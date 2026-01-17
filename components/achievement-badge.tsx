"use client"

import type { Achievement } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AchievementBadgeProps {
    achievement: Achievement
    isUnlocked: boolean
    size?: "sm" | "md" | "lg"
}

export function AchievementBadge({ achievement, isUnlocked, size = "md" }: AchievementBadgeProps) {
    const sizeClasses = {
        sm: "w-16 h-20",
        md: "w-20 h-24",
        lg: "w-24 h-28",
    }

    const iconSizes = {
        sm: "text-2xl",
        md: "text-3xl",
        lg: "text-4xl",
    }

    return (
        <div className={cn("flex flex-col items-center gap-2", sizeClasses[size])}>
            <div
                className={cn(
                    "relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all",
                    isUnlocked
                        ? "bg-gradient-success border-2 border-primary/50 shadow-lg hover-lift"
                        : "bg-secondary border border-border opacity-40",
                )}
            >
                <span className={cn(iconSizes[size], isUnlocked ? "animate-bounce-in" : "grayscale")}>
                    {achievement.icon}
                </span>

                {isUnlocked && achievement.unlockedAt && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className={cn("text-xs font-medium line-clamp-2", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                    {achievement.name}
                </p>
                {isUnlocked && achievement.unlockedAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    )
}
