"use client"

import { formatDistanceToNow } from "date-fns"
import type { PracticeSession } from "@/lib/types"
import { soccerSkills } from "@/lib/skills-database"
import { cn } from "@/lib/utils"

interface SessionHistoryListProps {
    sessions: PracticeSession[]
}

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )

    if (sortedSessions.length === 0) {
        return (
            <div className="text-center py-10 bg-secondary/20 rounded-2xl border border-dashed border-border">
                <p className="text-4xl mb-2">📝</p>
                <p className="font-medium">No practice history yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Complete your first guided session to see it here!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {sortedSessions.map((session, index) => {
                const skill = soccerSkills.find((s) => s.id === session.skillId)
                const date = new Date(session.startTime)
                const duration = session.endTime
                    ? Math.round((new Date(session.endTime).getTime() - date.getTime()) / 60000)
                    : 0
                const avgFluidity =
                    session.fluidityScores.length > 0
                        ? Math.round(
                            session.fluidityScores.reduce((a, b) => a + b, 0) / session.fluidityScores.length,
                        )
                        : 0

                return (
                    <div
                        key={`${session.skillId}-${session.startTime}`}
                        className="group relative bg-card hover:bg-card/80 border border-border p-4 rounded-2xl transition-all hover-lift animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                                    {skill?.category === "dribbling" && "⚽"}
                                    {skill?.category === "passing" && "👟"}
                                    {skill?.category === "shooting" && "🥅"}
                                    {skill?.category === "defending" && "🛡️"}
                                    {skill?.category === "movement" && "🏃"}
                                    {!skill && "📝"}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{skill?.name || "Practice Session"}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(date, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span
                                    className={cn(
                                        "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                        avgFluidity >= 80
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : avgFluidity >= 60
                                                ? "bg-amber-500/10 text-amber-500"
                                                : "bg-red-500/10 text-red-500",
                                    )}
                                >
                                    {avgFluidity} Score
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                            <div className="text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                                <p className="text-sm font-mono font-medium">{duration}m</p>
                            </div>
                            <div className="text-center border-l border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase">Fluidity</p>
                                <div className="flex items-center justify-center gap-1">
                                    <p className="text-sm font-mono font-medium">{avgFluidity}</p>
                                </div>
                            </div>
                        </div>

                        {/* Completion Badge */}
                        {session.completed && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center border border-background">
                                <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
