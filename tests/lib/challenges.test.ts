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

describe("lib/challenges", () => {
  beforeEach(() => {
    setupBrowserMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getMyPlayerCode returns the code from the API", async () => {
    mockFetchResponse(200, { code: "ABCDEF" })
    const { getMyPlayerCode } = await import("@/lib/challenges")
    const result = await getMyPlayerCode()
    expect(result).toEqual({ configured: true, code: "ABCDEF" })
  })

  it("getMyPlayerCode returns null code on failure", async () => {
    mockFetchResponse(500, { error: "boom" })
    const { getMyPlayerCode } = await import("@/lib/challenges")
    const result = await getMyPlayerCode()
    expect(result).toEqual({ configured: true, code: null })
  })

  it("getMyPlayerCode reports configured:false when unconfigured", async () => {
    mockFetchResponse(200, { configured: false })
    const { getMyPlayerCode } = await import("@/lib/challenges")
    const result = await getMyPlayerCode()
    expect(result).toEqual({ configured: false, code: null })
  })

  it("getChallenges returns the challenge list", async () => {
    const challenge = {
      id: "ch1",
      challengerToken: "a",
      challengerName: "Alex",
      opponentToken: "b",
      opponentName: "Bex",
      sport: "soccer",
      status: "pending",
      winnerToken: null,
      createdAt: "2026-08-01",
      acceptedAt: null,
      resolvedAt: null,
      expiresAt: "2026-08-08",
      challengerMinutes: 10,
      opponentMinutes: 5,
      mine: "challenger",
    }
    mockFetchResponse(200, { challenges: [challenge] })
    const { getChallenges } = await import("@/lib/challenges")
    const result = await getChallenges()
    expect(result.configured).toBe(true)
    expect(result.challenges).toHaveLength(1)
    expect(result.challenges[0].status).toBe("pending")
  })

  it("getChallenges returns an empty list on failure", async () => {
    mockFetchResponse(500, { error: "boom" })
    const { getChallenges } = await import("@/lib/challenges")
    const result = await getChallenges()
    expect(result).toEqual({ configured: true, challenges: [] })
  })

  it("createChallenge posts opponentCode and sport", async () => {
    mockFetchResponse(201, { id: "ch1" })
    const { createChallenge } = await import("@/lib/challenges")
    await createChallenge({ opponentCode: "abc123", sport: "basketball" })
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      action: "create",
      opponentCode: "abc123",
      sport: "basketball",
    })
  })

  it("createChallenge throws the API error on failure", async () => {
    mockFetchResponse(404, { error: "Player not found" })
    const { createChallenge } = await import("@/lib/challenges")
    await expect(createChallenge({ opponentCode: "NOBODY" })).rejects.toThrow("Player not found")
  })

  it("acceptChallenge posts the accept action for the id", async () => {
    mockFetchResponse(200, { ok: true })
    const { acceptChallenge } = await import("@/lib/challenges")
    await acceptChallenge("ch1")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "accept", id: "ch1" })
  })

  it("declineChallenge posts the decline action for the id", async () => {
    mockFetchResponse(200, { ok: true })
    const { declineChallenge } = await import("@/lib/challenges")
    await declineChallenge("ch1")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "decline", id: "ch1" })
  })

  it("resolveChallenge returns tied when the API reports a tie", async () => {
    mockFetchResponse(200, { ok: true, tied: true })
    const { resolveChallenge } = await import("@/lib/challenges")
    await expect(resolveChallenge("ch1")).resolves.toEqual({ tied: true })
  })

  it("resolveChallenge returns tied:false otherwise", async () => {
    mockFetchResponse(200, { ok: true, tied: false, winnerToken: "a" })
    const { resolveChallenge } = await import("@/lib/challenges")
    await expect(resolveChallenge("ch1")).resolves.toEqual({ tied: false })
  })

  it("resolveChallenge throws on failure", async () => {
    mockFetchResponse(403, { error: "Not your challenge" })
    const { resolveChallenge } = await import("@/lib/challenges")
    await expect(resolveChallenge("ch1")).rejects.toThrow("Not your challenge")
  })
})
