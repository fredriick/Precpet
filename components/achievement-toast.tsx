"use client"

import { useEffect, useState } from "react"
import { celebratoryFeedback } from "@/lib/feedback"
import type { Achievement } from "@/lib/types"

interface AchievementToastProps {
    achievement: Achievement
    onClose: () => void
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
                        top: "50%",
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
                        <div className="text-5xl animate-bounce-in">{achievement.icon}</div>
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
