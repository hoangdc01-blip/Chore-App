export interface DinoTheme {
  name: string
  skyGradient: [string, string]
  groundColor: string
  groundAccent: string
  obstacleColor: string
  obstacleAccent: string
  cloudColor: string
}

const THEMES: DinoTheme[] = [
  {
    name: 'Desert',
    skyGradient: ['#87CEEB', '#F4A460'],
    groundColor: '#DEB887',
    groundAccent: '#D2A679',
    obstacleColor: '#2E7D32',
    obstacleAccent: '#388E3C',
    cloudColor: '#FFFFFF',
  },
  {
    name: 'Forest',
    skyGradient: ['#90CAF9', '#C8E6C9'],
    groundColor: '#4CAF50',
    groundAccent: '#388E3C',
    obstacleColor: '#795548',
    obstacleAccent: '#8D6E63',
    cloudColor: '#E8F5E9',
  },
  {
    name: 'Snow',
    skyGradient: ['#B3E5FC', '#E1F5FE'],
    groundColor: '#ECEFF1',
    groundAccent: '#CFD8DC',
    obstacleColor: '#546E7A',
    obstacleAccent: '#78909C',
    cloudColor: '#FFFFFF',
  },
  {
    name: 'Lava',
    skyGradient: ['#1A1A2E', '#16213E'],
    groundColor: '#BF360C',
    groundAccent: '#D84315',
    obstacleColor: '#FF6F00',
    obstacleAccent: '#FF8F00',
    cloudColor: '#FF5722',
  },
]

export function randomTheme(): DinoTheme {
  return THEMES[Math.floor(Math.random() * THEMES.length)]
}
