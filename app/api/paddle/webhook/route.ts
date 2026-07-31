import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

type PaddleEventName =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.cancelled"
  | "subscription.activated"

interface PaddleWebhookPayload {
  event_id: string
  event_type: PaddleEventName
  data: {
    id: string
    custom_data?: Record<string, string>
    customer_id?: string
    status?: string
    items?: { price: { id: string } }[]
  }
}

function verifySignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = signatureHeader.split(";")
  let ts = ""
  let h1 = ""
  for (const part of parts) {
    const [key, value] = part.split("=")
    if (key === "ts") ts = value
    if (key === "h1") h1 = value
  }
  if (!ts || !h1) return Promise.resolve(false)

  const encoder = new TextEncoder()
  const signedPayload = `${ts}:${rawBody}`
  const keyBytes = encoder.encode(secret)
  const payloadBytes = encoder.encode(signedPayload)

  return crypto.subtle
    .importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"])
    .then((key) => crypto.subtle.verify("HMAC", key, hexToBuffer(h1), payloadBytes))
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signatureHeader = request.headers.get("Paddle-Signature")
    const secret = process.env.PADDLE_WEBHOOK_SECRET

    if (secret && signatureHeader) {
      const valid = await verifySignature(rawBody, signatureHeader, secret)
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload: PaddleWebhookPayload = JSON.parse(rawBody)
    const { event_type, data } = payload

    if (
      event_type !== "subscription.created" &&
      event_type !== "subscription.updated" &&
      event_type !== "subscription.cancelled" &&
      event_type !== "subscription.activated"
    ) {
      return NextResponse.json({ received: true })
    }

    const userId = data.custom_data?.userId
    if (!userId) {
      return NextResponse.json({ error: "No userId in custom_data" }, { status: 400 })
    }

    const isPro = event_type === "subscription.created" || event_type === "subscription.activated" || event_type === "subscription.updated"

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    await supabase.from("user_stats").upsert(
      {
        user_id: userId,
        is_pro: isPro,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[paddle-webhook]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
