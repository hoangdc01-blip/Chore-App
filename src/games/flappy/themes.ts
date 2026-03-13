export interface GameTheme {
  name: string
  skyGradient: [string, string]
  groundColor: string
  groundAccent: string
  obstacleColor: string
  obstacleAccent: string
  obstacleCapColor: string
  // Background decorations
  decorations: 'clouds' | 'stars' | 'bubbles' | 'candy'
  decorColor1: string
  decorColor2: string
  decorColor3: string
}

export const THEMES: GameTheme[] = [
  {
    name: 'Nature',
    skyGradient: ['#87CEEB', '#E0F7FA'],
    groundColor: '#4CAF50',
    groundAccent: '#388E3C',
    obstacleColor: '#795548',
    obstacleAccent: '#5D4037',
    obstacleCapColor: '#4CAF50',
    decorations: 'clouds',
    decorColor1: '#FFFFFF',
    decorColor2: '#F0F0F0',
    decorColor3: '#E8F5E9',
  },
  {
    name: 'Space',
    skyGradient: ['#0D1B2A', '#1B2838'],
    groundColor: '#37474F',
    groundAccent: '#263238',
    obstacleColor: '#78909C',
    obstacleAccent: '#546E7A',
    obstacleCapColor: '#FF7043',
    decorations: 'stars',
    decorColor1: '#FFFFFF',
    decorColor2: '#FFD54F',
    decorColor3: '#B39DDB',
  },
  {
    name: 'Underwater',
    skyGradient: ['#006994', '#00BCD4'],
    groundColor: '#FFCC80',
    groundAccent: '#FFB74D',
    obstacleColor: '#FF7043',
    obstacleAccent: '#E64A19',
    obstacleCapColor: '#FF8A65',
    decorations: 'bubbles',
    decorColor1: 'rgba(255,255,255,0.4)',
    decorColor2: 'rgba(255,255,255,0.2)',
    decorColor3: '#80DEEA',
  },
  {
    name: 'Candy',
    skyGradient: ['#FCE4EC', '#F8BBD0'],
    groundColor: '#E91E63',
    groundAccent: '#C2185B',
    obstacleColor: '#AB47BC',
    obstacleAccent: '#8E24AA',
    obstacleCapColor: '#FF80AB',
    decorations: 'candy',
    decorColor1: '#FFEB3B',
    decorColor2: '#FF80AB',
    decorColor3: '#80DEEA',
  },
]

export function randomTheme(): GameTheme {
  return THEMES[Math.floor(Math.random() * THEMES.length)]
}
