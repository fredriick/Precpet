import type { Skill } from "./types"

export const soccerSkills: Skill[] = [
  {
    id: "cruyff-turn",
    name: "The Cruyff Turn",
    category: "dribbling",
    difficulty: "intermediate",
    description: "A deceptive turn used to change direction quickly while shielding the ball from a defender.",
    reasoning: "Ideal for escaping pressure when a defender is tight on your back.",
    visualScript:
      "An Athlete in a green jersey receives the ball with their back to goal. A defender pressures from behind. The player feints to pass with their right foot, then drags the ball behind their standing leg with the inside of the same foot, spinning 180 degrees to face forward. Slow motion capture of the foot technique. Stadium setting, evening light.",
    steps: [
      "Position your body as if you're about to pass or shoot, drawing the defender in close",
      "Instead of striking the ball, drag it behind your standing leg with the inside of your foot",
      "Pivot on your standing foot and accelerate into the space you've created",
    ],
  },
  {
    id: "step-over",
    name: "The Step Over",
    category: "dribbling",
    difficulty: "beginner",
    description: "A classic move where you step over the ball to fake a direction change and unbalance the defender.",
    reasoning: "Perfect for 1v1 situations when you need to create space on the wing.",
    visualScript:
      "An Athlete facing a defender on the wing. Close-up of feet as the player circles their right foot over the ball from inside to outside, shifting weight, then pushes the ball the opposite direction with their left foot. Grass field, sunny day, dynamic camera angle.",
    steps: [
      "Approach the defender at a controlled pace with the ball close to your feet",
      "Circle your foot over the ball from inside to outside while shifting your body weight",
      "Push the ball in the opposite direction with your other foot and accelerate past",
    ],
  },
  {
    id: "la-croqueta",
    name: "La Croqueta",
    category: "dribbling",
    difficulty: "advanced",
    description: "A quick lateral shift of the ball from one foot to the other, popularized by Iniesta.",
    reasoning: "Excellent for evading tackles in tight spaces in the midfield.",
    visualScript:
      "A midfielder in a red jersey surrounded by two defenders. Extreme close-up of feet rapidly tapping the ball from the inside of one foot to the inside of the other, creating lateral movement. The player glides past the defenders. Night game, floodlights, slow motion.",
    steps: [
      "Keep the ball between your feet with knees slightly bent for quick reactions",
      "Use the inside of one foot to push the ball laterally to your other foot",
      "Immediately receive with the inside of your other foot and push forward",
    ],
  },
  {
    id: "drag-back",
    name: "The Drag Back",
    category: "dribbling",
    difficulty: "beginner",
    description: "A simple but effective move to pull the ball back and change direction.",
    reasoning: "Great for when you've run into a dead end or need to reset the play.",
    visualScript:
      "An Athlete dribbling towards the sideline, running out of space. They plant their non-dominant foot and use the sole of their dominant foot to roll the ball backwards. The player then turns and dribbles the opposite direction. Training ground setting, morning light.",
    steps: [
      "Plant your supporting foot firmly as you sense pressure or run out of space",
      "Place the sole of your other foot on top of the ball and roll it backward",
      "Turn your body quickly and accelerate away in the new direction",
    ],
  },
  {
    id: "elastico",
    name: "The Elastico",
    category: "dribbling",
    difficulty: "advanced",
    description: "A rapid double-touch that snaps the ball from outside to inside in one motion.",
    reasoning: "A devastating move for wrong-footing defenders in 1v1 situations.",
    visualScript:
      "A Brazilian player in a yellow jersey facing a defender. Super slow motion of the right foot pushing the ball with the outside, then instantly snapping it back with the inside of the same foot. The defender stumbles. Maracanã-style stadium, golden hour lighting.",
    steps: [
      "Push the ball slightly with the outside of your foot as if going one direction",
      "In one fluid motion snap the ball back with the inside of the same foot",
      "Explode past the wrong-footed defender into the space created",
    ],
  },
  {
    id: "body-feint",
    name: "The Body Feint",
    category: "movement",
    difficulty: "beginner",
    description: "Use your body movement to fake a direction change without touching the ball.",
    reasoning: "Fundamental skill for creating space without complex footwork.",
    visualScript:
      "A player running with the ball towards a defender. They dip their shoulder and lean heavily to the left, defender bites on the fake. The player then pushes the ball to the right with the outside of their foot and accelerates. Park setting, afternoon sun, eye-level camera.",
    steps: [
      "Approach the defender with the ball close and your eyes up reading their position",
      "Drop your shoulder dramatically in one direction selling the fake with your whole body",
      "Push the ball the opposite way with the outside of your foot and burst past",
    ],
  },
]

export function getSkillById(id: string): Skill | undefined {
  return soccerSkills.find((skill) => skill.id === id)
}

export function getSkillsByCategory(category: Skill["category"]): Skill[] {
  return soccerSkills.filter((skill) => skill.category === category)
}

export function getSkillsByDifficulty(difficulty: Skill["difficulty"]): Skill[] {
  return soccerSkills.filter((skill) => skill.difficulty === difficulty)
}
