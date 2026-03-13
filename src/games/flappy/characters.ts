export interface GameCharacter {
  name: string
  emoji: string
  bodyColor: string
  accentColor: string
  eyeColor: string
  wingColor: string
}

export const CHARACTERS: GameCharacter[] = [
  {
    name: 'Flying Cat',
    emoji: '🐱',
    bodyColor: '#FF9800',
    accentColor: '#F57C00',
    eyeColor: '#4CAF50',
    wingColor: '#FFB74D',
  },
  {
    name: 'Flying Dog',
    emoji: '🐶',
    bodyColor: '#8D6E63',
    accentColor: '#6D4C41',
    eyeColor: '#212121',
    wingColor: '#A1887F',
  },
  {
    name: 'Flying Penguin',
    emoji: '🐧',
    bodyColor: '#37474F',
    accentColor: '#FFFFFF',
    eyeColor: '#212121',
    wingColor: '#546E7A',
  },
  {
    name: 'Flying Hamster',
    emoji: '🐹',
    bodyColor: '#FFCC80',
    accentColor: '#FFB74D',
    eyeColor: '#212121',
    wingColor: '#FFE0B2',
  },
]

export function randomCharacter(): GameCharacter {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
}
