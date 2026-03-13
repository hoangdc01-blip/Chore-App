import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import GameWrapper from './GameWrapper'
import FlappyBird from './flappy/FlappyBird'
import MemoryMatch from './memory/MemoryMatch'
import DinoRun from './dino/DinoRun'
import type { AppView } from '../types'

interface GameMenuProps {
  onNavigate: (view: AppView) => void
}

type ActiveGame = 'flappy' | 'memory' | 'runner' | null

const GAME_CARDS = [
  {
    id: 'flappy' as const,
    name: 'Flappy Bird',
    emoji: '🐦',
    description: 'Fly through obstacles!',
    gradient: 'from-sky-400 to-blue-500',
    available: true,
  },
  {
    id: 'memory' as const,
    name: 'Memory Match',
    emoji: '🧠',
    description: 'Match the cards!',
    gradient: 'from-purple-400 to-indigo-500',
    available: true,
  },
  {
    id: 'runner' as const,
    name: 'Dino Run',
    emoji: '🦕',
    description: 'Jump over obstacles!',
    gradient: 'from-green-400 to-emerald-500',
    available: true,
  },
]

export default function GameMenu({ onNavigate }: GameMenuProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)
  if (activeGame === 'flappy') {
    return (
      <GameWrapper
        gameName="Flappy Bird"
        gameId="flappy"
        onBack={() => setActiveGame(null)}
        onNavigateToChores={() => onNavigate('calendar')}
      >
        {(props) => <FlappyBird {...props} />}
      </GameWrapper>
    )
  }

  if (activeGame === 'memory') {
    return (
      <GameWrapper
        gameName="Memory Match"
        gameId="memory"
        onBack={() => setActiveGame(null)}
        onNavigateToChores={() => onNavigate('calendar')}
      >
        {(props) => <MemoryMatch {...props} />}
      </GameWrapper>
    )
  }

  if (activeGame === 'runner') {
    return (
      <GameWrapper
        gameName="Dino Run"
        gameId="runner"
        onBack={() => setActiveGame(null)}
        onNavigateToChores={() => onNavigate('calendar')}
      >
        {(props) => <DinoRun {...props} />}
      </GameWrapper>
    )
  }

  return (
    <div className="flex-1 overflow-auto pb-20 bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-blue-500/10">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Gamepad2 size={36} className="text-purple-500" />
            Mini Games
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Complete chores to unlock games and earn bonus points!</p>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_CARDS.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && setActiveGame(game.id as ActiveGame)}
              disabled={!game.available}
              className={`relative group rounded-2xl p-6 text-left transition-all border-2 ${
                game.available
                  ? 'border-border bg-card shadow-md hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer'
                  : 'border-dashed border-border bg-muted cursor-not-allowed'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-3xl shadow-lg mb-4 ${
                game.available ? 'group-hover:rotate-6 transition-transform' : 'opacity-50'
              }`}>
                {game.emoji}
              </div>
              <h3 className={`text-lg font-extrabold mb-1 ${game.available ? 'text-foreground' : 'text-muted-foreground'}`}>
                {game.name}
              </h3>
              <p className="text-sm text-muted-foreground">{game.description}</p>
              {!game.available && (
                <div className="absolute top-3 right-3 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Coming Soon
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
