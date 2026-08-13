import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateClubCode } from "@/lib/club-code"

// GET /api/player-code?token=<session token>
// Returns the player's short shareable code, generating one on first use.
export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ configured: false })
  }

  const token = new URL(request.url).searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const { data: existing, error: existingError } = await supabase
    .from("player_codes")
    .select("code")
    .eq("session_token", token)
    .maybeSingle()

  if (existingError) {
    console.error("Player code lookup error:", existingError.message)
    return NextResponse.json({ error: "Failed to load player code" }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ code: existing.code })
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateClubCode()
    const { data, error } = await supabase
      .from("player_codes")
      .insert({ session_token: token, code })
      .select("code")
      .maybeSingle()
    if (!error && data) {
      return NextResponse.json({ code: data.code })
    }
  }

  return NextResponse.json({ error: "Failed to create player code" }, { status: 500 })
}
