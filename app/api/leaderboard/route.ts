import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { rankLeaderboard, type RankedLeaderboard } from "@/lib/leaderboard-rank"

function currentWeek(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}

const emptyResponse: RankedLeaderboard = { top: [], user: null, configured: false }

const postSchema = z.object({
  name: z.string().max(60).optional(),
  sport: z.string().max(40).optional(),
  minutes: z.number().min(0).max(100000),
})

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json(emptyResponse)
  }

  const token = new URL(request.url).searchParams.get("token")
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("session_token, name, minutes")
    .eq("week", currentWeek())
    .order("minutes", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Leaderboard GET error:", error.message)
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 })
  }

  return NextResponse.json(rankLeaderboard(data ?? [], token))
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json(emptyResponse)
  }

  const token = request.headers.get("x-session-token")
  if (!token) {
    return NextResponse.json({ error: "Missing session token" }, { status: 401 })
  }

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10)
  if (contentLength > 10_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 })
  }

  const parsed = postSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, sport, minutes } = parsed.data
  const week = currentWeek()

  const { error: upsertError } = await supabase.from("leaderboard_entries").upsert(
    {
      session_token: token,
      name: name?.trim() || "Anonymous",
      sport: sport ?? null,
      week,
      minutes: Math.round(minutes),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_token,week" },
  )

  if (upsertError) {
    console.error("Leaderboard POST error:", upsertError.message)
    return NextResponse.json({ error: "Failed to update leaderboard" }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("session_token, name, minutes")
    .eq("week", week)
    .order("minutes", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Leaderboard POST read error:", error.message)
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 })
  }

  return NextResponse.json(rankLeaderboard(data ?? [], token))
}
