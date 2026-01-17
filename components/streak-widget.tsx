"use client"

import { getStreakStatus } from "@/lib/storage"
import { cn } from "@/lib/utils"

export function StreakWidget() {
    const { current, longest, daysUntilBreak, isActive } = getStreakStatus()

    const getMotivationalMessage = () => {
        if (!isActive) return "Start a new streak today! 🌱"
        if (current === 1) return "Great start! Keep it going! 💪"
        if (current >= 7) return "You're unstoppable! 🔥"
        if (current >= 3) return "You're on fire! Keep the momentum! ⚡"
        return "Building consistency! 👏"
    }

    // Generate last 7 days for calendar
    const getLast7Days = () => {
        const days = []
        const today = new Date()

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
            const isPracticeDay = i < current && isActive
            days.push({ dayName, isPracticeDay, isToday: i === 0 })
        }

        return days
    }

    const days = getLast7Days()

    return (
        <div className="rounded-2xl bg-gradient-warm p-6 text-white shadow-lg shadow-primary/20">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-4xl drop-shadow-md">🔥</span>
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

            {/* Mini calendar */}
            <div className="flex gap-1.5 mb-3">
                {days.map((day, i) => (
                    <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] opacity-80 mb-1 font-medium">{day.dayName[0]}</p>
                        <div
                            className={cn(
                                "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm",
                                day.isPracticeDay
                                    ? "bg-white/30 border-2 border-white/50 text-white"
                                    : "bg-black/20 border border-white/10 text-white/50",
                                day.isToday && !day.isPracticeDay && "ring-2 ring-white/50 bg-white/10",
                            )}
                        >
                            {day.isPracticeDay && "✓"}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-sm font-medium text-center text-white/95 drop-shadow-sm">{getMotivationalMessage()}</p>

            {isActive && daysUntilBreak === 0 && (
                <div className="mt-3 p-2 rounded-lg bg-black/20 border border-white/20 backdrop-blur-sm">
                    <p className="text-xs text-center font-medium text-white/90">⚠️ Practice today to keep your streak alive!</p>
                </div>
            )}
        </div>
    )
}
