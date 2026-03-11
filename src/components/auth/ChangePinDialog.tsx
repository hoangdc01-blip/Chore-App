import { useState, useEffect, useCallback } from 'react'
import { Delete, X } from 'lucide-react'
import { changePin } from '../../lib/pin'

type Step = 'current' | 'new' | 'confirm'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ChangePinDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('current')
  const [pin, setPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setStep('current')
      setPin('')
      setCurrentPin('')
      setNewPin('')
      setError('')
      setShake(false)
      setSaving(false)
      setSuccess(false)
    }
  }, [open])

  const doShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const submit = useCallback(async (fullPin: string) => {
    if (step === 'current') {
      setCurrentPin(fullPin)
      setPin('')
      setStep('new')
      return
    }
    if (step === 'new') {
      setNewPin(fullPin)
      setPin('')
      setStep('confirm')
      return
    }
    if (fullPin !== newPin) {
      setError('PINs do not match. Start over.')
      doShake()
      setPin('')
      setStep('current')
      setCurrentPin('')
      setNewPin('')
      return
    }
    setSaving(true)
    try {
      const ok = await changePin(currentPin, fullPin)
      if (!ok) {
        setError('Current PIN is incorrect.')
        doShake()
        setPin('')
        setStep('current')
        setCurrentPin('')
        setNewPin('')
      } else {
        setSuccess(true)
        setTimeout(onClose, 1200)
      }
    } catch {
      setError('Failed to change PIN. Try again.')
      setPin('')
      setStep('current')
      setCurrentPin('')
      setNewPin('')
    } finally {
      setSaving(false)
    }
  }, [step, currentPin, newPin, onClose])

  const addDigit = useCallback((digit: string) => {
    if (saving || success) return
    setError('')
    setPin((prev) => {
      const next = prev + digit
      if (next.length === 4) {
        submit(next)
      }
      return next.length <= 4 ? next : prev
    })
  }, [saving, success, submit])

  const removeDigit = useCallback(() => {
    if (saving || success) return
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }, [saving, success])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, addDigit, removeDigit, onClose])

  if (!open) return null

  const titles: Record<Step, string> = {
    current: 'Enter current PIN',
    new: 'Enter new PIN',
    confirm: 'Confirm new PIN',
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-[300px] mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{titles[step]}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">PIN changed</p>
          </div>
        ) : (
          <>
            {/* PIN dots */}
            <div className={`flex gap-5 mb-6 ${shake ? 'animate-shake' : ''}`}>
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

            {/* Error */}
            <div className="h-8 flex items-center justify-center mb-2">
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
            </div>

            {/* Number pad - compact */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => addDigit(String(n))}
                  disabled={saving}
                  className="h-14 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                    text-lg font-semibold shadow-sm border border-neutral-200 dark:border-neutral-700
                    active:scale-90 active:bg-neutral-100 dark:active:bg-neutral-700
                    transition-all duration-100 disabled:opacity-30
                    hover:bg-neutral-50 dark:hover:bg-neutral-750"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => addDigit('0')}
                disabled={saving}
                className="h-14 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                  text-lg font-semibold shadow-sm border border-neutral-200 dark:border-neutral-700
                  active:scale-90 active:bg-neutral-100 dark:active:bg-neutral-700
                  transition-all duration-100 disabled:opacity-30
                  hover:bg-neutral-50 dark:hover:bg-neutral-750"
              >
                0
              </button>
              <button
                onClick={removeDigit}
                disabled={saving || pin.length === 0}
                className="h-14 rounded-full flex items-center justify-center
                  text-neutral-400 dark:text-neutral-500
                  active:scale-90 active:text-neutral-600 dark:active:text-neutral-300
                  transition-all duration-100 disabled:opacity-30
                  hover:text-neutral-500 dark:hover:text-neutral-400"
              >
                <Delete size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
