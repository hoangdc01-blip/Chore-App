import { useState, useCallback } from 'react'
import { useLanguageStore } from '@/store/language-store'
import { useMemberStore } from '@/store/member-store'
import { useAppStore } from '@/store/app-store'
import { getTopic } from '@/lib/language-data'
import LanguageHome from './LanguageHome'
import LessonView from './LessonView'
import LessonComplete from './LessonComplete'

type Screen = 'home' | 'lesson' | 'results'

interface LessonResults {
  total: number
  correct: number
  pointsEarned: number
  questions: Array<{ word: string; correctAnswer: string; wasCorrect: boolean }>
}

export default function LanguageView() {
  const [screen, setScreen] = useState<Screen>('home')
  const [results, setResults] = useState<LessonResults | null>(null)

  const startQuiz = useLanguageStore((s) => s.startQuiz)
  const quizState = useLanguageStore((s) => s.quizState)
  const finishQuiz = useLanguageStore((s) => s.finishQuiz)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const mode = useAppStore((s) => s.mode)

  const handleStartLesson = useCallback((topicId: string) => {
    const info = getTopic(topicId)
    if (!info) return
    startQuiz(topicId, info.language.code)
    setScreen('lesson')
  }, [startQuiz])

  const handleLessonComplete = useCallback(() => {
    const state = useLanguageStore.getState().quizState
    if (!state) return

    const info = getTopic(state.topicId)
    if (!info) return

    // Build results before finishing quiz
    const questions = state.questions.map((q, i) => {
      const word = info.topic.words[q.wordIndex]
      const wasCorrect = state.answers[i] !== null && q.options[state.answers[i]!] === q.correctAnswer
      return {
        word: q.type === 'meaning-to-word' || q.type === 'listen' ? word.meaning : word.word,
        correctAnswer: q.correctAnswer,
        wasCorrect,
      }
    })

    const correct = questions.filter((q) => q.wasCorrect).length
    const pointsEarned = finishQuiz()

    // Award points to kid
    if (pointsEarned > 0 && mode === 'kid' && activeKidId) {
      useMemberStore.getState().adjustPoints(activeKidId, pointsEarned)
    }

    setResults({ total: state.questions.length, correct, pointsEarned, questions })
    setScreen('results')
  }, [finishQuiz, mode, activeKidId])

  const handlePracticeAgain = useCallback(() => {
    if (quizState?.topicId) {
      const info = getTopic(quizState.topicId)
      if (info) {
        startQuiz(quizState.topicId, info.language.code)
        setScreen('lesson')
        return
      }
    }
    // Fallback: if we have results, retry same topic
    if (results) {
      setScreen('home')
    }
  }, [quizState, results, startQuiz])

  const handleBackToTopics = useCallback(() => {
    setResults(null)
    setScreen('home')
  }, [])

  return (
    <main className="flex-1 overflow-y-auto">
      {screen === 'home' && (
        <LanguageHome onStartLesson={handleStartLesson} />
      )}
      {screen === 'lesson' && quizState && (
        <LessonView onComplete={handleLessonComplete} />
      )}
      {screen === 'results' && results && (
        <LessonComplete
          results={results}
          onPracticeAgain={handlePracticeAgain}
          onBackToTopics={handleBackToTopics}
        />
      )}
    </main>
  )
}
