import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const analyzeSchema = z.object({
  skillId: z.string().min(1).max(100),
  sport: z.enum(["soccer", "basketball", "tennis"]),
  sessionId: z.string().max(100).optional(),
})

function buildAnalysisPrompt(skillName: string, sport: string): string {
  return `You are a sports technique analysis AI for "Precept," an AI-powered sports coaching app.

Analyze this training video. The user is practicing: ${skillName} (${sport}).

Evaluate each metric on a 0-100 scale based on what you observe:

1. **passAccuracy** (0-100): How accurate and clean are their passes, touches, or ball contact? For shooting skills, rate shot accuracy. For dribbling, rate ball control precision.

2. **successfulDribbles** (0-100): Count successful skill moves/completions as a percentage. If they attempt 5 moves and nail 3, that's 60.

3. **shotsOnTarget** (0-100): For shooting/striking skills: accuracy of shots. For other skills: how well they hit their target motion/technique.

4. **ballControlQuality** (0-100): Overall ball control — first touch, close control, handling. How "glued" is the ball to their body?

5. **techniqueForm** (0-100): How well do they execute the key steps of ${skillName}? Body positioning, footwork, follow-through, balance.

6. **confidence** (0.0-1.0): How confident are you in this analysis? Consider video quality, angle, duration.

7. **summary**: One concise sentence describing their performance.

Return ONLY valid JSON in this exact format:
{
  "passAccuracy": <number 0-100>,
  "successfulDribbles": <number 0-100>,
  "shotsOnTarget": <number 0-100>,
  "ballControlQuality": <number 0-100>,
  "techniqueForm": <number 0-100>,
  "confidence": <number 0.0-1.0>,
  "summary": "<string>"
}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File | null
    const skillId = formData.get("skillId") as string | null
    const sport = formData.get("sport") as string | null
    const sessionId = formData.get("sessionId") as string | null
    const userId = formData.get("userId") as string | null
    const skillName = formData.get("skillName") as string | null

    if (!file || !skillId || !sport || !userId || !skillName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const parsed = analyzeSchema.safeParse({ skillId, sport, sessionId })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be under 50MB" }, { status: 413 })
    }

    // Check Pro status via admin client
    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Service not configured" }, { status: 503 })
    }

    const { data: statsRow } = await admin
      .from("user_stats")
      .select("is_pro")
      .eq("user_id", userId)
      .single()

    if (!statsRow?.is_pro) {
      return NextResponse.json({ error: "Pro subscription required" }, { status: 403 })
    }

    // Rate limit: max 10 analyses per day per user
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await admin
      .from("video_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: "Daily analysis limit reached (10/day)" }, { status: 429 })
    }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "mp4"
    const path = `${userId}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from("practice-videos")
      .upload(path, buffer, {
        contentType: file.type || "video/mp4",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = admin.storage.from("practice-videos").getPublicUrl(path)
    const videoUrl = urlData?.publicUrl || ""

    // Analyze with Gemini
    if (!GEMINI_API_KEY) {
      // Demo mode: return mock analysis
      const mockResult = {
        passAccuracy: Math.round(60 + Math.random() * 30),
        successfulDribbles: Math.round(50 + Math.random() * 40),
        shotsOnTarget: Math.round(55 + Math.random() * 35),
        ballControlQuality: Math.round(55 + Math.random() * 35),
        techniqueForm: Math.round(50 + Math.random() * 40),
        confidence: 0.5,
        summary: "Demo analysis — set GEMINI_API_KEY for real AI analysis.",
      }

      await saveAnalysis(admin, userId, parsed.data.sessionId, parsed.data.skillId, parsed.data.sport, videoUrl, mockResult)

      return NextResponse.json({ success: true, result: mockResult, demo: true })
    }

    // Convert video to base64 for Gemini
    const base64Video = buffer.toString("base64")
    const mimeType = file.type || "video/mp4"

    const prompt = buildAnalysisPrompt(skillName, parsed.data.sport)

    const geminiResponse = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Video } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error("Gemini API error:", errText)
      // Clean up uploaded video on analysis failure
      await admin.storage.from("practice-videos").remove([path])
      return NextResponse.json({ error: "AI analysis failed" }, { status: 502 })
    }

    const geminiData = await geminiResponse.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      await admin.storage.from("practice-videos").remove([path])
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 })
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      await admin.storage.from("practice-videos").remove([path])
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    const analysis = JSON.parse(jsonMatch[0])

    const result = {
      passAccuracy: Math.min(100, Math.max(0, Math.round(analysis.passAccuracy || 0))),
      successfulDribbles: Math.min(100, Math.max(0, Math.round(analysis.successfulDribbles || 0))),
      shotsOnTarget: Math.min(100, Math.max(0, Math.round(analysis.shotsOnTarget || 0))),
      ballControlQuality: Math.min(100, Math.max(0, Math.round(analysis.ballControlQuality || 0))),
      techniqueForm: Math.min(100, Math.max(0, Math.round(analysis.techniqueForm || 0))),
      confidence: Math.min(1, Math.max(0, Number(analysis.confidence) || 0.5)),
      summary: String(analysis.summary || "Analysis complete"),
    }

    await saveAnalysis(admin, userId, parsed.data.sessionId, parsed.data.skillId, parsed.data.sport, videoUrl, result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Video analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    )
  }
}

async function saveAnalysis(
  admin: ReturnType<typeof getSupabaseAdmin> & {},
  userId: string,
  sessionId: string | null | undefined,
  skillId: string,
  sport: string,
  videoUrl: string,
  result: {
    passAccuracy: number
    successfulDribbles: number
    shotsOnTarget: number
    ballControlQuality: number
    techniqueForm: number
    confidence: number
    summary: string
  },
) {
  // Save analysis record
  await admin.from("video_analyses").insert({
    user_id: userId,
    session_id: sessionId || null,
    skill_id: skillId,
    sport,
    video_url: videoUrl,
    pass_accuracy: result.passAccuracy,
    successful_dribbles: result.successfulDribbles,
    shots_on_target: result.shotsOnTarget,
    ball_control_quality: result.ballControlQuality,
    technique_form: result.techniqueForm,
    confidence: result.confidence,
    raw_analysis: result,
  })

  // Update session with analysis if linked
  if (sessionId) {
    await admin
      .from("practice_sessions")
      .update({
        video_url: videoUrl,
        analysis_result: result,
      })
      .eq("user_id", userId)
      .eq("id", sessionId)
  }

  // Update user stats with latest analysis values (weighted: 70% new, 30% old)
  const { data: existing } = await admin
    .from("user_stats")
    .select("pass_accuracy, successful_dribbles, shots_on_target")
    .eq("user_id", userId)
    .single()

  const w = 0.7
  const newPass = existing ? Math.round(existing.pass_accuracy * (1 - w) + result.passAccuracy * w) : result.passAccuracy
  const newDribbles = existing ? Math.round(existing.successful_dribbles * (1 - w) + result.successfulDribbles * w) : result.successfulDribbles
  const newShots = existing ? Math.round(existing.shots_on_target * (1 - w) + result.shotsOnTarget * w) : result.shotsOnTarget

  await admin
    .from("user_stats")
    .update({
      pass_accuracy: newPass,
      successful_dribbles: newDribbles,
      shots_on_target: newShots,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
}
