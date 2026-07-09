import type { Achievement } from "./types"
import { allSkills } from "./skills-database"

export const achievements: Achievement[] = [
    {
        id: "first-steps",
        name: "First Steps",
        description: "Complete your first practice session",
        icon: "🎯",
        category: "practice",
    },
    {
        id: "on-fire",
        name: "On Fire",
        description: "Maintain a 3-day practice streak",
        icon: "🔥",
        category: "streak",
    },
    {
        id: "unstoppable",
        name: "Unstoppable",
        description: "Maintain a 7-day practice streak",
        icon: "⚡",
        category: "streak",
    },
    {
        id: "perfect-week",
        name: "Perfect Week",
        description: "Complete 7 practice sessions in 7 days",
        icon: "💯",
        category: "streak",
    },
    {
        id: "skill-master",
        name: "Skill Master",
        description: "Learn all available skills",
        icon: "🏆",
        category: "skill",
    },
    {
        id: "knowledge-seeker",
        name: "Knowledge Seeker",
        description: "Bookmark 3 or more skills",
        icon: "📚",
        category: "skill",
    },
    {
        id: "marathon",
        name: "Marathon",
        description: "Practice for 60+ minutes total",
        icon: "⏱️",
        category: "practice",
    },
    {
        id: "graduate",
        name: "Graduate",
        description: "Complete 10 practice sessions",
        icon: "🎓",
        category: "practice",
    },
    {
        id: "fluidity-pro",
        name: "Fluidity Pro",
        description: "Achieve 85+ fluidity score in a session",
        icon: "💪",
        category: "performance",
    },
    {
        id: "perfectionist",
        name: "Perfectionist",
        description: "Achieve 95+ fluidity score in a session",
        icon: "🌟",
        category: "performance",
    },
]

export function getAchievementById(id: string): Achievement | undefined {
    return achievements.find((achievement) => achievement.id === id)
}

export function checkAchievementUnlock(
    achievementId: string,
    userStats: {
        practiceMinutes: number
        skillsLearned: string[]
        bookmarkedSkills: string[]
        currentStreak: number
        achievements: string[]
    },
    sessions: { completed: boolean; fluidityScores: number[]; startTime: string }[],
): boolean {
    // Already unlocked
    if (userStats.achievements.includes(achievementId)) return false

    const completedSessions = sessions.filter((s) => s.completed)

    switch (achievementId) {
        case "first-steps":
            return completedSessions.length >= 1

        case "on-fire":
            return userStats.currentStreak >= 3

        case "unstoppable":
            return userStats.currentStreak >= 7

        case "perfect-week": {
            const last7Days = new Date()
            last7Days.setDate(last7Days.getDate() - 7)
            return completedSessions.filter((s) => new Date(s.startTime) >= last7Days).length >= 7
        }

        case "skill-master":
            return userStats.skillsLearned.length >= allSkills.length

        case "knowledge-seeker":
            return userStats.bookmarkedSkills.length >= 3

        case "marathon":
            return userStats.practiceMinutes >= 60

        case "graduate":
            return completedSessions.length >= 10

        case "fluidity-pro":
            return completedSessions.some((s) => {
                if (s.fluidityScores.length === 0) return false
                const avg = s.fluidityScores.reduce((a, b) => a + b, 0) / s.fluidityScores.length
                return avg >= 85
            })

        case "perfectionist":
            return completedSessions.some((s) => {
                if (s.fluidityScores.length === 0) return false
                const avg = s.fluidityScores.reduce((a, b) => a + b, 0) / s.fluidityScores.length
                return avg >= 95
            })

        default:
            return false
    }
}
