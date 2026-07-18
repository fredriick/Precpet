"use client"

import { startOfDay, subDays } from "date-fns"
import { getOrCreateSessionToken } from "@/lib/auth"
import type { LeaderboardEntry, RankedLeaderboard } from "@/lib/leaderboard-rank"
import type { PracticeSession } from "@/lib/types"

export type { LeaderboardEntry }
export type LeaderboardResult = RankedLeaderboard

export function weeklyMinutes(sessions: PracticeSession[]): number {
  const rangeStart = subDays(startOfDay(new Date()), 7)
  return sessions.reduce((acc, s) => {
    if (!s.endTime) return acc
    if (startOfDay(new Date(s.endTime)) < rangeStart) return acc
    const start = new Date(s.startTime).getTime()
    const end = new Date(s.endTime).getTime()
    return acc + Math.round((end - start) / 60000)
  }, 0)
}

function getStoredUserName(): string {
  if (typeof window === "undefined") return "You"
  try {
    const raw = localStorage.getItem("precept_auth_user")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.name) return parsed.name as string
    }
  } catch {
    // ignore
  }
  return "You"
}

export function syncLeaderboard(sessions: PracticeSession[], sport?: string): void {
  submitAndFetchLeaderboard(weeklyMinutes(sessions), getStoredUserName(), sport).catch(() => {
    // fire-and-forget; leaderboard is non-critical
  })
}

export async function submitAndFetchLeaderboard(
  userMinutes: number,
  userName: string,
  sport?: string,
  signal?: AbortSignal,
): Promise<LeaderboardResult> {
  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-token": getOrCreateSessionToken(),
    },
    body: JSON.stringify({ name: userName, sport, minutes: userMinutes }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Leaderboard error: ${response.status}`)
  }

  return response.json()
}
