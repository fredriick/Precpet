# Precept - AI-Powered Sports Coach

Precept is a Progressive Web App (PWA) that uses your device's motion sensors to analyze movement fluidity and provide personalized sports skill recommendations. It demonstrates the integration of device sensors, AI analysis, and video generation.

## Features

### Motion Tracking
- Real-time movement analysis using the DeviceMotion API
- Fluidity score calculation based on acceleration smoothness
- Intensity detection and direction change tracking
- Works best on mobile devices with accelerometer support

### AI-Powered Recommendations
- Analyzes your game stats and practice performance
- Recommends skills based on identified weaknesses
- Uses Claude AI for intelligent skill gap analysis
- Silent when confidence is low (no spam recommendations)

### Video Generation with Veo
- Generate AI tutorial videos for any skill
- Visual scripts optimized for sports technique demonstration
- Automatic video caching for faster subsequent loads
- Polling-based generation status with progress feedback

### Practice Sessions
- Guided practice with step-by-step instructions
- Real-time fluidity tracking during sessions
- Session history with performance metrics
- Automatic skill mastery detection (3+ sessions with avg > 70)

### Progress Tracking
- Visual progress ring showing skills mastery
- Session history with detailed statistics
- Game performance metrics integration
- Practice time and fluidity averages

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Context + localStorage persistence
- **AI**: Claude (via Vercel AI SDK) for skill analysis
- **Video**: Google Veo API for tutorial generation
- **PWA**: Web manifest for installability

## Getting Started

### Prerequisites
- Node.js 18+ 
- A mobile device for motion sensor testing (optional but recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/precept.git
cd precept
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### PWA Installation
On mobile devices, you can install Precept as a standalone app:
1. Open the app in your mobile browser
2. Tap "Add to Home Screen" (iOS Safari) or the install prompt (Android Chrome)
3. Launch from your home screen for the full-screen experience

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze-skill-gap/  # AI skill recommendation
│   │   ├── generate-video/     # Veo video generation
│   │   └── video-status/       # Video generation polling
│   ├── practice/               # Practice session page
│   ├── profile/                # User profile & settings
│   ├── progress/               # Progress tracking
│   ├── skills/                 # Skills library & detail
│   └── page.tsx                # Home dashboard
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── bottom-nav.tsx          # Navigation bar
│   ├── motion-indicator.tsx    # Fluidity visualization
│   ├── onboarding.tsx          # New user onboarding
│   └── ...
├── contexts/
│   └── app-context.tsx         # Global state management
├── hooks/
│   ├── use-motion-sensor.ts    # DeviceMotion API hook
│   └── use-video-generation.ts # Veo video hook
├── lib/
│   ├── demo-data.ts            # Demo/seed data
│   ├── skills-database.ts      # Soccer skills catalog
│   ├── storage.ts              # localStorage utilities
│   └── types.ts                # TypeScript definitions
└── public/
    └── manifest.json           # PWA manifest
```

## Key Components

### Motion Sensor Hook
The `useMotionSensor` hook provides:
- Permission handling for iOS 13+
- Throttled motion event processing (50ms intervals)
- Real-time fluidity calculation based on jerk (rate of change of acceleration)
- Direction change detection for movement analysis

### Skills Database
Six sports skills with varying difficulty:
- **Beginner**: Step Over, Drag Back, Body Feint
- **Intermediate**: Cruyff Turn
- **Advanced**: La Croqueta, Elastico

Each skill includes:
- Detailed description and reasoning
- Step-by-step execution instructions
- Visual script for AI video generation

### State Persistence
All user data is persisted to localStorage:
- User statistics and game performance
- Practice session history
- Generated video cache
- User preferences and settings

## API Routes

### POST /api/analyze-skill-gap
Analyzes user stats and recommends skills.

Request:
```json
{
  "userStats": { ... },
  "learnedSkills": ["skill-id-1", "skill-id-2"],
  "recentFluidityScores": [65, 70, 72]
}
```

### POST /api/generate-video
Initiates Veo video generation.

Request:
```json
{
  "prompt": "Visual script for the skill...",
  "skillId": "cruyff-turn"
}
```

### GET /api/video-status?operationName=...
Polls for video generation status.

## Demo Mode

The app works without API keys in demo mode:
- Skill recommendations use a fallback algorithm
- Video generation returns placeholder after simulated delay
- All other features work with localStorage persistence

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Claude](https://anthropic.com/) and [Google Veo](https://deepmind.google/technologies/veo/)
- Deployed on [Vercel](https://vercel.com/)
