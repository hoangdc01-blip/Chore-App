import { create } from 'zustand'
import type { ChatMessage } from '../lib/ai-chat'
import { sendToOllama, streamFromOllama, buildSystemPrompt } from '../lib/ai-chat'
import { parseChatResponse } from '../lib/chat-actions'
import type { ChoreAction } from '../types'
import { useChoreStore } from './chore-store'

const MAX_CONTEXT_MESSAGES = 8

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  selectedMemberId: string | null
  abortController: AbortController | null
  lastResponseTimeMs: number | null

  pendingChoreAction: ChoreAction | null
  pendingChoreMessageIndex: number | null

  setOpen: (open: boolean) => void
  setSelectedMemberId: (id: string | null) => void
  sendMessage: (content: string, image?: string) => Promise<void>
  sendMessageStreaming: (content: string, image?: string) => Promise<void>
  cancelGeneration: () => void
  clearMessages: () => void
  acceptChoreAction: () => void
  cancelChoreAction: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  isStreaming: false,
  error: null,
  selectedMemberId: null,
  abortController: null,
  lastResponseTimeMs: null,
  pendingChoreAction: null,
  pendingChoreMessageIndex: null,

  setOpen: (open) => {
    // Cancel any in-flight generation when closing
    if (!open && get().abortController) {
      get().abortController!.abort()
      set({ abortController: null, isLoading: false, isStreaming: false })
    }
    set({ isOpen: open })
  },

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  // Batch fallback (non-streaming)
  sendMessage: async (content, image) => {
    const userMsg: ChatMessage = { role: 'user', content, ...(image ? { image } : {}) }
    const messages = [...get().messages, userMsg]
    set({ messages, isLoading: true, error: null })

    try {
      const systemPrompt = buildSystemPrompt(get().selectedMemberId)
      const windowed = messages.slice(-MAX_CONTEXT_MESSAGES)
      const allMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...windowed,
      ]
      const reply = await sendToOllama(allMessages)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      set({ messages: [...get().messages, assistantMsg], isLoading: false })

      // Post-process: extract chore actions from the assistant response
      const batchFinalMessages = get().messages
      const batchLastMsg = batchFinalMessages[batchFinalMessages.length - 1]
      if (batchLastMsg?.role === 'assistant' && batchLastMsg.content) {
        const { displayText, choreAction } = parseChatResponse(batchLastMsg.content)
        if (choreAction || displayText !== batchLastMsg.content) {
          const updatedMessages = [
            ...batchFinalMessages.slice(0, -1),
            { ...batchLastMsg, content: displayText },
          ]
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: updatedMessages.length - 1,
          })
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      set({ isLoading: false, error: errorMsg })
    }
  },

  // Streaming (primary) — falls back to batch on error
  sendMessageStreaming: async (content, image) => {
    const userMsg: ChatMessage = { role: 'user', content, ...(image ? { image } : {}) }
    const allMessages = [...get().messages, userMsg]

    // Add empty assistant placeholder for streaming tokens
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    set({
      messages: [...allMessages, assistantMsg],
      isLoading: true,
      isStreaming: true,
      error: null,
    })

    const controller = new AbortController()
    // Vision models need longer — 120s for images, 60s for text
    const hasImages = allMessages.some((m) => !!m.image)
    const timeoutMs = hasImages ? 120000 : 60000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    set({ abortController: controller })

    const startTime = Date.now()

    try {
      const systemPrompt = buildSystemPrompt(get().selectedMemberId)
      const windowed = allMessages.slice(-MAX_CONTEXT_MESSAGES)
      const messagesForApi: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...windowed,
      ]

      await streamFromOllama(
        messagesForApi,
        (token) => {
          const msgs = get().messages
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg?.role === 'assistant') {
            const updated = [...msgs.slice(0, -1), { ...lastMsg, content: lastMsg.content + token }]
            set({ messages: updated })
          }
        },
        controller.signal
      )

      clearTimeout(timeoutId)
      set({ isLoading: false, isStreaming: false, abortController: null, lastResponseTimeMs: Date.now() - startTime })

      // Post-process: extract chore actions from the assistant response
      const finalMessages = get().messages
      const lastMsg = finalMessages[finalMessages.length - 1]
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        const { displayText, choreAction } = parseChatResponse(lastMsg.content)
        if (choreAction || displayText !== lastMsg.content) {
          const updatedMessages = [
            ...finalMessages.slice(0, -1),
            { ...lastMsg, content: displayText },
          ]
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: updatedMessages.length - 1,
          })
        }
      }
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled or timeout — keep partial text, but show error if it was a timeout
        const msgs = get().messages
        const lastMsg = msgs[msgs.length - 1]
        if (lastMsg?.role === 'assistant' && lastMsg.content === '') {
          // No content received at all — this was a timeout, not a user cancel
          const errorText = hasImages
            ? 'Image processing timed out. Try a simpler image or check that Ollama is running.'
            : 'Request timed out. Check that Ollama is running.'
          const updated = [...msgs.slice(0, -1), { ...lastMsg, content: errorText }]
          set({ messages: updated, isLoading: false, isStreaming: false, abortController: null, lastResponseTimeMs: null })
        } else {
          set({ isLoading: false, isStreaming: false, abortController: null, lastResponseTimeMs: null })
        }
        return
      }

      // Streaming failed — fall back to batch
      try {
        // Remove empty assistant placeholder
        const msgs = get().messages
        const withoutPlaceholder = msgs[msgs.length - 1]?.content === ''
          ? msgs.slice(0, -1)
          : msgs
        set({ messages: withoutPlaceholder, isStreaming: false })

        const systemPrompt = buildSystemPrompt(get().selectedMemberId)
        const windowed = allMessages.slice(-MAX_CONTEXT_MESSAGES)
        const fallbackMessages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...windowed,
        ]
        const reply = await sendToOllama(fallbackMessages)
        const fallbackAssistant: ChatMessage = { role: 'assistant', content: reply }
        set({
          messages: [...get().messages, fallbackAssistant],
          isLoading: false,
          isStreaming: false,
          abortController: null,
          lastResponseTimeMs: Date.now() - startTime,
        })

        // Post-process fallback: extract chore actions from the assistant response
        const fallbackFinalMessages = get().messages
        const fallbackLastMsg = fallbackFinalMessages[fallbackFinalMessages.length - 1]
        if (fallbackLastMsg?.role === 'assistant' && fallbackLastMsg.content) {
          const { displayText, choreAction } = parseChatResponse(fallbackLastMsg.content)
          if (choreAction || displayText !== fallbackLastMsg.content) {
            const updatedMessages = [
              ...fallbackFinalMessages.slice(0, -1),
              { ...fallbackLastMsg, content: displayText },
            ]
            set({
              messages: updatedMessages,
              pendingChoreAction: choreAction,
              pendingChoreMessageIndex: updatedMessages.length - 1,
            })
          }
        }
      } catch (fallbackErr) {
        const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong'
        set({ isLoading: false, isStreaming: false, error: errorMsg, abortController: null, lastResponseTimeMs: null })
      }
    }
  },

  acceptChoreAction: () => {
    const action = get().pendingChoreAction
    if (!action) return
    useChoreStore.getState().addChore(action)
    set({ pendingChoreAction: null, pendingChoreMessageIndex: null })
  },

  cancelChoreAction: () => {
    set({ pendingChoreAction: null, pendingChoreMessageIndex: null })
  },

  cancelGeneration: () => {
    const controller = get().abortController
    if (controller) controller.abort()
    set({ isLoading: false, isStreaming: false, abortController: null })
  },

  clearMessages: () => set({ messages: [], error: null, pendingChoreAction: null, pendingChoreMessageIndex: null }),
}))
