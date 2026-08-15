import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

function setupBrowserMocks() {
  const store = new Map<string, string>()
  vi.stubGlobal("crypto", {
    randomUUID: () => "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  })
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  })
}

function mockFetchResponse(status: number, body: unknown) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
  vi.stubGlobal("fetch", vi.fn(async () => res))
}

const fetchMock = () => vi.mocked(globalThis.fetch)

describe("lib/assignments", () => {
  beforeEach(() => {
    setupBrowserMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getAssignments returns created and claimed lists", async () => {
    mockFetchResponse(200, {
      created: [
        {
          id: "a1",
          skillId: "sk1",
          skillName: "Juggling",
          sport: "soccer",
          note: null,
          code: "AAA111",
          createdAt: "2026-08-01",
          claims: 2,
          completedClaims: 1,
        },
      ],
      claimed: [
        {
          id: "c1",
          assignmentId: "a1",
          completed: true,
          claimedAt: "2026-08-02",
          completedAt: "2026-08-03",
          skillId: "sk1",
          skillName: "Juggling",
          sport: "soccer",
          note: null,
          coachName: "Coach",
        },
      ],
    })
    const { getAssignments } = await import("@/lib/assignments")
    const result = await getAssignments()
    expect(result.configured).toBe(true)
    expect(result.created).toHaveLength(1)
    expect(result.created[0].code).toBe("AAA111")
    expect(result.claimed[0].completed).toBe(true)
  })

  it("getAssignments returns empty lists on failure", async () => {
    mockFetchResponse(500, { error: "boom" })
    const { getAssignments } = await import("@/lib/assignments")
    const result = await getAssignments()
    expect(result).toEqual({ configured: true, created: [], claimed: [] })
  })

  it("getAssignments reports configured:false when unconfigured", async () => {
    mockFetchResponse(200, { configured: false })
    const { getAssignments } = await import("@/lib/assignments")
    const result = await getAssignments()
    expect(result).toEqual({ configured: false, created: [], claimed: [] })
  })

  it("createAssignment posts the create action with skill details", async () => {
    mockFetchResponse(201, { id: "a1", skillName: "Juggling", code: "AAA111" })
    const { createAssignment } = await import("@/lib/assignments")
    const result = await createAssignment({
      skillId: "sk1",
      skillName: "Juggling",
      sport: "soccer",
      note: "30 min",
    })
    expect(result.code).toBe("AAA111")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      action: "create",
      skillId: "sk1",
      skillName: "Juggling",
      sport: "soccer",
      note: "30 min",
    })
  })

  it("createAssignment throws the API error on failure", async () => {
    mockFetchResponse(400, { error: "Missing skill" })
    const { createAssignment } = await import("@/lib/assignments")
    await expect(createAssignment({ skillId: "", skillName: "" })).rejects.toThrow("Missing skill")
  })

  it("claimAssignment posts the claim action with the code", async () => {
    mockFetchResponse(200, { ok: true })
    const { claimAssignment } = await import("@/lib/assignments")
    await claimAssignment("AAA111")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "claim", code: "AAA111" })
  })

  it("claimAssignment throws the API error on failure", async () => {
    mockFetchResponse(404, { error: "Assignment not found" })
    const { claimAssignment } = await import("@/lib/assignments")
    await expect(claimAssignment("ZZZ999")).rejects.toThrow("Assignment not found")
  })

  it("completeAssignment posts the complete action for the assignment id", async () => {
    mockFetchResponse(200, { ok: true })
    const { completeAssignment } = await import("@/lib/assignments")
    await completeAssignment("c1")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "complete", assignmentId: "c1" })
  })

  it("completeAssignment throws the API error on failure", async () => {
    mockFetchResponse(403, { error: "Not your assignment" })
    const { completeAssignment } = await import("@/lib/assignments")
    await expect(completeAssignment("c1")).rejects.toThrow("Not your assignment")
  })
})
