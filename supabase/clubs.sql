-- Clubs schema for Precept
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).
-- Safe to re-run (uses "if not exists" guards).

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  session_token text not null,
  name text not null default 'Anonymous',
  joined_at timestamptz not null default now(),
  unique (club_id, session_token)
);

-- Scope leaderboard entries to a club so members can be ranked head-to-head.
alter table public.leaderboard_entries add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists club_members_session_token_idx on public.club_members (session_token);
create index if not exists leaderboard_entries_club_week_minutes_idx
  on public.leaderboard_entries (club_id, week, minutes desc);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

-- Reads: anyone may SELECT (matches the existing leaderboard policy).
drop policy if exists "clubs read access" on public.clubs;
create policy "clubs read access"
  on public.clubs
  for select
  to anon, authenticated
  using (true);

drop policy if exists "club_members read access" on public.club_members;
create policy "club_members read access"
  on public.club_members
  for select
  to anon, authenticated
  using (true);

-- Writes: only the service role (server) may insert/update.
drop policy if exists "clubs service write" on public.clubs;
create policy "clubs service write"
  on public.clubs
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "club_members service write" on public.club_members;
create policy "club_members service write"
  on public.club_members
  for all
  to service_role
  using (true)
  with check (true);

-- Club leaderboard view: ranked entries for members of a club.
create or replace view public.club_leaderboard as
select
  e.session_token,
  e.name,
  e.minutes,
  e.week,
  m.club_id
from public.leaderboard_entries e
join public.club_members m on m.session_token = e.session_token;
