import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Trash2, ImagePlus, Volume2, VolumeX, FileText, Palette, Presentation, PencilLine, BookOpen, GraduationCap } from 'lucide-react'
import { speak, stopSpeaking, isSpeaking, isTTSAvailable } from '../../lib/tts'
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
import PresentationCard from './PresentationCard'
import Input from '../ui/Input'
import AiAvatar from './AiAvatar'
import { cn } from '../../lib/utils'
import { isDocumentFile, extractDocumentText, getDocumentLabel } from '../../lib/doc-parser'

/** Strip action block tags from message content so users never see raw [TAG]...[/TAG] text.
 *  This handles complete blocks, incomplete/partial blocks during streaming,
 *  and opening tags that haven't closed yet. */
function cleanMessageContent(content: string): string {
  return content
    // Strip complete blocks
    .replace(/\[DRAW_IMAGE[^\]]*\][\s\S]*?\[\/DRAW_IMAGE\]/g, '')
    .replace(/\[GENERATE_PRESENTATION\][\s\S]*?\[\/GENERATE_PRESENTATION\]/g, '')
    .replace(/\[HOMEWORK_CHECK\][\s\S]*?\[\/HOMEWORK_CHECK\]/g, '')
    .replace(/\[CREATE_CHORE\][\s\S]*?\[\/CREATE_CHORE\]/g, '')
    .replace(/\[REDEEM_REWARD\][\s\S]*?\[\/REDEEM_REWARD\]/g, '')
    // Strip incomplete/partial blocks (during streaming — open tag present but no close tag yet)
    .replace(/\[DRAW_IMAGE[^\]]*\][\s\S]*$/g, '')
    .replace(/\[GENERATE_PRESENTATION\][\s\S]*$/g, '')
    .replace(/\[HOMEWORK_CHECK\][\s\S]*$/g, '')
    .replace(/\[CREATE_CHORE\][\s\S]*$/g, '')
    .replace(/\[REDEEM_REWARD\][\s\S]*$/g, '')
    // Strip opening tags still being typed (partial tag name)
    .replace(/\[DRAW_IMAGE.*$/g, '')
    .replace(/\[GENERATE_P.*$/g, '')
    .replace(/\[HOMEWORK_C.*$/g, '')
    .replace(/\[CREATE_C.*$/g, '')
    .replace(/\[REDEEM_R.*$/g, '')
    .trim()
}

const TOOL_CARDS = [
  { label: 'Draw a picture', icon: Palette, text: 'I want to draw something!' },
  { label: 'Make a presentation', icon: Presentation, text: 'I want to make a presentation!' },
  { label: 'Check my homework', icon: PencilLine, text: 'Can you check my homework?' },
  { label: 'Help me study', icon: GraduationCap, text: 'Help me study!' },
  { label: 'Tell me a story', icon: BookOpen, text: 'Tell me a bedtime story' },
]

function ChatBubble({
  message,
  isUser,
  isActionGenerating,
  isSpeakingThis,
  onSpeak,
  onStop,
}: {
  message: ChatMessage
  isUser: boolean
  isActionGenerating?: boolean
  isSpeakingThis?: boolean
  onSpeak?: () => void
  onStop?: () => void
}) {
  const displayContent = isUser ? message.content : cleanMessageContent(message.content)
  const showTTS = !isUser && isTTSAvailable() && displayContent.length > 0
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <AiAvatar size="sm" className="shrink-0 mr-2 mt-1 shadow-sm" />
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-sm'
              : 'bg-card shadow-sm text-foreground rounded-bl-md'
          }`}
        >
          {message.image && (
            <img
              src={message.image}
              alt="Attached"
              className="rounded-xl max-w-full mb-2"
            />
          )}
          {displayContent || (isActionGenerating ? (
            <span className="text-muted-foreground italic">Creating something special...</span>
          ) : null)}
        </div>
        {showTTS && (
          <button
            onClick={isSpeakingThis ? onStop : onSpeak}
            className="self-start ml-1 mt-1 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={isSpeakingThis ? 'Stop reading' : 'Read aloud'}
            aria-label={isSpeakingThis ? 'Stop reading aloud' : 'Read this message aloud'}
          >
            {isSpeakingThis ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <AiAvatar size="sm" className="shrink-0 mr-2 mt-1" />
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
  const [pendingDoc, setPendingDoc] = useState<{ name: string; label: string; text: string } | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
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
    isGeneratingImage,
    drawings,
    generatingDrawingIndex,
    dismissDrawing,
    presentations,
    generatingPresentationIndex,
    dismissPresentation,
    autoReadAloud,
    toggleAutoReadAloud,
  } = useChatStore()

  const members = useMemberStore((s) => s.members)
  const appMode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const isKidMode = appMode === 'kid'

  // In kid mode, auto-select the active kid
  const effectiveMemberId = isKidMode ? activeKidId : selectedMemberId
  const buddyName = BUDDY_CHARACTER.name
  // storyStep/storyChapter can be derived from useChatStore().storyProgress if needed

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

  // ── TTS: track when speech ends ──
  useEffect(() => {
    if (speakingMsgIndex === null) return
    const interval = setInterval(() => {
      if (!isSpeaking()) {
        setSpeakingMsgIndex(null)
      }
    }, 300)
    return () => clearInterval(interval)
  }, [speakingMsgIndex])

  // Stop TTS when chat closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking()
      setSpeakingMsgIndex(null)
    }
  }, [isOpen])

  const handleSpeak = useCallback((msgIndex: number, text: string) => {
    speak(text)
    setSpeakingMsgIndex(msgIndex)
  }, [])

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking()
    setSpeakingMsgIndex(null)
  }, [])

  // ── Image handling ──

  const processImageFile = useCallback(async (file: File) => {
    try {
      const dataUrl = await resizeImageToDataURL(file)
      setPendingImage(dataUrl)
    } catch {
      // Silently ignore invalid images
    }
  }, [])

  // Document handling
  const processDocFile = useCallback(async (file: File) => {
    try {
      setDocLoading(true)
      const text = await extractDocumentText(file)
      setPendingDoc({ name: file.name, label: getDocumentLabel(file), text })
    } catch {
      setPendingDoc({ name: file.name, label: getDocumentLabel(file), text: '' })
    } finally {
      setDocLoading(false)
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
    const imageFile = getImageFile(e.dataTransfer)
    if (imageFile) {
      processImageFile(imageFile)
      return
    }
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i]
      if (isDocumentFile(file)) {
        processDocFile(file)
        return
      }
    }
  }, [processImageFile, processDocFile])

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
    if (!file) { e.target.value = ''; return }
    if (file.type.startsWith('image/')) {
      processImageFile(file)
    } else if (isDocumentFile(file)) {
      processDocFile(file)
    }
    e.target.value = ''
  }, [processImageFile, processDocFile])

  // ── Send ──

  const handleSend = useCallback(async () => {
    const text = input.trim()
    const image = pendingImage
    const doc = pendingDoc
    if ((!text && !image && !doc) || isLoading) return

    let finalText = text || (image ? "What's in this picture?" : '')

    // Prepend document content
    if (doc && doc.text) {
      const docPrefix = `[Attached document: ${doc.name}]\n\n${doc.text}\n\n---\n\n`
      finalText = docPrefix + (finalText || `I've attached a document called "${doc.name}". Can you help me with it?`)
    } else if (doc && !doc.text) {
      finalText = finalText || `I tried to attach "${doc.name}" but couldn't read it.`
    }

    setInput('')
    setPendingImage(null)
    setPendingDoc(null)
    await sendMessageStreaming(finalText, image ?? undefined)
  }, [input, pendingImage, pendingDoc, isLoading, sendMessageStreaming])

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
        className="fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] right-5 z-40 w-14 h-14 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center overflow-hidden"
        title="Chat with Váu Váu"
      >
        <AiAvatar size="lg" className="w-full h-full" />
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
      <div className="safe-top flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10 sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          <AiAvatar size="md" className="shadow-sm" />
          <div>
            <h3 className="font-extrabold text-foreground text-base">{buddyName}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isTTSAvailable() && (
            <button
              onClick={toggleAutoReadAloud}
              className={`rounded-lg p-2 transition-colors ${
                autoReadAloud
                  ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={autoReadAloud ? 'Auto-read: ON' : 'Auto-read: OFF'}
              aria-label={autoReadAloud ? 'Turn off auto-read aloud' : 'Turn on auto-read aloud'}
            >
              {autoReadAloud ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          <button
            onClick={() => {
              if (confirmClear) {
                clearMessages()
                setConfirmClear(false)
              } else {
                setConfirmClear(true)
                setTimeout(() => setConfirmClear(false), 3000)
              }
            }}
            className={cn(
              'rounded-lg p-2 transition-colors',
              confirmClear
                ? 'text-white bg-destructive'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title={confirmClear ? 'Click again to clear' : 'Clear chat'}
            aria-label={confirmClear ? 'Click again to clear chat' : 'Clear chat'}
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
        <div className="px-4 py-2 border-b border-border/50 flex gap-2 overflow-x-auto no-scrollbar">
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
            <p className="text-green-700 dark:text-green-300 font-bold text-lg">Drop file here</p>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
            <AiAvatar size="lg" className="shadow-md" />
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
                <ChatBubble
                  message={msg}
                  isUser={msg.role === 'user'}

                  isActionGenerating={
                    msg.role === 'assistant' && (
                      isGeneratingImage ||
                      generatingDrawingIndex === originalIndex ||
                      generatingPresentationIndex === originalIndex ||
                      isStreaming
                    )
                  }
                  isSpeakingThis={speakingMsgIndex === originalIndex}
                  onSpeak={() => handleSpeak(originalIndex, msg.content)}
                  onStop={handleStopSpeaking}
                />
                {isLastAssistant && appMode !== 'kid' && (
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
                  drawings[originalIndex] && drawings[originalIndex].length > 0 && (
                    drawings[originalIndex].map((drawing, drawIdx) => (
                      <DrawingCard
                        key={drawIdx}
                        result={drawing}
                        isGenerating={generatingDrawingIndex === originalIndex && !drawing.imageDataUrl && !drawing.error}
                        onDismiss={() => dismissDrawing(originalIndex)}
                      />
                    ))
                )}
                {msg.role === 'assistant' &&
                  presentations[originalIndex] && (
                    <PresentationCard
                      result={presentations[originalIndex]}
                      isGenerating={generatingPresentationIndex === originalIndex}
                      onDismiss={() => dismissPresentation(originalIndex)}
                    />
                )}
              </div>
            )
          })
        })()}

        {isLoading && !isStreaming && <TypingIndicator />}

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
              ? "Can't reach Váu Váu's brain (Ollama). Is it running? \u{1F914}"
              : error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick tools */}
      {effectiveMemberId && !isLoading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {TOOL_CARDS.map(({ label, icon: Icon, text }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(text)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 shadow-sm text-xs font-medium text-foreground/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Icon size={14} />
              {label}
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

      {/* Pending document preview */}
      {pendingDoc && (
        <div className="px-4 pt-2">
          <div className="relative inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
            <FileText size={16} className="text-blue-500 shrink-0" />
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{pendingDoc.name}</span>
            <span className="text-xs text-muted-foreground">({pendingDoc.label})</span>
            <button
              onClick={() => setPendingDoc(null)}
              className="ml-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors shrink-0"
              title="Remove document"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {docLoading && (
        <div className="px-4 pt-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-purple-200 dark:border-purple-800 border-t-purple-500 animate-spin" />
            Reading document...
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.docx,.xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFilePickerChange}
      />

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 flex gap-2 sm:rounded-b-2xl">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectiveMemberId ? "Ask Váu Váu anything..." : "Pick a kid first..."}
          disabled={!effectiveMemberId || isLoading}
          className="flex-1 rounded-2xl bg-muted px-4 py-2.5 shadow-sm disabled:opacity-50"
        />
        {effectiveMemberId && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="rounded-full px-3 py-2.5 bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center disabled:opacity-40"
              title="Attach image"
              aria-label="Attach image"
            >
              <ImagePlus size={16} />
            </button>
          </>
        )}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !pendingImage && !pendingDoc) || !effectiveMemberId || isLoading}
          className="rounded-full px-4 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
