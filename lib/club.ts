"use client"

import { getOrCreateSessionToken } from "@/lib/auth"

export interface ClubSummary {
  id: string
  name: string
  code: string
  memberCount: number
}

export interface ClubLookup {
  id: string
  name: string
  code: string
}

export type MyClubResult =
  | { configured: false; club: null }
  | { configured: true; club: ClubSummary | null }

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

export async function getMyClub(): Promise<MyClubResult> {
  const res = await api(`/api/clubs?token=${encodeURIComponent(getOrCreateSessionToken())}`)
  if (!res.ok) return { configured: false, club: null }
  const body = await res.json()
  if (body?.configured === false) return { configured: false, club: null }
  const club = Array.isArray(body?.clubs) && body.clubs.length > 0 ? (body.clubs[0] as ClubSummary) : null
  return { configured: true, club }
}

export async function createClub(name: string): Promise<ClubSummary> {
  const res = await api("/api/clubs", {
    method: "POST",
    body: JSON.stringify({ action: "create", name }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't create the club.")
  return res.json()
}

export async function joinClub(code: string): Promise<ClubSummary> {
  const res = await api("/api/clubs", {
    method: "POST",
    body: JSON.stringify({ action: "join", code }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't join that club.")
  return res.json()
}

export async function lookupClubByCode(code: string): Promise<ClubLookup | null> {
  const res = await api(`/api/clubs?code=${encodeURIComponent(code)}`)
  if (!res.ok) return null
  return res.json()
}
