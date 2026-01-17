import { NextResponse } from "next/server"

// Veo API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

interface VideoGenerationRequest {
  prompt: string
  skillId: string
}

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
    const body: VideoGenerationRequest = await request.json()
    const { prompt, skillId } = body

    if (!GEMINI_API_KEY) {
      // Return a mock response for demo purposes when no API key
      console.log("[v0] No GEMINI_API_KEY found, returning mock video URL")
      return NextResponse.json({
        success: true,
        videoUrl: `/placeholder-videos/${skillId}.mp4`,
        status: "mock",
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
    const generateResponse = await fetch(`${GEMINI_BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning`, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: enhancedPrompt,
          },
        ],
        parameters: {
          aspectRatio: "9:16", // Portrait for mobile app
          durationSeconds: "8",
        },
      }),
    })

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      console.error("[v0] Veo API error:", errorText)
      throw new Error(`Veo API error: ${generateResponse.status}`)
    }

    const operationData: VideoOperationResponse = await generateResponse.json()
    const operationName = operationData.name

    // Return the operation name for polling
    return NextResponse.json({
      success: true,
      operationName,
      status: "generating",
      message: "Video generation started. Poll the status endpoint to check progress.",
    })
  } catch (error) {
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
