export interface LeaderboardEntry {
  id: string
  name: string
  minutes: number
  isUser: boolean
  rank: number
}

export interface RankedLeaderboard {
  top: LeaderboardEntry[]
  user: LeaderboardEntry | null
  configured: boolean
}

export interface LeaderboardRow {
  session_token: string
  name: string
  minutes: number
}

export function rankLeaderboard(
  rows: LeaderboardRow[],
  token: string | null,
  topCount = 5,
): RankedLeaderboard {
  const sorted = [...rows].sort((a, b) => b.minutes - a.minutes)
  const ranked: LeaderboardEntry[] = sorted.map((r, i) => ({
    id: r.session_token,
    name: r.name || "Anonymous",
    minutes: r.minutes,
    isUser: token !== null && r.session_token === token,
    rank: i + 1,
  }))
  const user = token ? ranked.find((r) => r.isUser) ?? null : null
  return { top: ranked.slice(0, topCount), user, configured: true }
}
