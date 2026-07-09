import type { Program } from "./types"

export const trainingPrograms: Program[] = [
  {
    id: "beginner-fundamentals",
    name: "Beginner Fundamentals",
    description: "Master the essential moves every player needs. Build confidence on the ball with these foundational techniques.",
    category: "full",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { skillId: "step-over", duration: 4, reps: 10, instruction: "Practice the step over motion slowly, focusing on body feint" },
      { skillId: "drag-back", duration: 4, reps: 12, instruction: "Drag back and turn in both directions" },
      { skillId: "inside-foot-pass", duration: 4, reps: 20, instruction: "Alternate feet, focus on clean contact" },
      { skillId: "step-over", duration: 3, reps: 8, instruction: "Full speed step overs with direction change" },
      { skillId: "drag-back", duration: 3, reps: 8, instruction: "Drag back under pressure — accelerate after" },
    ],
  },
  {
    id: "dribbling-mastery",
    name: "Dribbling Mastery",
    description: "A complete dribbling workout covering all four core moves. Build unpredictability and close control.",
    category: "dribbling",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { skillId: "cruyff-turn", duration: 5, reps: 10, instruction: "Cruyff turn with both feet, focusing on selling the feint" },
      { skillId: "la-croqueta", duration: 5, reps: 12, instruction: "Rapid lateral shifts through cones" },
      { skillId: "elastico", duration: 5, reps: 10, instruction: "Inside-out flick with the front foot" },
      { skillId: "body-feint", duration: 4, reps: 10, instruction: "Shoulder drop + push in opposite direction" },
      { skillId: "cruyff-turn", duration: 3, reps: 6, instruction: "Cruyff turn at full speed into sprint" },
    ],
  },
  {
    id: "passing-accurary",
    name: "Passing Precision",
    description: "Sharpen your passing with these essential techniques. From short passes to driven balls and lofted through balls.",
    category: "passing",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { skillId: "inside-foot-pass", duration: 4, reps: 20, instruction: "Short passes against a wall, both feet" },
      { skillId: "driven-pass", duration: 5, reps: 15, instruction: "Driven passes with laces, focus on follow-through" },
      { skillId: "lofted-through-ball", duration: 5, reps: 12, instruction: "Lofted balls over a cone into a target zone" },
      { skillId: "driven-pass", duration: 3, reps: 10, instruction: "First-time driven passes" },
    ],
  },
  {
    id: "finishing-clinic",
    name: "Finishing Clinic",
    description: "Develop a deadly finishing ability. Laces shots, curling finishes, and volleys in a high-rep workout.",
    category: "shooting",
    difficulty: "intermediate",
    estimatedMinutes: 25,
    steps: [
      { skillId: "laces-shot", duration: 5, reps: 12, instruction: "Laces shots from just outside the box" },
      { skillId: "curling-finish", duration: 5, reps: 10, instruction: "Curling finishes into the far post" },
      { skillId: "volley-strike", duration: 5, reps: 10, instruction: "Volleys from crossed balls" },
      { skillId: "laces-shot", duration: 4, reps: 8, instruction: "One-touch finishes after a dribble" },
    ],
  },
  {
    id: "defensive-solidarity",
    name: "Defensive Solidity",
    description: "Build your defensive foundations. Learn proper jockeying, timing of tackles, and sliding challenges.",
    category: "defending",
    difficulty: "beginner",
    estimatedMinutes: 20,
    steps: [
      { skillId: "defensive-jockey", duration: 5, reps: 6, instruction: "Jockey side-to-side through cones, stay low" },
      { skillId: "standing-tackle", duration: 5, reps: 10, instruction: "Standing tackle technique — timing the poke" },
      { skillId: "slide-tackle", duration: 4, reps: 8, instruction: "Slide tackle on grass or soft surface" },
      { skillId: "defensive-jockey", duration: 3, reps: 4, instruction: "Jockey → standing tackle → recover" },
    ],
  },
  {
    id: "elite-playmaker",
    name: "Elite Playmaker",
    description: "Advanced skills for the creative player. Combine dribbling, passing, and finishing into a fluid workout.",
    category: "full",
    difficulty: "advanced",
    estimatedMinutes: 30,
    steps: [
      { skillId: "elastico", duration: 4, reps: 8, instruction: "Elastico to beat a defender wide" },
      { skillId: "la-croqueta", duration: 4, reps: 8, instruction: "La Croqueta in tight midfield space" },
      { skillId: "lofted-through-ball", duration: 4, reps: 10, instruction: "Lofted through ball after a dribble" },
      { skillId: "volley-strike", duration: 4, reps: 8, instruction: "Volley from a lofted pass" },
      { skillId: "curling-finish", duration: 4, reps: 8, instruction: "Cut inside and curl far post" },
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
