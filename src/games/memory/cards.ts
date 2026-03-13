export interface Card {
  id: string
  emoji: string
  label: string
}

export interface CardSet {
  name: string
  emoji: string
  cards: Card[]
}

const CARD_SETS: CardSet[] = [
  {
    name: 'Animals',
    emoji: '🐾',
    cards: [
      { id: 'cat', emoji: '🐱', label: 'Cat' },
      { id: 'dog', emoji: '🐶', label: 'Dog' },
      { id: 'penguin', emoji: '🐧', label: 'Penguin' },
      { id: 'hamster', emoji: '🐹', label: 'Hamster' },
      { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
      { id: 'bear', emoji: '🐻', label: 'Bear' },
      { id: 'fox', emoji: '🦊', label: 'Fox' },
      { id: 'panda', emoji: '🐼', label: 'Panda' },
      { id: 'lion', emoji: '🦁', label: 'Lion' },
      { id: 'monkey', emoji: '🐵', label: 'Monkey' },
    ],
  },
  {
    name: 'Chores',
    emoji: '🧹',
    cards: [
      { id: 'broom', emoji: '🧹', label: 'Sweep' },
      { id: 'dishes', emoji: '🍽️', label: 'Dishes' },
      { id: 'laundry', emoji: '👕', label: 'Laundry' },
      { id: 'trash', emoji: '🗑️', label: 'Trash' },
      { id: 'bed', emoji: '🛏️', label: 'Make Bed' },
      { id: 'water', emoji: '🪴', label: 'Water Plants' },
      { id: 'vacuum', emoji: '🧽', label: 'Clean' },
      { id: 'cook', emoji: '🍳', label: 'Cook' },
      { id: 'fold', emoji: '🧺', label: 'Fold' },
      { id: 'mop', emoji: '🪣', label: 'Mop' },
    ],
  },
  {
    name: 'Food',
    emoji: '🍕',
    cards: [
      { id: 'pizza', emoji: '🍕', label: 'Pizza' },
      { id: 'burger', emoji: '🍔', label: 'Burger' },
      { id: 'ice-cream', emoji: '🍦', label: 'Ice Cream' },
      { id: 'cake', emoji: '🎂', label: 'Cake' },
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'donut', emoji: '🍩', label: 'Donut' },
      { id: 'cookie', emoji: '🍪', label: 'Cookie' },
      { id: 'watermelon', emoji: '🍉', label: 'Watermelon' },
      { id: 'taco', emoji: '🌮', label: 'Taco' },
    ],
  },
  {
    name: 'Space',
    emoji: '🚀',
    cards: [
      { id: 'rocket', emoji: '🚀', label: 'Rocket' },
      { id: 'star', emoji: '⭐', label: 'Star' },
      { id: 'moon', emoji: '🌙', label: 'Moon' },
      { id: 'sun', emoji: '☀️', label: 'Sun' },
      { id: 'planet', emoji: '🪐', label: 'Planet' },
      { id: 'alien', emoji: '👽', label: 'Alien' },
      { id: 'ufo', emoji: '🛸', label: 'UFO' },
      { id: 'comet', emoji: '☄️', label: 'Comet' },
      { id: 'telescope', emoji: '🔭', label: 'Telescope' },
      { id: 'earth', emoji: '🌍', label: 'Earth' },
    ],
  },
]

export interface DeckCard {
  uid: number
  cardId: string
  emoji: string
  label: string
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Build a deck of card pairs for the given pair count and card set */
export function buildDeck(pairCount: number, setIndex: number): DeckCard[] {
  const cardSet = CARD_SETS[setIndex % CARD_SETS.length]
  const selected = shuffle(cardSet.cards).slice(0, pairCount)
  const pairs: DeckCard[] = []
  let uid = 0
  for (const card of selected) {
    pairs.push({ uid: uid++, cardId: card.id, emoji: card.emoji, label: card.label })
    pairs.push({ uid: uid++, cardId: card.id, emoji: card.emoji, label: card.label })
  }
  return shuffle(pairs)
}

export function getCardSetCount() {
  return CARD_SETS.length
}

export function getCardSetName(index: number) {
  return CARD_SETS[index % CARD_SETS.length].name
}

export function getCardSetEmoji(index: number) {
  return CARD_SETS[index % CARD_SETS.length].emoji
}
