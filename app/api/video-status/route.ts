import { NextResponse } from "next/server"
import { z } from "zod"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const operationNameSchema = z.string().regex(/^operations\/[a-zA-Z0-9-]+$/, "Invalid operation name format")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const operationName = searchParams.get("operationName")

    if (!operationName) {
      return NextResponse.json({ error: "Missing operationName parameter" }, { status: 400 })
    }

    // Validate operationName strictly to prevent SSRF
    const parsed = operationNameSchema.safeParse(operationName)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid operation name format" }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        done: true,
        videoUrl: `/placeholder-videos/placeholder.mp4`,
        demo: true,
      })
    }

    // Check operation status
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const statusResponse = await fetch(`${GEMINI_BASE_URL}/${parsed.data}`, {
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: controller.signal,
      })

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()

      if (statusData.done) {
        const videoUri =
          statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
          statusData.response?.generated_videos?.[0]?.video?.uri

        if (videoUri) {
          return NextResponse.json({ done: true, videoUrl: videoUri })
        } else {
          return NextResponse.json({
            done: true,
            error: "Video generation completed but no video URL found",
          })
        }
      }

      return NextResponse.json({ done: false, status: "generating" })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Video status check timed out" },
        { status: 504 },
      )
    }
    console.error("[v0] Video status check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check video status",
      },
      { status: 500 },
    )
  }
}
