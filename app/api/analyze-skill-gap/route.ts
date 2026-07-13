import { generateText } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"
import type { SkillRecommendation } from "@/lib/types"
import { allSkills } from "@/lib/skills-database"

const userStatsSchema = z.object({
  matchesPlayed: z.number().min(0).max(9999),
  ballLossesUnderPressure: z.number().min(0).max(9999),
  successfulDribbles: z.number().min(0).max(9999),
  passAccuracy: z.number().min(0).max(100),
  shotsOnTarget: z.number().min(0).max(9999),
  avgFluidityScore: z.number().min(0).max(100),
  practiceMinutes: z.number().min(0).max(99999),
  skillsLearned: z.array(z.string()),
  bookmarkedSkills: z.array(z.string()),
  achievements: z.array(z.string()),
  currentStreak: z.number().min(0),
  longestStreak: z.number().min(0),
  lastPracticeDate: z.string().nullable(),
})

const analyzeSchema = z.object({
  userStats: userStatsSchema,
  motionFluidityScore: z.number().min(0).max(100),
  isInPracticeWindow: z.boolean(),
})

export async function POST(request: Request) {
  try {
    // Body size check
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10)
    if (contentLength > 100_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 })
    }

    const body = await request.json()
    const parsed = analyzeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { userStats, motionFluidityScore, isInPracticeWindow } = parsed.data

    // If no AI key, fall back to local recommendation logic
    if (!process.env.ANTHROPIC_API_KEY) {
      return fallbackRecommendation(userStats, motionFluidityScore, isInPracticeWindow)
    }

    const analysisPrompt = `You are the Lead Intelligence Engine for "Precept," a prompt-less sports PWA. Your goal is to deliver hyper-personalized skill recommendations with extreme restraint.

## User Game Stats:
- Matches Played: ${userStats.matchesPlayed}
- Ball Losses Under Pressure: ${userStats.ballLossesUnderPressure}
- Successful Dribbles: ${userStats.successfulDribbles}
- Pass Accuracy: ${userStats.passAccuracy}%
- Shots on Target: ${userStats.shotsOnTarget}
- Average Fluidity Score: ${userStats.avgFluidityScore}
- Practice Minutes: ${userStats.practiceMinutes}
- Skills Already Learned: ${userStats.skillsLearned.join(", ") || "None yet"}

## Current Context:
- Motion Fluidity Score: ${motionFluidityScore}
- Is in Practice Window: ${isInPracticeWindow}

## Available Skills to Recommend (grouped by sport):
${allSkills
  .filter((s) => !userStats.skillsLearned.includes(s.id))
  .map((s) => `- [${s.sport}] ${s.name} (${s.id}): ${s.description}`)
  .join("\n")}

## Task 1: The Decision Logic (Restraint)
1. Determine if the user is in a "Skill Gap" (e.g., losing the ball under pressure, low fluidity scores).
2. Check if the user is currently in a "Practice Window" (available to practice).
3. STRICT RULE: If confidence is below HIGH, output ACTION: SILENCE.

## Task 2: Content Generation (if action is justified)
If recommending a skill, respond with JSON in this exact format:
{
  "action": "RECOMMEND",
  "skillId": "<skill-id>",
  "confidence": <0.0-1.0>,
  "reason": "<one sentence explaining why this skill addresses their gap>"
}

If not recommending (user is doing well or not in practice window), respond with:
{
  "action": "SILENCE",
  "confidence": <0.0-1.0>,
  "reason": "<brief reason for silence>"
}

Respond ONLY with valid JSON.`

    const model = process.env.AI_MODEL || "anthropic/claude-sonnet-4-20250514"

    const { text } = await generateText({
      model,
      prompt: analysisPrompt,
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(30_000),
    })

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const aiResponse = JSON.parse(jsonMatch[0])

    // Build the recommendation
    const recommendation: SkillRecommendation = {
      action: aiResponse.action,
      confidence: aiResponse.confidence,
      reason: aiResponse.reason,
    }

    // If recommending, include the full skill data
    if (aiResponse.action === "RECOMMEND" && aiResponse.skillId) {
      const skill = allSkills.find((s) => s.id === aiResponse.skillId)
      if (skill) {
        recommendation.skill = skill
      }
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error("Skill gap analysis error:", error)
    return NextResponse.json(
      { action: "SILENCE", confidence: 0, reason: "Analysis error" },
      { status: 500 },
    )
  }
}

function fallbackRecommendation(
  userStats: z.infer<typeof userStatsSchema>,
  motionFluidityScore: number,
  isInPracticeWindow: boolean,
): Response {
  // Find the weakest area and recommend the matching unlearned skill
  if (userStats.ballLossesUnderPressure > 5 && userStats.passAccuracy < 70) {
    const skill = allSkills.find((s) => s.id === "body-feint" && !userStats.skillsLearned.includes(s.id))
    if (skill) {
      return NextResponse.json({
        action: "RECOMMEND",
        skill,
        confidence: 0.8,
        reason: "Your ball losses under pressure suggest improving close-control dribbling",
      })
    }
  }

  if (userStats.passAccuracy > 0 && userStats.passAccuracy < 65) {
    const skill = allSkills.find((s) => s.id === "drag-back" && !userStats.skillsLearned.includes(s.id))
    if (skill) {
      return NextResponse.json({
        action: "RECOMMEND",
        skill,
        confidence: 0.85,
        reason: "Improving your turning technique can help maintain possession under pressure",
      })
    }
  }

  if (motionFluidityScore > 0 && motionFluidityScore < 50) {
    const skill = allSkills.find((s) => s.id === "cruyff-turn" && !userStats.skillsLearned.includes(s.id))
    if (skill) {
      return NextResponse.json({
        action: "RECOMMEND",
        skill,
        confidence: 0.75,
        reason: "Your movement fluidity suggests working on smooth change-of-direction techniques",
      })
    }
  }

  if (!isInPracticeWindow) {
    return NextResponse.json({
      action: "SILENCE",
      confidence: 1,
      reason: "Not in practice window - will recommend when you're ready to train",
    })
  }

  // Default: recommend the first unlearned skill if any
  const unlearned = allSkills.find((s) => !userStats.skillsLearned.includes(s.id))
  if (unlearned) {
    return NextResponse.json({
      action: "RECOMMEND",
      skill: unlearned,
      confidence: 0.6,
      reason: "Building your skill repertoire is key to becoming a well-rounded player",
    })
  }

  return NextResponse.json({
    action: "SILENCE",
    confidence: 1,
    reason: "You've learned all available skills - great work!",
  })
}
