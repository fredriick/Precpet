"use client"

import { useMemo } from "react"
import { getStreakStatus } from "@/lib/storage"
import { cn } from "@/lib/utils"
import type { PracticeSession } from "@/lib/types"

function toLocalDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface Week {
  label: string
  days: {
    date: Date
    key: string
    dayLabel: string
    isPractice: boolean
    isToday: boolean
    isFuture: boolean
  }[]
}

interface StreakWidgetProps {
  sessions: PracticeSession[]
  registeredAt?: string
}

export function StreakWidget({ sessions, registeredAt }: StreakWidgetProps) {
  const { current, longest, daysUntilBreak, isActive } = getStreakStatus()

  const getMotivationalMessage = () => {
    if (!isActive) return "Start a new streak today!"
    if (current === 1) return "Great start! Keep it going!"
    if (current >= 7) return "You're unstoppable!"
    if (current >= 3) return "You're on fire! Keep the momentum!"
    return "Building consistency!"
  }

  const todayKey = toKey(new Date())

  const practiceDays = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      set.add(toLocalDate(s.startTime))
    }
    return set
  }, [sessions])

  const weeks = useMemo((): Week[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const mondayOfThisWeek = getMonday(today)

    const regDate = registeredAt ? new Date(registeredAt) : today
    regDate.setHours(0, 0, 0, 0)
    const mondayOfRegWeek = getMonday(regDate)

    const result: Week[] = []
    const current = new Date(mondayOfRegWeek)

    while (current <= mondayOfThisWeek || (current.getTime() === mondayOfThisWeek.getTime())) {
      const weekStart = new Date(current)
      const days: Week["days"] = []

      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i)
        const key = toKey(date)
        days.push({
          date,
          key,
          dayLabel: date.toLocaleDateString("en-US", { weekday: "narrow" }),
          isPractice: practiceDays.has(key),
          isToday: key === todayKey,
          isFuture: date > today,
        })
      }

      const monthLabel = weekStart.toLocaleDateString("en-US", { month: "short" })
      const dayNum = weekStart.getDate()
      result.push({ label: `${monthLabel} ${dayNum}`, days })

      current.setDate(current.getDate() + 7)
      if (current > mondayOfThisWeek) break
    }

    return result
  }, [practiceDays, registeredAt, todayKey])

  return (
    <div className="rounded-2xl bg-gradient-warm p-6 text-foreground shadow-lg shadow-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-4xl drop-shadow-md">
              <svg className="w-9 h-9 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 01-1.925 3.546 5.974 5.974 0 01-2.133 1A3.75 3.75 0 0012 18z" />
              </svg>
            </span>
            <div>
              <p className="text-3xl font-bold drop-shadow-sm">{current}</p>
              <p className="text-xs opacity-90 font-medium">day streak</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-90 font-medium">Best Streak</p>
          <p className="text-xl font-bold drop-shadow-sm">{longest}</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mb-3">
        {/* Day-of-week header */}
        <div className="flex gap-1 mb-1 pl-0">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <p className="text-[10px] opacity-70 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {[...weeks].reverse().map((week, wi) => (
            <div key={wi} className="flex gap-1">
              {week.days.map((day) => (
                <div key={day.key} className="flex-1">
                  <div
                    className={cn(
                      "w-full aspect-square rounded-lg flex items-center justify-center transition-all",
                      day.isFuture
                        ? "bg-foreground/5"
                        : day.isPractice && day.isToday
                          ? "bg-foreground/25 border-2 border-foreground/40 shadow-[0_0_8px_oklch(0.7_0.17_162/0.5)]"
                          : day.isPractice
                            ? "bg-foreground/15 border border-foreground/25"
                            : day.isToday
                              ? "bg-foreground/10 border-2 border-foreground/35 shadow-[0_0_8px_oklch(0.7_0.17_162/0.3)]"
                              : "bg-foreground/8 border border-foreground/10",
                    )}
                  >
                    {day.isPractice ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-foreground/20 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    ) : day.isToday ? (
                      <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm font-medium text-center opacity-90 drop-shadow-sm">{getMotivationalMessage()}</p>

      {isActive && daysUntilBreak === 0 && (
        <div className="mt-3 p-2 rounded-lg bg-black/10 border border-white/20 backdrop-blur-sm">
          <p className="text-xs text-center font-medium opacity-85">
            <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866 1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Practice today to keep your streak alive!
          </p>
        </div>
      )}
    </div>
  )
}
