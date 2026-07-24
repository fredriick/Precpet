import type { Program } from "./types"

export const trainingPrograms: Program[] = [
  {
    id: "beginner-fundamentals",
    name: "Beginner Fundamentals",
    description: "Master the essential moves every player needs. Build confidence on the ball with these foundational techniques.",
    sport: "soccer",
    category: "full",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "soccer", skillId: "step-over", duration: 4, reps: 10, instruction: "Practice the step over motion slowly, focusing on body feint" },
      { sport: "soccer", skillId: "drag-back", duration: 4, reps: 12, instruction: "Drag back and turn in both directions" },
      { sport: "soccer", skillId: "inside-foot-pass", duration: 4, reps: 20, instruction: "Alternate feet, focus on clean contact" },
      { sport: "soccer", skillId: "step-over", duration: 3, reps: 8, instruction: "Full speed step overs with direction change" },
      { sport: "soccer", skillId: "drag-back", duration: 3, reps: 8, instruction: "Drag back under pressure — accelerate after" },
    ],
  },
  {
    id: "dribbling-mastery",
    name: "Dribbling Mastery",
    description: "A complete dribbling workout covering all four core moves. Build unpredictability and close control.",
    sport: "soccer",
    category: "dribbling",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { sport: "soccer", skillId: "cruyff-turn", duration: 5, reps: 10, instruction: "Cruyff turn with both feet, focusing on selling the feint" },
      { sport: "soccer", skillId: "la-croqueta", duration: 5, reps: 12, instruction: "Rapid lateral shifts through cones" },
      { sport: "soccer", skillId: "elastico", duration: 5, reps: 10, instruction: "Inside-out flick with the front foot" },
      { sport: "soccer", skillId: "body-feint", duration: 4, reps: 10, instruction: "Shoulder drop + push in opposite direction" },
      { sport: "soccer", skillId: "cruyff-turn", duration: 3, reps: 6, instruction: "Cruyff turn at full speed into sprint" },
    ],
  },
  {
    id: "passing-accurary",
    name: "Passing Precision",
    description: "Sharpen your passing with these essential techniques. From short passes to driven balls and lofted through balls.",
    sport: "soccer",
    category: "passing",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "soccer", skillId: "inside-foot-pass", duration: 4, reps: 20, instruction: "Short passes against a wall, both feet" },
      { sport: "soccer", skillId: "driven-pass", duration: 5, reps: 15, instruction: "Driven passes with laces, focus on follow-through" },
      { sport: "soccer", skillId: "lofted-through-ball", duration: 5, reps: 12, instruction: "Lofted balls over a cone into a target zone" },
      { sport: "soccer", skillId: "driven-pass", duration: 3, reps: 10, instruction: "First-time driven passes" },
    ],
  },
  {
    id: "finishing-clinic",
    name: "Finishing Clinic",
    description: "Develop a deadly finishing ability. Laces shots, curling finishes, and volleys in a high-rep workout.",
    sport: "soccer",
    category: "shooting",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { sport: "soccer", skillId: "laces-shot", duration: 5, reps: 12, instruction: "Laces shots from just outside the box" },
      { sport: "soccer", skillId: "curling-finish", duration: 5, reps: 10, instruction: "Curling finishes into the far post" },
      { sport: "soccer", skillId: "volley", duration: 5, reps: 10, instruction: "Volleys from crossed balls" },
      { sport: "soccer", skillId: "laces-shot", duration: 4, reps: 8, instruction: "One-touch finishes after a dribble" },
    ],
  },
  {
    id: "defensive-solidarity",
    name: "Defensive Solidity",
    description: "Build your defensive foundations. Learn proper jockeying, timing of tackles, and sliding challenges.",
    sport: "soccer",
    category: "defending",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "soccer", skillId: "jockey", duration: 5, reps: 6, instruction: "Jockey side-to-side through cones, stay low" },
      { sport: "soccer", skillId: "standing-tackle", duration: 5, reps: 10, instruction: "Standing tackle technique — timing the poke" },
      { sport: "soccer", skillId: "slide-tackle", duration: 4, reps: 8, instruction: "Slide tackle on grass or soft surface" },
      { sport: "soccer", skillId: "jockey", duration: 3, reps: 4, instruction: "Jockey → standing tackle → recover" },
    ],
  },
  {
    id: "elite-playmaker",
    name: "Elite Playmaker",
    description: "Advanced skills for the creative player. Combine dribbling, passing, and finishing into a fluid workout.",
    sport: "soccer",
    category: "full",
    difficulty: "advanced",
    estimatedMinutes: 30,
    steps: [
      { sport: "soccer", skillId: "elastico", duration: 4, reps: 8, instruction: "Elastico to beat a defender wide" },
      { sport: "soccer", skillId: "la-croqueta", duration: 4, reps: 8, instruction: "La Croqueta in tight midfield space" },
      { sport: "soccer", skillId: "lofted-through-ball", duration: 4, reps: 10, instruction: "Lofted through ball after a dribble" },
      { sport: "soccer", skillId: "volley", duration: 4, reps: 8, instruction: "Volley from a lofted pass" },
      { sport: "soccer", skillId: "curling-finish", duration: 4, reps: 8, instruction: "Cut inside and curl far post" },
    ],
  },
  {
    id: "bb-all-around",
    name: "All-Around Guard",
    description: "Build complete guard skills — dribbling, passing, shooting, and defense in one workout.",
    sport: "basketball",
    category: "full",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "basketball", skillId: "b-crossover", duration: 4, reps: 15, instruction: "Low crossover dribbles, each hand" },
      { sport: "basketball", skillId: "b-chest-pass", duration: 4, reps: 15, instruction: "Chest passes to a target — snap your wrists" },
      { sport: "basketball", skillId: "b-jump-shot", duration: 5, reps: 10, instruction: "Jump shots from mid-range" },
      { sport: "basketball", skillId: "b-defensive-slide", duration: 3, reps: 6, instruction: "Defensive slides in a zigzag pattern" },
    ],
  },
  {
    id: "bb-finishing",
    name: "Finishing at the Rim",
    description: "Attack the basket with confidence. Master layups, jump shots, and the hesitation move.",
    sport: "basketball",
    category: "shooting",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "basketball", skillId: "b-layup", duration: 5, reps: 12, instruction: "Right-hand layups, then left-hand" },
      { sport: "basketball", skillId: "b-jump-shot", duration: 4, reps: 10, instruction: "Catch-and-shoot jump shots from 15 feet" },
      { sport: "basketball", skillId: "b-hesitation", duration: 5, reps: 10, instruction: "Hesitation dribble into a layup" },
      { sport: "basketball", skillId: "b-spot-up", duration: 4, reps: 8, instruction: "Spot-up threes with quick release" },
    ],
  },
  {
    id: "bb-point-guard",
    name: "Point Guard Skills",
    description: "Ball-handling and passing workout for playmakers who run the offense.",
    sport: "basketball",
    category: "dribbling",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { sport: "basketball", skillId: "b-crossover", duration: 4, reps: 12, instruction: "Crossover into behind-the-back combo" },
      { sport: "basketball", skillId: "b-behind-back", duration: 5, reps: 10, instruction: "Behind-the-back dribbles in transition" },
      { sport: "basketball", skillId: "b-hesitation", duration: 4, reps: 8, instruction: "Hesitation to freeze, then explode" },
      { sport: "basketball", skillId: "b-bounce-pass", duration: 4, reps: 12, instruction: "Bounce passes into the post" },
      { sport: "basketball", skillId: "b-chest-pass", duration: 3, reps: 10, instruction: "Chest passes on the move" },
    ],
  },
  {
    id: "bb-lockdown-defender",
    name: "Lockdown Defender",
    description: "Build defensive toughness with slides, boxing out, and high-intensity drills.",
    sport: "basketball",
    category: "defending",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "basketball", skillId: "b-defensive-slide", duration: 5, reps: 8, instruction: "Full-court defensive slides, stay low" },
      { sport: "basketball", skillId: "b-box-out", duration: 5, reps: 10, instruction: "Box out drills — find your man and seal" },
      { sport: "basketball", skillId: "b-defensive-slide", duration: 4, reps: 6, instruction: "Slide into closeout position" },
      { sport: "basketball", skillId: "b-box-out", duration: 4, reps: 8, instruction: "Box out and secure the rebound" },
    ],
  },
  {
    id: "tn-baseline",
    name: "Baseline Basics",
    description: "Build a solid foundation with forehand, backhand, and consistent rally skills.",
    sport: "tennis",
    category: "full",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { sport: "tennis", skillId: "t-forehand", duration: 5, reps: 20, instruction: "Forehand groundstrokes cross-court" },
      { sport: "tennis", skillId: "t-backhand", duration: 5, reps: 20, instruction: "Backhand groundstrokes down the line" },
      { sport: "tennis", skillId: "t-forehand", duration: 4, reps: 15, instruction: "Forehand — mix of cross-court and inside-out" },
    ],
  },
  {
    id: "tn-net-play",
    name: "Net Play & Volleys",
    description: "Develop confidence at the net with volleys, overheads, and transition shots.",
    sport: "tennis",
    category: "striking",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { sport: "tennis", skillId: "t-volley", duration: 5, reps: 15, instruction: "Forehand volleys, focus on compact punch" },
      { sport: "tennis", skillId: "t-volley", duration: 5, reps: 15, instruction: "Backhand volleys, keep the racket head up" },
      { sport: "tennis", skillId: "t-overhead", duration: 5, reps: 10, instruction: "Overhead smashes from lob feeds" },
      { sport: "tennis", skillId: "t-volley", duration: 4, reps: 10, instruction: "Volley-to-volley rally with a partner" },
    ],
  },
  {
    id: "tn-weapons",
    name: "Weapons & Variety",
    description: "Add weapons to your game with serves, drop shots, and lobs.",
    sport: "tennis",
    category: "full",
    difficulty: "advanced",
    estimatedMinutes: 25,
    steps: [
      { sport: "tennis", skillId: "t-serve", duration: 6, reps: 15, instruction: "Serve practice — focus on toss and pronation" },
      { sport: "tennis", skillId: "t-drop-shot", duration: 4, reps: 10, instruction: "Drop shots from behind the baseline" },
      { sport: "tennis", skillId: "t-lob", duration: 4, reps: 10, instruction: "Lobs over an imaginary net player" },
      { sport: "tennis", skillId: "t-serve", duration: 5, reps: 10, instruction: "Serve with target placement — wide and T" },
    ],
  },
]

export function getProgramById(id: string): Program | undefined {
  return trainingPrograms.find((p) => p.id === id)
}

export function getProgramsByDifficulty(difficulty: Program["difficulty"]): Program[] {
  return trainingPrograms.filter((p) => p.difficulty === difficulty)
}

export function getProgramsByCategory(category: Program["category"]): Program[] {
  return trainingPrograms.filter((p) => p.category === category)
}

export function getProgramsBySport(sport: Program["sport"]): Program[] {
  return trainingPrograms.filter((p) => p.sport === sport)
}

export function getProgramsBySports(sports: Program["sport"][]): Program[] {
  if (!sports || sports.length === 0) return []
  return trainingPrograms.filter((p) => sports.includes(p.sport))
}
