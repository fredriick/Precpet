"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Sport } from "@/lib/types"

interface VideoRecorderProps {
  mode: "record" | "upload" | "both"
  onVideoSelected: (blob: Blob) => void
  onCancel: () => void
  skillName: string
  sport: Sport
}

const MAX_DURATION_SEC = 15
const TARGET_WIDTH = 720

function getPreferredMimeType(): string {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ]
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t
  }
  return ""
}

async function compressBlob(raw: Blob): Promise<Blob> {
  if (raw.size <= 10 * 1024 * 1024) return raw

  const url = URL.createObjectURL(raw)
  const video = document.createElement("video")
  video.src = url
  video.muted = true
  video.playsInline = true

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error("Failed to load video for compression"))
  })

  const canvas = document.createElement("canvas")
  const scale = TARGET_WIDTH / video.videoWidth
  canvas.width = TARGET_WIDTH
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext("2d")!

  const stream = canvas.captureStream(30)
  const mimeType = getPreferredMimeType()
  const recorder = new MediaRecorder(stream, {
    mimeType: mimeType || undefined,
    videoBitsPerSecond: 1_500_000,
  })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start()
  video.currentTime = 0
  video.play()

  const drawFrame = () => {
    if (video.ended || video.paused) {
      recorder.stop()
      return
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    requestAnimationFrame(drawFrame)
  }
  requestAnimationFrame(drawFrame)
  await done

  URL.revokeObjectURL(url)
  return new Blob(chunks, { type: mimeType || "video/webm" })
}

export function VideoRecorder({ mode, onVideoSelected, onCancel, skillName, sport }: VideoRecorderProps) {
  const [view, setView] = useState<"choose" | "recording" | "preview" | "uploading">(mode === "upload" ? "choose" : "choose")
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [countdown, setCountdown] = useState(MAX_DURATION_SEC)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopStream()
      if (timerRef.current) clearInterval(timerRef.current)
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [stopStream, recordedUrl])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
      setView("recording")
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.")
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    setCountdown(MAX_DURATION_SEC)

    const mimeType = getPreferredMimeType()
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 3_000_000,
    })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" })
      const url = URL.createObjectURL(blob)
      setRecordedBlob(blob)
      setRecordedUrl(url)
      setView("preview")
    }
    recorderRef.current = recorder
    recorder.start(100)

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    stopStream()
  }, [stopStream])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Video must be under 50MB.")
      return
    }
    setRecordedBlob(file)
    setRecordedUrl(URL.createObjectURL(file))
    setView("preview")
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!recordedBlob) return
    setView("uploading")
    try {
      const compressed = await compressBlob(recordedBlob)
      onVideoSelected(compressed)
    } catch {
      setError("Failed to process video. Please try again.")
      setView("preview")
    }
  }, [recordedBlob, onVideoSelected])

  const handleRetake = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
    setRecordedBlob(null)
    setError(null)
    setView("choose")
  }, [recordedUrl])

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      {/* Choose mode */}
      {view === "choose" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Analyze Your Technique</h3>
            <p className="text-sm text-muted-foreground">
              Record or upload a clip of your {skillName} practice for AI-powered analysis
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            {(mode === "record" || mode === "both") && (
              <Button onClick={startCamera} className="flex-1 h-12 rounded-xl">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Record
              </Button>
            )}
            {(mode === "upload" || mode === "both") && (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-12 rounded-xl">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>
      )}

      {/* Recording view */}
      {view === "recording" && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[50vh] mx-auto">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute top-3 right-3 bg-black/60 text-white text-sm font-mono px-2 py-1 rounded-lg">
              {countdown}s
            </div>
            {cameraReady && (
              <div className={cn(
                "absolute top-3 left-3 w-3 h-3 rounded-full",
                recorderRef.current?.state === "recording" ? "bg-red-500 animate-pulse" : "bg-white/60",
              )} />
            )}
          </div>
          <div className="flex gap-3">
            {recorderRef.current?.state === "recording" ? (
              <Button onClick={stopRecording} className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white">
                Stop Recording
              </Button>
            ) : (
              <Button onClick={startRecording} disabled={!cameraReady} className="flex-1 h-12 rounded-xl">
                Start Recording
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={() => { stopStream(); setView("choose"); }} className="w-full">
            Back
          </Button>
        </div>
      )}

      {/* Preview */}
      {view === "preview" && recordedUrl && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[50vh] mx-auto">
            <video src={recordedUrl} className="w-full h-full object-cover" controls playsInline />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRetake} className="flex-1 h-12 rounded-xl">
              Retake
            </Button>
            <Button onClick={handleConfirm} className="flex-1 h-12 rounded-xl">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Analyze
            </Button>
          </div>
        </div>
      )}

      {/* Uploading / Analyzing */}
      {view === "uploading" && (
        <div className="text-center py-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Analyzing your technique...</p>
            <p className="text-sm text-muted-foreground mt-1">AI is reviewing your {skillName} form</p>
          </div>
        </div>
      )}
    </div>
  )
}
