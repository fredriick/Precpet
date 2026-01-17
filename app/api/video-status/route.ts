import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const operationName = searchParams.get("operationName")

    if (!operationName) {
      return NextResponse.json({ error: "Missing operationName parameter" }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    // Check operation status
    const statusResponse = await fetch(`${GEMINI_BASE_URL}/${operationName}`, {
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
      },
    })

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`)
    }

    const statusData = await statusResponse.json()

    if (statusData.done) {
      // Extract video URL from the response
      const videoUri =
        statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
        statusData.response?.generated_videos?.[0]?.video?.uri

      if (videoUri) {
        return NextResponse.json({
          done: true,
          videoUrl: videoUri,
        })
      } else {
        return NextResponse.json({
          done: true,
          error: "Video generation completed but no video URL found",
        })
      }
    }

    return NextResponse.json({
      done: false,
      status: "generating",
    })
  } catch (error) {
    console.error("[v0] Video status check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check video status",
      },
      { status: 500 },
    )
  }
}
