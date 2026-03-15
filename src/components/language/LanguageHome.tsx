import { useState } from 'react'
import { ArrowLeft, Star, CheckCircle2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES, getLanguage } from '@/lib/language-data'
import type { LanguageCode, LanguageInfo } from '@/lib/language-data'
import { useLanguageStore } from '@/store/language-store'

interface Props {
  onStartLesson: (topicId: string) => void
}

export function LanguageHome({ onStartLesson }: Props) {
  const { activeLanguage, setActiveLanguage, progress } = useLanguageStore()
  const [selectedLang, setSelectedLang] = useState<LanguageCode | null>(
    activeLanguage ?? null,
  )

  const language = selectedLang ? getLanguage(selectedLang) : null

  function handleSelectLanguage(code: LanguageCode) {
    setSelectedLang(code)
    setActiveLanguage(code)
  }

  function handleBack() {
    setSelectedLang(null)
    setActiveLanguage(null)
  }

  // ── Topic list for a selected language ──────────────────
  if (language) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* Back button + language header */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-lg font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Languages
        </button>

        <div className="flex items-center gap-3 pb-2">
          <span className="text-4xl">{language.flag}</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {language.name}
            </h2>
            <p className="text-base text-muted-foreground">
              {language.nativeName}
            </p>
          </div>
        </div>

        {/* Topic rows */}
        <div className="space-y-3">
          {language.topics.map((topic) => {
            const topicProgress = progress[topic.id]
            const masteredWords = topicProgress?.masteredWords ?? 0
            const totalWords = topic.words.length
            const allMastered = masteredWords >= totalWords
            const pct =
              totalWords > 0
                ? Math.round((masteredWords / totalWords) * 100)
                : 0

            return (
              <div
                key={topic.id}
                className={cn(
                  'flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
                  allMastered && 'border-yellow-400/50 bg-yellow-50/30',
                )}
              >
                {/* Emoji */}
                <span className="text-3xl">{topic.emoji}</span>

                {/* Name + progress bar */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {topic.name}
                    </span>
                    {allMastered && (
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          allMastered
                            ? 'bg-yellow-400'
                            : pct > 0
                              ? 'bg-primary'
                              : 'bg-transparent',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                      {masteredWords}/{totalWords}
                    </span>
                  </div>
                </div>

                {/* Practice / Complete button */}
                {allMastered ? (
                  <button
                    onClick={() => onStartLesson(topic.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-900 shadow transition-transform hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Review
                  </button>
                ) : (
                  <button
                    onClick={() => onStartLesson(topic.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow transition-transform hover:scale-105 active:scale-95"
                  >
                    <Play className="h-4 w-4" />
                    Practice
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Language selection grid ──────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-foreground">
          Pick a Language!
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Choose what you want to learn today
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {LANGUAGES.map((lang) => (
          <LanguageCard
            key={lang.code}
            language={lang}
            onSelect={handleSelectLanguage}
          />
        ))}
      </div>
    </div>
  )
}

// ── Language card sub-component ────────────────────────────

function LanguageCard({
  language,
  onSelect,
}: {
  language: LanguageInfo
  onSelect: (code: LanguageCode) => void
}) {
  return (
    <button
      onClick={() => onSelect(language.code)}
      className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
    >
      <span className="text-5xl transition-transform group-hover:scale-110">
        {language.flag}
      </span>
      <span className="text-lg font-bold text-foreground">{language.name}</span>
      <span className="text-sm text-muted-foreground">
        {language.nativeName}
      </span>
    </button>
  )
}
