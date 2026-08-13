import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateClubCode, normalizeClubCode } from "@/lib/club-code"

const createSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(2).max(40),
})

const joinSchema = z.object({
  action: z.literal("join"),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().max(60).optional(),
})

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ clubs: [], configured: false })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const token = url.searchParams.get("token")

  if (code) {
    const normalized = normalizeClubCode(code)
    if (!normalized) {
      return NextResponse.json({ error: "Invalid club code" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("clubs")
      .select("id, name, code")
      .eq("code", normalized)
      .maybeSingle()
    if (error) {
      console.error("Club lookup error:", error.message)
      return NextResponse.json({ error: "Failed to look up club" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const { data: memberships, error } = await supabase
    .from("club_members")
    .select("club_id, clubs(id, name, code)")
    .eq("session_token", token)

  if (error) {
    console.error("Club memberships error:", error.message)
    return NextResponse.json({ error: "Failed to load clubs" }, { status: 500 })
  }

  const clubs = []
  for (const m of memberships ?? []) {
    const club = Array.isArray(m.clubs) ? m.clubs[0] : m.clubs
    if (!club) continue
    const { count } = await supabase
      .from("club_members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
    clubs.push({ ...club, memberCount: count ?? 0 })
  }

  return NextResponse.json({ clubs })
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

    let club: { id: string; name: string; code: string } | null = null
    for (let attempt = 0; attempt < 3 && !club; attempt++) {
      const code = generateClubCode()
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name: parsed.data.name, code })
        .select("id, name, code")
        .maybeSingle()
      if (!error && data) {
        club = data
      }
    }

    if (!club) {
      return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
    }

    const { error: memberError } = await supabase.from("club_members").upsert(
      { club_id: club.id, session_token: token, name: "You" },
      { onConflict: "club_id,session_token" },
    )
    if (memberError) {
      console.error("Club member create error:", memberError.message)
      return NextResponse.json({ error: "Failed to join new club" }, { status: 500 })
    }

    return NextResponse.json({ ...club, memberCount: 1 })
  }

  if (body?.action === "join") {
    const parsed = joinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const normalized = normalizeClubCode(parsed.data.code)
    if (!normalized) {
      return NextResponse.json({ error: "Invalid club code" }, { status: 400 })
    }

    const { data: club, error } = await supabase
      .from("clubs")
      .select("id, name, code")
      .eq("code", normalized)
      .maybeSingle()
    if (error) {
      console.error("Club join lookup error:", error.message)
      return NextResponse.json({ error: "Failed to look up club" }, { status: 500 })
    }
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 })
    }

    const { error: joinError } = await supabase.from("club_members").upsert(
      { club_id: club.id, session_token: token, name: parsed.data.name?.trim() || "You" },
      { onConflict: "club_id,session_token" },
    )
    if (joinError) {
      console.error("Club member join error:", joinError.message)
      return NextResponse.json({ error: "Failed to join club" }, { status: 500 })
    }

    const { count } = await supabase
      .from("club_members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)

    return NextResponse.json({ ...club, memberCount: count ?? 1 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
