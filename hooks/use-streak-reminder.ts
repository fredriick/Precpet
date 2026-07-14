"use client"

import { useEffect } from "react"

const LAST_NOTIFIED_KEY = "precept_streak_reminder_date"

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useStreakReminder(params: {
  enabled: boolean
  streakActive: boolean
  daysUntilBreak: number
  practicedToday: boolean
  currentStreak: number
}) {
  const { enabled, streakActive, daysUntilBreak, practicedToday, currentStreak } = params

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (!enabled || !streakActive || practicedToday) return
    if (daysUntilBreak !== 0) return

    let lastNotified: string | null = null
    try {
      lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY)
    } catch {
      lastNotified = null
    }
    if (lastNotified === todayKey()) return

    const notify = () => {
      try {
        new Notification("Keep your streak alive!", {
          body: `You're on a ${currentStreak}-day streak. Practice today so you don't lose it.`,
          icon: "/icon-192.jpg",
        })
        localStorage.setItem(LAST_NOTIFIED_KEY, todayKey())
      } catch {
        // ignore
      }
    }

    if (Notification.permission === "granted") {
      notify()
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") notify()
      })
    }
  }, [enabled, streakActive, daysUntilBreak, practicedToday, currentStreak])
}
