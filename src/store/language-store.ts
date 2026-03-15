import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type LanguageCode, getTopic } from '../lib/language-data'

// ── Types ────────────────────────────────────────────────────────────────────

interface TopicProgress {
  totalAttempts: number
  correctAnswers: number
  lastPracticed: string // ISO date
  masteredWords: number[] // indices of mastered words (3+ correct in a row)
}

interface WordStat {
  correctStreak: number
  totalCorrect: number
  totalAttempts: number
}

interface QuizQuestion {
  wordIndex: number
  correctAnswer: string
  options: string[]
  type: 'word-to-meaning' | 'meaning-to-word' | 'listen'
}

interface QuizState {
  topicId: string
  languageCode: LanguageCode
  questions: QuizQuestion[]
  currentIndex: number
  answers: (number | null)[] // index of chosen option per question
  isComplete: boolean
  pointsEarned: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle (in-place, returns same array) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Store ────────────────────────────────────────────────────────────────────

interface LanguageState {
  activeLanguage: LanguageCode | null
  activeTopic: string | null
  quizState: QuizState | null
  progress: Record<string, TopicProgress>
  wordStats: Record<string, WordStat>

  setActiveLanguage: (code: LanguageCode | null) => void
  setActiveTopic: (topicId: string | null) => void
  startQuiz: (topicId: string, languageCode: LanguageCode) => void
  answerQuestion: (optionIndex: number) => void
  finishQuiz: () => number
  resetProgress: (topicId?: string) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      activeLanguage: null,
      activeTopic: null,
      quizState: null,
      progress: {},
      wordStats: {},

      setActiveLanguage: (code) => set({ activeLanguage: code }),

      setActiveTopic: (topicId) => set({ activeTopic: topicId }),

      startQuiz: (topicId, languageCode) => {
        const result = getTopic(topicId)
        if (!result) return
        const { topic } = result
        const words = topic.words
        if (words.length === 0) return

        const { wordStats } = get()

        // Build index list sorted by lowest correctStreak first, then shuffle ties
        const indices = words.map((_, i) => i)
        shuffle(indices)
        indices.sort((a, b) => {
          const statA = wordStats[`${topicId}:${a}`]
          const statB = wordStats[`${topicId}:${b}`]
          return (statA?.correctStreak ?? 0) - (statB?.correctStreak ?? 0)
        })

        // Pick up to 5 words
        const picked = indices.slice(0, Math.min(5, words.length))

        const questions: QuizQuestion[] = picked.map((wordIndex) => {
          const word = words[wordIndex]
          const questionType: 'word-to-meaning' | 'meaning-to-word' =
            Math.random() < 0.5 ? 'word-to-meaning' : 'meaning-to-word'

          // Correct answer and distractors depend on question type
          const correctAnswer =
            questionType === 'word-to-meaning' ? word.meaning : word.word

          // Gather wrong options from other words in the same topic
          const wrongIndices = words
            .map((_, i) => i)
            .filter((i) => i !== wordIndex)
          shuffle(wrongIndices)
          const wrongOptions = wrongIndices.slice(0, 3).map((i) =>
            questionType === 'word-to-meaning' ? words[i].meaning : words[i].word
          )

          const options = shuffle([correctAnswer, ...wrongOptions])

          return {
            wordIndex,
            correctAnswer,
            options,
            type: questionType,
          }
        })

        set({
          quizState: {
            topicId,
            languageCode,
            questions,
            currentIndex: 0,
            answers: new Array(questions.length).fill(null),
            isComplete: false,
            pointsEarned: 0,
          },
        })
      },

      answerQuestion: (optionIndex) => {
        const { quizState, wordStats } = get()
        if (!quizState || quizState.isComplete) return
        const { currentIndex, questions, answers } = quizState

        const question = questions[currentIndex]
        const isCorrect = question.options[optionIndex] === question.correctAnswer

        // Update word stats
        const statKey = `${quizState.topicId}:${question.wordIndex}`
        const prev = wordStats[statKey] ?? { correctStreak: 0, totalCorrect: 0, totalAttempts: 0 }
        const updatedStat: WordStat = {
          correctStreak: isCorrect ? prev.correctStreak + 1 : 0,
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          totalAttempts: prev.totalAttempts + 1,
        }

        const newAnswers = [...answers]
        newAnswers[currentIndex] = optionIndex

        const nextIndex = currentIndex + 1
        const allAnswered = nextIndex >= questions.length

        // Calculate points if complete
        let pointsEarned = 0
        if (allAnswered) {
          for (let i = 0; i < questions.length; i++) {
            const ans = i === currentIndex ? optionIndex : newAnswers[i]
            if (ans !== null && questions[i].options[ans] === questions[i].correctAnswer) {
              pointsEarned += 2
            }
          }
        }

        set({
          wordStats: { ...wordStats, [statKey]: updatedStat },
          quizState: {
            ...quizState,
            answers: newAnswers,
            currentIndex: allAnswered ? currentIndex : nextIndex,
            isComplete: allAnswered,
            pointsEarned,
          },
        })
      },

      finishQuiz: () => {
        const { quizState, progress, wordStats } = get()
        if (!quizState) return 0

        const { topicId, questions, answers, pointsEarned } = quizState

        // Count correct answers in this quiz
        let correct = 0
        for (let i = 0; i < questions.length; i++) {
          const ans = answers[i]
          if (ans !== null && questions[i].options[ans] === questions[i].correctAnswer) {
            correct++
          }
        }

        // Compute mastered words (correctStreak >= 3) across all words in topic
        const result = getTopic(topicId)
        const masteredWords: number[] = []
        if (result) {
          for (let i = 0; i < result.topic.words.length; i++) {
            const stat = wordStats[`${topicId}:${i}`]
            if (stat && stat.correctStreak >= 3) {
              masteredWords.push(i)
            }
          }
        }

        const prev = progress[topicId]
        const updatedProgress: TopicProgress = {
          totalAttempts: (prev?.totalAttempts ?? 0) + questions.length,
          correctAnswers: (prev?.correctAnswers ?? 0) + correct,
          lastPracticed: new Date().toISOString(),
          masteredWords,
        }

        set({
          progress: { ...progress, [topicId]: updatedProgress },
          quizState: null,
        })

        return pointsEarned
      },

      resetProgress: (topicId) => {
        if (topicId) {
          const progress = { ...get().progress }
          delete progress[topicId]

          // Clear word stats for this topic
          const wordStats = { ...get().wordStats }
          for (const key of Object.keys(wordStats)) {
            if (key.startsWith(`${topicId}:`)) {
              delete wordStats[key]
            }
          }

          set({ progress, wordStats })
        } else {
          set({ progress: {}, wordStats: {} })
        }
      },
    }),
    {
      name: 'language-storage',
      version: 1,
      partialize: (state) => ({
        activeLanguage: state.activeLanguage,
        activeTopic: state.activeTopic,
        progress: state.progress,
        wordStats: state.wordStats,
      }),
    }
  )
)
