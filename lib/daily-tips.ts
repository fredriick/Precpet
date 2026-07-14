import type { Sport } from "@/lib/types"

const generalTips: string[] = [
  "Warm up for at least 5 minutes before every session to prevent injury.",
  "Consistency beats intensity — short daily practice outperforms rare long sessions.",
  "Film yourself occasionally; watching your own motion reveals habits you can't feel.",
  "Focus on quality reps. Ten mindful repetitions beat fifty sloppy ones.",
  "Stay hydrated — even mild dehydration reduces coordination and reaction time.",
  "Rest days matter. Muscles adapt and grow while you recover, not while you train.",
  "Set a single focus for each session instead of trying to fix everything at once.",
]

const sportTips: Record<Sport, string[]> = {
  soccer: [
    "Practice with both feet — a two-footed player is twice as unpredictable.",
    "Keep your head up while dribbling to scan for passing lanes.",
    "Small touches keep the ball close under pressure; big touches waste control.",
    "Plant your non-kicking foot beside the ball for more accurate passes.",
    "Shield the ball with your body between the defender and the ball.",
  ],
  basketball: [
    "Follow through on every shot — snap the wrist and hold the pose.",
    "Keep your dribble below the waist to protect it from defenders.",
    "Bend your knees on defense to react faster in any direction.",
    "Square your shoulders to the rim before you release your shot.",
    "Use your off-hand as a guide, not a driver, when shooting.",
  ],
  tennis: [
    "Split-step as your opponent hits to react faster to any shot.",
    "Rotate your hips and shoulders — power comes from your core, not your arm.",
    "Watch the ball all the way to your strings on every contact.",
    "Recover to the center after each shot to cover the most court.",
    "Loosen your grip between points to keep your arm relaxed and fast.",
  ],
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getDailyTip(sport: Sport, date: Date = new Date()): string {
  const pool = [...sportTips[sport], ...generalTips]
  const index = dayOfYear(date) % pool.length
  return pool[index]
}
