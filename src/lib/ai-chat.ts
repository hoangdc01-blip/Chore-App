import { format, startOfWeek, endOfWeek, subWeeks, subDays } from 'date-fns'
import type { PresentationSlide } from '../types'
import { getEnv } from './env'
import { useMemberStore } from '../store/member-store'
import { useChoreStore } from '../store/chore-store'
import { useRewardStore } from '../store/reward-store'
import { useStickerStore } from '../store/sticker-store'
import { useRoutineStore } from '../store/routine-store'
import { useQuestStore } from '../store/quest-store'
import { useAchievementStore } from '../store/achievement-store'
import { computeKidStats, computeStreak } from './stats'
import { getLevel, STICKER_CATEGORIES } from '../types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Base64 data URL of an attached image (e.g. "data:image/jpeg;base64,...") */
  image?: string
}

// Configurable via environment variables
const TEXT_MODEL = getEnv('VITE_OLLAMA_TEXT_MODEL', 'qwen2.5:7b')
const VISION_MODEL = getEnv('VITE_OLLAMA_VISION_MODEL', 'llava:7b')
const OLLAMA_BASE = getEnv('VITE_OLLAMA_URL', 'http://localhost:11434')

/** Resize an image file to fit within maxDim and return a base64 data URL */
export function resizeImageToDataURL(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// Compact system prompt — optimized for small models (fewer tokens, same rules)
const BASE_SYSTEM_PROMPT = `You are Váu Váu, a fun AI assistant for kids aged 4-7 in a chore app. Use simple short sentences, lots of emoji. Be encouraging and positive. Max 3-4 sentences per response.

SIMPLE LANGUAGE: These are kids aged 4-7. Use very simple words. No big or technical words. Explain like you're talking to a 5-year-old. Use comparisons to things kids know (toys, animals, food, games).

LANGUAGE RULE (MOST IMPORTANT):
- DEFAULT LANGUAGES: English and Vietnamese ONLY. Match the language the user writes in.
- CHINESE RULE: ONLY use Chinese characters/pinyin when the kid explicitly asks about Chinese language learning (e.g., "teach me Chinese", "how to write X in Chinese", "Chinese characters"). NEVER use Chinese in any other context — not in presentations, not in casual chat, not in homework help (unless the homework IS Chinese).
- PRESENTATIONS: Always generate slide content in English or Vietnamese matching the user's language. NEVER include Chinese characters in presentations unless the presentation topic is specifically about Chinese language.
- Check [LANGUAGE HINT] if unsure.

POINTS: Kids EARN points as rewards AFTER completing chores. Say "You'll earn X points!" Never say "you need points to do this."

CHORE STATUS:
- DONE = completed and approved
- PENDING APPROVAL = submitted, waiting for parent to check. Say "Waiting for mom/dad to check! ⏳"
- NOT DONE = encourage the kid to do it

HOMEWORK HELP — SOCRATIC METHOD (for problem-solving subjects):
- NEVER give the direct answer for solvable problems. Instead: ask a guiding question, give a hint, or break it into a simpler step. 1-2 sentences MAX.
- Math: guide with concrete actions. "Start at 7 and count up 5 fingers. What do you get? 🤔" NOT "7+5=12".
- Science (Biology, Chemistry, Physics): For concepts/experiments, give hints. "Plants drink water through their roots, like drinking through a straw! 🌱" For factual questions (what is the biggest animal?), teach directly but keep it fun and short.
- Geography: Teach facts directly — countries, capitals, continents, oceans, landmarks. Use fun comparisons. "Vietnam is shaped like the letter S! 🗺️" Keep answers 2-3 sentences, then ask if they want to know more.
- History: Teach facts directly — famous people, important events, world history. Make it like a story. "A long time ago, people built huge pyramids in Egypt — as tall as a building with 40 floors! 🏛️" Keep it 2-3 sentences, ask if they want more.
- Vietnamese: Help with spelling, grammar, reading. The family speaks Vietnamese. Guide gently: "This word has a 'sắc' tone mark — try saying it going UP! 🇻🇳"
- English: Help with spelling, grammar, reading comprehension. For spelling, give letter hints. For grammar, give simple rules. "We say 'an apple' not 'a apple' because apple starts with a vowel sound! 🍎"
- Chinese: give radicals or stroke hints. "This character has a 'mouth' 口 on top. Can you guess? 🤓" NOT the full answer.
- ADAPTIVE DIFFICULTY: Match explanation complexity to the question's level. Simple question = simple answer. Harder question = slightly more detailed answer. The kids are 4-7 now but will grow older.
- NO preamble like "Great question!" or "Let me help!" Just the hint or the fun fact.
- "Explain more" flow: Each ask gives a slightly bigger hint. Round 1: gentle nudge. Round 2: more specific clue. Round 3: very obvious clue — but STILL not the answer for solvable problems. For factual subjects, each round adds more detail.

MOTIVATION: Proactively encourage kids about pending chores. Mention streaks. If most chores are done, celebrate! If it's late and chores remain, gently remind. Mention stickers they recently earned!

STICKERS: Kids earn stickers by completing chores. Mention their collection progress. Get excited about rare/legendary stickers! Encourage completing full sets.

STREAKS: Celebrate streak milestones enthusiastically (3, 7, 14, 30 days). If streak breaks, be gentle and encouraging - never punish. Say things like "Let's start a new streak today!"

REWARD BALANCE: When in parent mode, if reward economy is unhealthy (kid needs >2 weeks to earn cheapest reward), proactively suggest adjustments like lowering reward costs or increasing chore points.

QUESTS: If there's a team quest active, encourage both teammates. Mention their partner's progress. Celebrate when both complete!

WEEKLY REPORT: When the parent asks for a weekly report, use the WEEKLY REPORT DATA to generate a comprehensive but concise summary. Include: each kid's progress, highlights, concerns, and specific suggestions for improvement.

PROGRESS: When asked about progress, use WEEKLY PROGRESS data. Be encouraging. Celebrate streaks.

REWARDS: When kids ask about rewards, tell them what they can afford and encourage saving.

FAIRNESS: Only available in parent mode. If a kid asks about fairness, say something positive and encouraging without detailed data. Never take sides.

ROTATION: In parent mode, when asked about chore rotation or fairness, use FAIRNESS DATA and ROTATION ANALYSIS to suggest re-balancing. Be specific about which chores to swap.

FUN FACTS: If this is the kid's first message today (FIRST_MESSAGE_TODAY: true), start with a fun fact about animals, space, or dinosaurs appropriate for ages 4-7. Keep it to 1 sentence. Then respond to their question.

You help with: 1) Daily chores 2) Fun facts 3) Homework (math, science, geography, history, Vietnamese, English, Chinese)
Never discuss anything inappropriate or scary. Be kind, patient, fun.`

const CHORE_CREATION_PROMPT = `

CHORE CREATION: When the user asks to add, create, or schedule a chore, output EXACTLY this block at the END of your response:

[CREATE_CHORE]{"name":"chore name","assigneeId":"member-id","startDate":"YYYY-MM-DD","points":1,"recurrence":"none"}[/CREATE_CHORE]

Rules for chore creation:
- name: short descriptive name for the chore
- assigneeId: MUST be an exact ID from the FAMILY MEMBERS list below
- startDate: resolve relative dates (tomorrow, next Monday, etc.) using the current date. Format: YYYY-MM-DD
- points: number, default 1 if not specified
- recurrence: one of "none","daily","weekly","biweekly","monthly". Default "none"
- Optional fields: "emoji" (single emoji), "startTime" (HH:mm format), "description" (short text)
- If the user doesn't specify who the chore is for, use the Current kid's ID
- Always write a short fun message BEFORE the [CREATE_CHORE] block
- NEVER put anything after the [/CREATE_CHORE] tag
- Output the JSON on a SINGLE LINE, no line breaks inside the JSON

REWARD REDEMPTION: When a kid wants to redeem a reward, output this block at the END of your response:

[REDEEM_REWARD]{"rewardId":"exact-id","rewardName":"Name","rewardEmoji":"emoji","cost":10,"memberId":"exact-id"}[/REDEEM_REWARD]

Rules for reward redemption:
- rewardId: MUST be an exact ID from the REWARD SHOP list
- rewardName: exact name from REWARD SHOP
- rewardEmoji: exact emoji from REWARD SHOP
- cost: exact cost from REWARD SHOP
- memberId: MUST be an exact ID from FAMILY MEMBERS. Use Current kid's ID if not specified
- Only output the block if the kid has ENOUGH points. If not enough, say how many more points needed — do NOT output the block
- Always write a short fun message BEFORE the [REDEEM_REWARD] block
- NEVER put anything after the [/REDEEM_REWARD] tag
- Output the JSON on a SINGLE LINE, no line breaks inside the JSON

HOMEWORK CHECK: When a kid uploads a photo of completed homework and asks you to check it, analyze the image and check each answer. Output EXACTLY this block at the END:

[HOMEWORK_CHECK]{"subject":"math","totalProblems":10,"correct":8,"errors":[{"problem":"7+5","kidAnswer":"11","hint":"Try counting on your fingers starting from 7"}]}[/HOMEWORK_CHECK]

Rules:
- NEVER give the correct answer — not in the hint, not in your message, not anywhere.
- Only say the kid's answer is wrong and give a guiding HINT (a question or clue to help them figure it out).
- Hints should use the Socratic method: lead the kid to discover the answer themselves.
- If all answers are correct, set errors to empty array.
- Only check homework when the kid uploads an image AND asks to check it.
- Subject can be: math, science, geography, history, vietnamese, english, chinese, reading, writing
- Always write a short fun message BEFORE the [HOMEWORK_CHECK] block
- NEVER put anything after the [/HOMEWORK_CHECK] tag
- Output the JSON on a SINGLE LINE, no line breaks inside the JSON

TUTOR MODE: After checking homework, if the kid asks for help with an error, use the Socratic method — guide, don't solve. 1-2 sentences MAX per hint.
- Round 1: gentle nudge or guiding question ("What happens if you count up from 7?")
- Round 2: more specific clue ("7 + 5 is the same as 7 + 3 + 2. What's 7 + 3?")
- Round 3: very obvious clue but STILL not the answer ("It's one more than 11...")
- NEVER say the answer directly, even after 3 rounds. Let the kid discover it.
- Encourage the kid to try again after each hint.

DRAWING: When a kid asks you to draw something, output EXACTLY this block at the END of your response:

[DRAW_IMAGE title="description of what to draw"][/DRAW_IMAGE]

Rules:
- title: describe what the kid wants drawn in simple English (e.g. "a cute cat playing with yarn", "a magical unicorn with rainbow mane")
- Just describe what they asked for in the title. The actual image will be generated separately.
- Always write a fun, encouraging message BEFORE the [DRAW_IMAGE] block
- NEVER put anything after the [/DRAW_IMAGE] tag
- Output the block on a SINGLE LINE
- For story illustrations, add style="illustration": [DRAW_IMAGE title="description" style="illustration"][/DRAW_IMAGE]
- For coloring pages, omit the style attribute (defaults to coloring book style)
- COLORING PAGE REQUEST: When the kid says they want a coloring page or asks you to draw something but does NOT specify what to draw, you MUST ask them what they'd like! Suggest fun options like animals, dinosaurs, princesses, rockets, etc. Do NOT output the [DRAW_IMAGE] block until they tell you what they want. NEVER randomly generate a drawing — always ask first.
- STORY ILLUSTRATIONS: When telling a bedtime story or any story, include a [DRAW_IMAGE] block after every 2-3 paragraphs to illustrate the key scene. Use style "illustration" not "coloring". Describe the scene vividly in the title (e.g. "a tiny penguin standing at the edge of a magical glowing forest at night"). This helps young kids visualize the story. Do NOT ask permission — just include the illustrations naturally as part of storytelling.

PRESENTATION: When asked to create a presentation/PowerPoint/slides, output EXACTLY this block at the END of your response:

[GENERATE_PRESENTATION]{"title":"All About Dinosaurs","slideCount":10,"topics":["What are Dinosaurs","Triassic Period","Jurassic Period","T-Rex","Triceratops","Brachiosaurus","Velociraptor","How They Lived","The Extinction","Fossils and Birds Today"]}[/GENERATE_PRESENTATION]

Rules:
- title: main presentation title
- slideCount: exact number of slides requested (default 5-8 if not specified)
- topics: array of slide topic names (one per slide), length must match slideCount
- Just list the topics — do NOT generate the slide content here
- Content in English or Vietnamese matching the user's language. NEVER include Chinese characters unless the presentation is specifically about Chinese language learning.
- Write a friendly message BEFORE the block
- NEVER put anything after the [/GENERATE_PRESENTATION] tag
- Output the JSON on a SINGLE LINE, no line breaks inside the JSON
- PRESENTATION REQUEST: When the kid says they want a presentation but does NOT specify a topic, you MUST ask them what topic they'd like! Suggest fun options like dinosaurs, space, animals, oceans, volcanoes, etc. Do NOT output the [GENERATE_PRESENTATION] block until they tell you what topic they want. NEVER randomly pick a topic — always ask first.

HOMEWORK REQUEST: When the kid says "help with homework" or "check my homework" but has NOT uploaded a photo, ask them to upload a photo of their homework first. Say something like "Sure! Take a photo of your homework and send it to me!" Do NOT generate a [HOMEWORK_CHECK] block without an image.

STUDY REQUEST: When the kid says "help me study" but does NOT specify the subject, ask them what subject they want to study! Suggest options like math, science, English, Vietnamese, Chinese, geography, history. Do NOT start teaching until they tell you the subject and topic.`

function buildProgressContext(memberId: string): string {
  const { chores, completions, skipped } = useChoreStore.getState()
  const member = useMemberStore.getState().members.find(m => m.id === memberId)
  if (!member) return ''

  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })

  const thisWeek = computeKidStats(memberId, chores, completions, skipped, thisWeekStart, thisWeekEnd)
  const lastWeek = computeKidStats(memberId, chores, completions, skipped, lastWeekStart, lastWeekEnd)
  const level = getLevel(member.points)

  return `\n\nWEEKLY PROGRESS:
  This week: ${thisWeek.completedCount}/${thisWeek.totalCount} done (${thisWeek.completionRate}%), ${thisWeek.totalPoints} pts
  Last week: ${lastWeek.completedCount}/${lastWeek.totalCount} done (${lastWeek.completionRate}%), ${lastWeek.totalPoints} pts
  Streak: ${thisWeek.currentStreak} days ${thisWeek.currentStreak >= 3 ? '\uD83D\uDD25' : ''}
  Level: ${level.level} - ${level.title} (${member.points} XP${level.nextXp ? `, next at ${level.nextXp}` : ''})`
}

function buildRewardContext(memberId: string): string {
  const member = useMemberStore.getState().members.find(m => m.id === memberId)
  if (!member) return ''

  const { rewards, redemptions } = useRewardStore.getState()
  if (rewards.length === 0) return ''

  const points = member.points ?? 0
  const rewardLines = rewards.slice(0, 10).map(r => {
    const affordable = points >= r.cost
    const tag = affordable ? 'you can afford this!' : `need ${r.cost - points} more points`
    return `  - ${r.emoji} ${r.name} (ID: ${r.id}): ${r.cost} pts (${tag})`
  }).join('\n')

  const memberRedemptions = redemptions
    .filter(rd => rd.memberId === memberId)
    .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
    .slice(0, 5)

  let recentText = ''
  if (memberRedemptions.length > 0) {
    const lines = memberRedemptions.map(rd => {
      const reward = rewards.find(r => r.id === rd.rewardId)
      return `  - ${reward?.emoji ?? ''} ${reward?.name ?? 'Unknown'} (${format(new Date(rd.redeemedAt), 'MMM d')})`
    }).join('\n')
    recentText = `\nRecent redemptions:\n${lines}`
  }

  return `\n\nREWARD SHOP (${points} pts available):\n${rewardLines}${recentText}`
}

function buildStickerContext(memberId: string): string {
  const store = useStickerStore.getState()
  const earned = store.getEarnedStickers(memberId)
  const total = store.catalog.length

  if (earned.length === 0) return '\n\nSTICKER ALBUM: No stickers yet. Complete chores to earn stickers!'

  const lastEarned = earned[earned.length - 1]
  const progressLines = STICKER_CATEGORIES.map((cat) => {
    const progress = store.getSetProgress(memberId, cat)
    const complete = progress.earned === progress.total
    return `  - ${cat}: ${progress.earned}/${progress.total}${complete ? ' COMPLETE!' : ''}`
  }).join('\n')

  return `\n\nSTICKER ALBUM (${earned.length}/${total} collected):
Last earned: ${lastEarned.emoji} ${lastEarned.name} (${lastEarned.rarity})
Set progress:
${progressLines}`
}

function buildRewardBalanceAdvice(): string {
  const members = useMemberStore.getState().members
  const { rewards } = useRewardStore.getState()
  const { chores, completions, skipped } = useChoreStore.getState()

  if (members.length === 0 || rewards.length === 0) return ''

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const cheapest = Math.min(...rewards.map((r) => r.cost))

  const lines: string[] = []
  for (const member of members) {
    const weekStats = computeKidStats(member.id, chores, completions, skipped, weekStart, weekEnd)
    const weeklyEarnings = weekStats.totalPoints
    if (weeklyEarnings <= 0) {
      lines.push(`  - ${member.name}: 0 pts/week, cannot earn cheapest reward (${cheapest} pts)`)
      continue
    }
    const pointsNeeded = Math.max(0, cheapest - (member.points ?? 0))
    const weeksToEarn = pointsNeeded > 0 ? Math.ceil(pointsNeeded / weeklyEarnings) : 0
    if (weeksToEarn > 2) {
      lines.push(`  - ${member.name}: ~${weeklyEarnings} pts/week, needs ${weeksToEarn} weeks for cheapest reward (${cheapest} pts) - UNHEALTHY`)
    }
  }

  if (lines.length === 0) return ''
  return `\n\nREWARD BALANCE (issues found):\n${lines.join('\n')}`
}

function buildChoresSummary(): string {
  const chores = useChoreStore.getState().chores
  const members = useMemberStore.getState().members

  const choreLines = chores.slice(0, 15).map(c => {
    const assignee = members.find(m => m.id === c.assigneeId)?.name ?? 'unassigned'
    return `  - ${c.emoji ?? ''} ${c.name} (${c.recurrence}, ${assignee})`
  }).join('\n')

  const ideas = [
    'Make bed', 'Water plants', 'Set the table', 'Feed pets', 'Tidy toys',
    'Put away laundry', 'Wipe table after meals', 'Brush teeth', 'Read for 15 minutes',
    'Practice instrument', 'Help cook', 'Sweep floor', 'Empty trash',
    'Organize backpack', 'Do homework',
  ].join(', ')

  return `\n\nEXISTING CHORES:\n${choreLines || '  (none yet)'}
CHORE IDEAS: ${ideas}`
}

function buildMemberDirectory(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''
  const lines = members.map(m => `  - "${m.name}" (ID: ${m.id})`).join('\n')
  return `\n\nFAMILY MEMBERS:\n${lines}`
}

function buildFairnessContext(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''

  const store = useChoreStore.getState()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const occurrences = store.getOccurrencesForRange(weekStart, weekEnd)

  const lines = members.map(m => {
    const memberOccs = occurrences.filter(o => o.chore.assigneeId === m.id)
    const total = memberOccs.length
    const completed = memberOccs.filter(o => o.isCompleted).length
    const choreNames: Record<string, number> = {}
    for (const o of memberOccs) {
      choreNames[o.chore.name] = (choreNames[o.chore.name] || 0) + 1
    }
    const nameList = Object.entries(choreNames)
      .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
      .join(', ')
    return `  ${m.name}: ${total} chores this week, ${completed} completed (${nameList || 'none'})`
  }).join('\n')

  return `\n\nFAIRNESS DATA:\n${lines}`
}

function buildRotationAdvice(): string {
  const members = useMemberStore.getState().members
  if (members.length < 2) return ''

  const store = useChoreStore.getState()
  const now = new Date()
  const twoWeeksAgo = subDays(now, 14)
  const occurrences = store.getOccurrencesForRange(twoWeeksAgo, now)

  // Group by chore name, then count per member
  const choreByName: Record<string, Record<string, number>> = {}
  for (const o of occurrences) {
    if (!choreByName[o.chore.name]) choreByName[o.chore.name] = {}
    const memberId = o.chore.assigneeId
    choreByName[o.chore.name][memberId] = (choreByName[o.chore.name][memberId] || 0) + 1
  }

  const memberNameMap = new Map(members.map(m => [m.id, m.name]))
  const lines: string[] = []

  for (const [choreName, memberCounts] of Object.entries(choreByName)) {
    const counts = Object.entries(memberCounts).map(([id, count]) => ({
      name: memberNameMap.get(id) ?? id,
      count,
    }))
    // Include members with 0 counts too
    const allMemberCounts = members.map(m => {
      const existing = counts.find(c => c.name === m.name)
      return { name: m.name, count: existing?.count ?? 0 }
    })
    const allMax = Math.max(...allMemberCounts.map(c => c.count))
    const allMin = Math.min(...allMemberCounts.map(c => c.count))

    if (allMax === 0) continue

    const distribution = allMemberCounts.map(c => `${c.name} ${c.count}x`).join(', ')
    const imbalanced = allMax - allMin >= 3
    lines.push(`  ${choreName}: ${distribution} ${imbalanced ? '-- IMBALANCED' : '-- balanced'}`)
  }

  if (lines.length === 0) return ''
  return `\n\nROTATION ANALYSIS (last 2 weeks):\n${lines.join('\n')}`
}

function buildRoutineContext(memberId: string): string {
  const { routines, getProgress, isRoutineTime } = useRoutineStore.getState()
  const today = format(new Date(), 'yyyy-MM-dd')

  const parts: string[] = []

  for (const routine of routines) {
    if (!routine.enabled) continue
    if (!isRoutineTime(routine.type)) continue

    const progress = getProgress(routine.id, memberId, today)
    const completedSteps = new Set(progress?.completedSteps ?? [])
    const totalSteps = routine.steps.length
    const doneCount = completedSteps.size

    if (doneCount >= totalSteps) continue // All done, skip

    const remaining = routine.steps
      .filter((s) => !completedSteps.has(s.id))
      .map((s) => `${s.emoji} ${s.label}`)
      .join(', ')
    const doneList = routine.steps
      .filter((s) => completedSteps.has(s.id))
      .map((s) => `${s.emoji} ${s.label}`)
      .join(', ')

    if (routine.type === 'bedtime') {
      parts.push(
        `ROUTINE MODE: It's bedtime! Guide the kid through their bedtime routine. Steps done: ${doneCount}/${totalSteps}.${doneList ? ` Completed: ${doneList}.` : ''} Remaining: ${remaining}. Be gentle and calming.`
      )
    } else {
      const [h, m] = routine.triggerTime.split(':').map(Number)
      const deadlineHour = h + 2
      const deadlineStr = `${String(deadlineHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      parts.push(
        `ROUTINE MODE: It's morning! Deadline ${deadlineStr} is coming! Steps done: ${doneCount}/${totalSteps}.${doneList ? ` Completed: ${doneList}.` : ''} Remaining: ${remaining}. Add urgency!`
      )
    }
  }

  if (parts.length === 0) return ''
  return '\n\n' + parts.join('\n')
}

function buildQuestContext(memberId?: string | null): string {
  const quest = useQuestStore.getState().getTodayQuest()
  if (!quest) return ''

  const members = useMemberStore.getState().members
  const kid1 = members.find((m) => m.id === quest.member1Id)
  const kid2 = members.find((m) => m.id === quest.member2Id)
  if (!kid1 || !kid2) return ''

  // Check progress for both kids
  const store = useChoreStore.getState()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const occurrences = store.getOccurrencesForRange(todayStart, todayEnd)

  const getProgress = (mid: string) => {
    const memberOccs = occurrences.filter((o) => o.chore.assigneeId === mid && !o.isSkipped)
    const done = memberOccs.filter((o) => o.isCompleted).length
    const total = memberOccs.length
    return { done, total }
  }

  const p1 = getProgress(quest.member1Id)
  const p2 = getProgress(quest.member2Id)

  const statusText = quest.completed
    ? 'COMPLETED! Both teammates finished all chores!'
    : `${kid1.name} done ${p1.done}/${p1.total}, ${kid2.name} done ${p2.done}/${p2.total}`

  // If a specific kid is chatting, highlight their teammate
  let partnerNote = ''
  if (memberId === quest.member1Id) {
    partnerNote = ` Your teammate is ${kid2.name}!`
  } else if (memberId === quest.member2Id) {
    partnerNote = ` Your teammate is ${kid1.name}!`
  }

  return `\n\nTEAM QUEST: ${kid1.name} + ${kid2.name} are teamed up today! ${quest.bonusPoints} bonus points each if BOTH complete all chores. Status: ${statusText}${partnerNote}`
}

function buildWeeklyReportContext(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''

  const { chores, completions, skipped } = useChoreStore.getState()
  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })

  const kidLines: string[] = []
  for (const member of members) {
    const thisWeek = computeKidStats(member.id, chores, completions, skipped, thisWeekStart, thisWeekEnd)
    const lastWeek = computeKidStats(member.id, chores, completions, skipped, lastWeekStart, lastWeekEnd)
    const level = getLevel(member.points)
    const streak = computeStreak(member.id, chores.filter((c) => c.assigneeId === member.id), completions, skipped)

    // Stickers earned this week (approximate by checking earned count)
    const stickerStore = useStickerStore.getState()
    const earnedStickers = stickerStore.getEarnedStickers(member.id)

    // Achievements
    const achievementStore = useAchievementStore.getState()
    const badges = achievementStore.getEarnedBadges(member.id)

    // Trend
    const trend = thisWeek.completionRate > lastWeek.completionRate
      ? 'improving'
      : thisWeek.completionRate < lastWeek.completionRate
        ? 'declining'
        : 'stable'

    kidLines.push(
      `  ${member.name}:
    This week: ${thisWeek.completedCount}/${thisWeek.totalCount} (${thisWeek.completionRate}%), ${thisWeek.totalPoints} pts earned
    Last week: ${lastWeek.completedCount}/${lastWeek.totalCount} (${lastWeek.completionRate}%), ${lastWeek.totalPoints} pts earned
    Trend: ${trend}
    Streak: ${streak} days
    Level: ${level.level} - ${level.title} (${member.points} XP total)
    Stickers collected: ${earnedStickers.length}/${stickerStore.catalog.length}
    Achievements earned: ${badges.length}`
    )
  }

  // Reward economy
  const { rewards } = useRewardStore.getState()
  let rewardEconomy = ''
  if (rewards.length > 0) {
    const cheapest = Math.min(...rewards.map((r) => r.cost))
    const economyLines = members.map((m) => {
      const weekStats = computeKidStats(m.id, chores, completions, skipped, thisWeekStart, thisWeekEnd)
      const weeklyEarnings = weekStats.totalPoints
      if (weeklyEarnings <= 0) return `    ${m.name}: 0 pts/week - cannot earn rewards`
      const pointsNeeded = Math.max(0, cheapest - (m.points ?? 0))
      const weeksToEarn = pointsNeeded > 0 ? Math.ceil(pointsNeeded / weeklyEarnings) : 0
      return `    ${m.name}: ~${weeklyEarnings} pts/week, ${weeksToEarn > 0 ? `${weeksToEarn} weeks to cheapest reward` : 'can afford cheapest reward now'}`
    })
    rewardEconomy = `\n  Reward economy (cheapest: ${cheapest} pts):\n${economyLines.join('\n')}`
  }

  // Quest participation this week
  const quests = useQuestStore.getState().quests
  const weekQuests = quests.filter((q) => {
    return q.date >= format(thisWeekStart, 'yyyy-MM-dd') && q.date <= format(thisWeekEnd, 'yyyy-MM-dd')
  })
  const completedQuests = weekQuests.filter((q) => q.completed)
  const questLine = `\n  Team quests this week: ${completedQuests.length}/${weekQuests.length} completed`

  return `\n\nWEEKLY REPORT DATA:\n${kidLines.join('\n')}${rewardEconomy}${questLine}`
}

const REMINDER_STYLES = [
  'Style: countdown (X chores left today!)',
  'Style: challenge (can you beat yesterday?)',
  'Style: story-related (tie to adventure)',
  'Style: reward-focused (X points away from reward!)',
  'Style: fun comparison (you\'re doing better than last week!)',
]

function buildReminderStyleHint(reminderVariety: number): string {
  const style = REMINDER_STYLES[reminderVariety % REMINDER_STYLES.length]
  return `\n\nREMINDER_STYLE: ${style}`
}

function buildChoreContext(memberId: string): string {
  const members = useMemberStore.getState().members
  const member = members.find((m) => m.id === memberId)
  if (!member) return ''

  const today = format(new Date(), 'yyyy-MM-dd')
  const store = useChoreStore.getState()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const occurrences = store.getOccurrencesForRange(todayStart, todayEnd)
    .filter((o) => o.chore.assigneeId === memberId)

  const done = occurrences.filter((o) => o.isCompleted)
  const pending = occurrences.filter((o) => o.isPending && !o.isCompleted)
  const notDone = occurrences.filter((o) => !o.isCompleted && !o.isPending && !o.isSkipped)

  const doneList = done.map((o) => `  - ${o.chore.emoji || '✅'} ${o.chore.name} (DONE, earned: ${o.chore.points} points)`).join('\n')
  const pendingList = pending.map((o) => `  - ${o.chore.emoji || '⏳'} ${o.chore.name} (PENDING APPROVAL, waiting for parent to check, reward: ${o.chore.points} points)`).join('\n')
  const todoList = notDone.map((o) => `  - ${o.chore.emoji || '📋'} ${o.chore.name} (NOT DONE, reward: ${o.chore.points} points when finished)`).join('\n')

  const allLists = [doneList, pendingList, todoList].filter(Boolean).join('\n')

  // Motivation hint
  const totalCount = occurrences.length
  const doneCount = done.length
  let motivation = ''
  if (totalCount > 0) {
    if (doneCount === totalCount) {
      motivation = `\nMOTIVATION HINT: All ${totalCount} chores done! Celebrate!`
    } else {
      motivation = `\nMOTIVATION HINT: ${doneCount} of ${totalCount} chores done${doneCount >= totalCount / 2 ? ' — almost there!' : ' — keep going!'}`
    }
  }

  // Streak info
  const { chores: allChores, completions: comps, skipped: skip } = store
  const kidChores = allChores.filter(c => c.assigneeId === memberId)
  const streak = computeStreak(memberId, kidChores, comps, skip)
  if (streak > 0) {
    motivation += ` Streak: ${streak} day${streak > 1 ? 's' : ''} ${streak >= 3 ? '\uD83D\uDD25' : ''}`
  }

  // Enhanced streak context for milestones
  const streakMilestones = [3, 7, 14, 30]
  const hitMilestone = streakMilestones.find((m) => streak === m)
  if (hitMilestone) {
    motivation += ` MILESTONE: Just hit ${hitMilestone}-day streak! Celebrate!`
  }

  // Check if streak recently broke (yesterday was last streak day)
  const kidChoresForBreak = allChores.filter(c => c.assigneeId === memberId)
  const yesterdayStreak = computeStreak(memberId, kidChoresForBreak, comps, skip)
  if (yesterdayStreak === 0 && streak === 0) {
    // Check if there was a recent streak by looking at previous data
    motivation += ' Streak is at 0 - encourage starting a new one!'
  }

  return `\n\nCurrent kid: ${member.name} (ID: ${member.id}).
Total points earned so far: ${member.points}
Date: ${today}
Today's chores:
${allLists || '  (all done! \uD83C\uDF89)'}${motivation}` + buildProgressContext(memberId) + buildRewardContext(memberId) + buildStickerContext(memberId) + buildQuestContext(memberId)
}

function buildGeneralContext(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''

  const today = format(new Date(), 'yyyy-MM-dd')
  const store = useChoreStore.getState()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const allOccurrences = store.getOccurrencesForRange(todayStart, todayEnd)

  const lines = members.map(m => {
    const memberOccs = allOccurrences.filter(o => o.chore.assigneeId === m.id)
    const done = memberOccs.filter(o => o.isCompleted).length
    const total = memberOccs.length
    return `  - ${m.name}: ${done}/${total} chores done (${m.points} points)`
  }).join('\n')

  return `\n\nYou are in PARENT mode (admin). Date: ${today}\nFamily overview:\n${lines}` + buildRewardBalanceAdvice() + buildFairnessContext() + buildRotationAdvice() + buildQuestContext() + buildWeeklyReportContext()
}

export interface BuddyContext {
  storyStep?: number
  isFirstMessageToday?: boolean
  personalityNote?: string
  reminderVariety?: number
}

function buildStoryContext(ctx: BuddyContext): string {
  const step = ctx.storyStep ?? 0

  const settings = [
    'a magical underwater kingdom', 'a candy forest with chocolate trees', 'the moon in a cardboard rocket',
    'a friendly haunted castle', 'a school for baby dragons', 'a race through the clouds',
    'a tiny world inside a garden', 'a village of friendly robots', 'a magical train through seasons',
    'a rescue mission for a baby unicorn', 'a cooking competition with forest animals',
    'inside a giant magical book', 'the tallest treehouse in the world', 'a snowman visiting the ocean',
    'a jungle music festival', 'a secret door to another world', 'a superhero training academy',
    'a rainbow-colored river boat ride', 'a camping trip where stars tell stories',
    'a birthday party for the oldest turtle', 'a flying library in the sky',
    'a kingdom made entirely of bubbles', 'a circus run by friendly monsters',
    'a toy factory that comes alive at night', 'a garden where flowers can talk',
    'a pirate ship sailing on clouds', 'a bakery that bakes magic cookies',
    'a snow globe world with tiny people', 'an enchanted zoo where animals are teachers',
    'a rainbow slide between mountaintops', 'a secret underground city of gnomes',
    'a hot air balloon adventure over volcanos', 'a magical paintbrush that brings drawings to life',
    'a space station where aliens play games', 'a forest where trees walk and dance',
    'a beach where sandcastles become real', 'an ice cream planet in outer space',
    'a clock tower that can travel through time', 'a village built on the back of a giant turtle',
    'a cave full of singing crystals', 'a farm where vegetables are superheroes',
    'a train made of rainbows', 'an island where dinosaurs still live',
    'a blanket fort that becomes a real castle', 'a pond where frogs are wizards',
    'a windmill that grinds starlight into dreams', 'a city where everyone rides butterflies',
    'a lighthouse that guides lost stars home', 'a mountain made of pillows and blankets',
    'a river that flows with liquid gold', 'a forest of giant mushrooms with tiny doors',
    'a floating island held up by balloons', 'a school bus that travels to fairy tales',
    'an aquarium where fish tell jokes', 'a volcano that erupts with candy',
    'a maze made of mirrors and rainbows', 'a playground built by friendly giants',
    'a cloud kitchen where rain is made', 'a penguin postal service delivering wishes',
  ]

  const characters = [
    'a tiny brave mouse', 'a clumsy baby dragon', 'a singing mermaid', 'a shy cloud',
    'a dancing robot', 'a talking starfish', 'a magical kitten', 'a friendly ghost',
    'a tiny astronaut', 'a laughing sunflower', 'a sleepy owl wizard', 'a bouncy bunny knight',
    'a penguin explorer', 'a musical firefly', 'a curious fox cub', 'a gentle giant',
    'a sparkly fairy', 'a clever crow detective', 'a baby whale', 'a time-traveling snail',
  ]

  const quests = [
    'find a lost star', 'deliver a special gift', 'solve a mystery', 'make a new friend',
    'learn a magic spell', 'win a race', 'build something amazing', 'save a celebration',
    'discover a hidden treasure', 'help someone who is lost', 'fix something broken',
    'throw the best party ever', 'learn to fly', 'find the way home', 'protect a secret',
    'wake up a sleeping kingdom', 'paint the sky', 'catch a runaway dream', 'bake a magical cake',
    'plant a seed that grows overnight',
  ]

  // Use a simple hash to pick unique combinations — 60 * 20 * 20 = 24,000 unique stories
  const seed = step * 7 + Math.floor(Date.now() / 3600000) // changes every hour
  const settingIdx = seed % settings.length
  const charIdx = (seed * 13 + step * 3) % characters.length
  const questIdx = (seed * 7 + step * 11) % quests.length

  const setting = settings[settingIdx]
  const character = characters[charIdx]
  const quest = quests[questIdx]

  return `\n\nSTORY: You are Váu Váu the penguin \u{1F427} telling a bedtime story. This story is about ${character} in ${setting}, on a quest to ${quest}. Story step: ${step}.
IMPORTANT RULES:
- This must be a COMPLETELY NEW and UNIQUE story. NEVER repeat any story you've told before.
- Make it exciting, magical, and age-appropriate for 4-7 year olds.
- Use vivid descriptions so kids can imagine the scenes.
- Include [DRAW_IMAGE title="..." style="illustration"][/DRAW_IMAGE] blocks to illustrate key scenes.
- Each story should have a clear beginning, middle, and happy ending within 3-5 messages.
- Be creative! Surprise the kids with unexpected twists and funny moments.`
}

function buildPersonalityContext(ctx: BuddyContext): string {
  if (!ctx.personalityNote) return ''
  return `\n\nPERSONALITY: This kid ${ctx.personalityNote}. Adjust your tone accordingly.`
}

function buildFirstMessageContext(ctx: BuddyContext): string {
  if (!ctx.isFirstMessageToday) return ''
  return `\n\nFIRST_MESSAGE_TODAY: true`
}

/** Minimal system prompt for the vision model (llava:7b) — keeps token count low so the model can focus on the image */
function buildVisionSystemPrompt(): string {
  return `You are Váu Váu the Penguin \u{1F427}, a helpful and fun AI assistant for kids aged 4-7.

When you see an image:
- Describe what you see clearly and enthusiastically
- If it's homework, check the answers. Output: [HOMEWORK_CHECK]{"subject":"math","totalProblems":N,"correct":N,"errors":[{"problem":"...","kidAnswer":"...","hint":"..."}]}[/HOMEWORK_CHECK]
- Supported homework subjects: math, science (biology/chemistry/physics), geography, history, vietnamese, english, chinese, reading, writing
- NEVER give correct answers for homework — only guiding hints (1 sentence each). Say which are wrong but NOT what the right answer is.
- Hints must use Socratic method: ask a question or give a clue so the kid figures it out themselves.
- For factual subjects (geography, history, science facts): still check if the kid's answer is right/wrong, give hints to guide them to the correct answer.
- If asked to describe, count, or identify things in the image, do so carefully
- Keep responses short (2-3 sentences max) and fun with emojis. NO lengthy breakdowns.
- For math homework: just state how many correct, then brief guiding hints for errors. No step-by-step. No answers.
- LANGUAGE: Respond in English or Vietnamese only, matching the language the kid uses. NEVER use Chinese characters/pinyin unless the kid is explicitly asking about Chinese language learning or the homework is Chinese.`
}

export function buildSystemPrompt(memberId: string | null, buddyCtx?: BuddyContext, hasImages = false): string {
  if (hasImages) return buildVisionSystemPrompt()
  const now = format(new Date(), 'EEEE, MMMM d, yyyy h:mm a')
  const context = memberId ? buildChoreContext(memberId) : buildGeneralContext()
  let prompt = BASE_SYSTEM_PROMPT + CHORE_CREATION_PROMPT + `\n\nCurrent date and time: ${now}` + context + buildMemberDirectory() + buildChoresSummary()

  if (memberId) {
    prompt += buildRoutineContext(memberId)
  }

  if (buddyCtx) {
    prompt += buildStoryContext(buddyCtx)
    prompt += buildPersonalityContext(buddyCtx)
    prompt += buildFirstMessageContext(buddyCtx)
    if (buddyCtx.reminderVariety !== undefined) {
      prompt += buildReminderStyleHint(buddyCtx.reminderVariety)
    }
  }

  // Reminder instruction (appended to all kid-mode prompts)
  if (memberId) {
    prompt += '\n\nREMINDERS: When the kid has pending chores, use the suggested reminder style. Be creative and varied -- never use the same phrasing twice.'
  }

  return prompt
}

/**
 * Detect the language of a text message based on character patterns.
 * Vietnamese diacritics → Vietnamese, CJK characters → Chinese, else English.
 */
export function detectLanguage(text: string): 'English' | 'Vietnamese' | 'Chinese' {
  // Vietnamese-specific diacritical marks and characters
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i
  if (vietnamesePattern.test(text)) return 'Vietnamese'

  // CJK Unified Ideographs
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf]/
  if (chinesePattern.test(text)) return 'Chinese'

  return 'English'
}

/** Inject language hint into the last user message */
function addLanguageHint(content: string, isLastUser: boolean): string {
  if (!isLastUser) return content
  const lang = detectLanguage(content)
  return content + `\n\n[LANGUAGE HINT: User is writing in ${lang}. You MUST reply in ${lang} ONLY. Default languages are English and Vietnamese. Only use Chinese characters/pinyin if the user is explicitly asking about Chinese language learning.]`
}

/** Check if Ollama is running and reachable */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

/** Batch (non-streaming) request to Ollama — used as fallback */
export async function sendToOllama(messages: ChatMessage[]): Promise<string> {
  const hasImages = messages.some((msg) => !!msg.image)
  const model = hasImages ? VISION_MODEL : TEXT_MODEL

  const processed = messages.map((msg, i) => {
    const isLastUser = msg.role === 'user' && i === messages.length - 1
    const textContent = addLanguageHint(msg.content, isLastUser)

    if (msg.image) {
      return {
        role: msg.role,
        content: [
          { type: 'text' as const, text: textContent },
          { type: 'image_url' as const, image_url: { url: msg.image } },
        ],
      }
    }

    return { role: msg.role, content: textContent }
  })

  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: processed,
        temperature: 0.7,
        max_tokens: 8000,
      }),
    })
  } catch {
    throw new Error('Váu Váu is sleeping! Ask a parent to start Ollama so I can chat with you.')
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Vision model "${model}" is not installed. Ask a parent to run: ollama pull ${model}`
      )
    }
    throw new Error(`Váu Váu had a hiccup! (error ${res.status}) Try again in a moment.`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? "Hmm, I got confused. Try again! 😊"
}

/** Streaming request to Ollama — shows tokens as they arrive */
export async function streamFromOllama(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const hasImages = messages.some((msg) => !!msg.image)
  const model = hasImages ? VISION_MODEL : TEXT_MODEL

  // Ollama native API uses `images: [base64String]` (no data URL prefix)
  const processed = messages.map((msg, i) => {
    const isLastUser = msg.role === 'user' && i === messages.length - 1
    const textContent = addLanguageHint(msg.content, isLastUser)

    const images = msg.image
      ? [msg.image.replace(/^data:[^;]+;base64,/, '')]
      : undefined

    return { role: msg.role, content: textContent, ...(images ? { images } : {}) }
  })

  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        messages: processed,
        stream: true,
        options: { temperature: 0.7, num_predict: 8000, num_ctx: 32768 },
      }),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error('Váu Váu is sleeping! Ask a parent to start Ollama so I can chat with you.')
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Vision model "${model}" is not installed. Ask a parent to run: ollama pull ${model}`
      )
    }
    throw new Error(`Váu Váu had a hiccup! (error ${res.status}) Try again in a moment.`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  const IDLE_TIMEOUT_MS = 60000

  try {
    while (true) {
      // Race the read against an idle timeout to detect Ollama hangs mid-stream
      let idleTimerId: ReturnType<typeof setTimeout>
      const idlePromise = new Promise<never>((_, reject) => {
        idleTimerId = setTimeout(
          () => reject(new Error('Ollama stopped responding mid-stream. Try again.')),
          IDLE_TIMEOUT_MS
        )
      })

      let readResult: { done: boolean; value?: Uint8Array }
      try {
        readResult = await Promise.race([reader.read(), idlePromise])
      } finally {
        clearTimeout(idleTimerId!)
      }

      const { done, value } = readResult
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          const token = json.message?.content || ''
          if (token) {
            fullText += token
            onToken(token)
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText
}

/** Lightweight direct Ollama call to generate content for a single presentation slide */
export async function generateSlideContentDirect(topic: string, presentationTitle: string): Promise<PresentationSlide> {
  const ollamaBase = getEnv('VITE_OLLAMA_URL', 'http://localhost:11434')
  const textModel = getEnv('VITE_OLLAMA_TEXT_MODEL', 'qwen2.5:7b')

  try {
    const res = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: textModel,
        messages: [{
          role: 'user',
          content: `Write 4 fun educational bullet points about "${topic}" for a kids' presentation titled "${presentationTitle}". Return ONLY a JSON object: {"title":"Short Title","content":"Point 1\\nPoint 2\\nPoint 3\\nPoint 4","emoji":"\\ud83e\\udd95"}`
        }],
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    })

    const data = await res.json()
    const text = data.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: String(parsed.title || topic),
        content: String(parsed.content || topic),
        emoji: String(parsed.emoji || '')
      }
    }
  } catch {
    // Fallback to topic name
  }

  return { title: topic, content: `Learn about ${topic}`, emoji: '' }
}
