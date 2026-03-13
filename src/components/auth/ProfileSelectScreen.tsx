import { useState, useEffect, useCallback } from 'react'
import { Delete, Lock, ArrowLeft } from 'lucide-react'
import { verifyPin, signInAfterPin } from '../../lib/pin'
import { useMemberStore } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'
import { useAuthStore } from '../../store/auth-store'
import { EMOJI_OPTIONS } from '../../types'
import type { FamilyMember } from '../../types'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 2 * 60 * 1000

// Muted avatar colors — desaturated, Netflix-style
const AVATAR_COLORS = [
  'bg-[#5b7a6f]', // sage
  'bg-[#7a5b6f]', // mauve
  'bg-[#5b6f7a]', // steel
  'bg-[#7a6f5b]', // tan
]

export default function ProfileSelectScreen() {
  // Parent PIN state
  const [showPinPad, setShowPinPad] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState('')

  // Kid emoji login state
  const [selectedKid, setSelectedKid] = useState<FamilyMember | null>(null)
  const [kidError, setKidError] = useState('')
  const [kidShake, setKidShake] = useState(false)
  const [kidAttempts, setKidAttempts] = useState(0)
  const [kidLockedUntil, setKidLockedUntil] = useState<number | null>(null)
  const [kidCountdown, setKidCountdown] = useState('')
  const [successEmoji, setSuccessEmoji] = useState<string | null>(null)

  const members = useMemberStore((s) => s.members)
  const enterParentMode = useAppStore((s) => s.enterParentMode)
  const enterKidMode = useAppStore((s) => s.enterKidMode)

  const isLockedOut = lockedUntil !== null && Date.now() < lockedUntil
  const isKidLockedOut = kidLockedUntil !== null && Date.now() < kidLockedUntil

  // Parent lockout timer
  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const remaining = lockedUntil - Date.now()
      if (remaining <= 0) {
        setLockedUntil(null)
        setAttempts(0)
        setError('')
        setCountdown('')
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  // Kid lockout timer
  useEffect(() => {
    if (!kidLockedUntil) return
    const tick = () => {
      const remaining = kidLockedUntil - Date.now()
      if (remaining <= 0) {
        setKidLockedUntil(null)
        setKidAttempts(0)
        setKidError('')
        setKidCountdown('')
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setKidCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [kidLockedUntil])

  // ── Parent PIN logic ──

  const submit = useCallback(async (fullPin: string) => {
    if (isLockedOut || checking) return
    setChecking(true)
    setError('')
    try {
      const valid = await verifyPin(fullPin)
      if (valid) {
        try { await signInAfterPin() } catch { /* ignore */ }
        useAuthStore.getState().setUnlocked(true)
        enterParentMode()
      } else {
        const next = attempts + 1
        setAttempts(next)
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS)
          setError('Too many attempts. Try again later.')
        } else {
          setError(`Wrong PIN. ${MAX_ATTEMPTS - next} attempts left.`)
        }
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPin('')
      }
    } catch {
      setError('Verification failed. Try again.')
      setPin('')
    } finally {
      setChecking(false)
    }
  }, [isLockedOut, checking, attempts, enterParentMode])

  const addDigit = useCallback((digit: string) => {
    if (isLockedOut || checking) return
    setError('')
    setPin((prev) => {
      const next = prev + digit
      if (next.length === 4) {
        submit(next)
      }
      return next.length <= 4 ? next : prev
    })
  }, [isLockedOut, checking, submit])

  const removeDigit = useCallback(() => {
    if (isLockedOut || checking) return
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }, [isLockedOut, checking])

  useEffect(() => {
    if (!showPinPad) return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
      else if (e.key === 'Escape') { setShowPinPad(false); setPin(''); setError('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showPinPad, addDigit, removeDigit])

  // ── Kid emoji login logic ──

  const handleKidClick = (member: FamilyMember) => {
    if (!member.emojiPasscode) {
      // No passcode set — enter directly
      doKidLogin(member.id)
      return
    }
    setSelectedKid(member)
    setKidError('')
    setKidAttempts(0)
    setSuccessEmoji(null)
  }

  const doKidLogin = async (memberId: string) => {
    try { await signInAfterPin() } catch { /* ignore */ }
    useAuthStore.getState().setUnlocked(true)
    enterKidMode(memberId)
  }

  const handleEmojiTap = (emoji: string) => {
    if (!selectedKid || isKidLockedOut || successEmoji) return

    if (emoji === selectedKid.emojiPasscode) {
      // Correct!
      setSuccessEmoji(emoji)
      setKidError('')
      setTimeout(() => doKidLogin(selectedKid.id), 600)
    } else {
      // Wrong
      const next = kidAttempts + 1
      setKidAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setKidLockedUntil(Date.now() + LOCKOUT_MS)
        setKidError('Too many tries! Wait a bit.')
      } else {
        setKidError('Try again!')
      }
      setKidShake(true)
      setTimeout(() => setKidShake(false), 500)
    }
  }

  // Escape key for kid emoji screen
  useEffect(() => {
    if (!selectedKid) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedKid(null); setKidError(''); setSuccessEmoji(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedKid])

  // ── Kid Emoji Login Screen ──
  if (selectedKid) {
    const kidIndex = members.indexOf(selectedKid)
    const avatarColor = AVATAR_COLORS[kidIndex % AVATAR_COLORS.length]

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center w-full max-w-[320px] animate-fade-in-up">
          <button
            onClick={() => { setSelectedKid(null); setKidError(''); setSuccessEmoji(null) }}
            className="self-start mb-10 flex items-center gap-1.5 text-[13px] tracking-wide transition-colors
              text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* Kid avatar */}
          <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center overflow-hidden mb-4`}>
            {selectedKid.avatar ? (
              <img src={selectedKid.avatar} alt={selectedKid.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-normal" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {selectedKid.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-lg tracking-wide mb-1 font-normal text-neutral-900 dark:text-neutral-100">{selectedKid.name}</h2>
          <p className="text-[13px] tracking-wide mb-8 text-neutral-400 dark:text-neutral-500">Tap your secret emoji</p>

          {/* Single emoji slot */}
          <div className={`mb-8 ${kidShake ? 'animate-shake' : ''}`}>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300
                ${successEmoji
                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 scale-[1.15]'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700'}`}
            >
              {successEmoji || ''}
            </div>
          </div>

          {/* Status message */}
          <div className="h-6 flex items-center justify-center mb-6">
            {successEmoji ? (
              <p className="text-[13px] tracking-wide text-green-500 dark:text-green-400">Welcome!</p>
            ) : kidError ? (
              <p className="text-[13px] text-center text-red-500">{kidError}</p>
            ) : isKidLockedOut && kidCountdown ? (
              <p className="text-[13px] font-mono text-neutral-400 dark:text-neutral-500">Try again in {kidCountdown}</p>
            ) : null}
          </div>

          {/* Emoji grid — 4x3 */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiTap(emoji)}
                disabled={isKidLockedOut || !!successEmoji}
                className="aspect-square rounded-2xl text-3xl flex items-center justify-center
                  transition-all duration-150 active:scale-90
                  disabled:opacity-20 disabled:cursor-not-allowed
                  bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
                  hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Parent PIN Pad ──
  if (showPinPad) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center w-full max-w-[260px] px-4 animate-fade-in-up">
          <button
            onClick={() => { setShowPinPad(false); setPin(''); setError('') }}
            className="self-start mb-10 flex items-center gap-1.5 text-[13px] tracking-wide transition-colors
              text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-neutral-200 dark:bg-neutral-800">
            <Lock size={26} className="text-neutral-400 dark:text-neutral-500" />
          </div>
          <h2 className="text-lg tracking-wide mb-1 font-normal text-neutral-900 dark:text-neutral-100">Parent</h2>
          <p className="text-[13px] tracking-wide mb-12 text-neutral-400 dark:text-neutral-500">Enter your PIN</p>

          {/* PIN dots */}
          <div className={`flex gap-6 mb-10 ${shake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                  ${i < pin.length
                    ? 'bg-neutral-900 dark:bg-neutral-100 scale-[1.2]'
                    : 'bg-neutral-300 dark:bg-neutral-600'}`}
              />
            ))}
          </div>

          <div className="h-6 flex items-center justify-center mb-5">
            {error ? (
              <p className="text-[13px] text-center text-red-500">{error}</p>
            ) : isLockedOut && countdown ? (
              <p className="text-[13px] font-mono text-neutral-400 dark:text-neutral-500">Try again in {countdown}</p>
            ) : checking ? (
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500">Verifying...</p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => addDigit(String(n))}
                disabled={isLockedOut || checking}
                className="aspect-square rounded-2xl text-xl font-normal transition-all duration-100
                  active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed
                  bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200
                  border border-neutral-200 dark:border-neutral-800
                  hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => addDigit('0')}
              disabled={isLockedOut || checking}
              className="aspect-square rounded-2xl text-xl font-normal transition-all duration-100
                active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed
                bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200
                border border-neutral-200 dark:border-neutral-800
                hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              0
            </button>
            <button
              onClick={removeDigit}
              disabled={isLockedOut || checking || pin.length === 0}
              className="aspect-square rounded-2xl flex items-center justify-center
                transition-all duration-100 active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed
                text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
            >
              <Delete size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Profile Selection ──
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950 safe-top safe-bottom">
      <div className="flex flex-col items-center w-full max-w-[420px]">

        {/* Header */}
        <div className="animate-fade-in-up text-center mb-14">
          <h1 className="text-[28px] tracking-tight mb-2 font-light text-neutral-900 dark:text-neutral-100">
            Family Chores
          </h1>
          <p className="text-[14px] tracking-wide text-neutral-400 dark:text-neutral-500">
            Who's using the app?
          </p>
        </div>

        {/* Parent profile */}
        <button
          onClick={() => setShowPinPad(true)}
          className="animate-fade-in-up group relative flex flex-col items-center gap-4 w-[140px] py-6
            rounded-2xl transition-all duration-300 ease-out
            active:scale-[0.97]
            bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
            hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.03]"
        >
          <div className="relative">
            <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all duration-300
              bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center
              bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-50 dark:border-neutral-950">
              <Lock size={9} className="text-neutral-400 dark:text-neutral-500" />
            </div>
          </div>
          <span className="text-[14px] tracking-wide font-normal text-neutral-700 dark:text-neutral-200">Parent</span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-300 dark:text-neutral-600">Kids</span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* Kid profiles — 4 across */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {members.map((member, i) => (
            <button
              key={member.id}
              onClick={() => handleKidClick(member)}
              className="animate-fade-in-up group flex flex-col items-center gap-3 py-5
                rounded-2xl transition-all duration-300 ease-out
                active:scale-[0.97]
                bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.03]"
              style={{ animationDelay: `${150 + i * 60}ms` }}
            >
              <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center overflow-hidden
                transition-all duration-300`}>
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-normal" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[13px] tracking-wide font-normal text-neutral-600 dark:text-neutral-300">
                {member.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
