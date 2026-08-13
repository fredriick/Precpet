// Ambiguous characters (I, O, 0, 1) are excluded so codes are easy to
// read and share over voice or text.
export const CLUB_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateClubCode(length = 6): string {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += CLUB_CODE_ALPHABET[Math.floor(Math.random() * CLUB_CODE_ALPHABET.length)]
  }
  return code
}

export function normalizeClubCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (cleaned.length < 4 || cleaned.length > 12) return null
  return cleaned
}
