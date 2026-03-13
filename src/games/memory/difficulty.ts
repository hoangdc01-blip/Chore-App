export interface DifficultyLevel {
  name: string
  emoji: string
  cols: number
  rows: number
  pairs: number
  maxMoves: number // Moves to get "perfect" score
  timeBonus: number // Seconds for full time bonus
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    name: 'Easy',
    emoji: '😊',
    cols: 3,
    rows: 4,
    pairs: 6,
    maxMoves: 12,
    timeBonus: 60,
  },
  {
    name: 'Medium',
    emoji: '🤔',
    cols: 4,
    rows: 4,
    pairs: 8,
    maxMoves: 18,
    timeBonus: 90,
  },
  {
    name: 'Hard',
    emoji: '🔥',
    cols: 4,
    rows: 5,
    pairs: 10,
    maxMoves: 24,
    timeBonus: 120,
  },
]
