"use client"

import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { getSkillById } from "@/lib/skills-database"
import { demoUserStats } from "@/lib/demo-data"
import { useVideoGeneration } from "@/hooks/use-video-generation"
import { cn } from "@/lib/utils"

interface SkillDetailPageProps {
  params: Promise<{ id: string }>
}

const difficultyColors = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const skill = getSkillById(id)
  if (!skill) {
    notFound()
  }

  // Hook must be called unconditionally, so we pass skill?.id (which might be undefined, handled by hook)
  // Re-checking skill existence here for type safety is fine as notFound() throws
  const { isGenerating, videoUrl, error, progress, generateVideo } = useVideoGeneration(skill.id)

  const isLearned = demoUserStats.skillsLearned.includes(skill.id)

  const handleGenerateVideo = () => {
    generateVideo(skill.visualScript, skill.id)
  }

  const getProgressText = () => {
    switch (progress) {
      case "starting":
        return "Initializing Veo..."
      case "generating":
        return "Generating video (this may take a minute)..."
      case "error":
        return error || "Generation failed"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold truncate">{skill.name}</h1>
          {isLearned && (
            <div className="ml-auto flex items-center gap-1 text-primary text-xs font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Learned
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Video Section */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="aspect-video bg-secondary flex items-center justify-center relative">
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full h-full object-cover" autoPlay loop playsInline />
            ) : (
              <div className="text-center p-6">
                <div
                  className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                    isGenerating ? "bg-primary/30" : "bg-primary/20",
                  )}
                >
                  {isGenerating ? (
                    <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-1">
                  {isGenerating ? getProgressText() : "AI-generated tutorial video"}
                </p>
                {progress === "error" && <p className="text-destructive text-xs mb-4">{error}</p>}
                {!isGenerating && !videoUrl && (
                  <Button
                    onClick={handleGenerateVideo}
                    className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Generate Video with Veo
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Skill Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize border",
                difficultyColors[skill.difficulty],
              )}
            >
              {skill.difficulty}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium capitalize">
              {skill.category}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">{skill.name}</h2>
            <p className="text-muted-foreground">{skill.description}</p>
          </div>

          {/* Why This Skill */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Why Learn This
            </h3>
            <p className="text-sm text-foreground/80">{skill.reasoning}</p>
          </div>

          {/* Steps */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              How to Execute
            </h3>
            <div className="space-y-4">
              {skill.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </div>
                  <p className="text-foreground/90 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Script (for demo) */}
          <details className="rounded-xl bg-secondary/50 border border-border">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              View AI Video Prompt
            </summary>
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground font-mono">{skill.visualScript}</p>
            </div>
          </details>
        </div>

        {/* Practice CTA */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto">
            <Button
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => router.push(`/practice?skill=${skill.id}`)}
            >
              Practice This Skill
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
