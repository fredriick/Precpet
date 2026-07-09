import type { Skill, Sport } from "./types"

export const soccerSkills: Skill[] = [
  {
    id: "cruyff-turn",
    name: "The Cruyff Turn",
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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
    sport: "soccer",
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

export const basketballSkills: Skill[] = [
  {
    id: "b-crossover",
    name: "Crossover Dribble",
    sport: "basketball",
    category: "dribbling",
    difficulty: "beginner",
    description: "A low, quick bounce pass of the ball from one hand to the other to change direction.",
    reasoning: "The foundation move for breaking down your defender in 1v1 situations.",
    visualScript:
      "A player in a red jersey faces a defender. They bounce the ball low and quick from their right hand to their left, dropping their shoulder to sell the fake. The defender bites and the player accelerates past. Hardwood court, bright arena lighting.",
    steps: [
      "Dribble low and wide with your dominant hand to draw the defender",
      "Snap the ball across your body with a quick low bounce to your other hand",
      "Cross your opposite foot over and burst past the defender",
    ],
  },
  {
    id: "b-behind-back",
    name: "Behind-the-Back Dribble",
    sport: "basketball",
    category: "dribbling",
    difficulty: "intermediate",
    description: "A dribble move that bounces the ball behind your back to switch hands.",
    reasoning: "Keeps the ball protected from the defender while changing direction.",
    visualScript:
      "A guard bringing the ball up court under pressure. They swing the ball behind their back from right to left hand, keeping their body between the defender and the ball. The defender reaches but can't reach it. Gymnasium setting, game speed.",
    steps: [
      "Dribble forward with your dominant hand keeping your body low",
      "Swing the ball behind your back with a wrist snap to your opposite hand",
      "Catch the ball on the other side and continue your drive",
    ],
  },
  {
    id: "b-hesitation",
    name: "Hesitation Dribble",
    sport: "basketball",
    category: "dribbling",
    difficulty: "intermediate",
    description: "A change-of-pace move where you slow down to freeze the defender then blow past them.",
    reasoning: "Uses tempo changes to keep the defender off balance and create driving lanes.",
    visualScript:
      "A guard approaches the defender, slows their dribble and raises their shoulders as if stopping. The defender pauses. The guard then explodes past with a low crossover. Arena crowd reacts. Night game, bright lights.",
    steps: [
      "Approach the defender at speed then decelerate suddenly, raising your shoulders slightly",
      "As the defender hesitates, drop your shoulder and plant your foot to explode past",
      "Push the ball ahead and accelerate into the open space",
    ],
  },
  {
    id: "b-jump-shot",
    name: "Jump Shot",
    sport: "basketball",
    category: "shooting",
    difficulty: "beginner",
    description: "A shot taken by jumping and releasing the ball at the peak of the jump.",
    reasoning: "The most fundamental scoring technique in basketball.",
    visualScript:
      "A player catches a pass and rises up. Close-up of their shooting pocket, elbow aligned, wrist flick. The ball arcs high and swishes through the net. Slow motion of the follow-through. Outdoor court, golden hour.",
    steps: [
      "Catch the ball in triple-threat position with knees bent for power",
      "Jump straight up and release the ball at the peak with a high elbow and wrist flick",
      "Hold your follow-through until the ball hits the rim",
    ],
  },
  {
    id: "b-layup",
    name: "Layup",
    sport: "basketball",
    category: "shooting",
    difficulty: "beginner",
    description: "A close-range shot where the player drives to the basket and lays the ball off the backboard.",
    reasoning: "The highest-percentage shot in basketball, essential for all positions.",
    visualScript:
      "A player driving fast down the lane. They take off from one foot, extending toward the basket, gently laying the ball off the glass. The ball banks in. Arena crowd noise, fast break scenario.",
    steps: [
      "Attack the basket with speed, taking off from the foot opposite your shooting hand",
      "Extend your shooting arm toward the top corner of the backboard square",
      "Release the ball softly off the glass with a gentle wrist flick",
    ],
  },
  {
    id: "b-spot-up",
    name: "Spot-Up Three",
    sport: "basketball",
    category: "shooting",
    difficulty: "advanced",
    description: "A catch-and-shoot three-point shot from a stationary position.",
    reasoning: "Essential for spacing the floor and capitalizing on kick-out passes.",
    visualScript:
      "A shooter spots up behind the arc. They catch a pass with feet already set, rise and fire in one motion. The ball splashes through the net. Close-up of quick release. Professional court, playoff atmosphere.",
    steps: [
      "Get your feet set before the catch with your knees bent and hands ready",
      "Catch the ball in your shooting pocket and go straight up into your shot",
      "Release high with a quick flick — don't dip the ball",
    ],
  },
  {
    id: "b-chest-pass",
    name: "Chest Pass",
    sport: "basketball",
    category: "passing",
    difficulty: "beginner",
    description: "A two-handed pass thrown from the chest with a quick snap of the wrists.",
    reasoning: "The quickest and most accurate way to move the ball to a teammate.",
    visualScript:
      "Two players on a fast break. The ball-handler fires a crisp chest pass to a teammate cutting to the basket. Close-up of hands pushing through the ball with thumbs down. Clean catch and finish. Indoor court, practice setting.",
    steps: [
      "Hold the ball at chest level with both hands, elbows tucked",
      "Step toward your target and push through the ball, snapping your wrists",
      "Finish with thumbs pointing down and palms facing out",
    ],
  },
  {
    id: "b-bounce-pass",
    name: "Bounce Pass",
    sport: "basketball",
    category: "passing",
    difficulty: "beginner",
    description: "A pass that bounces off the floor to reach a teammate, avoiding defenders.",
    reasoning: "Essential for feeding the post and splitting defenders in traffic.",
    visualScript:
      "A player at the top of the key feeds the ball into the low post. The pass bounces once, arriving at waist height for the post player. The defender's hand is too low to intercept. Timberwolves court, game lighting.",
    steps: [
      "Aim for a spot about two-thirds of the way to your teammate",
      "Push the ball down with both hands, spinning it forward",
      "The ball should bounce up to waist height for an easy catch",
    ],
  },
  {
    id: "b-defensive-slide",
    name: "Defensive Slide",
    sport: "basketball",
    category: "defending",
    difficulty: "beginner",
    description: "A side-to-side shuffling motion to stay in front of your defender.",
    reasoning: "The foundation of on-ball defense — staying between your man and the basket.",
    visualScript:
      "A defender in a low stance slides laterally, mirroring the ball-handler's movements. Arms wide, eyes on the offensive player's chest. Quick feet, no crossing of legs. High school gym, midday practice.",
    steps: [
      "Stay low with your feet wider than shoulder-width and your weight on the balls of your feet",
      "Take quick sliding steps — don't cross your feet or jump",
      "Keep your lead hand active and your eyes on the offensive player's chest",
    ],
  },
  {
    id: "b-box-out",
    name: "Box Out",
    sport: "basketball",
    category: "defending",
    difficulty: "beginner",
    description: "Positioning your body between the opponent and the basket to secure a rebound.",
    reasoning: "Rebounding wins games — boxing out is the fundamental technique to control the glass.",
    visualScript:
      "A shot goes up. A player immediately makes contact with their opponent, pivots, and seals them out with a wide base and arms out. The player secures the rebound. Intense playoff atmosphere, physical play.",
    steps: [
      "Find your opponent and make contact as soon as the shot goes up",
      "Pivot and put your body between them and the basket with a wide stance",
      "Keep your arms out and go get the ball at its highest point",
    ],
  },
]

export const tennisSkills: Skill[] = [
  {
    id: "t-forehand",
    name: "Forehand Groundstroke",
    sport: "tennis",
    category: "striking",
    difficulty: "beginner",
    description: "A stroke hit from the dominant side of the body with the palm facing forward.",
    reasoning: "The most natural and powerful shot in tennis, used as the primary weapon from the baseline.",
    visualScript:
      "A player in white prepares as the ball approaches their forehand side. They rotate their shoulders, drop the racket head, and swing through with a low-to-high motion. The ball fizzes over the net with topspin. Clay court, Roland Garros-style, afternoon sun.",
    steps: [
      "Prepare early by turning your shoulders and taking the racket back",
      "Drop the racket head below the ball and swing forward with your hips rotating",
      "Brush up the back of the ball for topspin and finish over your shoulder",
    ],
  },
  {
    id: "t-backhand",
    name: "Backhand Groundstroke",
    sport: "tennis",
    category: "striking",
    difficulty: "beginner",
    description: "A stroke hit from the non-dominant side with the back of the hand facing forward.",
    reasoning: "Essential for covering the full court and neutralizing attacks to your backhand side.",
    visualScript:
      "A player turns sideways as the ball approaches their backhand. For a one-hander, they swing through with a smooth low-to-high motion. For a two-hander, they push through with both arms extended. The ball travels cross-court. Green clay, daylight.",
    steps: [
      "Turn your shoulders early and take the racket back with your non-dominant hand guiding",
      "Step forward and swing through the ball with a low-to-high motion",
      "Finish high and rotate your shoulders toward the target",
    ],
  },
  {
    id: "t-serve",
    name: "Serve",
    sport: "tennis",
    category: "striking",
    difficulty: "intermediate",
    description: "The shot that starts every point, tossed overhead and struck into the service box.",
    reasoning: "The only shot you have full control over — a weapon that sets up the entire point.",
    visualScript:
      "A player at the baseline tosses the ball high. They coil their body, then explode up, making contact at full extension. The ball rockets into the service box. Slow motion of the trophy pose and pronation. Hard court, US Open series.",
    steps: [
      "Stand sideways with your front foot at a 45-degree angle and toss the ball slightly in front",
      "Coil your body and explode up, making contact at the highest point with a full extension",
      "Pronate your wrist on contact and follow through across your body",
    ],
  },
  {
    id: "t-volley",
    name: "Volley",
    sport: "tennis",
    category: "striking",
    difficulty: "intermediate",
    description: "A shot hit before the ball bounces, typically at the net.",
    reasoning: "Finishing points at the net requires soft hands and quick reflexes.",
    visualScript:
      "A player at the net in a split step as the ball approaches. They punch the ball with a short compact swing, keeping the racket head up. The ball lands deep in the open court. Doubles match, bright sunlight.",
    steps: [
      "Take a split step as your opponent makes contact to load your legs",
      "Keep the racket head up and punch the ball with a short, compact motion — no backswing",
      "Step forward into the shot and direct it to the open space",
    ],
  },
  {
    id: "t-overhead",
    name: "Overhead Smash",
    sport: "tennis",
    category: "striking",
    difficulty: "advanced",
    description: "A powerful shot hit above the head, like a serve, to put away a high ball.",
    reasoning: "The definitive put-away shot — don't let a lob go unanswered.",
    visualScript:
      "A player tracks a lob, turns sideways, and rises up to smash the ball with authority. The ball explodes into the opposite court. Close-up of the contact point at full extension. Stadium setting, dramatic angle.",
    steps: [
      "Turn sideways immediately and track the ball with your non-dominant hand pointing up",
      "Use the same motion as a serve — trophy pose, explode up, contact at full extension",
      "Snap your wrist down on contact to direct the ball into the court",
    ],
  },
  {
    id: "t-drop-shot",
    name: "Drop Shot",
    sport: "tennis",
    category: "movement",
    difficulty: "advanced",
    description: "A soft shot that barely clears the net and dies near the net on the opponent's side.",
    reasoning: "A deadly weapon when your opponent is behind the baseline, forcing them to sprint forward.",
    visualScript:
      "A player disguises a drop shot mid-rally. They open the racket face and cushion the ball, letting it float softly over the net. The ball bounces twice before the opponent can reach it. Slow motion of the feathery touch. Red clay, Roland Garros.",
    steps: [
      "Disguise the shot by setting up as if hitting a normal groundstroke",
      "Open the racket face and cut under the ball with a high-to-low motion to kill the pace",
      "Aim for the ball to bounce three times just over the net on the opponent's side",
    ],
  },
  {
    id: "t-lob",
    name: "Lob",
    sport: "tennis",
    category: "movement",
    difficulty: "intermediate",
    description: "A high-arcing shot hit over an opponent who is at the net.",
    reasoning: "The best counter to an aggressive net player — makes them retreat and resets the point.",
    visualScript:
      "A player at the baseline sees their opponent charging the net. They slice under the ball, sending it high and deep. The opponent backpedals and can't reach it. The ball lands near the baseline. Stadium atmosphere.",
    steps: [
      "Recognize your opponent moving forward and prepare a high, defensive swing path",
      "Open the racket face and lift the ball with a high-to-low motion, getting it over their reach",
      "Aim deep — ideally the ball lands within a few feet of the baseline",
    ],
  },
]

export const allSkills: Skill[] = [...soccerSkills, ...basketballSkills, ...tennisSkills]

export function getSkillById(id: string): Skill | undefined {
  return allSkills.find((skill) => skill.id === id)
}

export function getSkillsBySport(sport: Sport): Skill[] {
  return allSkills.filter((skill) => skill.sport === sport)
}

export function getSkillsByCategory(category: Skill["category"]): Skill[] {
  return allSkills.filter((skill) => skill.category === category)
}

export function getSkillsByDifficulty(difficulty: Skill["difficulty"]): Skill[] {
  return allSkills.filter((skill) => skill.difficulty === difficulty)
}
