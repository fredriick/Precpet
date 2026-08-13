"use client"

import { getOrCreateSessionToken } from "@/lib/auth"

export type ChallengeStatus = "pending" | "accepted" | "declined" | "completed"

export interface Challenge {
  id: string
  challengerToken: string
  challengerName: string
  opponentToken: string
  opponentName: string
  sport: string | null
  status: ChallengeStatus
  winnerToken: string | null
  createdAt: string
  acceptedAt: string | null
  resolvedAt: string | null
  expiresAt: string
  challengerMinutes: number
  opponentMinutes: number
  mine: "challenger" | "opponent"
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-token": getOrCreateSessionToken(),
      ...(init?.headers ?? {}),
    },
  })
}

async function errorMessage(res: Response, fallback: string): Promise<Error> {
  let message = fallback
  try {
    const body = await res.json()
    if (typeof body?.error === "string") message = body.error
  } catch {
    // ignore
  }
  return new Error(message)
}

export async function getMyPlayerCode(): Promise<{ configured: boolean; code: string | null }> {
  const res = await api(`/api/player-code?token=${encodeURIComponent(getOrCreateSessionToken())}`)
  if (!res.ok) return { configured: true, code: null }
  const body = await res.json()
  if (body?.configured === false) return { configured: false, code: null }
  if (typeof body?.code !== "string") return { configured: true, code: null }
  return { configured: true, code: body.code }
}

export async function getChallenges(): Promise<{ configured: boolean; challenges: Challenge[] }> {
  const res = await api(`/api/challenges?token=${encodeURIComponent(getOrCreateSessionToken())}`)
  if (!res.ok) return { configured: true, challenges: [] }
  const body = await res.json()
  if (body?.configured === false) return { configured: false, challenges: [] }
  if (!Array.isArray(body?.challenges)) return { configured: true, challenges: [] }
  return { configured: true, challenges: body.challenges }
}

export async function createChallenge(input: { opponentCode: string; sport?: string }): Promise<void> {
  const res = await api("/api/challenges", {
    method: "POST",
    body: JSON.stringify({ action: "create", opponentCode: input.opponentCode, sport: input.sport }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't create the challenge.")
}

export async function acceptChallenge(id: string): Promise<void> {
  const res = await api("/api/challenges", {
    method: "POST",
    body: JSON.stringify({ action: "accept", id }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't accept the challenge.")
}

export async function declineChallenge(id: string): Promise<void> {
  const res = await api("/api/challenges", {
    method: "POST",
    body: JSON.stringify({ action: "decline", id }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't decline the challenge.")
}

export async function resolveChallenge(id: string): Promise<{ tied: boolean }> {
  const res = await api("/api/challenges", {
    method: "POST",
    body: JSON.stringify({ action: "resolve", id }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't resolve the challenge.")
  const body = await res.json()
  return { tied: body?.tied === true }
}
