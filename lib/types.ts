export interface Skill {
  id: string
  name: string
  category: "dribbling" | "passing" | "shooting" | "defending" | "movement"
  difficulty: "beginner" | "intermediate" | "advanced"
  description: string
  reasoning: string
  visualScript: string
  steps: string[]
  videoUrl?: string
  videoStatus?: "pending" | "generating" | "ready" | "failed"
  isBookmarked?: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: "practice" | "streak" | "skill" | "performance"
  unlockedAt?: string
}

export interface UserStats {
  matchesPlayed: number
  ballLossesUnderPressure: number
  successfulDribbles: number
  passAccuracy: number
  shotsOnTarget: number
  avgFluidityScore: number
  practiceMinutes: number
  skillsLearned: string[]
  lastPractice?: string
  bookmarkedSkills: string[]
  achievements: string[]
  currentStreak: number
  longestStreak: number
  lastPracticeDate: string | null
}

export interface SkillRecommendation {
  action: "SILENCE" | "RECOMMEND"
  skill?: Skill
  confidence: number
  reason?: string
}

export interface PracticeSession {
  id: string
  skillId: string
  startTime: string
  endTime?: string
  fluidityScores: number[]
  completed: boolean
}
