"use client"

import { getOrCreateSessionToken } from "@/lib/auth"

export interface CreatedAssignment {
  id: string
  skillId: string
  skillName: string
  sport: string | null
  note: string | null
  code: string
  createdAt: string
  claims: number
  completedClaims: number
}

export interface ClaimedAssignment {
  id: string
  assignmentId: string
  completed: boolean
  claimedAt: string
  completedAt: string | null
  skillId: string
  skillName: string
  sport: string | null
  note: string | null
  coachName: string
}

export interface AssignmentsResult {
  configured: boolean
  created: CreatedAssignment[]
  claimed: ClaimedAssignment[]
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

export async function getAssignments(): Promise<AssignmentsResult> {
  const res = await api(`/api/assignments?token=${encodeURIComponent(getOrCreateSessionToken())}`)
  if (!res.ok) return { configured: true, created: [], claimed: [] }
  const body = await res.json()
  if (body?.configured === false) return { configured: false, created: [], claimed: [] }
  return {
    configured: true,
    created: Array.isArray(body?.created) ? body.created : [],
    claimed: Array.isArray(body?.claimed) ? body.claimed : [],
  }
}

export async function createAssignment(input: { skillId: string; skillName: string; sport?: string; note?: string }): Promise<{
  id: string
  skillName: string
  code: string
}> {
  const res = await api("/api/assignments", {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      skillId: input.skillId,
      skillName: input.skillName,
      sport: input.sport,
      note: input.note,
    }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't create the assignment.")
  return res.json()
}

export async function claimAssignment(code: string): Promise<void> {
  const res = await api("/api/assignments", {
    method: "POST",
    body: JSON.stringify({ action: "claim", code }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't claim the assignment.")
}

export async function completeAssignment(assignmentId: string): Promise<void> {
  const res = await api("/api/assignments", {
    method: "POST",
    body: JSON.stringify({ action: "complete", assignmentId }),
  })
  if (!res.ok) throw await errorMessage(res, "Couldn't update the assignment.")
}
