import { NextResponse } from "next/server"
import { z } from "zod"

// Veo API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const generateVideoSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt too long"),
  skillId: z.string().min(1, "Skill ID is required").max(100, "Skill ID too long"),
})

interface VideoOperationResponse {
  name: string
  done?: boolean
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string
        }
      }>
    }
    generated_videos?: Array<{
      video?: {
        uri?: string
      }
    }>
  }
}

export async function POST(request: Request) {
  try {
    // Body size check
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10)
    if (contentLength > 100_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 })
    }

    const body = await request.json()
    const parsed = generateVideoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { prompt, skillId } = parsed.data

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        videoUrl: `/placeholder-videos/placeholder.mp4`,
        status: "mock",
        demo: true,
        message: "Demo mode - set GEMINI_API_KEY for real video generation",
      })
    }

    // Enhanced prompt for sports skill tutorials
    const enhancedPrompt = `Create a professional sports training tutorial video. ${prompt} 
    
The video should be:
- Clear and instructional
- Shot at eye-level or slightly elevated angle
- Well-lit with natural daylight
- Showing the technique in slow motion where appropriate
- Professional quality, suitable for a sports training app`

    // Start video generation with Veo 3.1
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    try {
      const generateResponse = await fetch(
        `${GEMINI_BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              aspectRatio: "9:16",
              durationSeconds: "8",
            },
          }),
          signal: controller.signal,
        },
      )

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text()
        console.error("[v0] Veo API error:", errorText)
        throw new Error(`Veo API error: ${generateResponse.status}`)
      }

      const operationData: VideoOperationResponse = await generateResponse.json()
      const operationName = operationData.name

      return NextResponse.json({
        success: true,
        operationName,
        status: "generating",
        message: "Video generation started. Poll the status endpoint to check progress.",
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Video generation timed out" },
        { status: 504 },
      )
    }
    console.error("[v0] Video generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate video",
      },
      { status: 500 },
    )
  }
}
