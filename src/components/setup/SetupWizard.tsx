import { useState, useRef } from 'react'
import { Camera, X, Plus, ArrowRight, Check } from 'lucide-react'
import { useMemberStore } from '../../store/member-store'
import { MEMBER_COLORS } from '../../types'
import { resizeImageToDataURL } from '../../lib/image'
import { fireConfetti } from '../../lib/confetti'

interface KidEntry {
  name: string
  avatar?: string
  colorIndex: number
}

interface SetupWizardProps {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [kids, setKids] = useState<KidEntry[]>([])
  const [nameInput, setNameInput] = useState('')
  const [avatarInput, setAvatarInput] = useState<string | undefined>()
  const [transitioning, setTransitioning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const nextColorIndex = kids.length % MEMBER_COLORS.length

  const goToStep = (next: 1 | 2 | 3) => {
    setTransitioning(true)
    setTimeout(() => {
      setStep(next)
      setTransitioning(false)
      if (next === 3) {
        setTimeout(() => fireConfetti(), 300)
      }
    }, 200)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImageToDataURL(file, 256)
    setAvatarInput(dataUrl)
    // Reset file input so the same file can be selected again
    e.target.value = ''
  }

  const addKid = () => {
    const trimmed = nameInput.trim()
    if (!trimmed || kids.length >= 8) return
    setKids((prev) => [...prev, { name: trimmed, avatar: avatarInput, colorIndex: nextColorIndex }])
    setNameInput('')
    setAvatarInput(undefined)
  }

  const removeKid = (index: number) => {
    setKids((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKid()
    }
  }

  const handleComplete = () => {
    const store = useMemberStore.getState()
    for (const kid of kids) {
      store.addMember(kid.name, kid.avatar, String(kid.colorIndex))
    }
    useMemberStore.setState({ _initialized: true })
    onComplete()
  }

  const color = MEMBER_COLORS[nextColorIndex]

  return (
    <div role="dialog" aria-modal="true" aria-label="Family setup wizard" className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-background safe-top safe-bottom">
      <div
        className={`flex flex-col items-center w-full max-w-[480px] transition-opacity duration-200 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              <span className="text-5xl">&#127968;</span>
            </div>
            <h1 className="text-[28px] tracking-tight mb-3 font-light text-foreground">
              Welcome to Váu Váu AI!
            </h1>
            <p className="text-[15px] tracking-wide mb-12 text-muted-foreground max-w-[320px]">
              Let's set up your family. You'll add your kids and they can start tracking their chores right away.
            </p>
            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-[15px] font-medium text-primary-foreground
                hover:bg-primary/90 transition-all duration-200 active:scale-[0.97]"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Add Kids */}
        {step === 2 && (
          <div className="flex flex-col items-center w-full animate-fade-in-up">
            <h2 className="text-[24px] tracking-tight mb-2 font-light text-foreground">
              Add your kids
            </h2>
            <p className="text-[14px] tracking-wide mb-8 text-muted-foreground">
              Add at least 1 kid to get started (max 8)
            </p>

            {/* Added kids */}
            {kids.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 w-full justify-center">
                {kids.map((kid, i) => {
                  const kidColor = MEMBER_COLORS[kid.colorIndex]
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 ${kidColor.bg} ${kidColor.darkBg} ${kidColor.text} ${kidColor.darkText} rounded-full pl-1.5 pr-3 py-1.5
                        animate-fade-in-up`}
                    >
                      <div className={`w-7 h-7 rounded-full ${kidColor.dot} flex items-center justify-center overflow-hidden`}>
                        {kid.avatar ? (
                          <img src={kid.avatar} alt={kid.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{kid.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{kid.name}</span>
                      <button
                        onClick={() => removeKid(i)}
                        className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${kid.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add kid form */}
            {kids.length < 8 && (
              <div className="w-full max-w-[360px] bg-card border border-border rounded-2xl p-5 mb-6">
                {/* Avatar preview + upload */}
                <div className="flex justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative group"
                    aria-label="Upload avatar photo"
                  >
                    {avatarInput ? (
                      <img src={avatarInput} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <div className={`h-20 w-20 rounded-full ${color.dot} flex items-center justify-center text-white text-2xl font-bold`}>
                        {nameInput.trim() ? nameInput.trim().charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>

                {/* Name input + add button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Kid's name"
                    className="flex-1 rounded-xl border border-border bg-muted
                      px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={addKid}
                    disabled={!nameInput.trim()}
                    className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground
                      hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all
                      active:scale-[0.97] flex items-center gap-1.5"
                    aria-label="Add kid"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            )}

            {kids.length >= 8 && (
              <p className="text-[13px] text-muted-foreground mb-6">
                Maximum of 8 kids reached
              </p>
            )}

            {/* Continue button */}
            <button
              onClick={() => goToStep(3)}
              disabled={kids.length === 0}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-[15px] font-medium text-primary-foreground
                hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-8">
              <Check size={48} className="text-green-500" />
            </div>
            <h2 className="text-[28px] tracking-tight mb-3 font-light text-foreground">
              You're all set!
            </h2>
            <p className="text-[15px] tracking-wide mb-10 text-muted-foreground">
              Here's your family
            </p>

            {/* Show added kids */}
            <div className="flex flex-wrap gap-4 mb-12 justify-center">
              {kids.map((kid, i) => {
                const kidColor = MEMBER_COLORS[kid.colorIndex]
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`w-16 h-16 rounded-full ${kidColor.dot} flex items-center justify-center overflow-hidden
                      ring-4 ring-background shadow-lg`}>
                      {kid.avatar ? (
                        <img src={kid.avatar} alt={kid.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-white">{kid.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-muted-foreground">{kid.name}</span>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleComplete}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-[15px] font-medium text-primary-foreground
                hover:bg-primary/90 transition-all duration-200 active:scale-[0.97]"
            >
              Start Using Váu Váu AI
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
