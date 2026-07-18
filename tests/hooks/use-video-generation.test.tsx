import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useVideoGeneration } from "@/hooks/use-video-generation"

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    }),
  )
}

describe("useVideoGeneration", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it("flags isDemo when the API returns a mock/demo video", async () => {
    mockFetchOnce({
      success: true,
      videoUrl: "/placeholder-videos/placeholder.mp4",
      status: "mock",
      demo: true,
    })

    const { result } = renderHook(() => useVideoGeneration("test-skill"))

    await act(async () => {
      await result.current.generateVideo("prompt", "test-skill")
    })

    await waitFor(() => {
      expect(result.current.progress).toBe("ready")
    })
    expect(result.current.videoUrl).toBe("/placeholder-videos/placeholder.mp4")
    expect(result.current.isDemo).toBe(true)
  })
})
