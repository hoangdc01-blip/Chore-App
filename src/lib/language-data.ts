/**
 * Language learning curriculum data.
 * Each language has topics, each topic has words organized by level.
 */

export type LanguageCode = 'ko' | 'ja' | 'zh' | 'vi' | 'en'

export interface VocabWord {
  word: string
  romanization: string  // pronunciation guide
  meaning: string       // English meaning
  emoji: string
}

export interface Topic {
  id: string
  name: string
  emoji: string
  words: VocabWord[]
}

export interface LanguageInfo {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  topics: Topic[]
}

export const LANGUAGES: LanguageInfo[] = [
  // ── Korean ───────────────────────────────────────────
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    topics: [
      {
        id: 'ko-numbers', name: 'Numbers', emoji: '🔢',
        words: [
          { word: '하나', romanization: 'hana', meaning: 'one', emoji: '1️⃣' },
          { word: '둘', romanization: 'dul', meaning: 'two', emoji: '2️⃣' },
          { word: '셋', romanization: 'set', meaning: 'three', emoji: '3️⃣' },
          { word: '넷', romanization: 'net', meaning: 'four', emoji: '4️⃣' },
          { word: '다섯', romanization: 'daseot', meaning: 'five', emoji: '5️⃣' },
          { word: '여섯', romanization: 'yeoseot', meaning: 'six', emoji: '6️⃣' },
          { word: '일곱', romanization: 'ilgop', meaning: 'seven', emoji: '7️⃣' },
          { word: '여덟', romanization: 'yeodeol', meaning: 'eight', emoji: '8️⃣' },
          { word: '아홉', romanization: 'ahop', meaning: 'nine', emoji: '9️⃣' },
          { word: '열', romanization: 'yeol', meaning: 'ten', emoji: '🔟' },
        ],
      },
      {
        id: 'ko-animals', name: 'Animals', emoji: '🐾',
        words: [
          { word: '고양이', romanization: 'goyangi', meaning: 'cat', emoji: '🐱' },
          { word: '강아지', romanization: 'gangaji', meaning: 'puppy', emoji: '🐶' },
          { word: '토끼', romanization: 'tokki', meaning: 'rabbit', emoji: '🐰' },
          { word: '새', romanization: 'sae', meaning: 'bird', emoji: '🐦' },
          { word: '물고기', romanization: 'mulgogi', meaning: 'fish', emoji: '🐟' },
          { word: '곰', romanization: 'gom', meaning: 'bear', emoji: '🐻' },
          { word: '호랑이', romanization: 'horangi', meaning: 'tiger', emoji: '🐯' },
          { word: '코끼리', romanization: 'kokkiri', meaning: 'elephant', emoji: '🐘' },
        ],
      },
      {
        id: 'ko-colors', name: 'Colors', emoji: '🌈',
        words: [
          { word: '빨간색', romanization: 'ppalgansaek', meaning: 'red', emoji: '🔴' },
          { word: '파란색', romanization: 'paransaek', meaning: 'blue', emoji: '🔵' },
          { word: '노란색', romanization: 'noransaek', meaning: 'yellow', emoji: '🟡' },
          { word: '초록색', romanization: 'choroksaek', meaning: 'green', emoji: '🟢' },
          { word: '하얀색', romanization: 'hayansaek', meaning: 'white', emoji: '⚪' },
          { word: '검은색', romanization: 'geomeunsaek', meaning: 'black', emoji: '⚫' },
          { word: '주황색', romanization: 'juhwangsaek', meaning: 'orange', emoji: '🟠' },
          { word: '보라색', romanization: 'borasaek', meaning: 'purple', emoji: '🟣' },
        ],
      },
      {
        id: 'ko-food', name: 'Food', emoji: '🍱',
        words: [
          { word: '밥', romanization: 'bap', meaning: 'rice', emoji: '🍚' },
          { word: '물', romanization: 'mul', meaning: 'water', emoji: '💧' },
          { word: '우유', romanization: 'uyu', meaning: 'milk', emoji: '🥛' },
          { word: '사과', romanization: 'sagwa', meaning: 'apple', emoji: '🍎' },
          { word: '바나나', romanization: 'banana', meaning: 'banana', emoji: '🍌' },
          { word: '빵', romanization: 'ppang', meaning: 'bread', emoji: '🍞' },
          { word: '고기', romanization: 'gogi', meaning: 'meat', emoji: '🥩' },
          { word: '김치', romanization: 'kimchi', meaning: 'kimchi', emoji: '🥬' },
        ],
      },
      {
        id: 'ko-family', name: 'Family', emoji: '👨‍👩‍👧‍👦',
        words: [
          { word: '엄마', romanization: 'eomma', meaning: 'mom', emoji: '👩' },
          { word: '아빠', romanization: 'appa', meaning: 'dad', emoji: '👨' },
          { word: '언니/누나', romanization: 'eonni/nuna', meaning: 'older sister', emoji: '👧' },
          { word: '오빠/형', romanization: 'oppa/hyeong', meaning: 'older brother', emoji: '👦' },
          { word: '동생', romanization: 'dongsaeng', meaning: 'younger sibling', emoji: '👶' },
          { word: '할머니', romanization: 'halmeoni', meaning: 'grandma', emoji: '👵' },
          { word: '할아버지', romanization: 'harabeoji', meaning: 'grandpa', emoji: '👴' },
          { word: '친구', romanization: 'chingu', meaning: 'friend', emoji: '🤝' },
        ],
      },
      {
        id: 'ko-greetings', name: 'Greetings', emoji: '👋',
        words: [
          { word: '안녕하세요', romanization: 'annyeonghaseyo', meaning: 'hello', emoji: '👋' },
          { word: '감사합니다', romanization: 'gamsahamnida', meaning: 'thank you', emoji: '🙏' },
          { word: '네', romanization: 'ne', meaning: 'yes', emoji: '✅' },
          { word: '아니요', romanization: 'aniyo', meaning: 'no', emoji: '❌' },
          { word: '잘자요', romanization: 'jaljayo', meaning: 'good night', emoji: '🌙' },
          { word: '미안해요', romanization: 'mianhaeyo', meaning: 'sorry', emoji: '😔' },
          { word: '좋아요', romanization: 'joayo', meaning: 'I like it', emoji: '👍' },
          { word: '사랑해요', romanization: 'saranghaeyo', meaning: 'I love you', emoji: '❤️' },
        ],
      },
      {
        id: 'ko-body', name: 'Body', emoji: '🧍',
        words: [
          { word: '머리', romanization: 'meori', meaning: 'head', emoji: '🗣️' },
          { word: '눈', romanization: 'nun', meaning: 'eye', emoji: '👁️' },
          { word: '코', romanization: 'ko', meaning: 'nose', emoji: '👃' },
          { word: '입', romanization: 'ip', meaning: 'mouth', emoji: '👄' },
          { word: '귀', romanization: 'gwi', meaning: 'ear', emoji: '👂' },
          { word: '손', romanization: 'son', meaning: 'hand', emoji: '✋' },
          { word: '발', romanization: 'bal', meaning: 'foot', emoji: '🦶' },
          { word: '배', romanization: 'bae', meaning: 'belly', emoji: '🫃' },
        ],
      },
    ],
  },

  // ── Japanese ─────────────────────────────────────────
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    topics: [
      {
        id: 'ja-numbers', name: 'Numbers', emoji: '🔢',
        words: [
          { word: 'いち', romanization: 'ichi', meaning: 'one', emoji: '1️⃣' },
          { word: 'に', romanization: 'ni', meaning: 'two', emoji: '2️⃣' },
          { word: 'さん', romanization: 'san', meaning: 'three', emoji: '3️⃣' },
          { word: 'し/よん', romanization: 'shi/yon', meaning: 'four', emoji: '4️⃣' },
          { word: 'ご', romanization: 'go', meaning: 'five', emoji: '5️⃣' },
          { word: 'ろく', romanization: 'roku', meaning: 'six', emoji: '6️⃣' },
          { word: 'なな', romanization: 'nana', meaning: 'seven', emoji: '7️⃣' },
          { word: 'はち', romanization: 'hachi', meaning: 'eight', emoji: '8️⃣' },
          { word: 'きゅう', romanization: 'kyuu', meaning: 'nine', emoji: '9️⃣' },
          { word: 'じゅう', romanization: 'juu', meaning: 'ten', emoji: '🔟' },
        ],
      },
      {
        id: 'ja-animals', name: 'Animals', emoji: '🐾',
        words: [
          { word: 'ねこ', romanization: 'neko', meaning: 'cat', emoji: '🐱' },
          { word: 'いぬ', romanization: 'inu', meaning: 'dog', emoji: '🐶' },
          { word: 'うさぎ', romanization: 'usagi', meaning: 'rabbit', emoji: '🐰' },
          { word: 'とり', romanization: 'tori', meaning: 'bird', emoji: '🐦' },
          { word: 'さかな', romanization: 'sakana', meaning: 'fish', emoji: '🐟' },
          { word: 'くま', romanization: 'kuma', meaning: 'bear', emoji: '🐻' },
          { word: 'さる', romanization: 'saru', meaning: 'monkey', emoji: '🐵' },
          { word: 'かめ', romanization: 'kame', meaning: 'turtle', emoji: '🐢' },
        ],
      },
      {
        id: 'ja-colors', name: 'Colors', emoji: '🌈',
        words: [
          { word: 'あか', romanization: 'aka', meaning: 'red', emoji: '🔴' },
          { word: 'あお', romanization: 'ao', meaning: 'blue', emoji: '🔵' },
          { word: 'きいろ', romanization: 'kiiro', meaning: 'yellow', emoji: '🟡' },
          { word: 'みどり', romanization: 'midori', meaning: 'green', emoji: '🟢' },
          { word: 'しろ', romanization: 'shiro', meaning: 'white', emoji: '⚪' },
          { word: 'くろ', romanization: 'kuro', meaning: 'black', emoji: '⚫' },
          { word: 'オレンジ', romanization: 'orenji', meaning: 'orange', emoji: '🟠' },
          { word: 'むらさき', romanization: 'murasaki', meaning: 'purple', emoji: '🟣' },
        ],
      },
      {
        id: 'ja-food', name: 'Food', emoji: '🍱',
        words: [
          { word: 'ごはん', romanization: 'gohan', meaning: 'rice', emoji: '🍚' },
          { word: 'みず', romanization: 'mizu', meaning: 'water', emoji: '💧' },
          { word: 'ぎゅうにゅう', romanization: 'gyuunyuu', meaning: 'milk', emoji: '🥛' },
          { word: 'りんご', romanization: 'ringo', meaning: 'apple', emoji: '🍎' },
          { word: 'たまご', romanization: 'tamago', meaning: 'egg', emoji: '🥚' },
          { word: 'パン', romanization: 'pan', meaning: 'bread', emoji: '🍞' },
          { word: 'すし', romanization: 'sushi', meaning: 'sushi', emoji: '🍣' },
          { word: 'ラーメン', romanization: 'raamen', meaning: 'ramen', emoji: '🍜' },
        ],
      },
      {
        id: 'ja-family', name: 'Family', emoji: '👨‍👩‍👧‍👦',
        words: [
          { word: 'おかあさん', romanization: 'okaasan', meaning: 'mom', emoji: '👩' },
          { word: 'おとうさん', romanization: 'otousan', meaning: 'dad', emoji: '👨' },
          { word: 'おねえさん', romanization: 'oneesan', meaning: 'older sister', emoji: '👧' },
          { word: 'おにいさん', romanization: 'oniisan', meaning: 'older brother', emoji: '👦' },
          { word: 'あかちゃん', romanization: 'akachan', meaning: 'baby', emoji: '👶' },
          { word: 'おばあさん', romanization: 'obaasan', meaning: 'grandma', emoji: '👵' },
          { word: 'おじいさん', romanization: 'ojiisan', meaning: 'grandpa', emoji: '👴' },
          { word: 'ともだち', romanization: 'tomodachi', meaning: 'friend', emoji: '🤝' },
        ],
      },
      {
        id: 'ja-greetings', name: 'Greetings', emoji: '👋',
        words: [
          { word: 'こんにちは', romanization: 'konnichiwa', meaning: 'hello', emoji: '👋' },
          { word: 'ありがとう', romanization: 'arigatou', meaning: 'thank you', emoji: '🙏' },
          { word: 'はい', romanization: 'hai', meaning: 'yes', emoji: '✅' },
          { word: 'いいえ', romanization: 'iie', meaning: 'no', emoji: '❌' },
          { word: 'おやすみ', romanization: 'oyasumi', meaning: 'good night', emoji: '🌙' },
          { word: 'ごめんなさい', romanization: 'gomen nasai', meaning: 'sorry', emoji: '😔' },
          { word: 'すき', romanization: 'suki', meaning: 'I like it', emoji: '👍' },
          { word: 'だいすき', romanization: 'daisuki', meaning: 'I love you', emoji: '❤️' },
        ],
      },
      {
        id: 'ja-body', name: 'Body', emoji: '🧍',
        words: [
          { word: 'あたま', romanization: 'atama', meaning: 'head', emoji: '🗣️' },
          { word: 'め', romanization: 'me', meaning: 'eye', emoji: '👁️' },
          { word: 'はな', romanization: 'hana', meaning: 'nose', emoji: '👃' },
          { word: 'くち', romanization: 'kuchi', meaning: 'mouth', emoji: '👄' },
          { word: 'みみ', romanization: 'mimi', meaning: 'ear', emoji: '👂' },
          { word: 'て', romanization: 'te', meaning: 'hand', emoji: '✋' },
          { word: 'あし', romanization: 'ashi', meaning: 'foot', emoji: '🦶' },
          { word: 'おなか', romanization: 'onaka', meaning: 'belly', emoji: '🫃' },
        ],
      },
    ],
  },

  // ── Chinese ──────────────────────────────────────────
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    topics: [
      {
        id: 'zh-numbers', name: 'Numbers', emoji: '🔢',
        words: [
          { word: '一', romanization: 'yī', meaning: 'one', emoji: '1️⃣' },
          { word: '二', romanization: 'èr', meaning: 'two', emoji: '2️⃣' },
          { word: '三', romanization: 'sān', meaning: 'three', emoji: '3️⃣' },
          { word: '四', romanization: 'sì', meaning: 'four', emoji: '4️⃣' },
          { word: '五', romanization: 'wǔ', meaning: 'five', emoji: '5️⃣' },
          { word: '六', romanization: 'liù', meaning: 'six', emoji: '6️⃣' },
          { word: '七', romanization: 'qī', meaning: 'seven', emoji: '7️⃣' },
          { word: '八', romanization: 'bā', meaning: 'eight', emoji: '8️⃣' },
          { word: '九', romanization: 'jiǔ', meaning: 'nine', emoji: '9️⃣' },
          { word: '十', romanization: 'shí', meaning: 'ten', emoji: '🔟' },
        ],
      },
      {
        id: 'zh-animals', name: 'Animals', emoji: '🐾',
        words: [
          { word: '猫', romanization: 'māo', meaning: 'cat', emoji: '🐱' },
          { word: '狗', romanization: 'gǒu', meaning: 'dog', emoji: '🐶' },
          { word: '兔子', romanization: 'tùzi', meaning: 'rabbit', emoji: '🐰' },
          { word: '鸟', romanization: 'niǎo', meaning: 'bird', emoji: '🐦' },
          { word: '鱼', romanization: 'yú', meaning: 'fish', emoji: '🐟' },
          { word: '熊', romanization: 'xióng', meaning: 'bear', emoji: '🐻' },
          { word: '老虎', romanization: 'lǎohǔ', meaning: 'tiger', emoji: '🐯' },
          { word: '大象', romanization: 'dàxiàng', meaning: 'elephant', emoji: '🐘' },
        ],
      },
      {
        id: 'zh-colors', name: 'Colors', emoji: '🌈',
        words: [
          { word: '红色', romanization: 'hóngsè', meaning: 'red', emoji: '🔴' },
          { word: '蓝色', romanization: 'lánsè', meaning: 'blue', emoji: '🔵' },
          { word: '黄色', romanization: 'huángsè', meaning: 'yellow', emoji: '🟡' },
          { word: '绿色', romanization: 'lǜsè', meaning: 'green', emoji: '🟢' },
          { word: '白色', romanization: 'báisè', meaning: 'white', emoji: '⚪' },
          { word: '黑色', romanization: 'hēisè', meaning: 'black', emoji: '⚫' },
          { word: '橙色', romanization: 'chéngsè', meaning: 'orange', emoji: '🟠' },
          { word: '紫色', romanization: 'zǐsè', meaning: 'purple', emoji: '🟣' },
        ],
      },
      {
        id: 'zh-food', name: 'Food', emoji: '🍱',
        words: [
          { word: '米饭', romanization: 'mǐfàn', meaning: 'rice', emoji: '🍚' },
          { word: '水', romanization: 'shuǐ', meaning: 'water', emoji: '💧' },
          { word: '牛奶', romanization: 'niúnǎi', meaning: 'milk', emoji: '🥛' },
          { word: '苹果', romanization: 'píngguǒ', meaning: 'apple', emoji: '🍎' },
          { word: '鸡蛋', romanization: 'jīdàn', meaning: 'egg', emoji: '🥚' },
          { word: '面包', romanization: 'miànbāo', meaning: 'bread', emoji: '🍞' },
          { word: '面条', romanization: 'miàntiáo', meaning: 'noodles', emoji: '🍜' },
          { word: '饺子', romanization: 'jiǎozi', meaning: 'dumplings', emoji: '🥟' },
        ],
      },
      {
        id: 'zh-family', name: 'Family', emoji: '👨‍👩‍👧‍👦',
        words: [
          { word: '妈妈', romanization: 'māma', meaning: 'mom', emoji: '👩' },
          { word: '爸爸', romanization: 'bàba', meaning: 'dad', emoji: '👨' },
          { word: '姐姐', romanization: 'jiějie', meaning: 'older sister', emoji: '👧' },
          { word: '哥哥', romanization: 'gēge', meaning: 'older brother', emoji: '👦' },
          { word: '弟弟', romanization: 'dìdi', meaning: 'younger brother', emoji: '👶' },
          { word: '奶奶', romanization: 'nǎinai', meaning: 'grandma', emoji: '👵' },
          { word: '爷爷', romanization: 'yéye', meaning: 'grandpa', emoji: '👴' },
          { word: '朋友', romanization: 'péngyǒu', meaning: 'friend', emoji: '🤝' },
        ],
      },
      {
        id: 'zh-greetings', name: 'Greetings', emoji: '👋',
        words: [
          { word: '你好', romanization: 'nǐ hǎo', meaning: 'hello', emoji: '👋' },
          { word: '谢谢', romanization: 'xièxie', meaning: 'thank you', emoji: '🙏' },
          { word: '是', romanization: 'shì', meaning: 'yes', emoji: '✅' },
          { word: '不是', romanization: 'bù shì', meaning: 'no', emoji: '❌' },
          { word: '晚安', romanization: 'wǎn ān', meaning: 'good night', emoji: '🌙' },
          { word: '对不起', romanization: 'duìbuqǐ', meaning: 'sorry', emoji: '😔' },
          { word: '喜欢', romanization: 'xǐhuān', meaning: 'I like it', emoji: '👍' },
          { word: '我爱你', romanization: 'wǒ ài nǐ', meaning: 'I love you', emoji: '❤️' },
        ],
      },
      {
        id: 'zh-body', name: 'Body', emoji: '🧍',
        words: [
          { word: '头', romanization: 'tóu', meaning: 'head', emoji: '🗣️' },
          { word: '眼睛', romanization: 'yǎnjīng', meaning: 'eye', emoji: '👁️' },
          { word: '鼻子', romanization: 'bízi', meaning: 'nose', emoji: '👃' },
          { word: '嘴巴', romanization: 'zuǐba', meaning: 'mouth', emoji: '👄' },
          { word: '耳朵', romanization: 'ěrduo', meaning: 'ear', emoji: '👂' },
          { word: '手', romanization: 'shǒu', meaning: 'hand', emoji: '✋' },
          { word: '脚', romanization: 'jiǎo', meaning: 'foot', emoji: '🦶' },
          { word: '肚子', romanization: 'dùzi', meaning: 'belly', emoji: '🫃' },
        ],
      },
    ],
  },

  // ── Vietnamese ───────────────────────────────────────
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    topics: [
      {
        id: 'vi-numbers', name: 'Numbers', emoji: '🔢',
        words: [
          { word: 'một', romanization: 'moht', meaning: 'one', emoji: '1️⃣' },
          { word: 'hai', romanization: 'hai', meaning: 'two', emoji: '2️⃣' },
          { word: 'ba', romanization: 'bah', meaning: 'three', emoji: '3️⃣' },
          { word: 'bốn', romanization: 'bohn', meaning: 'four', emoji: '4️⃣' },
          { word: 'năm', romanization: 'nahm', meaning: 'five', emoji: '5️⃣' },
          { word: 'sáu', romanization: 'saow', meaning: 'six', emoji: '6️⃣' },
          { word: 'bảy', romanization: 'bye', meaning: 'seven', emoji: '7️⃣' },
          { word: 'tám', romanization: 'tahm', meaning: 'eight', emoji: '8️⃣' },
          { word: 'chín', romanization: 'chin', meaning: 'nine', emoji: '9️⃣' },
          { word: 'mười', romanization: 'moo-ee', meaning: 'ten', emoji: '🔟' },
        ],
      },
      {
        id: 'vi-animals', name: 'Animals', emoji: '🐾',
        words: [
          { word: 'con mèo', romanization: 'kon meh-o', meaning: 'cat', emoji: '🐱' },
          { word: 'con chó', romanization: 'kon chaw', meaning: 'dog', emoji: '🐶' },
          { word: 'con thỏ', romanization: 'kon taw', meaning: 'rabbit', emoji: '🐰' },
          { word: 'con chim', romanization: 'kon chim', meaning: 'bird', emoji: '🐦' },
          { word: 'con cá', romanization: 'kon kah', meaning: 'fish', emoji: '🐟' },
          { word: 'con gấu', romanization: 'kon goh', meaning: 'bear', emoji: '🐻' },
          { word: 'con hổ', romanization: 'kon haw', meaning: 'tiger', emoji: '🐯' },
          { word: 'con voi', romanization: 'kon voy', meaning: 'elephant', emoji: '🐘' },
        ],
      },
      {
        id: 'vi-colors', name: 'Colors', emoji: '🌈',
        words: [
          { word: 'màu đỏ', romanization: 'mah-oo daw', meaning: 'red', emoji: '🔴' },
          { word: 'màu xanh dương', romanization: 'mah-oo sanh yoo-ung', meaning: 'blue', emoji: '🔵' },
          { word: 'màu vàng', romanization: 'mah-oo vahng', meaning: 'yellow', emoji: '🟡' },
          { word: 'màu xanh lá', romanization: 'mah-oo sanh lah', meaning: 'green', emoji: '🟢' },
          { word: 'màu trắng', romanization: 'mah-oo chahng', meaning: 'white', emoji: '⚪' },
          { word: 'màu đen', romanization: 'mah-oo den', meaning: 'black', emoji: '⚫' },
          { word: 'màu cam', romanization: 'mah-oo kahm', meaning: 'orange', emoji: '🟠' },
          { word: 'màu tím', romanization: 'mah-oo teem', meaning: 'purple', emoji: '🟣' },
        ],
      },
      {
        id: 'vi-food', name: 'Food', emoji: '🍱',
        words: [
          { word: 'cơm', romanization: 'kuhm', meaning: 'rice', emoji: '🍚' },
          { word: 'nước', romanization: 'noo-uhk', meaning: 'water', emoji: '💧' },
          { word: 'sữa', romanization: 'soo-ah', meaning: 'milk', emoji: '🥛' },
          { word: 'táo', romanization: 'tah-o', meaning: 'apple', emoji: '🍎' },
          { word: 'chuối', romanization: 'choo-oy', meaning: 'banana', emoji: '🍌' },
          { word: 'bánh mì', romanization: 'bahn mee', meaning: 'bread', emoji: '🍞' },
          { word: 'phở', romanization: 'fuh', meaning: 'pho', emoji: '🍜' },
          { word: 'bánh xèo', romanization: 'bahn seh-o', meaning: 'crepe', emoji: '🥞' },
        ],
      },
      {
        id: 'vi-family', name: 'Family', emoji: '👨‍👩‍👧‍👦',
        words: [
          { word: 'mẹ', romanization: 'meh', meaning: 'mom', emoji: '👩' },
          { word: 'bố', romanization: 'boh', meaning: 'dad', emoji: '👨' },
          { word: 'chị', romanization: 'chee', meaning: 'older sister', emoji: '👧' },
          { word: 'anh', romanization: 'ahn', meaning: 'older brother', emoji: '👦' },
          { word: 'em', romanization: 'em', meaning: 'younger sibling', emoji: '👶' },
          { word: 'bà', romanization: 'bah', meaning: 'grandma', emoji: '👵' },
          { word: 'ông', romanization: 'ohm', meaning: 'grandpa', emoji: '👴' },
          { word: 'bạn', romanization: 'bahn', meaning: 'friend', emoji: '🤝' },
        ],
      },
      {
        id: 'vi-greetings', name: 'Greetings', emoji: '👋',
        words: [
          { word: 'xin chào', romanization: 'sin chow', meaning: 'hello', emoji: '👋' },
          { word: 'cảm ơn', romanization: 'kahm uhn', meaning: 'thank you', emoji: '🙏' },
          { word: 'vâng', romanization: 'vuhng', meaning: 'yes', emoji: '✅' },
          { word: 'không', romanization: 'kohm', meaning: 'no', emoji: '❌' },
          { word: 'chúc ngủ ngon', romanization: 'chook ngoo ngon', meaning: 'good night', emoji: '🌙' },
          { word: 'xin lỗi', romanization: 'sin loy', meaning: 'sorry', emoji: '😔' },
          { word: 'thích', romanization: 'tick', meaning: 'I like it', emoji: '👍' },
          { word: 'yêu', romanization: 'ee-oo', meaning: 'love', emoji: '❤️' },
        ],
      },
      {
        id: 'vi-body', name: 'Body', emoji: '🧍',
        words: [
          { word: 'đầu', romanization: 'doh', meaning: 'head', emoji: '🗣️' },
          { word: 'mắt', romanization: 'maht', meaning: 'eye', emoji: '👁️' },
          { word: 'mũi', romanization: 'moo-ee', meaning: 'nose', emoji: '👃' },
          { word: 'miệng', romanization: 'mee-eng', meaning: 'mouth', emoji: '👄' },
          { word: 'tai', romanization: 'tai', meaning: 'ear', emoji: '👂' },
          { word: 'tay', romanization: 'tai', meaning: 'hand', emoji: '✋' },
          { word: 'chân', romanization: 'chuhn', meaning: 'foot', emoji: '🦶' },
          { word: 'bụng', romanization: 'boong', meaning: 'belly', emoji: '🫃' },
        ],
      },
    ],
  },

  // ── English ──────────────────────────────────────────
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    topics: [
      {
        id: 'en-numbers', name: 'Numbers', emoji: '🔢',
        words: [
          { word: 'one', romanization: 'wun', meaning: 'một', emoji: '1️⃣' },
          { word: 'two', romanization: 'too', meaning: 'hai', emoji: '2️⃣' },
          { word: 'three', romanization: 'three', meaning: 'ba', emoji: '3️⃣' },
          { word: 'four', romanization: 'for', meaning: 'bốn', emoji: '4️⃣' },
          { word: 'five', romanization: 'fayv', meaning: 'năm', emoji: '5️⃣' },
          { word: 'six', romanization: 'siks', meaning: 'sáu', emoji: '6️⃣' },
          { word: 'seven', romanization: 'seh-ven', meaning: 'bảy', emoji: '7️⃣' },
          { word: 'eight', romanization: 'ayt', meaning: 'tám', emoji: '8️⃣' },
          { word: 'nine', romanization: 'nayn', meaning: 'chín', emoji: '9️⃣' },
          { word: 'ten', romanization: 'ten', meaning: 'mười', emoji: '🔟' },
        ],
      },
      {
        id: 'en-animals', name: 'Animals', emoji: '🐾',
        words: [
          { word: 'cat', romanization: 'kat', meaning: 'con mèo', emoji: '🐱' },
          { word: 'dog', romanization: 'dawg', meaning: 'con chó', emoji: '🐶' },
          { word: 'rabbit', romanization: 'ra-bit', meaning: 'con thỏ', emoji: '🐰' },
          { word: 'bird', romanization: 'burd', meaning: 'con chim', emoji: '🐦' },
          { word: 'fish', romanization: 'fish', meaning: 'con cá', emoji: '🐟' },
          { word: 'bear', romanization: 'behr', meaning: 'con gấu', emoji: '🐻' },
          { word: 'tiger', romanization: 'tye-ger', meaning: 'con hổ', emoji: '🐯' },
          { word: 'elephant', romanization: 'eh-leh-fant', meaning: 'con voi', emoji: '🐘' },
        ],
      },
      {
        id: 'en-colors', name: 'Colors', emoji: '🌈',
        words: [
          { word: 'red', romanization: 'red', meaning: 'màu đỏ', emoji: '🔴' },
          { word: 'blue', romanization: 'bloo', meaning: 'màu xanh dương', emoji: '🔵' },
          { word: 'yellow', romanization: 'yeh-loh', meaning: 'màu vàng', emoji: '🟡' },
          { word: 'green', romanization: 'green', meaning: 'màu xanh lá', emoji: '🟢' },
          { word: 'white', romanization: 'wyte', meaning: 'màu trắng', emoji: '⚪' },
          { word: 'black', romanization: 'blak', meaning: 'màu đen', emoji: '⚫' },
          { word: 'orange', romanization: 'or-inj', meaning: 'màu cam', emoji: '🟠' },
          { word: 'purple', romanization: 'pur-pul', meaning: 'màu tím', emoji: '🟣' },
        ],
      },
      {
        id: 'en-food', name: 'Food', emoji: '🍱',
        words: [
          { word: 'rice', romanization: 'rys', meaning: 'cơm', emoji: '🍚' },
          { word: 'water', romanization: 'wah-ter', meaning: 'nước', emoji: '💧' },
          { word: 'milk', romanization: 'milk', meaning: 'sữa', emoji: '🥛' },
          { word: 'apple', romanization: 'a-pul', meaning: 'táo', emoji: '🍎' },
          { word: 'banana', romanization: 'bah-na-na', meaning: 'chuối', emoji: '🍌' },
          { word: 'bread', romanization: 'bred', meaning: 'bánh mì', emoji: '🍞' },
          { word: 'egg', romanization: 'eg', meaning: 'trứng', emoji: '🥚' },
          { word: 'chicken', romanization: 'chi-ken', meaning: 'gà', emoji: '🍗' },
        ],
      },
      {
        id: 'en-family', name: 'Family', emoji: '👨‍👩‍👧‍👦',
        words: [
          { word: 'mom', romanization: 'mahm', meaning: 'mẹ', emoji: '👩' },
          { word: 'dad', romanization: 'dad', meaning: 'bố', emoji: '👨' },
          { word: 'sister', romanization: 'sis-ter', meaning: 'chị/em gái', emoji: '👧' },
          { word: 'brother', romanization: 'bruh-ther', meaning: 'anh/em trai', emoji: '👦' },
          { word: 'baby', romanization: 'bay-bee', meaning: 'em bé', emoji: '👶' },
          { word: 'grandma', romanization: 'grand-mah', meaning: 'bà', emoji: '👵' },
          { word: 'grandpa', romanization: 'grand-pah', meaning: 'ông', emoji: '👴' },
          { word: 'friend', romanization: 'frend', meaning: 'bạn', emoji: '🤝' },
        ],
      },
      {
        id: 'en-greetings', name: 'Greetings', emoji: '👋',
        words: [
          { word: 'hello', romanization: 'heh-loh', meaning: 'xin chào', emoji: '👋' },
          { word: 'thank you', romanization: 'thank yoo', meaning: 'cảm ơn', emoji: '🙏' },
          { word: 'yes', romanization: 'yes', meaning: 'vâng', emoji: '✅' },
          { word: 'no', romanization: 'noh', meaning: 'không', emoji: '❌' },
          { word: 'good night', romanization: 'good nyte', meaning: 'chúc ngủ ngon', emoji: '🌙' },
          { word: 'sorry', romanization: 'sah-ree', meaning: 'xin lỗi', emoji: '😔' },
          { word: 'I like it', romanization: 'eye lyk it', meaning: 'thích', emoji: '👍' },
          { word: 'I love you', romanization: 'eye luv yoo', meaning: 'yêu', emoji: '❤️' },
        ],
      },
      {
        id: 'en-body', name: 'Body', emoji: '🧍',
        words: [
          { word: 'head', romanization: 'hed', meaning: 'đầu', emoji: '🗣️' },
          { word: 'eye', romanization: 'eye', meaning: 'mắt', emoji: '👁️' },
          { word: 'nose', romanization: 'nohz', meaning: 'mũi', emoji: '👃' },
          { word: 'mouth', romanization: 'mowth', meaning: 'miệng', emoji: '👄' },
          { word: 'ear', romanization: 'eer', meaning: 'tai', emoji: '👂' },
          { word: 'hand', romanization: 'hand', meaning: 'tay', emoji: '✋' },
          { word: 'foot', romanization: 'foot', meaning: 'chân', emoji: '🦶' },
          { word: 'belly', romanization: 'beh-lee', meaning: 'bụng', emoji: '🫃' },
        ],
      },
    ],
  },
]

/** Helper to get a language by code */
export function getLanguage(code: LanguageCode): LanguageInfo | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

/** Helper to get a topic by ID across all languages */
export function getTopic(topicId: string): { language: LanguageInfo; topic: Topic } | undefined {
  for (const lang of LANGUAGES) {
    const topic = lang.topics.find((t) => t.id === topicId)
    if (topic) return { language: lang, topic }
  }
  return undefined
}
