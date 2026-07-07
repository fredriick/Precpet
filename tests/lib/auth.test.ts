import { describe, it, expect, beforeEach, vi } from "vitest"

const SESSION_KEY = "precept_session"

function setupMocks() {
  const store = new Map<string, string>()
  vi.stubGlobal("crypto", {
    randomUUID: () => "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  })
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size
    },
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
  })
  return store
}

describe("auth", () => {
  beforeEach(() => {
    setupMocks()
  })

  it("getOrCreateSessionToken creates a new token if none exists", async () => {
    const { getOrCreateSessionToken } = await import("@/lib/auth")
    const token = getOrCreateSessionToken()
    expect(token).toBe("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
  })

  it("getOrCreateSessionToken returns existing token", async () => {
    localStorage.setItem(SESSION_KEY, "existing-token")
    const { getOrCreateSessionToken } = await import("@/lib/auth")
    expect(getOrCreateSessionToken()).toBe("existing-token")
  })

  it("getSessionToken returns null when not set", async () => {
    const { getSessionToken } = await import("@/lib/auth")
    expect(getSessionToken()).toBeNull()
  })

  it("getSessionToken returns the stored token", async () => {
    localStorage.setItem(SESSION_KEY, "my-token")
    const { getSessionToken } = await import("@/lib/auth")
    expect(getSessionToken()).toBe("my-token")
  })
})
