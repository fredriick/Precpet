-- Leaderboard schema for Precept
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).
-- Safe to re-run (uses "if not exists" / "if not exists" guards).

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  session_token text not null,
  name text not null default 'Anonymous',
  sport text,
  week integer not null,
  minutes integer not null default 0 check (minutes >= 0),
  updated_at timestamptz not null default now(),
  unique (session_token, week)
);

create index if not exists leaderboard_entries_week_minutes_idx
  on public.leaderboard_entries (week, minutes desc);

alter table public.leaderboard_entries enable row level security;

-- Reads: anyone (including the anon/public role) may SELECT, so the
-- client can fetch the leaderboard without the service key.
drop policy if exists "leaderboard read access" on public.leaderboard_entries;
create policy "leaderboard read access"
  on public.leaderboard_entries
  for select
  to anon, authenticated
  using (true);

-- Writes: only the service role (server) may insert/update.
-- The anon/authenticated roles are intentionally excluded so the
-- client cannot forge or tamper with entries.
drop policy if exists "leaderboard service write" on public.leaderboard_entries;
create policy "leaderboard service write"
  on public.leaderboard_entries
  for all
  to service_role
  using (true)
  with check (true);
