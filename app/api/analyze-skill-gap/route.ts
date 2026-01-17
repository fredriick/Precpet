import { generateText } from "ai"
import { NextResponse } from "next/server"
import type { UserStats, SkillRecommendation } from "@/lib/types"
import { soccerSkills } from "@/lib/skills-database"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userStats, motionFluidityScore, isInPracticeWindow } = body as {
      userStats: UserStats
      motionFluidityScore: number
      isInPracticeWindow: boolean
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

## Available Skills to Recommend:
${soccerSkills
  .filter((s) => !userStats.skillsLearned.includes(s.id))
  .map((s) => `- ${s.name} (${s.id}): ${s.description}`)
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

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: analysisPrompt,
      temperature: 0.3,
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
      const skill = soccerSkills.find((s) => s.id === aiResponse.skillId)
      if (skill) {
        recommendation.skill = skill
      }
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error("Skill gap analysis error:", error)
    return NextResponse.json({ action: "SILENCE", confidence: 0, reason: "Analysis error" }, { status: 500 })
  }
}
