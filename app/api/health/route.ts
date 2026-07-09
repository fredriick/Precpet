import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    services: {
      skillAnalysis: !!process.env.ANTHROPIC_API_KEY ? "ready" : "fallback",
      videoGeneration: !!process.env.GEMINI_API_KEY ? "ready" : "fallback",
      blobStorage: !!process.env.BLOB_READ_WRITE_TOKEN ? "ready" : "unavailable",
    },
  })
}
