import { create } from 'zustand'
import type { ChatMessage } from '../lib/ai-chat'
import { sendToOllama, streamFromOllama, buildSystemPrompt } from '../lib/ai-chat'

const MAX_CONTEXT_MESSAGES = 8

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  selectedMemberId: string | null
  soundEnabled: boolean
  abortController: AbortController | null

  setOpen: (open: boolean) => void
  setSelectedMemberId: (id: string | null) => void
  setSoundEnabled: (enabled: boolean) => void
  sendMessage: (content: string, image?: string) => Promise<void>
  sendMessageStreaming: (content: string, image?: string) => Promise<void>
  cancelGeneration: () => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  isStreaming: false,
  error: null,
  selectedMemberId: null,
  soundEnabled: true,
  abortController: null,

  setOpen: (open) => {
    // Cancel any in-flight generation when closing
    if (!open && get().abortController) {
      get().abortController!.abort()
      set({ abortController: null, isLoading: false, isStreaming: false })
    }
    set({ isOpen: open })
  },

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

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
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    set({ abortController: controller })

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
      set({ isLoading: false, isStreaming: false, abortController: null })
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled or timeout — keep partial text
        set({ isLoading: false, isStreaming: false, abortController: null })
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
        })
      } catch (fallbackErr) {
        const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong'
        set({ isLoading: false, isStreaming: false, error: errorMsg, abortController: null })
      }
    }
  },

  cancelGeneration: () => {
    const controller = get().abortController
    if (controller) controller.abort()
    set({ isLoading: false, isStreaming: false, abortController: null })
  },

  clearMessages: () => set({ messages: [], error: null }),
}))
