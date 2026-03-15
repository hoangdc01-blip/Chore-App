/**
 * Pre-built SVG drawing library for the AI Buddy chat.
 * LLMs are bad at generating SVG code, so we provide high-quality
 * pre-made drawings that the LLM can select by ID.
 */

export interface LibraryDrawing {
  id: string
  title: string
  keywords: string[]
  svg: string
}

export const DRAWING_LIBRARY: LibraryDrawing[] = [
  // ── Animals ──────────────────────────────────────────
  {
    id: 'cat',
    title: 'Cute Kitty',
    keywords: ['cat', 'kitty', 'kitten', 'meow', 'hello kitty', 'neko'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="110" r="55" fill="#FFD1DC"/>
  <polygon points="55,70 45,25 80,55" fill="#FFD1DC" stroke="#FF9AB2" stroke-width="2"/>
  <polygon points="145,70 155,25 120,55" fill="#FFD1DC" stroke="#FF9AB2" stroke-width="2"/>
  <polygon points="55,70 45,25 80,55" fill="none" stroke="#FF69B4" stroke-width="1.5"/>
  <polygon points="145,70 155,25 120,55" fill="none" stroke="#FF69B4" stroke-width="1.5"/>
  <triangle/>
  <circle cx="80" cy="95" r="10" fill="white"/>
  <circle cx="120" cy="95" r="10" fill="white"/>
  <circle cx="82" cy="93" r="6" fill="#2D2D2D"/>
  <circle cx="122" cy="93" r="6" fill="#2D2D2D"/>
  <circle cx="84" cy="91" r="2.5" fill="white"/>
  <circle cx="124" cy="91" r="2.5" fill="white"/>
  <ellipse cx="100" cy="112" rx="5" ry="3.5" fill="#FF69B4"/>
  <line x1="100" y1="115" x2="100" y2="125" stroke="#FF9AB2" stroke-width="1.5"/>
  <path d="M92 125 Q100 132 108 125" fill="none" stroke="#FF9AB2" stroke-width="2" stroke-linecap="round"/>
  <line x1="55" y1="105" x2="30" y2="100" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="55" y1="112" x2="30" y2="112" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="55" y1="119" x2="30" y2="124" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="145" y1="105" x2="170" y2="100" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="145" y1="112" x2="170" y2="112" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="145" y1="119" x2="170" y2="124" stroke="#FFB6C1" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="70" cy="108" r="8" fill="#FF69B4" opacity="0.25"/>
  <circle cx="130" cy="108" r="8" fill="#FF69B4" opacity="0.25"/>
</svg>`,
  },
  {
    id: 'dog',
    title: 'Happy Puppy',
    keywords: ['dog', 'puppy', 'doggy', 'woof', 'bark', 'pup'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="110" r="55" fill="#DEB887"/>
  <ellipse cx="60" cy="60" rx="22" ry="30" fill="#C4956A" transform="rotate(-15 60 60)"/>
  <ellipse cx="140" cy="60" rx="22" ry="30" fill="#C4956A" transform="rotate(15 140 60)"/>
  <circle cx="80" cy="95" r="9" fill="white"/>
  <circle cx="120" cy="95" r="9" fill="white"/>
  <circle cx="82" cy="94" r="5.5" fill="#2D2D2D"/>
  <circle cx="122" cy="94" r="5.5" fill="#2D2D2D"/>
  <circle cx="84" cy="92" r="2" fill="white"/>
  <circle cx="124" cy="92" r="2" fill="white"/>
  <ellipse cx="100" cy="115" rx="20" ry="15" fill="#F5DEB3"/>
  <ellipse cx="100" cy="110" rx="8" ry="5" fill="#2D2D2D"/>
  <path d="M88 120 Q100 132 112 120" fill="none" stroke="#C4956A" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="100" cy="125" rx="4" ry="6" fill="#FF6B6B" opacity="0.8"/>
  <circle cx="72" cy="112" r="7" fill="#FF9999" opacity="0.3"/>
  <circle cx="128" cy="112" r="7" fill="#FF9999" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'bunny',
    title: 'Fluffy Bunny',
    keywords: ['bunny', 'rabbit', 'hop', 'easter', 'hare'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="80" cy="45" rx="14" ry="38" fill="#F8F0F0" stroke="#FFB6C1" stroke-width="1.5"/>
  <ellipse cx="120" cy="45" rx="14" ry="38" fill="#F8F0F0" stroke="#FFB6C1" stroke-width="1.5"/>
  <ellipse cx="80" cy="45" rx="7" ry="25" fill="#FFB6C1" opacity="0.4"/>
  <ellipse cx="120" cy="45" rx="7" ry="25" fill="#FFB6C1" opacity="0.4"/>
  <circle cx="100" cy="115" r="52" fill="#F8F0F0" stroke="#E8D8D8" stroke-width="1"/>
  <circle cx="82" cy="100" r="7" fill="#2D2D2D"/>
  <circle cx="118" cy="100" r="7" fill="#2D2D2D"/>
  <circle cx="84" cy="98" r="2.5" fill="white"/>
  <circle cx="120" cy="98" r="2.5" fill="white"/>
  <ellipse cx="100" cy="118" rx="4" ry="3" fill="#FF69B4"/>
  <path d="M93 124 Q100 130 107 124" fill="none" stroke="#E8A0B0" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="75" cy="115" r="10" fill="#FFB6C1" opacity="0.25"/>
  <circle cx="125" cy="115" r="10" fill="#FFB6C1" opacity="0.25"/>
  <line x1="60" y1="115" x2="42" y2="110" stroke="#E8D8D8" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="60" y1="120" x2="42" y2="122" stroke="#E8D8D8" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="140" y1="115" x2="158" y2="110" stroke="#E8D8D8" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="140" y1="120" x2="158" y2="122" stroke="#E8D8D8" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'unicorn',
    title: 'Magical Unicorn',
    keywords: ['unicorn', 'magic', 'magical', 'horn', 'pony', 'my little pony', 'horse'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="115" r="52" fill="#F0E6FF"/>
  <polygon points="100,15 90,65 110,65" fill="#FFD700" stroke="#FFA500" stroke-width="1.5"/>
  <ellipse cx="70" cy="60" rx="15" ry="22" fill="#F0E6FF" stroke="#D8BFD8" stroke-width="1"/>
  <ellipse cx="130" cy="60" rx="15" ry="22" fill="#F0E6FF" stroke="#D8BFD8" stroke-width="1"/>
  <circle cx="82" cy="100" r="8" fill="white"/>
  <circle cx="118" cy="100" r="8" fill="white"/>
  <circle cx="83" cy="99" r="5" fill="#6B5CE7"/>
  <circle cx="119" cy="99" r="5" fill="#6B5CE7"/>
  <circle cx="85" cy="97" r="2" fill="white"/>
  <circle cx="121" cy="97" r="2" fill="white"/>
  <path d="M93 125 Q100 132 107 125" fill="none" stroke="#D8BFD8" stroke-width="2" stroke-linecap="round"/>
  <circle cx="72" cy="112" r="8" fill="#FF69B4" opacity="0.2"/>
  <circle cx="128" cy="112" r="8" fill="#FF69B4" opacity="0.2"/>
  <path d="M55 75 Q45 65 50 55" fill="none" stroke="#FF69B4" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 55 Q40 50 45 40" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
  <path d="M145 75 Q155 65 150 55" fill="none" stroke="#87CEEB" stroke-width="3" stroke-linecap="round"/>
  <path d="M150 55 Q160 50 155 40" fill="none" stroke="#98FB98" stroke-width="3" stroke-linecap="round"/>
  <circle cx="95" cy="30" r="3" fill="#FF69B4" opacity="0.6"/>
  <circle cx="105" cy="25" r="2" fill="#87CEEB" opacity="0.6"/>
  <circle cx="92" cy="20" r="2" fill="#FFD700" opacity="0.6"/>
</svg>`,
  },
  {
    id: 'dinosaur',
    title: 'Friendly Dino',
    keywords: ['dinosaur', 'dino', 't-rex', 'trex', 'rawr', 'jurassic'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="100" cy="120" rx="45" ry="50" fill="#7ED67E"/>
  <circle cx="100" cy="80" r="38" fill="#7ED67E"/>
  <polygon points="75,50 70,30 82,48" fill="#5CB85C"/>
  <polygon points="90,45 88,22 98,42" fill="#5CB85C"/>
  <polygon points="108,45 112,22 102,42" fill="#5CB85C"/>
  <polygon points="125,50 130,30 118,48" fill="#5CB85C"/>
  <circle cx="85" cy="75" r="9" fill="white"/>
  <circle cx="115" cy="75" r="9" fill="white"/>
  <circle cx="87" cy="74" r="5" fill="#2D2D2D"/>
  <circle cx="117" cy="74" r="5" fill="#2D2D2D"/>
  <circle cx="89" cy="72" r="2" fill="white"/>
  <circle cx="119" cy="72" r="2" fill="white"/>
  <ellipse cx="100" cy="95" rx="15" ry="10" fill="#6BC96B"/>
  <path d="M88 97 Q100 108 112 97" fill="none" stroke="#4A9E4A" stroke-width="2" stroke-linecap="round"/>
  <rect x="60" y="130" rx="8" ry="8" width="18" height="30" fill="#7ED67E"/>
  <rect x="122" y="130" rx="8" ry="8" width="18" height="30" fill="#7ED67E"/>
  <ellipse cx="55" cy="110" rx="12" ry="8" fill="#7ED67E"/>
  <ellipse cx="145" cy="110" rx="12" ry="8" fill="#7ED67E"/>
  <circle cx="75" cy="90" r="6" fill="#FFB6C1" opacity="0.3"/>
  <circle cx="125" cy="90" r="6" fill="#FFB6C1" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'butterfly',
    title: 'Pretty Butterfly',
    keywords: ['butterfly', 'flutter', 'wings', 'bug', 'insect', 'moth'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="60" cy="70" rx="35" ry="40" fill="#FF69B4" opacity="0.7" transform="rotate(-15 60 70)"/>
  <ellipse cx="140" cy="70" rx="35" ry="40" fill="#FF69B4" opacity="0.7" transform="rotate(15 140 70)"/>
  <ellipse cx="55" cy="120" rx="25" ry="30" fill="#FFB347" opacity="0.7" transform="rotate(-10 55 120)"/>
  <ellipse cx="145" cy="120" rx="25" ry="30" fill="#FFB347" opacity="0.7" transform="rotate(10 145 120)"/>
  <ellipse cx="65" cy="65" rx="12" ry="15" fill="#FF1493" opacity="0.4"/>
  <ellipse cx="135" cy="65" rx="12" ry="15" fill="#FF1493" opacity="0.4"/>
  <circle cx="58" cy="115" r="8" fill="#FF8C00" opacity="0.4"/>
  <circle cx="142" cy="115" r="8" fill="#FF8C00" opacity="0.4"/>
  <ellipse cx="100" cy="105" rx="8" ry="35" fill="#8B4513"/>
  <circle cx="100" cy="65" r="10" fill="#8B4513"/>
  <circle cx="96" cy="63" r="3" fill="white"/>
  <circle cx="104" cy="63" r="3" fill="white"/>
  <circle cx="96" cy="63" r="1.5" fill="black"/>
  <circle cx="104" cy="63" r="1.5" fill="black"/>
  <path d="M93 55 Q88 35 82 30" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
  <path d="M107 55 Q112 35 118 30" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
  <circle cx="82" cy="30" r="3" fill="#FFD700"/>
  <circle cx="118" cy="30" r="3" fill="#FFD700"/>
</svg>`,
  },
  {
    id: 'penguin',
    title: 'Adorable Penguin',
    keywords: ['penguin', 'arctic', 'ice', 'snow', 'tux', 'waddle'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="100" cy="115" rx="45" ry="55" fill="#2D2D2D"/>
  <ellipse cx="100" cy="125" rx="30" ry="40" fill="white"/>
  <circle cx="100" cy="75" r="32" fill="#2D2D2D"/>
  <ellipse cx="100" cy="80" rx="22" ry="20" fill="white"/>
  <circle cx="88" cy="75" r="6" fill="white"/>
  <circle cx="112" cy="75" r="6" fill="white"/>
  <circle cx="89" cy="74" r="3.5" fill="#2D2D2D"/>
  <circle cx="113" cy="74" r="3.5" fill="#2D2D2D"/>
  <circle cx="90" cy="73" r="1.5" fill="white"/>
  <circle cx="114" cy="73" r="1.5" fill="white"/>
  <polygon points="100,82 94,92 106,92" fill="#FFA500"/>
  <ellipse cx="55" cy="115" rx="12" ry="25" fill="#2D2D2D" transform="rotate(15 55 115)"/>
  <ellipse cx="145" cy="115" rx="12" ry="25" fill="#2D2D2D" transform="rotate(-15 145 115)"/>
  <ellipse cx="85" cy="168" rx="15" ry="7" fill="#FFA500"/>
  <ellipse cx="115" cy="168" rx="15" ry="7" fill="#FFA500"/>
  <circle cx="80" cy="85" r="5" fill="#FF69B4" opacity="0.3"/>
  <circle cx="120" cy="85" r="5" fill="#FF69B4" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'fish',
    title: 'Colorful Fish',
    keywords: ['fish', 'goldfish', 'nemo', 'ocean', 'sea', 'swim', 'aquarium'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="40" cy="40" r="4" fill="#87CEEB" opacity="0.5"/>
  <circle cx="160" cy="50" r="6" fill="#87CEEB" opacity="0.4"/>
  <circle cx="30" cy="150" r="5" fill="#87CEEB" opacity="0.3"/>
  <circle cx="170" cy="140" r="3" fill="#87CEEB" opacity="0.5"/>
  <polygon points="155,100 180,75 180,125" fill="#FF6B6B"/>
  <ellipse cx="105" cy="100" rx="55" ry="35" fill="#FF6B6B"/>
  <ellipse cx="105" cy="100" rx="40" ry="25" fill="#FF8A8A"/>
  <path d="M80 80 Q105 95 130 80" fill="none" stroke="#FF5252" stroke-width="2" opacity="0.5"/>
  <path d="M80 120 Q105 105 130 120" fill="none" stroke="#FF5252" stroke-width="2" opacity="0.5"/>
  <circle cx="75" cy="92" r="8" fill="white"/>
  <circle cx="76" cy="91" r="5" fill="#2D2D2D"/>
  <circle cx="78" cy="89" r="2" fill="white"/>
  <path d="M62 105 Q70 110 78 105" fill="none" stroke="#FF5252" stroke-width="2" stroke-linecap="round"/>
  <path d="M100 65 Q105 55 110 65" fill="none" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="110" cy="100" rx="3" ry="8" fill="#FFD700" opacity="0.3"/>
  <ellipse cx="125" cy="100" rx="3" ry="8" fill="#FFD700" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'bear',
    title: 'Teddy Bear',
    keywords: ['bear', 'teddy', 'teddy bear', 'panda', 'grizzly', 'cub'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="65" cy="55" r="20" fill="#C4956A"/>
  <circle cx="135" cy="55" r="20" fill="#C4956A"/>
  <circle cx="65" cy="55" r="12" fill="#DEB887"/>
  <circle cx="135" cy="55" r="12" fill="#DEB887"/>
  <circle cx="100" cy="105" r="52" fill="#C4956A"/>
  <ellipse cx="100" cy="120" rx="30" ry="22" fill="#DEB887"/>
  <circle cx="82" cy="92" r="7" fill="#2D2D2D"/>
  <circle cx="118" cy="92" r="7" fill="#2D2D2D"/>
  <circle cx="84" cy="90" r="2.5" fill="white"/>
  <circle cx="120" cy="90" r="2.5" fill="white"/>
  <ellipse cx="100" cy="110" rx="7" ry="5" fill="#2D2D2D"/>
  <path d="M92 118 Q100 126 108 118" fill="none" stroke="#8B6914" stroke-width="2" stroke-linecap="round"/>
  <circle cx="72" cy="108" r="8" fill="#FF9999" opacity="0.25"/>
  <circle cx="128" cy="108" r="8" fill="#FF9999" opacity="0.25"/>
</svg>`,
  },
  // ── Objects & Nature ─────────────────────────────────
  {
    id: 'rainbow',
    title: 'Beautiful Rainbow',
    keywords: ['rainbow', 'colors', 'sky', 'colorful', 'arc'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="100" cy="160" rx="85" ry="80" fill="none" stroke="#FF0000" stroke-width="8"/>
  <ellipse cx="100" cy="160" rx="77" ry="72" fill="none" stroke="#FF8C00" stroke-width="8"/>
  <ellipse cx="100" cy="160" rx="69" ry="64" fill="none" stroke="#FFD700" stroke-width="8"/>
  <ellipse cx="100" cy="160" rx="61" ry="56" fill="none" stroke="#4CAF50" stroke-width="8"/>
  <ellipse cx="100" cy="160" rx="53" ry="48" fill="none" stroke="#2196F3" stroke-width="8"/>
  <ellipse cx="100" cy="160" rx="45" ry="40" fill="none" stroke="#6B5CE7" stroke-width="8"/>
  <rect x="0" y="155" width="200" height="50" fill="white"/>
  <ellipse cx="25" cy="155" rx="25" ry="18" fill="white"/>
  <ellipse cx="15" cy="150" rx="18" ry="14" fill="#F0F0F0"/>
  <ellipse cx="35" cy="148" rx="20" ry="15" fill="#F0F0F0"/>
  <ellipse cx="175" cy="155" rx="25" ry="18" fill="white"/>
  <ellipse cx="165" cy="150" rx="18" ry="14" fill="#F0F0F0"/>
  <ellipse cx="185" cy="148" rx="20" ry="15" fill="#F0F0F0"/>
  <circle cx="60" cy="30" r="8" fill="#FFD700" opacity="0.3"/>
  <circle cx="140" cy="25" r="5" fill="#FFD700" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'rocket',
    title: 'Space Rocket',
    keywords: ['rocket', 'space', 'spaceship', 'fly', 'launch', 'nasa', 'astronaut', 'moon'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="50" cy="30" r="3" fill="#FFD700" opacity="0.7"/>
  <circle cx="160" cy="45" r="2" fill="#FFD700" opacity="0.6"/>
  <circle cx="35" cy="80" r="2" fill="#FFD700" opacity="0.5"/>
  <circle cx="170" cy="100" r="3" fill="#FFD700" opacity="0.7"/>
  <circle cx="30" cy="150" r="2" fill="#FFD700" opacity="0.4"/>
  <path d="M100 25 Q85 60 85 100 L115 100 Q115 60 100 25Z" fill="#E8E8E8" stroke="#CCCCCC" stroke-width="1"/>
  <path d="M100 25 Q95 45 92 65 L108 65 Q105 45 100 25Z" fill="#FF6B6B"/>
  <rect x="85" y="100" rx="2" ry="2" width="30" height="40" fill="#E8E8E8" stroke="#CCCCCC" stroke-width="1"/>
  <circle cx="100" cy="85" r="8" fill="#87CEEB" stroke="#6BB3D9" stroke-width="1.5"/>
  <circle cx="100" cy="85" r="4" fill="#B0E0FF"/>
  <path d="M85 120 Q70 115 65 140 L85 130Z" fill="#FF6B6B"/>
  <path d="M115 120 Q130 115 135 140 L115 130Z" fill="#FF6B6B"/>
  <polygon points="92,140 96,165 100,155 104,165 108,140" fill="#FFA500"/>
  <polygon points="95,140 98,158 100,150 102,158 105,140" fill="#FFD700"/>
</svg>`,
  },
  {
    id: 'flower',
    title: 'Pretty Flower',
    keywords: ['flower', 'rose', 'daisy', 'sunflower', 'garden', 'plant', 'bloom', 'blossom'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <line x1="100" y1="105" x2="100" y2="180" stroke="#4CAF50" stroke-width="6" stroke-linecap="round"/>
  <path d="M100 140 Q80 130 70 140 Q75 150 100 145" fill="#4CAF50"/>
  <path d="M100 155 Q120 145 130 155 Q125 165 100 160" fill="#4CAF50"/>
  <ellipse cx="100" cy="62" rx="18" ry="22" fill="#FF69B4" transform="rotate(0 100 80)"/>
  <ellipse cx="100" cy="62" rx="18" ry="22" fill="#FF85C8" transform="rotate(72 100 80)"/>
  <ellipse cx="100" cy="62" rx="18" ry="22" fill="#FF69B4" transform="rotate(144 100 80)"/>
  <ellipse cx="100" cy="62" rx="18" ry="22" fill="#FF85C8" transform="rotate(216 100 80)"/>
  <ellipse cx="100" cy="62" rx="18" ry="22" fill="#FF69B4" transform="rotate(288 100 80)"/>
  <circle cx="100" cy="80" r="14" fill="#FFD700"/>
  <circle cx="96" cy="77" r="2" fill="#FFA500" opacity="0.6"/>
  <circle cx="104" cy="77" r="2" fill="#FFA500" opacity="0.6"/>
  <circle cx="100" cy="84" r="2" fill="#FFA500" opacity="0.6"/>
</svg>`,
  },
  {
    id: 'star',
    title: 'Shining Star',
    keywords: ['star', 'stars', 'shine', 'twinkle', 'sparkle', 'night'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,20 120,75 180,80 135,115 148,175 100,142 52,175 65,115 20,80 80,75" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
  <polygon points="100,35 115,75 160,78 128,108 138,158 100,133 62,158 72,108 40,78 85,75" fill="#FFEB3B" opacity="0.7"/>
  <circle cx="92" cy="85" r="5" fill="#2D2D2D"/>
  <circle cx="108" cy="85" r="5" fill="#2D2D2D"/>
  <circle cx="93" cy="83" r="2" fill="white"/>
  <circle cx="109" cy="83" r="2" fill="white"/>
  <path d="M93 100 Q100 106 107 100" fill="none" stroke="#FFA500" stroke-width="2" stroke-linecap="round"/>
  <circle cx="85" cy="95" r="5" fill="#FF9999" opacity="0.3"/>
  <circle cx="115" cy="95" r="5" fill="#FF9999" opacity="0.3"/>
  <line x1="55" y1="30" x2="60" y2="40" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="35" x2="65" y2="35" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
  <line x1="150" y1="35" x2="155" y2="45" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
  <line x1="145" y1="40" x2="160" y2="40" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'heart',
    title: 'Love Heart',
    keywords: ['heart', 'love', 'valentine', 'cute', 'like'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M100 170 C60 130 10 100 10 65 C10 35 35 20 60 20 C78 20 92 30 100 45 C108 30 122 20 140 20 C165 20 190 35 190 65 C190 100 140 130 100 170Z" fill="#FF4B6E"/>
  <path d="M100 160 C65 128 20 100 20 68 C20 42 42 28 62 28 C78 28 90 36 100 50 C110 36 122 28 138 28 C158 28 180 42 180 68 C180 100 135 128 100 160Z" fill="#FF6B8A" opacity="0.6"/>
  <ellipse cx="65" cy="65" rx="18" ry="15" fill="white" opacity="0.3" transform="rotate(-20 65 65)"/>
  <circle cx="70" cy="95" r="4" fill="white" opacity="0.15"/>
  <circle cx="130" cy="95" r="4" fill="white" opacity="0.15"/>
  <circle cx="60" cy="40" r="3" fill="#FF69B4" opacity="0.4"/>
  <circle cx="140" cy="40" r="3" fill="#FF69B4" opacity="0.4"/>
  <circle cx="100" cy="30" r="2" fill="#FF69B4" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'cake',
    title: 'Birthday Cake',
    keywords: ['cake', 'birthday', 'party', 'candle', 'cupcake', 'celebrate', 'dessert'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="45" y="100" rx="10" ry="10" width="110" height="55" fill="#FF9AB2"/>
  <rect x="40" y="120" rx="8" ry="8" width="120" height="45" fill="#FFB6C8"/>
  <path d="M40 125 Q60 115 80 125 Q100 135 120 125 Q140 115 160 125" fill="none" stroke="white" stroke-width="4"/>
  <path d="M40 145 Q60 135 80 145 Q100 155 120 145 Q140 135 160 145" fill="none" stroke="white" stroke-width="3" opacity="0.6"/>
  <rect x="70" y="65" rx="8" ry="8" width="60" height="40" fill="#FF69B4"/>
  <path d="M70 80 Q85 73 100 80 Q115 87 130 80" fill="none" stroke="white" stroke-width="3"/>
  <rect x="97" y="35" width="6" height="30" fill="#FFD700" rx="2"/>
  <ellipse cx="100" cy="32" rx="5" ry="7" fill="#FF6B6B"/>
  <ellipse cx="100" cy="30" rx="3" ry="4" fill="#FFA500"/>
  <circle cx="60" cy="135" r="4" fill="#FF6B6B" opacity="0.5"/>
  <circle cx="80" cy="140" r="3" fill="#FFD700" opacity="0.5"/>
  <circle cx="120" cy="135" r="4" fill="#87CEEB" opacity="0.5"/>
  <circle cx="140" cy="140" r="3" fill="#98FB98" opacity="0.5"/>
</svg>`,
  },
  {
    id: 'crown',
    title: 'Royal Crown',
    keywords: ['crown', 'king', 'queen', 'prince', 'princess', 'royal', 'tiara'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="30,130 40,55 70,95 100,40 130,95 160,55 170,130" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
  <rect x="30" y="125" rx="5" ry="5" width="140" height="25" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
  <rect x="30" y="125" rx="5" ry="5" width="140" height="25" fill="#FFEB3B" opacity="0.5"/>
  <circle cx="100" cy="137" r="8" fill="#FF4B6E"/>
  <circle cx="65" cy="137" r="6" fill="#4CAF50"/>
  <circle cx="135" cy="137" r="6" fill="#2196F3"/>
  <circle cx="40" cy="55" r="5" fill="#FFD700" stroke="#FFA500" stroke-width="1.5"/>
  <circle cx="100" cy="40" r="6" fill="#FF4B6E" stroke="#FFA500" stroke-width="1.5"/>
  <circle cx="160" cy="55" r="5" fill="#FFD700" stroke="#FFA500" stroke-width="1.5"/>
  <line x1="55" y1="85" x2="55" y2="125" stroke="#FFA500" stroke-width="1" opacity="0.3"/>
  <line x1="100" y1="70" x2="100" y2="125" stroke="#FFA500" stroke-width="1" opacity="0.3"/>
  <line x1="145" y1="85" x2="145" y2="125" stroke="#FFA500" stroke-width="1" opacity="0.3"/>
</svg>`,
  },
  {
    id: 'robot',
    title: 'Friendly Robot',
    keywords: ['robot', 'bot', 'machine', 'android', 'mech', 'transformer'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <line x1="100" y1="15" x2="100" y2="35" stroke="#888" stroke-width="3"/>
  <circle cx="100" cy="12" r="5" fill="#FF6B6B"/>
  <rect x="60" y="35" rx="12" ry="12" width="80" height="65" fill="#87CEEB" stroke="#6BB3D9" stroke-width="2"/>
  <rect x="72" y="50" rx="5" ry="5" width="22" height="18" fill="white"/>
  <rect x="106" y="50" rx="5" ry="5" width="22" height="18" fill="white"/>
  <circle cx="83" cy="59" r="6" fill="#2D2D2D"/>
  <circle cx="117" cy="59" r="6" fill="#2D2D2D"/>
  <circle cx="85" cy="57" r="2" fill="#87CEEB"/>
  <circle cx="119" cy="57" r="2" fill="#87CEEB"/>
  <rect x="85" y="78" rx="3" ry="3" width="30" height="8" fill="#6BB3D9"/>
  <line x1="92" y1="78" x2="92" y2="86" stroke="#87CEEB" stroke-width="1"/>
  <line x1="100" y1="78" x2="100" y2="86" stroke="#87CEEB" stroke-width="1"/>
  <line x1="108" y1="78" x2="108" y2="86" stroke="#87CEEB" stroke-width="1"/>
  <rect x="65" y="105" rx="8" ry="8" width="70" height="55" fill="#87CEEB" stroke="#6BB3D9" stroke-width="2"/>
  <circle cx="85" cy="125" r="5" fill="#FFD700"/>
  <circle cx="100" cy="125" r="5" fill="#FF6B6B"/>
  <circle cx="115" cy="125" r="5" fill="#4CAF50"/>
  <rect x="40" y="110" rx="5" ry="5" width="18" height="40" fill="#6BB3D9"/>
  <rect x="142" y="110" rx="5" ry="5" width="18" height="40" fill="#6BB3D9"/>
  <rect x="75" y="160" rx="4" ry="4" width="15" height="22" fill="#6BB3D9"/>
  <rect x="110" y="160" rx="4" ry="4" width="15" height="22" fill="#6BB3D9"/>
</svg>`,
  },
  {
    id: 'sun',
    title: 'Happy Sun',
    keywords: ['sun', 'sunshine', 'sunny', 'morning', 'bright', 'summer', 'warm'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <line x1="100" y1="10" x2="100" y2="40" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="100" y1="160" x2="100" y2="190" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="10" y1="100" x2="40" y2="100" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="160" y1="100" x2="190" y2="100" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="32" y1="32" x2="55" y2="55" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="145" y1="145" x2="168" y2="168" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="168" y1="32" x2="145" y2="55" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <line x1="55" y1="145" x2="32" y2="168" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="45" fill="#FFD700"/>
  <circle cx="100" cy="100" r="40" fill="#FFEB3B"/>
  <circle cx="85" cy="90" r="5" fill="#2D2D2D"/>
  <circle cx="115" cy="90" r="5" fill="#2D2D2D"/>
  <circle cx="86" cy="88" r="2" fill="white"/>
  <circle cx="116" cy="88" r="2" fill="white"/>
  <path d="M85 110 Q100 122 115 110" fill="none" stroke="#FFA500" stroke-width="3" stroke-linecap="round"/>
  <circle cx="75" cy="102" r="6" fill="#FFA500" opacity="0.25"/>
  <circle cx="125" cy="102" r="6" fill="#FFA500" opacity="0.25"/>
</svg>`,
  },
  {
    id: 'car',
    title: 'Cool Car',
    keywords: ['car', 'vehicle', 'drive', 'race', 'racing', 'auto', 'truck', 'bus'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="25" y="90" rx="15" ry="15" width="150" height="50" fill="#FF4B6E"/>
  <path d="M55 90 L70 55 L130 55 L145 90Z" fill="#FF6B8A"/>
  <rect x="73" y="58" rx="3" ry="3" width="24" height="28" fill="#87CEEB" opacity="0.7"/>
  <rect x="103" y="58" rx="3" ry="3" width="24" height="28" fill="#87CEEB" opacity="0.7"/>
  <line x1="100" y1="58" x2="100" y2="86" stroke="#FF4B6E" stroke-width="2"/>
  <circle cx="60" cy="140" r="18" fill="#444"/>
  <circle cx="140" cy="140" r="18" fill="#444"/>
  <circle cx="60" cy="140" r="10" fill="#888"/>
  <circle cx="140" cy="140" r="10" fill="#888"/>
  <circle cx="60" cy="140" r="4" fill="#AAA"/>
  <circle cx="140" cy="140" r="4" fill="#AAA"/>
  <rect x="155" y="100" rx="3" ry="3" width="15" height="10" fill="#FFD700"/>
  <rect x="30" y="100" rx="3" ry="3" width="12" height="8" fill="#FF6B6B"/>
  <circle cx="42" cy="108" r="3" fill="#FFD700" opacity="0.5"/>
</svg>`,
  },
  {
    id: 'house',
    title: 'Cozy House',
    keywords: ['house', 'home', 'building', 'roof', 'cottage'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="40" y="95" width="120" height="80" fill="#FFB347"/>
  <polygon points="100,30 25,95 175,95" fill="#FF6B6B"/>
  <polygon points="100,40 35,95 165,95" fill="#FF8A8A" opacity="0.5"/>
  <rect x="80" y="130" rx="3" ry="3" width="30" height="45" fill="#8B4513"/>
  <circle cx="104" cy="155" r="3" fill="#FFD700"/>
  <rect x="50" y="110" rx="2" ry="2" width="22" height="22" fill="#87CEEB"/>
  <rect x="128" y="110" rx="2" ry="2" width="22" height="22" fill="#87CEEB"/>
  <line x1="61" y1="110" x2="61" y2="132" stroke="white" stroke-width="1.5"/>
  <line x1="50" y1="121" x2="72" y2="121" stroke="white" stroke-width="1.5"/>
  <line x1="139" y1="110" x2="139" y2="132" stroke="white" stroke-width="1.5"/>
  <line x1="128" y1="121" x2="150" y2="121" stroke="white" stroke-width="1.5"/>
  <rect x="140" y="50" width="12" height="45" fill="#888"/>
  <ellipse cx="146" cy="45" rx="10" ry="8" fill="#CCC" opacity="0.6"/>
  <circle cx="170" cy="25" r="12" fill="#FFD700" opacity="0.8"/>
</svg>`,
  },
  // ── Characters & Fantasy ─────────────────────────────
  {
    id: 'princess',
    title: 'Beautiful Princess',
    keywords: ['princess', 'queen', 'elsa', 'frozen', 'fairy', 'girl', 'dress'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="80,35 100,8 120,35" fill="#FFD700" stroke="#FFA500" stroke-width="1.5"/>
  <circle cx="90" cy="28" r="3" fill="#FF69B4"/>
  <circle cx="100" cy="18" r="3" fill="#87CEEB"/>
  <circle cx="110" cy="28" r="3" fill="#FF69B4"/>
  <circle cx="100" cy="65" r="28" fill="#FFDAB9"/>
  <path d="M72 55 Q70 35 80 38 Q85 30 95 40" fill="#8B4513"/>
  <path d="M128 55 Q130 35 120 38 Q115 30 105 40" fill="#8B4513"/>
  <path d="M80 40 Q100 32 120 40 Q125 50 120 55 L80 55 Q75 50 80 40Z" fill="#8B4513"/>
  <circle cx="90" cy="62" r="4" fill="#2D2D2D"/>
  <circle cx="110" cy="62" r="4" fill="#2D2D2D"/>
  <circle cx="91" cy="61" r="1.5" fill="white"/>
  <circle cx="111" cy="61" r="1.5" fill="white"/>
  <path d="M95 75 Q100 79 105 75" fill="none" stroke="#FF69B4" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="82" cy="70" r="5" fill="#FF69B4" opacity="0.2"/>
  <circle cx="118" cy="70" r="5" fill="#FF69B4" opacity="0.2"/>
  <path d="M75 90 L65 175 Q100 185 135 175 L125 90Z" fill="#FF69B4"/>
  <path d="M80 90 L72 175 Q100 182 128 175 L120 90Z" fill="#FF85C8" opacity="0.5"/>
  <path d="M75 90 Q100 100 125 90" fill="none" stroke="#FF1493" stroke-width="2"/>
  <circle cx="100" cy="105" r="4" fill="#FFD700"/>
  <circle cx="100" cy="125" r="3" fill="#FFD700"/>
  <circle cx="100" cy="142" r="3" fill="#FFD700"/>
</svg>`,
  },
  {
    id: 'superhero',
    title: 'Super Hero',
    keywords: ['superhero', 'hero', 'superman', 'batman', 'spiderman', 'avenger', 'power', 'cape', 'marvel'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M75 90 L40 170 Q55 175 70 170" fill="#FF4B6E" opacity="0.8"/>
  <path d="M125 90 L160 170 Q145 175 130 170" fill="#FF4B6E" opacity="0.8"/>
  <circle cx="100" cy="65" r="28" fill="#FFDAB9"/>
  <rect x="75" y="48" rx="8" ry="5" width="50" height="18" fill="#2196F3"/>
  <circle cx="90" cy="55" r="6" fill="white"/>
  <circle cx="110" cy="55" r="6" fill="white"/>
  <circle cx="91" cy="55" r="3.5" fill="#2D2D2D"/>
  <circle cx="111" cy="55" r="3.5" fill="#2D2D2D"/>
  <circle cx="92" cy="54" r="1.5" fill="white"/>
  <circle cx="112" cy="54" r="1.5" fill="white"/>
  <path d="M95 75 Q100 79 105 75" fill="none" stroke="#C49370" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="75" y="88" rx="5" ry="5" width="50" height="65" fill="#2196F3"/>
  <polygon points="100,98 92,118 108,118" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
  <rect x="55" y="92" rx="5" ry="5" width="22" height="45" fill="#2196F3"/>
  <rect x="123" y="92" rx="5" ry="5" width="22" height="45" fill="#2196F3"/>
  <ellipse cx="66" cy="138" rx="8" ry="5" fill="#FFDAB9"/>
  <ellipse cx="134" cy="138" rx="8" ry="5" fill="#FFDAB9"/>
  <rect x="78" y="152" rx="5" ry="5" width="16" height="30" fill="#FF4B6E"/>
  <rect x="106" y="152" rx="5" ry="5" width="16" height="30" fill="#FF4B6E"/>
  <rect x="75" y="178" rx="4" ry="4" width="20" height="8" fill="#FF4B6E"/>
  <rect x="105" y="178" rx="4" ry="4" width="20" height="8" fill="#FF4B6E"/>
</svg>`,
  },
  {
    id: 'mermaid',
    title: 'Magical Mermaid',
    keywords: ['mermaid', 'ariel', 'ocean', 'sea', 'swim', 'tail', 'little mermaid'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="40" cy="170" r="4" fill="#87CEEB" opacity="0.3"/>
  <circle cx="160" cy="160" r="3" fill="#87CEEB" opacity="0.3"/>
  <circle cx="150" cy="30" r="3" fill="#87CEEB" opacity="0.3"/>
  <circle cx="100" cy="60" r="25" fill="#FFDAB9"/>
  <path d="M75 48 Q80 25 90 40 Q95 30 100 38 Q105 30 110 40 Q120 25 125 48" fill="#FF6B6B"/>
  <path d="M80 50 Q100 42 120 50" fill="#FF6B6B"/>
  <circle cx="90" cy="58" r="4" fill="#2D2D2D"/>
  <circle cx="110" cy="58" r="4" fill="#2D2D2D"/>
  <circle cx="91" cy="57" r="1.5" fill="white"/>
  <circle cx="111" cy="57" r="1.5" fill="white"/>
  <path d="M95 70 Q100 74 105 70" fill="none" stroke="#FF69B4" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="82" cy="65" r="4" fill="#FF69B4" opacity="0.2"/>
  <circle cx="118" cy="65" r="4" fill="#FF69B4" opacity="0.2"/>
  <path d="M80 85 L75 115 Q100 125 125 115 L120 85Z" fill="#FFDAB9"/>
  <path d="M82 100 Q100 95 118 100" fill="none" stroke="#4CAF50" stroke-width="3"/>
  <path d="M75 115 Q70 140 80 160 Q100 175 120 160 Q130 140 125 115 Q100 125 75 115Z" fill="#4CAF50"/>
  <path d="M78 120 Q100 128 122 120" fill="none" stroke="#66BB6A" stroke-width="2" opacity="0.5"/>
  <path d="M80 140 Q100 148 120 140" fill="none" stroke="#66BB6A" stroke-width="2" opacity="0.5"/>
  <path d="M80 160 Q70 175 60 170 Q65 180 80 175" fill="#4CAF50"/>
  <path d="M120 160 Q130 175 140 170 Q135 180 120 175" fill="#4CAF50"/>
</svg>`,
  },
  {
    id: 'dragon',
    title: 'Baby Dragon',
    keywords: ['dragon', 'fire', 'wings', 'fly', 'dragon ball', 'toothless'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M55 95 Q35 75 40 60 Q50 70 55 85" fill="#6B5CE7" opacity="0.7"/>
  <path d="M55 85 Q30 65 38 50 Q48 62 55 80" fill="#8B7BF7" opacity="0.5"/>
  <path d="M145 95 Q165 75 160 60 Q150 70 145 85" fill="#6B5CE7" opacity="0.7"/>
  <path d="M145 85 Q170 65 162 50 Q152 62 145 80" fill="#8B7BF7" opacity="0.5"/>
  <ellipse cx="100" cy="120" rx="42" ry="48" fill="#6B5CE7"/>
  <ellipse cx="100" cy="130" rx="28" ry="30" fill="#8B7BF7" opacity="0.4"/>
  <circle cx="100" cy="80" r="32" fill="#6B5CE7"/>
  <polygon points="82,52 78,30 90,48" fill="#8B7BF7"/>
  <polygon points="118,52 122,30 110,48" fill="#8B7BF7"/>
  <circle cx="88" cy="75" r="8" fill="white"/>
  <circle cx="112" cy="75" r="8" fill="white"/>
  <circle cx="90" cy="74" r="5" fill="#FFD700"/>
  <circle cx="114" cy="74" r="5" fill="#FFD700"/>
  <circle cx="91" cy="73" r="2.5" fill="#2D2D2D"/>
  <circle cx="115" cy="73" r="2.5" fill="#2D2D2D"/>
  <ellipse cx="100" cy="92" rx="4" ry="3" fill="#2D2D2D"/>
  <path d="M90 98 Q100 106 110 98" fill="none" stroke="#4B3CC7" stroke-width="2" stroke-linecap="round"/>
  <polygon points="95,102 100,112 105,102" fill="#FF6B6B" opacity="0.5"/>
  <rect x="75" y="160" rx="6" ry="6" width="14" height="20" fill="#6B5CE7"/>
  <rect x="111" y="160" rx="6" ry="6" width="14" height="20" fill="#6B5CE7"/>
</svg>`,
  },
  {
    id: 'pirate',
    title: 'Pirate Captain',
    keywords: ['pirate', 'ship', 'treasure', 'captain', 'sword', 'one piece'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="75" r="30" fill="#FFDAB9"/>
  <path d="M70 62 Q75 40 100 35 Q125 40 130 62 L135 55 Q130 32 100 25 Q70 32 65 55Z" fill="#2D2D2D"/>
  <rect x="65" y="52" rx="3" ry="3" width="70" height="12" fill="#2D2D2D"/>
  <circle cx="100" cy="50" r="5" fill="#FFD700"/>
  <circle cx="88" cy="72" r="5" fill="#2D2D2D"/>
  <circle cx="89" cy="71" r="2" fill="white"/>
  <ellipse cx="112" cy="72" rx="8" ry="7" fill="#2D2D2D"/>
  <line x1="105" y1="68" x2="119" y2="76" stroke="#2D2D2D" stroke-width="2"/>
  <path d="M90 88 Q100 94 110 88" fill="none" stroke="#C49370" stroke-width="2" stroke-linecap="round"/>
  <rect x="75" y="102" rx="5" ry="5" width="50" height="55" fill="#FF4B6E"/>
  <path d="M75 102 Q100 110 125 102" fill="none" stroke="white" stroke-width="2"/>
  <line x1="100" y1="102" x2="100" y2="157" stroke="white" stroke-width="2"/>
  <rect x="55" y="108" rx="5" ry="5" width="22" height="35" fill="#FF6B8A"/>
  <rect x="123" y="108" rx="5" ry="5" width="22" height="35" fill="#FF6B8A"/>
  <rect x="80" y="155" rx="5" ry="5" width="15" height="28" fill="#8B4513"/>
  <rect x="105" y="155" rx="5" ry="5" width="15" height="28" fill="#8B4513"/>
</svg>`,
  },
  {
    id: 'alien',
    title: 'Friendly Alien',
    keywords: ['alien', 'ufo', 'space', 'extraterrestrial', 'et', 'martian', 'galaxy'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="45" cy="35" r="2" fill="#FFD700" opacity="0.6"/>
  <circle cx="155" cy="28" r="3" fill="#FFD700" opacity="0.5"/>
  <circle cx="30" cy="100" r="2" fill="#FFD700" opacity="0.4"/>
  <circle cx="175" cy="90" r="2" fill="#FFD700" opacity="0.6"/>
  <ellipse cx="100" cy="85" rx="42" ry="52" fill="#98FB98"/>
  <ellipse cx="82" cy="78" rx="16" ry="20" fill="#2D2D2D"/>
  <ellipse cx="118" cy="78" rx="16" ry="20" fill="#2D2D2D"/>
  <ellipse cx="82" cy="78" rx="12" ry="16" fill="#4CAF50"/>
  <ellipse cx="118" cy="78" rx="12" ry="16" fill="#4CAF50"/>
  <ellipse cx="82" cy="75" rx="5" ry="7" fill="white" opacity="0.6"/>
  <ellipse cx="118" cy="75" rx="5" ry="7" fill="white" opacity="0.6"/>
  <path d="M92 105 Q100 112 108 105" fill="none" stroke="#45A049" stroke-width="2" stroke-linecap="round"/>
  <line x1="78" y1="30" x2="82" y2="40" stroke="#98FB98" stroke-width="2" stroke-linecap="round"/>
  <circle cx="78" cy="28" r="4" fill="#98FB98"/>
  <line x1="122" y1="30" x2="118" y2="40" stroke="#98FB98" stroke-width="2" stroke-linecap="round"/>
  <circle cx="122" cy="28" r="4" fill="#98FB98"/>
  <ellipse cx="100" cy="140" rx="25" ry="15" fill="#98FB98"/>
  <ellipse cx="65" cy="110" rx="8" ry="18" fill="#98FB98" transform="rotate(-10 65 110)"/>
  <ellipse cx="135" cy="110" rx="8" ry="18" fill="#98FB98" transform="rotate(10 135 110)"/>
  <circle cx="60" cy="128" r="5" fill="#98FB98"/>
  <circle cx="140" cy="128" r="5" fill="#98FB98"/>
</svg>`,
  },
]

/** Find the best matching drawing from the library by ID */
export function getDrawingById(id: string): LibraryDrawing | undefined {
  return DRAWING_LIBRARY.find((d) => d.id === id)
}

/** Get all available drawing IDs and titles for the AI prompt */
export function getDrawingCatalog(): string {
  return DRAWING_LIBRARY.map((d) => `- "${d.id}": ${d.title} (${d.keywords.slice(0, 3).join(', ')})`).join('\n')
}
