import { useState, useEffect, useCallback } from 'react'
import { Delete } from 'lucide-react'
import { savePin, signInAfterPin } from '../../lib/pin'
import { useAuthStore } from '../../store/auth-store'
import { useAppStore } from '../../store/app-store'

type Step = 'create' | 'confirm'

export default function PinSetupScreen() {
  const [step, setStep] = useState<Step>('create')
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = useCallback(async (fullPin: string) => {
    if (step === 'create') {
      setFirstPin(fullPin)
      setPin('')
      setStep('confirm')
      return
    }
    if (fullPin !== firstPin) {
      setError('PINs do not match. Try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPin('')
      setStep('create')
      setFirstPin('')
      return
    }
    setSaving(true)
    try {
      await signInAfterPin()
      await savePin(fullPin)
      useAuthStore.getState().setPinExists(true)
      useAuthStore.getState().setUnlocked(true)
      useAppStore.getState().enterParentMode()
    } catch (err) {
      console.error('PIN setup failed:', err)
      setError('Failed to save PIN. Check that Anonymous Auth is enabled in Firebase Console.')
      setPin('')
      setStep('create')
      setFirstPin('')
    } finally {
      setSaving(false)
    }
  }, [step, firstPin])

  const addDigit = useCallback((digit: string) => {
    if (saving) return
    setError('')
    setPin((prev) => {
      const next = prev + digit
      if (next.length === 4) {
        submit(next)
      }
      return next.length <= 4 ? next : prev
    })
  }, [saving, submit])

  const removeDigit = useCallback(() => {
    if (saving) return
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }, [saving])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [addDigit, removeDigit])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 safe-top safe-bottom">
      <div className="flex flex-col items-center w-full max-w-[280px] px-4">
        {/* App branding */}
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 mb-1">
          Family Chores
        </h1>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-10">
          {step === 'create' ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'}
        </p>

        {/* PIN dots */}
        <div className={`flex gap-5 mb-8 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-neutral-800 dark:bg-neutral-100 scale-110'
                  : 'border-2 border-neutral-300 dark:border-neutral-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        <div className="h-10 flex items-center justify-center mb-2">
          {error ? (
            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
          ) : saving ? (
            <p className="text-sm text-neutral-400">Saving...</p>
          ) : null}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => addDigit(String(n))}
              disabled={saving}
              className="aspect-square rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                text-xl font-semibold shadow-sm border border-neutral-200 dark:border-neutral-700
                active:scale-90 active:bg-neutral-100 dark:active:bg-neutral-700
                transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-neutral-50 dark:hover:bg-neutral-750"
            >
              {n}
            </button>
          ))}

          <div />
          <button
            onClick={() => addDigit('0')}
            disabled={saving}
            className="aspect-square rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
              text-xl font-semibold shadow-sm border border-neutral-200 dark:border-neutral-700
              active:scale-90 active:bg-neutral-100 dark:active:bg-neutral-700
              transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-neutral-50 dark:hover:bg-neutral-750"
          >
            0
          </button>
          <button
            onClick={removeDigit}
            disabled={saving || pin.length === 0}
            className="aspect-square rounded-full flex items-center justify-center
              text-neutral-400 dark:text-neutral-500
              active:scale-90 active:text-neutral-600 dark:active:text-neutral-300
              transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed
              hover:text-neutral-500 dark:hover:text-neutral-400"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}
