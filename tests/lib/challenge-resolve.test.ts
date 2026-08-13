import { describe, it, expect } from "vitest"
import { computeChallengeOutcome } from "@/lib/challenge-resolve"

const challenger = "token-a"
const opponent = "token-b"

describe("computeChallengeOutcome", () => {
  it("awards the win to the challenger when they have more minutes", () => {
    const outcome = computeChallengeOutcome(120, 90, challenger, opponent)
    expect(outcome.winnerToken).toBe(challenger)
    expect(outcome.tied).toBe(false)
  })

  it("awards the win to the opponent when they have more minutes", () => {
    const outcome = computeChallengeOutcome(60, 140, challenger, opponent)
    expect(outcome.winnerToken).toBe(opponent)
    expect(outcome.tied).toBe(false)
  })

  it("reports a tie when minutes are equal", () => {
    const outcome = computeChallengeOutcome(100, 100, challenger, opponent)
    expect(outcome.winnerToken).toBeNull()
    expect(outcome.tied).toBe(true)
  })

  it("treats zero minutes for both as a tie", () => {
    const outcome = computeChallengeOutcome(0, 0, challenger, opponent)
    expect(outcome.tied).toBe(true)
    expect(outcome.winnerToken).toBeNull()
  })
})
