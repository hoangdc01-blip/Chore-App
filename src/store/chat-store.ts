import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, BuddyContext } from '../lib/ai-chat'
import { sendToOllama, streamFromOllama, buildSystemPrompt, checkHomeworkWithTextModel } from '../lib/ai-chat'
import { parseChatResponse } from '../lib/chat-actions'
import { generateImage } from '../lib/image-gen'

import { generatePptx } from '../lib/pptx-gen'
import type { ChoreAction, RewardAction, HomeworkCheckResult, DrawingResult, PresentationResult, PresentationAction } from '../types'
import { useChoreStore } from './chore-store'
import { useRewardStore } from './reward-store'
import { useMemberStore } from './member-store'
import { format } from 'date-fns'
import { speak } from '../lib/tts'

const MAX_CONTEXT_MESSAGES = 10

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  memberId: string | null
}

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  isStreaming: boolean
  isGeneratingImage: boolean
  generatingDrawingIndex: number | null
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

  drawings: Record<number, DrawingResult[]>

  presentations: Record<number, PresentationResult>
  generatingPresentationIndex: number | null

  storyProgress: Record<string, number>
  lastGreetingDate: Record<string, string>
  reminderVariety: number
  autoReadAloud: boolean

  chatHistory: ChatSession[]
  activeSessionId: string | null

  setOpen: (open: boolean) => void
  setSelectedMemberId: (id: string | null) => void
  sendMessage: (content: string, image?: string) => Promise<void>
  sendMessageStreaming: (content: string, image?: string) => Promise<void>
  cancelGeneration: () => void
  clearMessages: () => void
  startNewChat: () => void
  loadSession: (id: string) => void
  deleteSession: (id: string) => void
  acceptChoreAction: () => void
  cancelChoreAction: () => void
  acceptRewardAction: () => void
  cancelRewardAction: () => void
  dismissHomeworkResult: () => void
  dismissDrawing: (messageIndex: number) => void
  dismissPresentation: (messageIndex: number) => void
  advanceStory: (memberId: string) => void
  toggleAutoReadAloud: () => void
}

function buildBuddyCtx(state: ChatState): BuddyContext {
  const memberId = state.selectedMemberId
  const today = format(new Date(), 'yyyy-MM-dd')
  const isFirstToday = memberId ? state.lastGreetingDate[memberId] !== today : false
  const member = memberId ? useMemberStore.getState().members.find(m => m.id === memberId) : null

  return {
    storyStep: memberId ? (state.storyProgress[memberId] ?? 0) : 0,
    isFirstMessageToday: isFirstToday,
    personalityNote: member?.personalityNote,
    reminderVariety: state.reminderVariety,
  }
}

/** Post-process drawing results: call Stable Diffusion to generate images sequentially */
async function resolveDrawingImages(
  drawingResults: DrawingResult[],
  messageIndex: number,
  set: (partial: Partial<ChatState>) => void,
  get: () => ChatState
): Promise<void> {
  // Initialize with placeholder results
  set({
    isGeneratingImage: true,
    generatingDrawingIndex: messageIndex,
    drawings: { ...get().drawings, [messageIndex]: drawingResults.map(d => ({ ...d })) },
  })

  // Generate images sequentially
  for (let i = 0; i < drawingResults.length; i++) {
    const dr = drawingResults[i]
    try {
      const result = await generateImage(dr.title, dr.style || 'coloring')
      if (result) {
        const imageDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`
        const current = get().drawings[messageIndex] ?? []
        const updated = [...current]
        updated[i] = { ...dr, imageDataUrl }
        set({ drawings: { ...get().drawings, [messageIndex]: updated } })
      } else {
        const current = get().drawings[messageIndex] ?? []
        const updated = [...current]
        updated[i] = { ...dr, imageDataUrl: '', error: 'Draw Things returned no image. Make sure a model is loaded and the API server is enabled.' }
        set({ drawings: { ...get().drawings, [messageIndex]: updated } })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const isConnectionError = errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('timeout')
      const userMessage = isConnectionError
        ? 'Cannot connect to Draw Things. Make sure the app is open with API Server enabled.'
        : `Draw Things error: ${errorMsg}`
      const current = get().drawings[messageIndex] ?? []
      const updated = [...current]
      updated[i] = { ...dr, imageDataUrl: '', error: userMessage }
      set({ drawings: { ...get().drawings, [messageIndex]: updated } })
    }
  }

  set({ isGeneratingImage: false, generatingDrawingIndex: null })
}

/** Post-process presentation action: generate slide content + PPTX blob and store result */
async function resolvePresentationFile(
  action: PresentationAction,
  messageIndex: number,
  set: (partial: Partial<ChatState>) => void,
  get: () => ChatState
): Promise<void> {
  const pendingResult: PresentationResult = {
    title: action.title,
    slideCount: action.topics.length,
    topics: action.topics,
    slides: [],
  }
  set({
    generatingPresentationIndex: messageIndex,
    presentations: { ...get().presentations, [messageIndex]: pendingResult },
  })
  try {
    const onProgress = (stage: 'content' | 'image', current: number, total: number) => {
      const currentResult = get().presentations[messageIndex]
      if (currentResult) {
        const update = stage === 'content'
          ? { contentProgress: { current, total } }
          : { imageProgress: { current, total } }
        set({
          presentations: {
            ...get().presentations,
            [messageIndex]: { ...currentResult, ...update },
          },
        })
      }
    }
    const { blob, slides } = await generatePptx(action, onProgress)
    const pptxDataUrl = URL.createObjectURL(blob)
    set({
      presentations: {
        ...get().presentations,
        [messageIndex]: { ...pendingResult, slides, pptxDataUrl },
      },
      generatingPresentationIndex: null,
    })
  } catch {
    set({
      presentations: {
        ...get().presentations,
        [messageIndex]: { ...pendingResult, pptxDataUrl: undefined },
      },
      generatingPresentationIndex: null,
    })
  }
}

function generateId(): string {
  return crypto.randomUUID()
}

function deriveSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return 'New Chat'
  const text = firstUserMsg.content.replace(/\[Attached document:[^\]]*\]\n[\s\S]*?---\n\n/g, '').trim()
  if (!text) return 'New Chat'
  return text.length > 40 ? text.slice(0, 40) + '...' : text
}

function saveCurrentToHistory(state: ChatState): ChatSession[] {
  const { activeSessionId, messages, chatHistory, selectedMemberId } = state
  const userMessages = messages.filter(m => m.role !== 'system')
  if (!activeSessionId || userMessages.length === 0) return chatHistory

  const existing = chatHistory.find(s => s.id === activeSessionId)
  const session: ChatSession = {
    id: activeSessionId,
    title: deriveSessionTitle(messages),
    messages: messages.filter(m => !m.image).slice(-20),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    memberId: selectedMemberId,
  }

  if (existing) {
    return chatHistory.map(s => s.id === activeSessionId ? session : s)
  }
  return [...chatHistory, session]
}

export const useChatStore = create<ChatState>()(persist((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  isStreaming: false,
  isGeneratingImage: false,
  generatingDrawingIndex: null,
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

  drawings: {},

  presentations: {},
  generatingPresentationIndex: null,

  storyProgress: {},
  lastGreetingDate: {},
  reminderVariety: 0,
  autoReadAloud: false,

  chatHistory: [],
  activeSessionId: null,

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
    // Ensure we have an active session ID
    if (!get().activeSessionId) {
      set({ activeSessionId: generateId() })
    }

    const userMsg: ChatMessage = { role: 'user', content, ...(image ? { image } : {}) }
    const messages = [...get().messages, userMsg]
    set({ messages, isLoading: true, error: null })

    try {
      const buddyCtx = buildBuddyCtx(get())
      const hasImagesInConvo = messages.some((m) => !!m.image)
      let systemPrompt = buildSystemPrompt(get().selectedMemberId, buddyCtx, hasImagesInConvo)

      // Track first message of the day and advance story
      const memberId = get().selectedMemberId
      if (memberId) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const updates: Partial<ChatState> = {}
        if (get().lastGreetingDate[memberId] !== today) {
          updates.lastGreetingDate = { ...get().lastGreetingDate, [memberId]: today }
        }
        updates.storyProgress = { ...get().storyProgress, [memberId]: (get().storyProgress[memberId] ?? 0) + 1 }
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
        const lastUserMsg = get().messages.slice().reverse().find(m => m.role === 'user')?.content ?? ''
        const { displayText, choreAction, rewardAction, homeworkResult, drawingResults, presentationAction } = parseChatResponse(batchLastMsg.content, lastUserMsg)
        if (choreAction || rewardAction || homeworkResult || drawingResults.length > 0 || presentationAction || displayText !== batchLastMsg.content) {
          const updatedMessages = [
            ...batchFinalMessages.slice(0, -1),
            { ...batchLastMsg, content: displayText },
          ]
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
            pendingRewardAction: rewardAction,
            pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
            homeworkCheckResult: homeworkResult ?? get().homeworkCheckResult,
            homeworkCheckMessageIndex: homeworkResult ? updatedMessages.length - 1 : get().homeworkCheckMessageIndex,
          })
          // Generate images via Stable Diffusion if drawings were requested
          if (drawingResults.length > 0) {
            resolveDrawingImages(drawingResults, updatedMessages.length - 1, set, get)
          }
          // Generate PPTX if presentation was requested
          if (presentationAction) {
            resolvePresentationFile(presentationAction, updatedMessages.length - 1, set, get)
          }
        }
        // Auto-read aloud if enabled
        const batchTextToRead = displayText || batchLastMsg.content
        if (get().autoReadAloud && batchTextToRead) {
          speak(batchTextToRead)
        }
      }
      // Auto-save session to history
      set({ chatHistory: saveCurrentToHistory(get()) })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      set({ isLoading: false, error: errorMsg })
    }
  },

  // Streaming (primary) — falls back to batch on error
  sendMessageStreaming: async (content, image) => {
    // Ensure we have an active session ID
    if (!get().activeSessionId) {
      set({ activeSessionId: generateId() })
    }

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
      const hasImagesStream = allMessages.some((m) => !!m.image)
      let systemPrompt = buildSystemPrompt(get().selectedMemberId, buddyCtx, hasImagesStream)

      // Track first message of the day and advance story
      const memberId = get().selectedMemberId
      if (memberId) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const updates: Partial<ChatState> = {}
        if (get().lastGreetingDate[memberId] !== today) {
          updates.lastGreetingDate = { ...get().lastGreetingDate, [memberId]: today }
        }
        updates.storyProgress = { ...get().storyProgress, [memberId]: (get().storyProgress[memberId] ?? 0) + 1 }
        if (Object.keys(updates).length > 0) set(updates as Partial<ChatState>)
      }

      // Increment reminder variety for next message
      set({ reminderVariety: get().reminderVariety + 1 })

      // Vision models (minicpm-v) get confused by old conversation context
      // and repeat previous answers instead of reading new images.
      // When the last message has an image, send only that message to keep vision isolated.
      const lastUserMsg = allMessages[allMessages.length - 1]
      const lastMsgHasImage = lastUserMsg?.role === 'user' && !!lastUserMsg.image
      const windowed = lastMsgHasImage
        ? [lastUserMsg]
        : allMessages.slice(-MAX_CONTEXT_MESSAGES)
      const messagesForApi: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...windowed,
      ]

      let tokenBuffer = ''
      let rafId: number | null = null

      const flushTokens = () => {
        if (!tokenBuffer) return
        const msgs = get().messages
        const lastMsg = msgs[msgs.length - 1]
        if (lastMsg?.role === 'assistant') {
          const updated = [...msgs.slice(0, -1), { ...lastMsg, content: lastMsg.content + tokenBuffer }]
          set({ messages: updated })
        }
        tokenBuffer = ''
        rafId = null
      }

      await streamFromOllama(
        messagesForApi,
        (token) => {
          tokenBuffer += token
          if (!rafId) {
            rafId = requestAnimationFrame(flushTokens)
          }
        },
        controller.signal
      )

      // Flush any remaining buffered tokens
      if (tokenBuffer) flushTokens()
      if (rafId) { cancelAnimationFrame(rafId); rafId = null }

      // Two-step homework check: vision reads image -> text model checks answers
      if (hasImages) {
        const msgs = get().messages
        const visionResponse = msgs[msgs.length - 1]
        const lastUserMsg = allMessages.slice().reverse().find(m => m.role === 'user')
        const isHomeworkRequest = lastUserMsg && (
          lastUserMsg.content.toLowerCase().includes('homework') ||
          lastUserMsg.content.toLowerCase().includes('check') ||
          lastUserMsg.content.toLowerCase().includes('bài tập') ||
          lastUserMsg.content.toLowerCase().includes('kiểm tra')
        )

        if (isHomeworkRequest && visionResponse?.role === 'assistant' && visionResponse.content) {
          try {
            // Show status while text model checks
            const currentMsgs = get().messages
            const updatedWithStatus = [
              ...currentMsgs.slice(0, -1),
              { ...visionResponse, content: visionResponse.content + '\n\n⏳ Checking answers...' }
            ]
            set({ messages: updatedWithStatus })

            const checkResult = await checkHomeworkWithTextModel(visionResponse.content, controller.signal)

            // Replace with the text model's response (which has the HOMEWORK_CHECK block)
            const msgs3 = get().messages
            set({ messages: [...msgs3.slice(0, -1), { ...msgs3[msgs3.length - 1], content: checkResult }] })
          } catch {
            // Keep vision response as fallback (remove the status message)
            const msgs4 = get().messages
            const lastM = msgs4[msgs4.length - 1]
            if (lastM?.content.endsWith('\n\n⏳ Checking answers...')) {
              const cleaned = lastM.content.replace('\n\n⏳ Checking answers...', '')
              set({ messages: [...msgs4.slice(0, -1), { ...lastM, content: cleaned }] })
            }
          }
        }
      }

      clearTimeout(timeoutId)
      set({ isLoading: false, isStreaming: false, abortController: null, lastResponseTimeMs: Date.now() - startTime })

      // Post-process: extract chore/reward/homework/drawing/presentation actions from the assistant response
      const finalMessages = get().messages
      const lastMsg = finalMessages[finalMessages.length - 1]
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        const streamLastUserMsg = get().messages.slice().reverse().find(m => m.role === 'user')?.content ?? ''
        const { displayText, choreAction, rewardAction, homeworkResult, drawingResults, presentationAction } = parseChatResponse(lastMsg.content, streamLastUserMsg)
        if (choreAction || rewardAction || homeworkResult || drawingResults.length > 0 || presentationAction || displayText !== lastMsg.content) {
          const updatedMessages = [
            ...finalMessages.slice(0, -1),
            { ...lastMsg, content: displayText },
          ]
          set({
            messages: updatedMessages,
            pendingChoreAction: choreAction,
            pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
            pendingRewardAction: rewardAction,
            pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
            homeworkCheckResult: homeworkResult ?? get().homeworkCheckResult,
            homeworkCheckMessageIndex: homeworkResult ? updatedMessages.length - 1 : get().homeworkCheckMessageIndex,
          })
          // Generate images via Stable Diffusion if drawings were requested
          if (drawingResults.length > 0) {
            resolveDrawingImages(drawingResults, updatedMessages.length - 1, set, get)
          }
          // Generate PPTX if presentation was requested
          if (presentationAction) {
            resolvePresentationFile(presentationAction, updatedMessages.length - 1, set, get)
          }
        }
        // Auto-read aloud if enabled
        const textToRead = displayText || lastMsg.content
        if (get().autoReadAloud && textToRead) {
          speak(textToRead)
        }
      }
      // Auto-save session to history
      set({ chatHistory: saveCurrentToHistory(get()) })
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
        const hasImagesFallback = allMessages.some((m) => !!m.image)
        const systemPrompt = buildSystemPrompt(get().selectedMemberId, fallbackBuddyCtx, hasImagesFallback)
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

        // Post-process fallback: extract chore/reward/homework/drawing/presentation actions from the assistant response
        const fallbackFinalMessages = get().messages
        const fallbackLastMsg = fallbackFinalMessages[fallbackFinalMessages.length - 1]
        if (fallbackLastMsg?.role === 'assistant' && fallbackLastMsg.content) {
          const fallbackLastUserMsg = get().messages.slice().reverse().find(m => m.role === 'user')?.content ?? ''
          const { displayText, choreAction, rewardAction, homeworkResult, drawingResults, presentationAction } = parseChatResponse(fallbackLastMsg.content, fallbackLastUserMsg)
          if (choreAction || rewardAction || homeworkResult || drawingResults.length > 0 || presentationAction || displayText !== fallbackLastMsg.content) {
            const updatedMessages = [
              ...fallbackFinalMessages.slice(0, -1),
              { ...fallbackLastMsg, content: displayText },
            ]
            set({
              messages: updatedMessages,
              pendingChoreAction: choreAction,
              pendingChoreMessageIndex: choreAction ? updatedMessages.length - 1 : null,
              pendingRewardAction: rewardAction,
              pendingRewardMessageIndex: rewardAction ? updatedMessages.length - 1 : null,
              homeworkCheckResult: homeworkResult ?? get().homeworkCheckResult,
              homeworkCheckMessageIndex: homeworkResult ? updatedMessages.length - 1 : get().homeworkCheckMessageIndex,
            })
            // Generate images via Stable Diffusion if drawings were requested
            if (drawingResults.length > 0) {
              resolveDrawingImages(drawingResults, updatedMessages.length - 1, set, get)
            }
            // Generate PPTX if presentation was requested
            if (presentationAction) {
              resolvePresentationFile(presentationAction, updatedMessages.length - 1, set, get)
            }
          }
          // Auto-read aloud if enabled
          const fallbackTextToRead = displayText || fallbackLastMsg.content
          if (get().autoReadAloud && fallbackTextToRead) {
            speak(fallbackTextToRead)
          }
        }
        // Auto-save session to history
        set({ chatHistory: saveCurrentToHistory(get()) })
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

  dismissDrawing: (messageIndex: number) => {
    const updated = { ...get().drawings }
    delete updated[messageIndex]
    set({ drawings: updated })
  },

  dismissPresentation: (messageIndex: number) => {
    const current = get().presentations[messageIndex]
    // Revoke blob URL to free memory
    if (current?.pptxDataUrl) {
      URL.revokeObjectURL(current.pptxDataUrl)
    }
    const updated = { ...get().presentations }
    delete updated[messageIndex]
    set({ presentations: updated })
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

  toggleAutoReadAloud: () => set({ autoReadAloud: !get().autoReadAloud }),

  clearMessages: () => {
    // Save current messages to history before clearing
    const updatedHistory = saveCurrentToHistory(get())
    // Revoke all presentation blob URLs
    const pres = get().presentations
    for (const key of Object.keys(pres)) {
      if (pres[Number(key)]?.pptxDataUrl) {
        URL.revokeObjectURL(pres[Number(key)].pptxDataUrl!)
      }
    }
    set({
      chatHistory: updatedHistory,
      messages: [],
      activeSessionId: generateId(),
      error: null,
      pendingChoreAction: null,
      pendingChoreMessageIndex: null,
      pendingRewardAction: null,
      pendingRewardMessageIndex: null,
      homeworkCheckResult: null,
      homeworkCheckMessageIndex: null,
      drawings: {},
      presentations: {},
      generatingPresentationIndex: null,
    })
  },

  startNewChat: () => {
    const updatedHistory = saveCurrentToHistory(get())
    // Revoke all presentation blob URLs
    const pres = get().presentations
    for (const key of Object.keys(pres)) {
      if (pres[Number(key)]?.pptxDataUrl) {
        URL.revokeObjectURL(pres[Number(key)].pptxDataUrl!)
      }
    }
    set({
      chatHistory: updatedHistory,
      messages: [],
      activeSessionId: generateId(),
      error: null,
      pendingChoreAction: null,
      pendingChoreMessageIndex: null,
      pendingRewardAction: null,
      pendingRewardMessageIndex: null,
      homeworkCheckResult: null,
      homeworkCheckMessageIndex: null,
      drawings: {},
      presentations: {},
      generatingPresentationIndex: null,
    })
  },

  loadSession: (id: string) => {
    const updatedHistory = saveCurrentToHistory(get())
    const session = updatedHistory.find(s => s.id === id)
    if (!session) return
    // Revoke all presentation blob URLs
    const pres = get().presentations
    for (const key of Object.keys(pres)) {
      if (pres[Number(key)]?.pptxDataUrl) {
        URL.revokeObjectURL(pres[Number(key)].pptxDataUrl!)
      }
    }
    set({
      chatHistory: updatedHistory,
      messages: session.messages,
      activeSessionId: id,
      error: null,
      pendingChoreAction: null,
      pendingChoreMessageIndex: null,
      pendingRewardAction: null,
      pendingRewardMessageIndex: null,
      homeworkCheckResult: null,
      homeworkCheckMessageIndex: null,
      drawings: {},
      presentations: {},
      generatingPresentationIndex: null,
    })
  },

  deleteSession: (id: string) => {
    const { chatHistory, activeSessionId } = get()
    const updated = chatHistory.filter(s => s.id !== id)
    if (id === activeSessionId) {
      // Revoke all presentation blob URLs
      const pres = get().presentations
      for (const key of Object.keys(pres)) {
        if (pres[Number(key)]?.pptxDataUrl) {
          URL.revokeObjectURL(pres[Number(key)].pptxDataUrl!)
        }
      }
      set({
        chatHistory: updated,
        messages: [],
        activeSessionId: generateId(),
        error: null,
        pendingChoreAction: null,
        pendingChoreMessageIndex: null,
        pendingRewardAction: null,
        pendingRewardMessageIndex: null,
        homeworkCheckResult: null,
        homeworkCheckMessageIndex: null,
        drawings: {},
        presentations: {},
        generatingPresentationIndex: null,
      })
    } else {
      set({ chatHistory: updated })
    }
  },
}), {
  name: 'chat-storage',
  version: 1,
  partialize: (state) => ({
    messages: state.messages.filter(m => !m.image).slice(-20), // Keep last 20 text messages, skip images (too large)
    storyProgress: state.storyProgress,
    lastGreetingDate: state.lastGreetingDate,
    reminderVariety: state.reminderVariety,
    autoReadAloud: state.autoReadAloud,
    selectedMemberId: state.selectedMemberId,
    chatHistory: state.chatHistory,
    activeSessionId: state.activeSessionId,
  }),
}))
