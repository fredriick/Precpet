"use client"

import { getStreakStatus } from "@/lib/storage"
import { cn } from "@/lib/utils"

export function StreakWidget() {
    const { current, longest, daysUntilBreak, isActive } = getStreakStatus()

    const getMotivationalMessage = () => {
        if (!isActive) return "Start a new streak today!"
        if (current === 1) return "Great start! Keep it going!"
        if (current >= 7) return "You're unstoppable!"
        if (current >= 3) return "You're on fire! Keep the momentum!"
        return "Building consistency!"
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

            {/* Mini calendar */}
            <div className="flex gap-1.5 mb-3">
                {days.map((day, i) => (
                    <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] opacity-80 mb-1 font-medium">{day.dayName[0]}</p>
                        <div
                            className={cn(
                                "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm",
                                day.isPracticeDay
                                    ? "bg-white/30 border-2 border-white/50"
                                    : "bg-black/10 border border-white/20",
                                day.isToday && !day.isPracticeDay && "ring-2 ring-white/50 bg-white/10",
                            )}
                        >
                            {day.isPracticeDay && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-sm font-medium text-center opacity-90 drop-shadow-sm">{getMotivationalMessage()}</p>

            {isActive && daysUntilBreak === 0 && (
                <div className="mt-3 p-2 rounded-lg bg-black/10 border border-white/20 backdrop-blur-sm">
                    <p className="text-xs text-center font-medium opacity-85">
                      <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      Practice today to keep your streak alive!
                    </p>
                </div>
            )}
        </div>
    )
}
