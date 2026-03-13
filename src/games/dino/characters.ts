export interface DinoCharacter {
  name: string
  emoji: string
  bodyColor: string
  accentColor: string
  eyeColor: string
  bellyColor: string
}

const CHARACTERS: DinoCharacter[] = [
  {
    name: 'Dino',
    emoji: '🦕',
    bodyColor: '#4CAF50',
    accentColor: '#388E3C',
    eyeColor: '#1B5E20',
    bellyColor: '#A5D6A7',
  },
  {
    name: 'Cat',
    emoji: '🐱',
    bodyColor: '#FF9800',
    accentColor: '#F57C00',
    eyeColor: '#2E7D32',
    bellyColor: '#FFE0B2',
  },
  {
    name: 'Dog',
    emoji: '🐶',
    bodyColor: '#8D6E63',
    accentColor: '#6D4C41',
    eyeColor: '#3E2723',
    bellyColor: '#D7CCC8',
  },
  {
    name: 'Bunny',
    emoji: '🐰',
    bodyColor: '#F8BBD0',
    accentColor: '#F48FB1',
    eyeColor: '#880E4F',
    bellyColor: '#FCE4EC',
  },
]

export function randomCharacter(): DinoCharacter {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
}
