import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Trash2, ImagePlus } from 'lucide-react'
import { useChatStore } from '../../store/chat-store'
import { useMemberStore } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'
import { resizeImageToDataURL } from '../../lib/ai-chat'
import type { ChatMessage } from '../../lib/ai-chat'
import { BUDDY_CHARACTER } from '../../types'
import { useQuestStore } from '../../store/quest-store'
import ChoreConfirmCard from './ChoreConfirmCard'
import RewardConfirmCard from './RewardConfirmCard'
import HomeworkResultCard from './HomeworkResultCard'
import DrawingCard from './DrawingCard'
import Input from '../ui/Input'

const KID_QUICK_ACTIONS = [
  { label: "What should I do now? \u{1F914}", text: "What should I do now?" },
  { label: "What's next? \u27A1\uFE0F", text: "What's next?" },
  { label: "My progress \u{1F4CA}", text: "How am I doing this week?" },
  { label: "Suggest a chore \u{1F4A1}", text: "Can you suggest a new chore for me?" },
  { label: "What can I get? \u{1F381}", text: "What rewards can I get with my points?" },
  { label: "Is it fair? \u2696\uFE0F", text: "Is it fair that I have to do this chore? Why do I have so many chores?" },
  { label: "Fun fact! \u{1F31F}", text: "Tell me a fun fact!" },
  { label: "Help with homework \u{1F4DA}", text: "Help me with homework" },
  { label: "Check homework \u270F\uFE0F", text: "Can you check my homework? I'm uploading a photo!" },
  { label: "Add a chore \u270F\uFE0F", text: "Add a new chore for me" },
  { label: "Redeem reward \u{1F381}", text: "I want to redeem a reward!" },
  { label: "Draw something \u{1F3A8}", text: "Can you draw me something fun?" },
]

const PARENT_QUICK_ACTIONS = [
  { label: "What should I do now? \u{1F914}", text: "What should I do now?" },
  { label: "What's next? \u27A1\uFE0F", text: "What's next?" },
  { label: "My progress \u{1F4CA}", text: "How am I doing this week?" },
  { label: "Suggest a chore \u{1F4A1}", text: "Can you suggest a new chore for me?" },
  { label: "What can I get? \u{1F381}", text: "What rewards can I get with my points?" },
  { label: "Check fairness \u2696\uFE0F", text: "Are the chores fairly distributed among the kids? Any rotation suggestions?" },
  { label: "Weekly report \u{1F4CB}", text: "Give me a weekly report on how the kids are doing with their chores." },
  { label: "Fun fact! \u{1F31F}", text: "Tell me a fun fact!" },
  { label: "Help with homework \u{1F4DA}", text: "Help me with homework" },
  { label: "Add a chore \u270F\uFE0F", text: "Add a new chore for me" },
  { label: "Redeem reward \u{1F381}", text: "I want to redeem a reward!" },
]

function ChatBubble({ message, isUser, emoji }: { message: ChatMessage; isUser: boolean; emoji: string }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm shrink-0 mr-2 mt-1 shadow-sm">
          {emoji}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        }`}
      >
        {message.image && (
          <img
            src={message.image}
            alt="Attached"
            className="rounded-xl max-w-full mb-2"
          />
        )}
        {message.content}
      </div>
    </div>
  )
}

function TypingIndicator({ emoji }: { emoji: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
        {emoji}
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

/** Extract the first image File from a DataTransfer (drag/paste), or null */
function getImageFile(dt: DataTransfer): File | null {
  for (let i = 0; i < dt.files.length; i++) {
    if (dt.files[i].type.startsWith('image/')) return dt.files[i]
  }
  // Check items for pasted images (clipboard)
  for (let i = 0; i < dt.items.length; i++) {
    const item = dt.items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }
  return null
}

export default function BuddyChat() {
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isOpen,
    isLoading,
    isStreaming,
    error,
    selectedMemberId,
    lastResponseTimeMs,
    setOpen,
    setSelectedMemberId,
    sendMessageStreaming,
    cancelGeneration,
    clearMessages,
    pendingChoreAction,
    pendingChoreMessageIndex,
    acceptChoreAction,
    cancelChoreAction,
    pendingRewardAction,
    pendingRewardMessageIndex,
    acceptRewardAction,
    cancelRewardAction,
    homeworkCheckResult,
    homeworkCheckMessageIndex,
    dismissHomeworkResult,
    drawingResult,
    drawingMessageIndex,
    dismissDrawing,
    storyProgress,
  } = useChatStore()

  const members = useMemberStore((s) => s.members)
  const appMode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const isKidMode = appMode === 'kid'

  // In kid mode, auto-select the active kid
  const effectiveMemberId = isKidMode ? activeKidId : selectedMemberId
  const buddyEmoji = BUDDY_CHARACTER.emoji
  const buddyName = BUDDY_CHARACTER.name
  const storyStep = effectiveMemberId ? (storyProgress[effectiveMemberId] ?? 0) : 0
  const storyChapter = Math.floor(storyStep / 5) + 1

  // Sync chat store member for kid mode
  useEffect(() => {
    if (isKidMode && activeKidId && selectedMemberId !== activeKidId) {
      setSelectedMemberId(activeKidId)
    }
    // Parent mode: auto-select first kid if none selected
    if (!isKidMode && !selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id)
    }
  }, [isKidMode, activeKidId, selectedMemberId, setSelectedMemberId, members])

  // Generate today's quest and check completion on chat open
  useEffect(() => {
    if (isOpen) {
      const questStore = useQuestStore.getState()
      questStore.generateDailyQuest()
      const todayQuest = questStore.getTodayQuest()
      if (todayQuest && !todayQuest.completed) {
        questStore.checkQuestCompletion(todayQuest.id)
      }
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ── Image handling ──

  const processImageFile = useCallback(async (file: File) => {
    try {
      const dataUrl = await resizeImageToDataURL(file)
      setPendingImage(dataUrl)
    } catch {
      // Silently ignore invalid images
    }
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)
    const file = getImageFile(e.dataTransfer)
    if (file) processImageFile(file)
  }, [processImageFile])

  // Paste handler (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const file = getImageFile(e.clipboardData)
      if (file) {
        e.preventDefault()
        processImageFile(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen, processImageFile])

  const handleFilePickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processImageFile(file)
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [processImageFile])

  // ── Send ──

  const handleSend = useCallback(async () => {
    const text = input.trim()
    const image = pendingImage
    // Need either text or image to send
    if ((!text && !image) || isLoading) return
    const finalText = text || "What's in this picture?"
    setInput('')
    setPendingImage(null)
    await sendMessageStreaming(finalText, image ?? undefined)
  }, [input, pendingImage, isLoading, sendMessageStreaming])

  const handleQuickAction = async (text: string) => {
    if (isLoading) return
    await sendMessageStreaming(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Floating Button ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
        title="Chat with Buddy"
      >
        <span className="text-2xl">{buddyEmoji}</span>
      </button>
    )
  }

  // ── Chat Panel ──
  return (
    <div
      className={`fixed z-40 flex flex-col bg-background border border-border shadow-2xl
        inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[560px] sm:max-h-[80vh] sm:rounded-2xl
      `}
    >
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-green-500/10 to-emerald-500/10 sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg shadow-sm">
            {buddyEmoji}
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-base">{buddyName}</h3>
            <p className="text-xs text-muted-foreground">
              Chapter {storyChapter}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Kid selector — parent mode only */}
      {!isKidMode && (
        <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                selectedMemberId === member.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages area with drag-and-drop */}
      <div
        className="flex-1 overflow-auto px-4 py-3 min-h-0 relative"
        aria-live="polite"
        aria-label="Chat messages"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-green-500/20 border-2 border-dashed border-green-500 rounded-xl flex items-center justify-center">
            <p className="text-green-700 dark:text-green-300 font-bold text-lg">Drop image here</p>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl shadow-md">
              {buddyEmoji}
            </div>
            <p className="font-bold text-foreground text-lg">Hi there! I'm {buddyName}!</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {effectiveMemberId
                ? `I can help ${members.find((m) => m.id === effectiveMemberId)?.name} with chores, fun facts, and more!`
                : 'Pick a kid above, then ask me anything!'}
            </p>
          </div>
        )}

        {(() => {
          const visible = messages.filter((m) => m.role !== 'system')
          return visible.map((msg, i, arr) => {
            // Find original index in unfiltered messages array
            // so pendingChoreMessageIndex (which references the full array) matches correctly
            const originalIndex = messages.indexOf(msg)
            const isLastAssistant =
              msg.role === 'assistant' &&
              i === arr.length - 1 &&
              !isLoading &&
              !isStreaming &&
              lastResponseTimeMs != null
            return (
              <div key={originalIndex}>
                <ChatBubble message={msg} isUser={msg.role === 'user'} emoji={buddyEmoji} />
                {isLastAssistant && (
                  <div className="flex justify-start mb-3 ml-10">
                    <span className={`text-xs ${lastResponseTimeMs >= 10000 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {'\u26A1'} {(lastResponseTimeMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
                {msg.role === 'assistant' &&
                  pendingChoreAction &&
                  pendingChoreMessageIndex === originalIndex && (
                    <ChoreConfirmCard
                      action={pendingChoreAction}
                      onAccept={acceptChoreAction}
                      onCancel={cancelChoreAction}
                    />
                )}
                {msg.role === 'assistant' &&
                  pendingRewardAction &&
                  pendingRewardMessageIndex === originalIndex && (
                    <RewardConfirmCard
                      action={pendingRewardAction}
                      onAccept={acceptRewardAction}
                      onCancel={cancelRewardAction}
                    />
                )}
                {msg.role === 'assistant' &&
                  homeworkCheckResult &&
                  homeworkCheckMessageIndex === originalIndex && (
                    <HomeworkResultCard
                      result={homeworkCheckResult}
                      onDismiss={dismissHomeworkResult}
                    />
                )}
                {msg.role === 'assistant' &&
                  drawingResult &&
                  drawingMessageIndex === originalIndex && (
                    <DrawingCard
                      result={drawingResult}
                      onDismiss={dismissDrawing}
                    />
                )}
              </div>
            )
          })
        })()}

        {isLoading && !isStreaming && <TypingIndicator emoji={buddyEmoji} />}

        {isLoading && (
          <div className="flex justify-center mb-3">
            <button
              onClick={cancelGeneration}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Stop generating
            </button>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2 mb-3">
            {error.includes('fetch')
              ? "Can't reach Buddy's brain (Ollama). Is it running? \u{1F914}"
              : error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length === 0 && effectiveMemberId && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {(isKidMode ? KID_QUICK_ACTIONS : PARENT_QUICK_ACTIONS).map((action) => (
            <button
              key={action.text}
              onClick={() => handleQuickAction(action.text)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-4 pt-2">
          <div className="relative inline-block">
            <img
              src={pendingImage}
              alt="Pending"
              className="h-16 rounded-lg border border-border object-cover"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
              title="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilePickerChange}
      />

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2 sm:rounded-b-2xl">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectiveMemberId ? "Ask Buddy anything..." : "Pick a kid first..."}
          disabled={!effectiveMemberId || isLoading}
          className="flex-1 rounded-xl bg-muted px-4 py-2.5 disabled:opacity-50"
        />
        {effectiveMemberId && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="rounded-xl px-3 py-2.5 bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center disabled:opacity-40"
              title="Attach image"
              aria-label="Attach image"
            >
              <ImagePlus size={16} />
            </button>
          </>
        )}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !pendingImage) || !effectiveMemberId || isLoading}
          className="rounded-xl px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
