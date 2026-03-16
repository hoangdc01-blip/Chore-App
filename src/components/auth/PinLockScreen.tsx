import { useState, useEffect, useCallback } from 'react'
import { Delete } from 'lucide-react'
import { verifyPin, signInAfterPin } from '../../lib/pin'
import { useAuthStore } from '../../store/auth-store'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000

export default function PinLockScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState('')

  const isLockedOut = lockedUntil !== null && Date.now() < lockedUntil

  // Countdown timer
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

  const submit = useCallback(async (fullPin: string) => {
    if (isLockedOut || checking) return
    setChecking(true)
    setError('')
    try {
      const valid = await verifyPin(fullPin)
      if (valid) {
        await signInAfterPin()
        useAuthStore.getState().setUnlocked(true)
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
      setError('Connection error. Try again.')
      setPin('')
    } finally {
      setChecking(false)
    }
  }, [isLockedOut, checking, attempts])

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

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [addDigit, removeDigit])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center w-full max-w-[280px] px-4">
        {/* App branding */}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
          Vau Vau AI
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Enter your PIN to continue
        </p>

        {/* PIN dots */}
        <div className={`flex gap-5 mb-8 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ease-out ${
                i < pin.length
                  ? 'bg-foreground scale-125 animate-pulse'
                  : 'border-2 border-muted-foreground/40 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Error / lockout message */}
        <div className="h-10 flex items-center justify-center mb-2">
          {error ? (
            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
          ) : isLockedOut && countdown ? (
            <p className="text-sm text-muted-foreground font-mono">Try again in {countdown}</p>
          ) : checking ? (
            <p className="text-sm text-muted-foreground">Verifying...</p>
          ) : null}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => addDigit(String(n))}
              disabled={isLockedOut || checking}
              className="w-16 h-16 rounded-full bg-card text-foreground
                text-xl font-semibold shadow-sm border border-border
                active:scale-90 active:bg-muted
                transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-muted flex items-center justify-center mx-auto"
            >
              {n}
            </button>
          ))}

          {/* Bottom row */}
          <div />
          <button
            onClick={() => addDigit('0')}
            disabled={isLockedOut || checking}
            className="w-16 h-16 rounded-full bg-card text-foreground
              text-xl font-semibold shadow-sm border border-border
              active:scale-90 active:bg-muted
              transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-muted flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            onClick={removeDigit}
            disabled={isLockedOut || checking || pin.length === 0}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto
              text-muted-foreground
              active:scale-90 active:text-foreground
              transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
              hover:text-foreground"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}
