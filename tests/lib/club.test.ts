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

describe("lib/club", () => {
  beforeEach(() => {
    setupBrowserMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getMyClub returns the first club when present", async () => {
    mockFetchResponse(200, {
      clubs: [
        { id: "c1", name: "Rovers", code: "ABC123", memberCount: 3 },
        { id: "c2", name: "City", code: "DEF456", memberCount: 9 },
      ],
    })
    const { getMyClub } = await import("@/lib/club")
    const result = await getMyClub()
    expect(result.configured).toBe(true)
    expect(result.club?.name).toBe("Rovers")
    expect(fetchMock()).toHaveBeenCalledWith(
      expect.stringContaining("/api/clubs?token="),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-session-token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }),
      }),
    )
  })

  it("getMyClub returns null club when the list is empty", async () => {
    mockFetchResponse(200, { clubs: [] })
    const { getMyClub } = await import("@/lib/club")
    const result = await getMyClub()
    expect(result).toEqual({ configured: true, club: null })
  })

  it("getMyClub reports configured:false when the API is unconfigured", async () => {
    mockFetchResponse(200, { clubs: [], configured: false })
    const { getMyClub } = await import("@/lib/club")
    const result = await getMyClub()
    expect(result.configured).toBe(false)
    expect(result.club).toBeNull()
  })

  it("getMyClub reports configured:false on an error response", async () => {
    mockFetchResponse(500, { error: "boom" })
    const { getMyClub } = await import("@/lib/club")
    const result = await getMyClub()
    expect(result.configured).toBe(false)
    expect(result.club).toBeNull()
  })

  it("createClub posts the create action and returns the club", async () => {
    mockFetchResponse(200, { id: "c1", name: "Rovers", code: "ABC123", memberCount: 1 })
    const { createClub } = await import("@/lib/club")
    const club = await createClub("Rovers")
    expect(club.name).toBe("Rovers")
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "create", name: "Rovers" })
  })

  it("createClub throws the API error message on failure", async () => {
    mockFetchResponse(400, { error: "Name too short" })
    const { createClub } = await import("@/lib/club")
    await expect(createClub("X")).rejects.toThrow("Name too short")
  })

  it("joinClub posts the join action with the given code", async () => {
    mockFetchResponse(200, { id: "c1", name: "Rovers", code: "ABC123", memberCount: 2 })
    const { joinClub } = await import("@/lib/club")
    const club = await joinClub("abc123")
    expect(club.memberCount).toBe(2)
    const call = fetchMock().mock.calls[0]
    expect(JSON.parse(String(call[1]?.body))).toEqual({ action: "join", code: "abc123" })
  })

  it("joinClub throws the API error message on failure", async () => {
    mockFetchResponse(404, { error: "Club not found" })
    const { joinClub } = await import("@/lib/club")
    await expect(joinClub("ZZZZZZ")).rejects.toThrow("Club not found")
  })

  it("lookupClubByCode returns the club or null on failure", async () => {
    mockFetchResponse(200, { id: "c1", name: "Rovers", code: "ABC123" })
    const { lookupClubByCode } = await import("@/lib/club")
    expect((await lookupClubByCode("ABC123"))?.name).toBe("Rovers")

    mockFetchResponse(404, { error: "Club not found" })
    expect(await lookupClubByCode("ZZZZZZ")).toBeNull()
  })
})
