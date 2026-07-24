-- Cloud sync schema for Precept training data.
-- Run in Supabase SQL Editor. Safe to re-run.
-- All tables are keyed by the authenticated user (auth.users.id).

-- 1. User stats (single row per user)
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  matches_played integer not null default 0 check (matches_played >= 0),
  ball_losses_under_pressure integer not null default 0 check (ball_losses_under_pressure >= 0),
  successful_dribbles integer not null default 0 check (successful_dribbles >= 0),
  pass_accuracy integer not null default 0 check (pass_accuracy >= 0 and pass_accuracy <= 100),
  shots_on_target integer not null default 0 check (shots_on_target >= 0),
  avg_fluidity_score integer not null default 0,
  practice_minutes integer not null default 0 check (practice_minutes >= 0),
  skills_learned text[] not null default '{}',
  bookmarked_skills text[] not null default '{}',
  achievements jsonb not null default '[]',
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_practice_date text,
  is_pro boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 2. Practice sessions
create table if not exists public.practice_sessions (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  sport text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  fluidity_scores integer[] not null default '{}',
  completed boolean not null default false,
  notes text,
  video_url text,
  analysis_result jsonb,
  primary key (user_id, id)
);

create index if not exists practice_sessions_user_start_idx
  on public.practice_sessions (user_id, start_time desc);

-- 3. User settings (single row per user)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  haptic_feedback boolean not null default true,
  sound_effects boolean not null default true,
  practice_reminders boolean not null default true,
  preferred_difficulty text not null default 'all',
  preferred_sport text not null default 'soccer',
  preferred_sports jsonb not null default '["soccer"]'::jsonb,
  active_sport text not null default 'soccer',
  theme text not null default 'dark',
  weekly_goal_minutes integer not null default 60,
  updated_at timestamptz not null default now()
);

-- 4. Program progress (one row per user+program)
create table if not exists public.program_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null,
  completed_steps integer not null default 0,
  total_steps integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_practiced timestamptz,
  primary key (user_id, program_id)
);

-- 5. Generated videos cache (one row per user+skill)
create table if not exists public.generated_videos (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  video_url text not null,
  primary key (user_id, skill_id)
);

-- 6. Video analyses (one row per uploaded video analysis)
create table if not exists public.video_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text,
  skill_id text not null,
  sport text not null,
  video_url text not null,
  pass_accuracy integer,
  successful_dribbles integer,
  shots_on_target integer,
  ball_control_quality integer,
  technique_form integer,
  confidence real,
  raw_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists video_analyses_user_idx
  on public.video_analyses (user_id, created_at desc);

-- Row Level Security: every table is scoped to the owner.
alter table public.user_stats enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.user_settings enable row level security;
alter table public.program_progress enable row level security;
alter table public.generated_videos enable row level security;
alter table public.video_analyses enable row level security;

-- Helper: owner check per table
drop policy if exists "user_stats owner" on public.user_stats;
create policy "user_stats owner" on public.user_stats
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "practice_sessions owner" on public.practice_sessions;
create policy "practice_sessions owner" on public.practice_sessions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings owner" on public.user_settings;
create policy "user_settings owner" on public.user_settings
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "program_progress owner" on public.program_progress;
create policy "program_progress owner" on public.program_progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "generated_videos owner" on public.generated_videos;
create policy "generated_videos owner" on public.generated_videos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "video_analyses owner" on public.video_analyses;
create policy "video_analyses owner" on public.video_analyses
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
