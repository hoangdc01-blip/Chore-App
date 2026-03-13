export interface KidTheme {
  id: string
  name: string
  emoji: string
  primaryColor: string
  accentColor: string
  bgGradient: string
}

export const KID_THEMES: KidTheme[] = [
  {
    id: 'default',
    name: 'Default',
    emoji: '🎨',
    primaryColor: '210 100% 52%',
    accentColor: '210 100% 60%',
    bgGradient: '',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    primaryColor: '200 90% 45%',
    accentColor: '190 85% 55%',
    bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(6,182,212,0.08))',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    primaryColor: '150 60% 40%',
    accentColor: '140 50% 50%',
    bgGradient: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(22,163,74,0.08))',
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    primaryColor: '260 70% 55%',
    accentColor: '280 60% 60%',
    bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(99,102,241,0.08))',
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍬',
    primaryColor: '330 80% 55%',
    accentColor: '340 70% 60%',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(249,115,22,0.08))',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    primaryColor: '25 95% 55%',
    accentColor: '35 90% 55%',
    bgGradient: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(234,179,8,0.08))',
  },
]

export function getThemeById(id: string): KidTheme {
  return KID_THEMES.find((t) => t.id === id) ?? KID_THEMES[0]
}
