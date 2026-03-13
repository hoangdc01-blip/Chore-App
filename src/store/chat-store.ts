import { create } from 'zustand'
import type { ChatMessage } from '../lib/ai-chat'
import { sendToOllama, buildSystemPrompt } from '../lib/ai-chat'

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  error: string | null
  selectedMemberId: string | null
  soundEnabled: boolean

  setOpen: (open: boolean) => void
  setSelectedMemberId: (id: string | null) => void
  setSoundEnabled: (enabled: boolean) => void
  sendMessage: (content: string, image?: string) => Promise<void>
  clearMessages: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  error: null,
  selectedMemberId: null,
  soundEnabled: true,

  setOpen: (open) => set({ isOpen: open }),

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  sendMessage: async (content, image) => {
    const userMsg: ChatMessage = { role: 'user', content, ...(image ? { image } : {}) }
    const messages = [...get().messages, userMsg]
    set({ messages, isLoading: true, error: null })

    try {
      const systemPrompt = buildSystemPrompt(get().selectedMemberId)
      const allMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ]
      const reply = await sendToOllama(allMessages)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      set({ messages: [...get().messages, assistantMsg], isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      set({ isLoading: false, error: errorMsg })
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
}))
