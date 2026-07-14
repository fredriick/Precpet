"use client"

import { useMemo } from "react"
import { getLeaderboard } from "@/lib/leaderboard"
import { cn } from "@/lib/utils"

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-amber-400"
  if (rank === 2) return "text-slate-300"
  if (rank === 3) return "text-orange-400"
  return "text-muted-foreground"
}

export function LeaderboardWidget({ userMinutes, userName }: { userMinutes: number; userName: string }) {
  const { top, user } = useMemo(() => getLeaderboard(userMinutes, userName), [userMinutes, userName])
  const userInTop = top.some((e) => e.isUser)

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
          </svg>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Leaderboard</h3>
        </div>
        <span className="text-xs text-muted-foreground">this week</span>
      </div>

      <div className="space-y-2">
        {top.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
              entry.isUser ? "bg-primary/15 border border-primary/30" : "bg-accent/20",
            )}
          >
            <span className={cn("w-6 text-center font-bold font-mono text-sm", rankColor(entry.rank))}>
              {entry.rank}
            </span>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-semibold">
              {entry.name.charAt(0)}
            </div>
            <p className={cn("flex-1 min-w-0 truncate text-sm", entry.isUser ? "font-semibold" : "font-medium")}>
              {entry.name}
              {entry.isUser && <span className="text-primary text-xs ml-1">(you)</span>}
            </p>
            <span className="text-sm font-mono text-muted-foreground">{formatMinutes(entry.minutes)}</span>
          </div>
        ))}

        {!userInTop && (
          <>
            <div className="flex justify-center py-1 text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v.008M12 12v.008M12 17.25v.008" />
              </svg>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/15 border border-primary/30">
              <span className="w-6 text-center font-bold font-mono text-sm text-primary">{user.rank}</span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                {user.name.charAt(0)}
              </div>
              <p className="flex-1 min-w-0 truncate text-sm font-semibold">
                {user.name}
                <span className="text-primary text-xs ml-1">(you)</span>
              </p>
              <span className="text-sm font-mono text-muted-foreground">{formatMinutes(user.minutes)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
