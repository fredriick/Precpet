"use client"

import { useEffect, useState } from "react"
import { celebratoryFeedback } from "@/lib/feedback"
import type { Achievement } from "@/lib/types"
import type { ReactNode } from "react"

interface AchievementToastProps {
    achievement: Achievement
    onClose: () => void
}

const ACHIEVEMENT_ICONS: Record<string, ReactNode> = {
    "first-steps": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 01-1.925 3.546 5.974 5.974 0 01-2.133 1A3.75 3.75 0 0012 18z" />
        </svg>
    ),
    "on-fire": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 01-1.925 3.546 5.974 5.974 0 01-2.133 1A3.75 3.75 0 0012 18z" />
        </svg>
    ),
    "unstoppable": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    ),
    "perfect-week": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    "skill-master": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a5.998 5.998 0 01-3.227 0m0 0a5.999 5.999 0 01-2.77-.896" />
        </svg>
    ),
    "knowledge-seeker": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
    ),
    "marathon": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    "graduate": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
        </svg>
    ),
    "fluidity-pro": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    ),
    "perfectionist": (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    ),
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [confettiPieces, setConfettiPieces] = useState<number[]>([])

    useEffect(() => {
        // Trigger haptic and sound feedback
        celebratoryFeedback()

        // Show toast with animation
        setTimeout(() => setIsVisible(true), 100)

        // Generate confetti
        setConfettiPieces(Array.from({ length: 12 }, (_, i) => i))

        // Auto-close after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 400)
        }, 5000)

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
            {/* Confetti */}
            {confettiPieces.map((i) => (
                <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${30 + Math.random() * 40}%`,
                        animationDelay: `${Math.random() * 0.3}s`,
                    }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: ["#ff6b6b", "#ffd93d", "#4facfe", "#38ef7d", "#a78bfa"][Math.floor(Math.random() * 5)],
                        }}
                    />
                </div>
            ))}

            {/* Toast */}
            <div
                className={cn(
                    "max-w-sm w-full pointer-events-auto transition-all duration-400",
                    isVisible ? "animate-slide-up" : "translate-y-full opacity-0",
                )}
            >
                <div className="rounded-2xl bg-gradient-success p-6 shadow-2xl border-2 border-primary/30">
                    <div className="flex items-start gap-4">
                        <div className="animate-bounce-in">{ACHIEVEMENT_ICONS[achievement.id]}</div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wider mb-1">
                                Achievement Unlocked!
                            </p>
                            <h3 className="text-xl font-bold text-primary-foreground mb-1">{achievement.name}</h3>
                            <p className="text-sm text-primary-foreground/90">{achievement.description}</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false)
                                setTimeout(onClose, 400)
                            }}
                            className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}
