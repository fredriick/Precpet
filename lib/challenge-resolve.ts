export interface ChallengeOutcome {
  winnerToken: string | null
  tied: boolean
}

export function computeChallengeOutcome(
  challengerMinutes: number,
  opponentMinutes: number,
  challengerToken: string,
  opponentToken: string,
): ChallengeOutcome {
  if (challengerMinutes > opponentMinutes) {
    return { winnerToken: challengerToken, tied: false }
  }
  if (opponentMinutes > challengerMinutes) {
    return { winnerToken: opponentToken, tied: false }
  }
  return { winnerToken: null, tied: true }
}
