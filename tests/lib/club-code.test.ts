import { describe, it, expect } from "vitest"
import { CLUB_CODE_ALPHABET, generateClubCode, normalizeClubCode } from "@/lib/club-code"

describe("generateClubCode", () => {
  it("returns a 6-character code by default", () => {
    expect(generateClubCode()).toMatch(/^[A-Z2-9]{6}$/)
  })

  it("respects a custom length", () => {
    expect(generateClubCode(8)).toMatch(/^[A-Z2-9]{8}$/)
  })

  it("only uses unambiguous characters", () => {
    const codes = Array.from({ length: 200 }, () => generateClubCode())
    for (const code of codes) {
      for (const char of code) {
        expect(CLUB_CODE_ALPHABET).toContain(char)
      }
    }
  })

  it("generates varied codes", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateClubCode()))
    expect(codes.size).toBeGreaterThan(10)
  })
})

describe("normalizeClubCode", () => {
  it("upper-cases and trims input", () => {
    expect(normalizeClubCode("  abc 234 ")).toBe("ABC234")
  })

  it("strips dashes and spaces", () => {
    expect(normalizeClubCode("ab-c3 d")).toBe("ABC3D")
  })

  it("rejects codes that are too short", () => {
    expect(normalizeClubCode("ab1")).toBeNull()
  })

  it("rejects codes that are too long", () => {
    expect(normalizeClubCode("ABC234567890123")).toBeNull()
  })
})
