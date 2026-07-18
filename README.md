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
- **State Management**: React Context; localStorage offline cache + Supabase cloud sync
- **Backend**: Supabase (Auth, Postgres, Row-Level Security) for real accounts and cloud-synced data
- **Schema/Migrations**: Prisma (typed client + `prisma db push`)
- **AI**: Claude (via Vercel AI SDK) for skill analysis
- **Video**: Google Veo API for tutorial generation (graceful placeholder fallback)
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
cp .env.example .env
```

Fill in the variables (see below). At minimum you need the three Supabase
values and at least one AI key:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```
`SUPABASE_DB_URL` is only needed for Prisma (see Backend & Database Setup).

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend & Database Setup

Precept needs a Supabase project for authentication, cloud-synced user data,
and the weekly leaderboard.

**Schema + security are owned entirely by the `supabase/*.sql` files** — they
create the tables *and* the Row-Level Security policies and the new-user
trigger in one shot. This is the canonical, required setup step:

Run these files in order in your Supabase project's SQL Editor
(Settings → SQL Editor) — works from anywhere over HTTPS (port 443):
- `supabase/auth.sql` — `profiles` table, new-user trigger, RLS
- `supabase/schema.sql` — `user_stats`, `practice_sessions`, `user_settings`,
  `program_progress`, `generated_videos` + RLS
- `supabase/leaderboard.sql` — `leaderboard_entries` + RLS (already applied if
  you followed the original setup)

> **Prisma is used only as a typed client** (`lib/prisma.ts`), never to
> provision the database. `prisma db push` cannot model RLS policies, triggers,
> or the FK to `auth.users`, so running it would create tables with no security
> layer. Always apply schema changes via the SQL files above, then mirror the
> structural part into `prisma/schema.prisma` so the typed client stays in sync.
> `pnpm prisma generate` (offline-safe) regenerates the client.

> The build/CI sandbox firewalls Postgres port 5432, so Prisma push/migrate
> commands cannot run there regardless — the SQL Editor path is the only one
> usable from the sandbox.

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
 │   ├── app-context.tsx         # Global state (hydrates from cloud, writes through)
 │   └── auth-context.tsx        # Supabase auth state
 ├── hooks/
 │   ├── use-motion-sensor.ts    # DeviceMotion API hook
 │   └── use-video-generation.ts # Veo video hook (+ demo fallback)
 ├── lib/
 │   ├── supabase-browser.ts     # Anon Supabase client (browser)
 │   ├── supabase-server.ts      # Service-role client (server)
 │   ├── cloud-sync.ts           # Load/save user data to Supabase
 │   ├── leaderboard.ts          # Leaderboard submit/fetch
 │   ├── leaderboard-rank.ts     # Pure ranking helper
 │   ├── prisma.ts               # Prisma client singleton (scripts only)
 │   ├── skills-database.ts      # Soccer skills catalog
 │   ├── storage.ts              # localStorage utilities (offline cache)
 │   └── types.ts                # TypeScript definitions
 ├── app/api/leaderboard/        # GET/POST weekly leaderboard
 ├── supabase/                   # SQL: auth.sql, schema.sql, leaderboard.sql
 ├── prisma/                     # Prisma schema + generated client
 └── public/
     ├── manifest.json           # PWA manifest
     └── placeholder-videos/     # Demo video fallback asset
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
User data is the source of truth in Supabase (Postgres) and synced per
`auth.uid()` via `lib/cloud-sync.ts`:
- User statistics, game performance, practice sessions, settings, program
  progress, bookmarked/learned skills, achievements
- Generated video URLs (cached per user + skill)
- Weekly leaderboard entries (service-role write, anonymous read)

A localStorage copy is kept as an offline cache so the app stays usable
without a network connection; cloud state is re-hydrated on login.

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

The app is fully functional with a real Supabase backend — no simulated or
hardcoded data. Without API keys it degrades gracefully:
- Skill recommendations use a built-in fallback algorithm (no Claude key)
- Video generation returns a bundled placeholder clip with a "Demo video" badge
  (no Veo key) instead of an AI-generated tutorial
- All other features (auth, cloud sync, leaderboard, progress) work unchanged

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
