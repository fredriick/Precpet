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
  {
    id: "inside-foot-pass",
    name: "Inside Foot Pass",
    category: "passing",
    difficulty: "beginner",
    description: "The most fundamental passing technique using the inside of your foot for accuracy.",
    reasoning: "Essential for short, precise passes in build-up play.",
    visualScript:
      "A player receiving a ball and passing to a teammate 10 yards away. Close-up of the standing foot pointing at the target as the passing foot swings through, striking the ball's center with the inside of the foot. The ball rolls smoothly along the grass. Training session, daylight.",
    steps: [
      "Point your standing foot toward your target and keep your head up",
      "Strike through the center of the ball with the inside of your foot",
      "Follow through toward your target for accuracy and weight control",
    ],
  },
  {
    id: "driven-pass",
    name: "Driven Pass",
    category: "passing",
    difficulty: "intermediate",
    description: "A powerful low-driven pass that travels quickly along the ground over distance.",
    reasoning: "Essential for switching play or playing line-breaking passes through tight spaces.",
    visualScript:
      "Midfielder in white receiving the ball and spotting a run. Low follow-through striking the center of the ball with the laces while leaning forward. The ball rockets low across the pitch to a teammate's feet. Stadium setting, match lighting.",
    steps: [
      "Approach the ball at a slight angle with your plant foot next to the ball",
      "Strike through the center of the ball with your laces while keeping your shoulders over the ball",
      "Follow through low to keep the ball driven along the ground",
    ],
  },
  {
    id: "lofted-through-ball",
    name: "Lofted Through Ball",
    category: "passing",
    difficulty: "advanced",
    description: "A weighted pass that lifts the ball over defenders into the path of a runner.",
    reasoning: "Breaks defensive lines and creates goal-scoring chances from deep positions.",
    visualScript:
      "A midfielder spots a forward making a run behind the defense. The player strikes underneath the ball with the inside of their foot, imparting backspin. The ball arcs over the defenders and lands perfectly in stride for the forward. Slow motion of the foot contact. Professional stadium, golden hour.",
    steps: [
      "Identify the runner's path and time your pass to lead them into space behind the defense",
      "Strike underneath the ball with the inside of your foot to generate lift and backspin",
      "Follow through high and let the ball drop over the defender's head into the runner's path",
    ],
  },
  {
    id: "laces-shot",
    name: "Laces Shot",
    category: "shooting",
    difficulty: "beginner",
    description: "A powerful strike using your laces to drive the ball toward goal.",
    reasoning: "The foundation of all shooting — generating power through proper technique.",
    visualScript:
      "A player dribbling toward goal and setting up for a strike. Close-up of the plant foot placed beside the ball as the striking leg swings through. The foot is pointed down, laces driving through the center of the ball. The ball rockets toward the bottom corner. Goal net ripples in slow motion.",
    steps: [
      "Plant your non-kicking foot beside the ball with your knee slightly bent",
      "Keep your head down and strike through the center of the ball with your laces",
      "Follow through straight at the target and land on your kicking foot",
    ],
  },
  {
    id: "curling-finish",
    name: "Curling Finish",
    category: "shooting",
    difficulty: "intermediate",
    description: "A placed shot that curves around the goalkeeper using the inside of the foot.",
    reasoning: "Placing the ball beyond the keeper's reach from tight angles inside the box.",
    visualScript:
      "A forward cutting in from the left wing. They use the inside of their right foot to strike the ball with spin, wrapping it around an invisible defender toward the far post. Slow motion of the ball's rotation in flight. The ball nestles into the side netting.",
    steps: [
      "Approach the ball at an angle and plant your foot slightly behind for lift",
      "Strike the ball with the inside of your foot, wrapping your foot around the ball for spin",
      "Follow through across your body and aim for the far post",
    ],
  },
  {
    id: "volley",
    name: "Volley Strike",
    category: "shooting",
    difficulty: "advanced",
    description: "Striking the ball out of the air before it touches the ground.",
    reasoning: "Essential for finishing crosses and bouncing clearances in the box.",
    visualScript:
      "A player positioning themselves as a cross comes in. Their eyes lock on the ball as they time their jump. The player strikes the ball mid-air with their laces, foot pointed down. The ball blazes into the goal. Close-up of the contact point. Floodlit stadium, night match atmosphere.",
    steps: [
      "Read the flight of the ball early and position your body sideways to the target",
      "Lock your ankle and keep your toe down as you swing through the center of the ball mid-flight",
      "Keep your head still and your eyes on the ball through the point of contact",
    ],
  },
  {
    id: "jockey",
    name: "Defensive Jockey",
    category: "defending",
    difficulty: "beginner",
    description: "A side-on stance used to contain an attacker and delay their progress.",
    reasoning: "The cornerstone of 1v1 defending — forcing attackers into low-percentage plays.",
    visualScript:
      "A defender in a low stance facing an attacker with the ball. The defender moves sideways, knees bent, arms at sides, staying between the attacker and goal. The attacker feints but the defender holds position. Training session with cones, daylight.",
    steps: [
      "Get into a low side-on stance with knees bent and weight on your front foot",
      "Maintain an arm's length distance and force the attacker to one side",
      "Stay patient — don't dive in. Mirror their movements and wait for help or a mistake",
    ],
  },
  {
    id: "standing-tackle",
    name: "Standing Tackle",
    category: "defending",
    difficulty: "intermediate",
    description: "A well-timed tackle using the inside of your foot to cleanly win the ball.",
    reasoning: "Winning the ball cleanly without fouling is the mark of a composed defender.",
    visualScript:
      "A defender times their approach perfectly as the attacker tries to dribble past. The defender plants their standing foot and extends their tackling leg, meeting the ball with the inside of their foot. Clean contact wins the ball. The attacker stumbles over. Match lighting, slow motion.",
    steps: [
      "Time your approach as the attacker pushes the ball slightly ahead of their foot",
      "Plant your standing foot and extend your tackling leg with the inside of your foot facing the ball",
      "Drive through the ball with determination — commit fully to the tackle",
    ],
  },
  {
    id: "slide-tackle",
    name: "Slide Tackle",
    category: "defending",
    difficulty: "advanced",
    description: "A last-resort tackle where you slide to win the ball or deflect it away.",
    reasoning: "High-risk, high-reward — effective in emergency situations when the attacker has broken through.",
    visualScript:
      "A last-ditch defensive situation. The attacker is about to shoot. The defender slides in, leading with their extended leg, sweeping the ball away just as the attacker winds up. The defender rises quickly and regains their feet. Dramatic stadium atmosphere, rain-slicked pitch.",
    steps: [
      "Commit only when you're certain you can reach the ball — mistiming risks a penalty",
      "Drop your center of gravity and slide on your trailing thigh, leading with your extended foot",
      "Sweep the ball away and get back to your feet as quickly as possible",
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
