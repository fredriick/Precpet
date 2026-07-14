"use client"

import { useMemo } from "react"
import { startOfDay, subDays } from "date-fns"
import type { PracticeSession } from "@/lib/types"

const WEEKS = 12
const DAYS = WEEKS * 7

function levelColor(level: number): string {
  if (level === 0) return "var(--secondary)"
  const opacity = [0, 0.3, 0.5, 0.75, 1][level]
  return `color-mix(in srgb, var(--primary) ${opacity * 100}%, transparent)`
}

export function PracticeHeatmap({ sessions }: { sessions: PracticeSession[] }) {
  const { cells, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of sessions) {
      if (!s.endTime) continue
      const key = startOfDay(new Date(s.endTime)).getTime()
      counts[key] = (counts[key] || 0) + 1
    }
    const today = startOfDay(new Date())
    const dow = today.getDay()
    const gridEnd = subDays(today, -(6 - dow))
    const arr: { date: Date; count: number }[] = []
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = subDays(gridEnd, i)
      arr.push({ date, count: counts[date.getTime()] || 0 })
    }
    const max = arr.reduce((m, c) => Math.max(m, c.count), 0)
    return { cells: arr, maxCount: max }
  }, [sessions])

  const columns = useMemo(() => {
    const cols: { date: Date; count: number }[][] = []
    for (let w = 0; w < WEEKS; w++) {
      cols.push(cells.slice(w * 7, w * 7 + 7))
    }
    return cols
  }, [cells])

  const getLevel = (count: number): number => {
    if (count === 0) return 0
    if (maxCount <= 1) return 4
    const ratio = count / maxCount
    if (ratio > 0.75) return 4
    if (ratio > 0.5) return 3
    if (ratio > 0.25) return 2
    return 1
  }

  const today = startOfDay(new Date()).getTime()

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Practice Activity</h3>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date.getTime()}
                title={`${cell.date.toLocaleDateString()} — ${cell.count} session${cell.count === 1 ? "" : "s"}`}
                className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor: cell.date.getTime() > today ? "transparent" : levelColor(getLevel(cell.count)),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className="w-3 h-3 rounded-sm" style={{ backgroundColor: levelColor(l) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
