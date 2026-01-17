import type { UserStats, PracticeSession } from "./types"

// Demo user stats for hackathon presentation
export const demoUserStats: UserStats = {
  matchesPlayed: 12,
  ballLossesUnderPressure: 8,
  successfulDribbles: 23,
  passAccuracy: 76,
  shotsOnTarget: 4,
  avgFluidityScore: 62,
  practiceMinutes: 145,
  skillsLearned: ["drag-back", "body-feint"],
  lastPractice: new Date(Date.now() - 86400000).toISOString(), // yesterday
}

export const demoPracticeSessions: PracticeSession[] = [
  {
    id: "1",
    skillId: "drag-back",
    startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 3 + 900000).toISOString(),
    fluidityScores: [45, 52, 58, 61, 65, 68, 72],
    completed: true,
  },
  {
    id: "2",
    skillId: "body-feint",
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + 600000).toISOString(),
    fluidityScores: [50, 55, 60, 63, 67],
    completed: true,
  },
]

// Simulate location-based practice window detection
export function isPracticeWindow(): boolean {
  const hour = new Date().getHours()
  // Assume evening hours (5-9 PM) are good practice times
  return hour >= 17 && hour <= 21
}
