import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Trash2, Mic, MicOff, Volume2, VolumeX, ImagePlus } from 'lucide-react'
import { useChatStore } from '../../store/chat-store'
import { useMemberStore } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'
import { resizeImageToDataURL } from '../../lib/ai-chat'
import type { ChatMessage } from '../../lib/ai-chat'

const QUICK_ACTIONS = [
  { label: "What should I do now? \u{1F914}", text: "What should I do now?" },
  { label: "What's next? \u27A1\uFE0F", text: "What's next?" },
  { label: "Fun fact! \u{1F31F}", text: "Tell me a fun fact!" },
  { label: "Help with homework \u{1F4DA}", text: "Help me with homework" },
]

// Lazily resolve SpeechRecognition — iOS Safari may not have it at module load
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

const isHTTPS = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1.1

  // Try to pick a friendly voice
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    // Detect language from text
    const hasVietnamese = /[\u00C0-\u024F\u1E00-\u1EFF]/.test(text) || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)
    const hasChinese = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)

    let langCode = 'en'
    if (hasVietnamese) langCode = 'vi'
    else if (hasChinese) langCode = 'zh'

    // Find a matching voice
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode) && !v.name.includes('Google')) ||
      voices.find((v) => v.lang.startsWith(langCode)) ||
      voices.find((v) => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
      voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Google')) ||
      voices[0]

    if (matchingVoice) utterance.voice = matchingVoice
  }

  window.speechSynthesis.speak(utterance)
}

function ChatBubble({ message, isUser }: { message: ChatMessage; isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm shrink-0 mr-2 mt-1 shadow-sm">
          {'\u{1F43B}'}
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

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
        {'\u{1F43B}'}
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
  const [isListening, setIsListening] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const prevMessageCountRef = useRef(0)

  const {
    messages,
    isOpen,
    isLoading,
    error,
    selectedMemberId,
    soundEnabled,
    setOpen,
    setSelectedMemberId,
    setSoundEnabled,
    sendMessage,
    clearMessages,
  } = useChatStore()

  const members = useMemberStore((s) => s.members)
  const appMode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const isKidMode = appMode === 'kid'

  // In kid mode, auto-select the active kid
  const effectiveMemberId = isKidMode ? activeKidId : selectedMemberId

  // Sync chat store member for kid mode
  useEffect(() => {
    if (isKidMode && activeKidId && selectedMemberId !== activeKidId) {
      setSelectedMemberId(activeKidId)
    }
  }, [isKidMode, activeKidId, selectedMemberId, setSelectedMemberId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Load voices on mount (needed for some browsers)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!soundEnabled) return
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    if (assistantMessages.length > prevMessageCountRef.current) {
      const lastMsg = assistantMessages[assistantMessages.length - 1]
      if (lastMsg) {
        speakText(lastMsg.content)
      }
    }
    prevMessageCountRef.current = assistantMessages.length
  }, [messages, soundEnabled])

  // Stop speech when chat closes or sound disabled
  useEffect(() => {
    if (!isOpen || !soundEnabled) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [isOpen, soundEnabled])

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
    await sendMessage(finalText, image ?? undefined)
  }, [input, pendingImage, isLoading, sendMessage])

  const handleQuickAction = async (text: string) => {
    if (isLoading) return
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const [micStatus, setMicStatus] = useState<'idle' | 'listening' | 'unsupported' | 'error'>('idle')
  const [micError, setMicError] = useState('')

  const clearMicStatus = () => {
    setMicStatus('idle')
    setMicError('')
  }

  const startListening = () => {
    // Abort any stale recognition session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    if (isListening) return

    const SR = getSpeechRecognition()

    if (!SR) {
      setMicStatus('unsupported')
      return
    }

    try {
      const recognition = new SR()
      recognitionRef.current = recognition

      // Auto-detect language from browser setting; supports vi, zh, en
      const browserLang = navigator.language || 'en-US'
      if (browserLang.startsWith('vi')) recognition.lang = 'vi-VN'
      else if (browserLang.startsWith('zh')) recognition.lang = 'zh-CN'
      else recognition.lang = browserLang
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript ?? ''
        if (transcript.trim()) {
          sendMessage(transcript.trim())
        }
        setIsListening(false)
        setMicStatus('idle')
      }

      recognition.onerror = (event: any) => {
        const errMsg = event?.error || 'Unknown error'

        setIsListening(false)

        if (errMsg === 'not-allowed' || errMsg === 'service-not-allowed') {
          setMicStatus('error')
          setMicError('Microphone access denied. Check browser permissions.')
        } else if (errMsg === 'no-speech') {
          setMicStatus('error')
          setMicError('No speech detected. Try again.')
        } else if (errMsg === 'network') {
          setMicStatus('error')
          setMicError('Network error. Check your connection.')
        } else if (errMsg === 'aborted') {
          setMicStatus('idle')
          return
        } else {
          setMicStatus('error')
          setMicError(`Mic error: ${errMsg}`)
        }
        setTimeout(clearMicStatus, 4000)
      }

      recognition.onend = () => {
        setIsListening(false)
        // Only reset status if we didn't already set an error
        setMicStatus((prev) => prev === 'listening' ? 'idle' : prev)
      }

      recognition.start()
      setIsListening(true)
      setMicStatus('listening')
      setMicError('')
    } catch {
      setIsListening(false)
      setMicStatus('error')
      setMicError('Failed to start voice input')
      setTimeout(clearMicStatus, 4000)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setIsListening(false)
    setMicStatus('idle')
  }

  // ── Floating Button ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
        title="Chat with Buddy"
      >
        <span className="text-2xl">{'\u{1F43B}'}</span>
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-green-500/10 to-emerald-500/10 sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg shadow-sm">
            {'\u{1F43B}'}
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-base">Buddy</h3>
            <p className="text-xs text-muted-foreground">Your friendly helper!</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-lg p-2 transition-colors ${
              soundEnabled
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={clearMessages}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
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
              {'\u{1F43B}'}
            </div>
            <p className="font-bold text-foreground text-lg">Hi there! I'm Buddy!</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {effectiveMemberId
                ? `I can help ${members.find((m) => m.id === effectiveMemberId)?.name} with chores, fun facts, and more!`
                : 'Pick a kid above, then ask me anything!'}
            </p>
          </div>
        )}

        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, i) => (
            <ChatBubble key={i} message={msg} isUser={msg.role === 'user'} />
          ))}

        {isLoading && <TypingIndicator />}

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
          {QUICK_ACTIONS.map((action) => (
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

      {/* Mic status notice */}
      {micStatus === 'listening' && (
        <div className="px-4 pb-1">
          <p className="text-xs text-center text-green-600 dark:text-green-400 animate-pulse">
            Listening...
          </p>
        </div>
      )}
      {micStatus === 'error' && micError && (
        <div className="px-4 pb-1">
          <p className="text-xs text-center text-amber-600 dark:text-amber-400">
            {micError}
          </p>
        </div>
      )}

      {/* Voice not available modal */}
      {micStatus === 'unsupported' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-[fadeIn_150ms_ease-out]"
          onClick={clearMicStatus}
        >
          <div
            className="bg-background rounded-2xl border border-border shadow-xl w-[90vw] max-w-[320px] p-6 flex flex-col items-center text-center animate-[fadeInUp_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <MicOff size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Voice Not Available</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Voice input is not supported on this browser.
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              Try using Chrome on desktop for the best experience.
            </p>
            {!isHTTPS && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Or try the live site (HTTPS) for voice support.
              </p>
            )}
            <button
              onClick={clearMicStatus}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              OK
            </button>
          </div>
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
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectiveMemberId ? "Ask Buddy anything..." : "Pick a kid first..."}
          disabled={!effectiveMemberId || isLoading}
          className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {effectiveMemberId && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="rounded-xl px-3 py-2.5 bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center disabled:opacity-40"
              title="Attach image"
            >
              <ImagePlus size={16} />
            </button>
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`rounded-xl px-3 py-2.5 font-bold transition-all flex items-center justify-center ${
                micStatus === 'listening'
                  ? 'bg-red-500 text-white animate-pulse'
                  : micStatus === 'error' || micStatus === 'unsupported'
                    ? 'bg-muted border border-border text-amber-500'
                    : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              } disabled:opacity-40`}
              title={isListening ? 'Stop listening' : 'Talk to Buddy'}
            >
              {micStatus === 'unsupported' ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </>
        )}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !pendingImage) || !effectiveMemberId || isLoading}
          className="rounded-xl px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
