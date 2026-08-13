import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { normalizeClubCode } from "@/lib/club-code"
import { computeChallengeOutcome } from "@/lib/challenge-resolve"

function currentWeek(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}

const createSchema = z.object({
  action: z.literal("create"),
  opponentCode: z.string().trim().min(1).max(20).optional(),
  opponentId: z.string().trim().min(1).max(100).optional(),
  sport: z.string().trim().max(40).optional(),
})

const idSchema = z.object({
  id: z.string().uuid(),
})

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "resolve"]),
})

function escape(value: string): string {
  return value.replace(/'/g, "''")
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ challenges: [], configured: false })
  }

  const token = new URL(request.url).searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*")
    .or(`challenger_token.eq.${escape(token)},opponent_token.eq.${escape(token)}`)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Challenges GET error:", error.message)
    return NextResponse.json({ error: "Failed to load challenges" }, { status: 500 })
  }

  const tokens = new Set<string>()
  for (const c of challenges ?? []) {
    tokens.add(c.challenger_token)
    tokens.add(c.opponent_token)
  }

  const minutesByToken = new Map<string, number>()
  if (tokens.size > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from("leaderboard_entries")
      .select("session_token, minutes")
      .eq("week", currentWeek())
      .in("session_token", [...tokens])
    if (!entriesError) {
      for (const e of entries ?? []) {
        minutesByToken.set(e.session_token, e.minutes)
      }
    }
  }

  const result = (challenges ?? []).map((c) => ({
    id: c.id,
    challengerToken: c.challenger_token,
    challengerName: c.challenger_name,
    opponentToken: c.opponent_token,
    opponentName: c.opponent_name,
    sport: c.sport ?? null,
    status: c.status,
    winnerToken: c.winner_token ?? null,
    createdAt: c.created_at,
    acceptedAt: c.accepted_at ?? null,
    resolvedAt: c.resolved_at ?? null,
    expiresAt: c.expires_at,
    challengerMinutes: minutesByToken.get(c.challenger_token) ?? 0,
    opponentMinutes: minutesByToken.get(c.opponent_token) ?? 0,
    mine: c.challenger_token === token ? "challenger" : "opponent",
  }))

  return NextResponse.json({ challenges: result })
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  const token = request.headers.get("x-session-token")
  if (!token) {
    return NextResponse.json({ error: "Missing session token" }, { status: 401 })
  }

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10)
  if (contentLength > 10_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 })
  }

  const body = await request.json()

  if (body?.action === "create") {
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!parsed.data.opponentCode && !parsed.data.opponentId) {
      return NextResponse.json({ error: "Enter your opponent's player code" }, { status: 400 })
    }

    let opponentToken: string
    if (parsed.data.opponentId) {
      opponentToken = parsed.data.opponentId
    } else {
      const normalized = normalizeClubCode(parsed.data.opponentCode!)
      if (!normalized) {
        return NextResponse.json({ error: "Invalid player code" }, { status: 400 })
      }
      const { data: player, error: playerError } = await supabase
        .from("player_codes")
        .select("session_token")
        .eq("code", normalized)
        .maybeSingle()
      if (playerError) {
        console.error("Player lookup error:", playerError.message)
        return NextResponse.json({ error: "Failed to look up player" }, { status: 500 })
      }
      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 })
      }
      opponentToken = player.session_token
    }

    if (opponentToken === token) {
      return NextResponse.json({ error: "You can't challenge yourself" }, { status: 400 })
    }

    const { data: challengerEntry } = await supabase
      .from("leaderboard_entries")
      .select("name")
      .eq("session_token", token)
      .eq("week", currentWeek())
      .maybeSingle()

    const { data: opponentEntry } = await supabase
      .from("leaderboard_entries")
      .select("name")
      .eq("session_token", opponentToken)
      .eq("week", currentWeek())
      .maybeSingle()

    const { data: created, error } = await supabase
      .from("challenges")
      .insert({
        challenger_token: token,
        challenger_name: challengerEntry?.name ?? "Anonymous",
        opponent_token: opponentToken,
        opponent_name: opponentEntry?.name ?? "Anonymous",
        sport: parsed.data.sport ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error("Challenge create error:", error.message)
      return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
    }

    return NextResponse.json({ id: created.id }, { status: 201 })
  }

  if (body?.action === "accept" || body?.action === "decline" || body?.action === "resolve") {
    const parsedId = idSchema.safeParse(body)
    const parsedAction = actionSchema.safeParse(body)
    if (!parsedId.success || !parsedAction.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", parsedId.data.id)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.challenger_token !== token && challenge.opponent_token !== token) {
      return NextResponse.json({ error: "Not your challenge" }, { status: 403 })
    }

    const action = parsedAction.data.action

    if (action === "accept") {
      if (challenge.status !== "pending") {
        return NextResponse.json({ error: "Challenge is not pending" }, { status: 400 })
      }
      if (challenge.opponent_token !== token) {
        return NextResponse.json({ error: "Only the opponent can accept" }, { status: 403 })
      }
      const { error } = await supabase
        .from("challenges")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", challenge.id)
      if (error) {
        console.error("Challenge accept error:", error.message)
        return NextResponse.json({ error: "Failed to accept challenge" }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "decline") {
      if (challenge.status !== "pending") {
        return NextResponse.json({ error: "Challenge is not pending" }, { status: 400 })
      }
      if (challenge.opponent_token !== token) {
        return NextResponse.json({ error: "Only the opponent can decline" }, { status: 403 })
      }
      const { error } = await supabase
        .from("challenges")
        .update({ status: "declined", resolved_at: new Date().toISOString() })
        .eq("id", challenge.id)
      if (error) {
        console.error("Challenge decline error:", error.message)
        return NextResponse.json({ error: "Failed to decline challenge" }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    // resolve
    if (challenge.status !== "accepted") {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 })
    }

    const { data: entries, error: entriesError } = await supabase
      .from("leaderboard_entries")
      .select("session_token, minutes")
      .eq("week", currentWeek())
      .in("session_token", [challenge.challenger_token, challenge.opponent_token])

    if (entriesError) {
      console.error("Challenge resolve minutes error:", entriesError.message)
      return NextResponse.json({ error: "Failed to resolve challenge" }, { status: 500 })
    }

    const minutesByToken = new Map<string, number>()
    for (const e of entries ?? []) {
      minutesByToken.set(e.session_token, e.minutes)
    }

    const outcome = computeChallengeOutcome(
      minutesByToken.get(challenge.challenger_token) ?? 0,
      minutesByToken.get(challenge.opponent_token) ?? 0,
      challenge.challenger_token,
      challenge.opponent_token,
    )

    const { error } = await supabase
      .from("challenges")
      .update({
        status: "completed",
        winner_token: outcome.winnerToken,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", challenge.id)

    if (error) {
      console.error("Challenge resolve error:", error.message)
      return NextResponse.json({ error: "Failed to resolve challenge" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, tied: outcome.tied, winnerToken: outcome.winnerToken })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
