const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Maya", "Liam", "Noah", "Emma", "Olivia", "Ava", "Ethan",
  "Sofia", "Lucas", "Mia", "Leo", "Zoe", "Kai", "Nina", "Diego", "Aria", "Omar",
  "Yuki", "Priya", "Marco", "Chloe", "Ivan", "Layla", "Tariq", "Elena", "Hugo", "Freya",
]

const LAST_INITIALS = ["B.", "C.", "D.", "F.", "G.", "H.", "K.", "L.", "M.", "N.", "P.", "R.", "S.", "T.", "V."]

export interface LeaderboardEntry {
  id: string
  name: string
  minutes: number
  isUser: boolean
  rank: number
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function weekSeed(): number {
  const now = new Date()
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
  return week
}

export function getLeaderboard(userMinutes: number, userName: string, count = 30): {
  top: LeaderboardEntry[]
  user: LeaderboardEntry
} {
  const rand = mulberry32(weekSeed())
  const athletes: { id: string; name: string; minutes: number; isUser: boolean }[] = []

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const last = LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)]
    // Skew distribution: most athletes 20-180 min, a few high performers
    const base = Math.floor(rand() * 160) + 20
    const boost = rand() > 0.85 ? Math.floor(rand() * 200) : 0
    athletes.push({ id: `athlete-${i}`, name: `${first} ${last}`, minutes: base + boost, isUser: false })
  }

  athletes.push({ id: "user", name: userName || "You", minutes: userMinutes, isUser: true })

  athletes.sort((a, b) => b.minutes - a.minutes)

  const ranked: LeaderboardEntry[] = athletes.map((a, i) => ({ ...a, rank: i + 1 }))
  const user = ranked.find((a) => a.isUser)!

  return { top: ranked.slice(0, 5), user }
}
