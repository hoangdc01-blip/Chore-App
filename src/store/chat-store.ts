import { create } from 'zustand'
import type { ChatMessage, BuddyContext } from '../lib/ai-chat'
import { sendToOllama, streamFromOllama, buildSystemPrompt } from '../lib/ai-chat'
import { parseChatResponse } from '../lib/chat-actions'
import type { ChoreAction, RewardAction, HomeworkCheckResult, DrawingResult, BuddyCharacter } from '../types'
import { useAppStore } from './app-store'
import { useChoreStore } from './chore-store'
import { useRewardStore } from './reward-store'
import { useMemberStore } from './member-store'
import { format } from 'date-fns'

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

  pendingRewardAction: RewardAction | null
  pendingRewardMessageIndex: number | null

  homeworkCheckResult: HomeworkCheckResult | null
  homeworkCheckMessageIndex: number | null
  checkedHomeworks: Record<string, string>

  drawingResult: DrawingResult | null
  drawingMessageIndex: number | null

  buddyCharacter: BuddyCharacter | null
  storyProgress: Record<string, number>
  lastGreetingDate: Record<string, string>
  reminderVariety: number

  setOpen: (open: boolean) => void
  setSelectedMemberId: (id: string | null) => void
  sendMessage: (content: string, image?: string) => Promise<void>
  sendMessageStreaming: (content: string, image?: string) => Promise<void>
  cancelGeneration: () => void
  clearMessages: () => void
  acceptChoreAction: () => void
  cancelChoreAction: () => void
  acceptRewardAction: () => void
  cancelRewardAction: () => void
  dismissHomeworkResult: () => void
  dismissDrawing: () => void
  selectBuddyCharacter: (character: BuddyCharacter) => void
  advanceStory: (memberId: string) => void
}

function buildBuddyCtx(state: ChatState): BuddyContext {
  const memberId = state.selectedMemberId
  const today = format(new Date(), 'yyyy-MM-dd')
  const isFirstToday = memberId ? state.lastGreetingDate[memberId] !== today : false
  const member = memberId ? useMemberStore.getState().members.find(m => m.id === memberId) : null

  return {
    buddyCharacter: state.buddyCharacter,
    storyStep: memberId ? (state.storyProgress[memberId] ?? 0) : 0,
    isFirstMessageToday: isFirstToday,
    personalityNote: member?.personalityNote,
    reminderVariety: state.reminderVariety,
  }
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
  pendingRewardAction: null,
  pendingRewardMessageIndex: null,

  homeworkCheckResult: null,
  homeworkCheckMessageIndex: null,
  checkedHomeworks: {},

  drawingResult: null,
  drawingMessageIndex: null,

  buddyCharacter: null,
  storyProgress: {},
  lastGreetingDate: {},
  reminderVariety: 0,

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
      const buddyCtx = buildBuddyCtx(get())
      let systemPrompt = buildSystemPrompt(get().selectedMemberId, buddyCtx)

      // Check homework limit if image is attached (skip for parent mode)
      const isParentMode = useAppStore.getState().mode !== 'kid'
      if (image && get().selectedMemberId && !isParentMode) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const key = `${get().selectedMemberId}:${today}`
        if (get().checkedHomeworks[key]) {
          systemPrompt += '\n\nHOMEWORK_LIMIT: This kid already checked homework today. Tell them they can check again tomorrow.'
        }
      }

      // Track first message of the day and advance story
      const memberId = get().selectedMemberId
      if (memberId) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const updates: Partial<ChatState> = {}
        if (get().lastGreetingDate[memberId] !== today) {
          updates.lastGreetingDate = { ...get().lastGreetingDate, [memberId]: today }
        }
        if (get().buddyCharacter) {
          updates.storyProgress = { ...get().storyProgress, [memberId]: (get().storyProgress[memberId] ?? 0) + 1 }
        }
        if (Object.keys(updates).length > 0) set(updates as Partial<ChatState>)
      }

      // Increment reminder variety for next message
      set({ reminderVariety: get().reminderVariety + 1 })

      const windowed = messages.slice(-MAX_CONTEXT_MESSAGES)
      const allMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...windowed,
      ]
      const reply = await sendToOllama(allMessages)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      set({ messages: [...get().messages, assistantMsg], isLoading: false })

      // Post-process: extract chore/reward/homework/drawing actions from the assistant response
      const batchFinalMessages = get().messages
      const batchLastMsg = batchFinalMessages[batchFinalMessages.length - 1]
      if (batchLastMsg?.role === 'assistant' && batchLastMsg.content) {
        const { displayText, choreAction, rewardAction, homeworkResult, drawingResult } = parseChatResponse(batchLastMsg.content)
        if (choreAction || rewardAction || homeworkResult || drawingResult || displayText !== batchLastMsg.content) {
          const updatedMessages = [
            ...batchFinalMessages.slice(0, -1),
            { ...batchLastMsg, content: displayText },
          ]
          const homeworkUpdates: Partial<ChatState> = {}
          if (homeworkResult) {
            homeworkUpdates.homeworkCheckResult = homeworkResult
            homeworkUpdates.homeworkCheckMessageIndex = updatedMessages.length - 1
            const mid = get().selectedMemberId
            if (mid) {
              const today = format(new Date(), 'yyyy-MM-dd')
              homeworkUpdates.checkedHomeworks = { ...get().checkedHomeworks, [`${mid}:${today}`]: new Date().toISOString() }
            }
          }
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
            pendingRewardAction: rewardAction,
            pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
            drawingResult: drawingResult ?? get().drawingResult,
            drawingMessageIndex: drawingResult ? updatedMessages.length - 1 : get().drawingMessageIndex,
            ...homeworkUpdates,
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
      const buddyCtx = buildBuddyCtx(get())
      let systemPrompt = buildSystemPrompt(get().selectedMemberId, buddyCtx)

      // Check homework limit if image is attached (skip for parent mode)
      const isParentModeStream = useAppStore.getState().mode !== 'kid'
      if (allMessages.some(m => !!m.image) && get().selectedMemberId && !isParentModeStream) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const key = `${get().selectedMemberId}:${today}`
        if (get().checkedHomeworks[key]) {
          systemPrompt += '\n\nHOMEWORK_LIMIT: This kid already checked homework today. Tell them they can check again tomorrow.'
        }
      }

      // Track first message of the day and advance story
      const memberId = get().selectedMemberId
      if (memberId) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const updates: Partial<ChatState> = {}
        if (get().lastGreetingDate[memberId] !== today) {
          updates.lastGreetingDate = { ...get().lastGreetingDate, [memberId]: today }
        }
        if (get().buddyCharacter) {
          updates.storyProgress = { ...get().storyProgress, [memberId]: (get().storyProgress[memberId] ?? 0) + 1 }
        }
        if (Object.keys(updates).length > 0) set(updates as Partial<ChatState>)
      }

      // Increment reminder variety for next message
      set({ reminderVariety: get().reminderVariety + 1 })

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

      // Post-process: extract chore/reward/homework/drawing actions from the assistant response
      const finalMessages = get().messages
      const lastMsg = finalMessages[finalMessages.length - 1]
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        const { displayText, choreAction, rewardAction, homeworkResult, drawingResult } = parseChatResponse(lastMsg.content)
        if (choreAction || rewardAction || homeworkResult || drawingResult || displayText !== lastMsg.content) {
          const updatedMessages = [
            ...finalMessages.slice(0, -1),
            { ...lastMsg, content: displayText },
          ]
          const homeworkUpdates: Partial<ChatState> = {}
          if (homeworkResult) {
            homeworkUpdates.homeworkCheckResult = homeworkResult
            homeworkUpdates.homeworkCheckMessageIndex = updatedMessages.length - 1
            const mid = get().selectedMemberId
            if (mid) {
              const today = format(new Date(), 'yyyy-MM-dd')
              homeworkUpdates.checkedHomeworks = { ...get().checkedHomeworks, [`${mid}:${today}`]: new Date().toISOString() }
            }
          }
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
            pendingRewardAction: rewardAction,
            pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
            drawingResult: drawingResult ?? get().drawingResult,
            drawingMessageIndex: drawingResult ? updatedMessages.length - 1 : get().drawingMessageIndex,
            ...homeworkUpdates,
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

        const fallbackBuddyCtx = buildBuddyCtx(get())
        const systemPrompt = buildSystemPrompt(get().selectedMemberId, fallbackBuddyCtx)
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

        // Post-process fallback: extract chore/reward/homework/drawing actions from the assistant response
        const fallbackFinalMessages = get().messages
        const fallbackLastMsg = fallbackFinalMessages[fallbackFinalMessages.length - 1]
        if (fallbackLastMsg?.role === 'assistant' && fallbackLastMsg.content) {
          const { displayText, choreAction, rewardAction, homeworkResult, drawingResult } = parseChatResponse(fallbackLastMsg.content)
          if (choreAction || rewardAction || homeworkResult || drawingResult || displayText !== fallbackLastMsg.content) {
            const updatedMessages = [
              ...fallbackFinalMessages.slice(0, -1),
              { ...fallbackLastMsg, content: displayText },
            ]
            const homeworkUpdates: Partial<ChatState> = {}
            if (homeworkResult) {
              homeworkUpdates.homeworkCheckResult = homeworkResult
              homeworkUpdates.homeworkCheckMessageIndex = updatedMessages.length - 1
              const mid = get().selectedMemberId
              if (mid) {
                const today = format(new Date(), 'yyyy-MM-dd')
                homeworkUpdates.checkedHomeworks = { ...get().checkedHomeworks, [`${mid}:${today}`]: new Date().toISOString() }
              }
            }
            set({
              messages: updatedMessages,
              pendingChoreAction: choreAction,
              pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
              pendingRewardAction: rewardAction,
              pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
              drawingResult: drawingResult ?? get().drawingResult,
              drawingMessageIndex: drawingResult ? updatedMessages.length - 1 : get().drawingMessageIndex,
              ...homeworkUpdates,
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

  acceptRewardAction: () => {
    const action = get().pendingRewardAction
    if (!action) return
    useRewardStore.getState().redeemReward(action.rewardId, action.memberId)
    set({ pendingRewardAction: null, pendingRewardMessageIndex: null })
  },

  cancelRewardAction: () => {
    set({ pendingRewardAction: null, pendingRewardMessageIndex: null })
  },

  dismissHomeworkResult: () => {
    set({ homeworkCheckResult: null, homeworkCheckMessageIndex: null })
  },

  dismissDrawing: () => {
    set({ drawingResult: null, drawingMessageIndex: null })
  },

  selectBuddyCharacter: (character) => {
    set({ buddyCharacter: character })
  },

  advanceStory: (memberId) => {
    const progress = get().storyProgress
    set({ storyProgress: { ...progress, [memberId]: (progress[memberId] ?? 0) + 1 } })
  },

  cancelGeneration: () => {
    const controller = get().abortController
    if (controller) controller.abort()
    set({ isLoading: false, isStreaming: false, abortController: null })
  },

  clearMessages: () => set({ messages: [], error: null, pendingChoreAction: null, pendingChoreMessageIndex: null, pendingRewardAction: null, pendingRewardMessageIndex: null, homeworkCheckResult: null, homeworkCheckMessageIndex: null, drawingResult: null, drawingMessageIndex: null }),
}))
