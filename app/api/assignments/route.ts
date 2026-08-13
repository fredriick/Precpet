import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateClubCode, normalizeClubCode } from "@/lib/club-code"

const createSchema = z.object({
  action: z.literal("create"),
  skillId: z.string().trim().min(1).max(80),
  skillName: z.string().trim().min(1).max(80).optional(),
  sport: z.string().trim().max(40).optional(),
  note: z.string().trim().max(280).optional(),
})

const claimSchema = z.object({
  action: z.literal("claim"),
  code: z.string().trim().min(1).max(20),
  athleteName: z.string().trim().max(60).optional(),
})

const completeSchema = z.object({
  action: z.literal("complete"),
  assignmentId: z.string().uuid(),
})

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ created: [], claimed: [], configured: false })
  }

  const token = new URL(request.url).searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const [createdRes, claimedRes] = await Promise.all([
    supabase.from("drill_assignments").select("*").eq("coach_token", token).order("created_at", { ascending: false }).limit(50),
    supabase.from("assignment_claims").select("*, drill_assignments(skill_id, skill_name, sport, note, coach_name, code)").eq("athlete_token", token).order("claimed_at", { ascending: false }).limit(50),
  ])

  const createdRaw = createdRes.data ?? []
  const claimedRaw = claimedRes.data ?? []

  const created = []
  for (const a of createdRaw) {
    const { count } = await supabase
      .from("assignment_claims")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", a.id)
    const { count: completedCount } = await supabase
      .from("assignment_claims")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", a.id)
      .eq("completed", true)
    created.push({
      id: a.id,
      skillId: a.skill_id,
      skillName: a.skill_name,
      sport: a.sport ?? null,
      note: a.note ?? null,
      code: a.code,
      createdAt: a.created_at,
      claims: count ?? 0,
      completedClaims: completedCount ?? 0,
    })
  }

  const claimed = claimedRaw.map((c) => ({
    id: c.id,
    assignmentId: c.assignment_id,
    completed: c.completed,
    claimedAt: c.claimed_at,
    completedAt: c.completed_at ?? null,
    skillId: c.drill_assignments?.skill_id ?? "",
    skillName: c.drill_assignments?.skill_name ?? "Drill",
    sport: c.drill_assignments?.sport ?? null,
    note: c.drill_assignments?.note ?? null,
    coachName: c.drill_assignments?.coach_name ?? "Coach",
  }))

  return NextResponse.json({ created, claimed, configured: true })
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

    let code: string | null = null
    let created: { id: string; skill_name: string; code: string } | null = null
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      code = generateClubCode()
      const { data, error } = await supabase
        .from("drill_assignments")
        .insert({
          coach_token: token,
          coach_name: "Coach",
          skill_id: parsed.data.skillId,
          skill_name: parsed.data.skillName || "Drill",
          sport: parsed.data.sport ?? null,
          note: parsed.data.note ?? null,
          code,
        })
        .select("id, skill_name, code")
        .maybeSingle()
      if (!error && data) created = data
    }

    if (!created) {
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }

    return NextResponse.json(
      { id: created.id, skillName: created.skill_name, code: created.code },
      { status: 201 },
    )
  }

  if (body?.action === "claim") {
    const parsed = claimSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const normalized = normalizeClubCode(parsed.data.code)
    if (!normalized) {
      return NextResponse.json({ error: "Invalid assignment code" }, { status: 400 })
    }

    const { data: assignment, error: findError } = await supabase
      .from("drill_assignments")
      .select("id, skill_name, code")
      .eq("code", normalized)
      .maybeSingle()
    if (findError) {
      console.error("Assignment lookup error:", findError.message)
      return NextResponse.json({ error: "Failed to look up assignment" }, { status: 500 })
    }
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const { error } = await supabase.from("assignment_claims").upsert(
      {
        assignment_id: assignment.id,
        athlete_token: token,
        athlete_name: parsed.data.athleteName?.trim() || "Anonymous",
      },
      { onConflict: "assignment_id,athlete_token" },
    )
    if (error) {
      console.error("Assignment claim error:", error.message)
      return NextResponse.json({ error: "Failed to claim assignment" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, assignmentId: assignment.id })
  }

  if (body?.action === "complete") {
    const parsed = completeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { data: claim, error: claimError } = await supabase
      .from("assignment_claims")
      .select("id, completed")
      .eq("assignment_id", parsed.data.assignmentId)
      .eq("athlete_token", token)
      .maybeSingle()
    if (claimError) {
      console.error("Assignment claim error:", claimError.message)
      return NextResponse.json({ error: "Failed to load claim" }, { status: 500 })
    }
    if (!claim) {
      return NextResponse.json({ error: "Claim this assignment first" }, { status: 404 })
    }
    if (claim.completed) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from("assignment_claims")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", claim.id)
    if (error) {
      console.error("Assignment complete error:", error.message)
      return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
