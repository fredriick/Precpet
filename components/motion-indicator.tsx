"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

interface MotionIndicatorProps {
  fluidityScore: number
  intensity: number
  isActive: boolean
  isTracking: boolean
}

export function MotionIndicator({ fluidityScore, intensity, isActive, isTracking }: MotionIndicatorProps) {
  const { t } = useI18n()

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-primary"
    if (score >= 40) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t("motion.excellent")
    if (score >= 60) return t("motion.good")
    if (score >= 40) return t("motion.fair")
    return t("motion.needsWork")
  }

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("motion.title")}</h3>
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isTracking ? (isActive ? "bg-primary animate-pulse" : "bg-amber-500") : "bg-muted-foreground",
          )}
        />
      </div>

      {isTracking ? (
        <div className="space-y-6">
          {/* Fluidity Score */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-muted-foreground text-sm">{t("motion.fluidity")}</span>
              <span className={cn("text-3xl font-bold font-mono", getScoreColor(fluidityScore))}>{fluidityScore}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full fluidity-gradient transition-all duration-300"
                style={{ width: `${fluidityScore}%` }}
              />
            </div>
            <p className={cn("text-xs mt-1", getScoreColor(fluidityScore))}>{getScoreLabel(fluidityScore)}</p>
          </div>

          {/* Intensity */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-muted-foreground text-sm">{t("motion.intensity")}</span>
              <span className="text-xl font-semibold font-mono text-foreground">{intensity}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary/60 transition-all duration-300" style={{ width: `${intensity}%` }} />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
              )}
            >
              {isActive ? t("motion.inMotion") : t("motion.stationary")}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">{t("motion.inactive")}</p>
          <p className="text-muted-foreground/60 text-xs mt-1">{t("motion.startHint")}</p>
        </div>
      )}
    </div>
  )
}
