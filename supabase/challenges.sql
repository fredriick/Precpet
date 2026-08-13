-- Head-to-head challenges schema for Precept
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).
-- Safe to re-run (uses "if not exists" guards).

-- Short, human-friendly codes that map back to anonymous session tokens so
-- players can challenge each other without exposing their raw token.
create table if not exists public.player_codes (
  session_token text primary key,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_token text not null,
  challenger_name text not null default 'Anonymous',
  opponent_token text not null,
  opponent_name text not null default 'Anonymous',
  sport text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'completed')),
  winner_token text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  resolved_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days'
);

create index if not exists challenges_challenger_idx on public.challenges (challenger_token, status);
create index if not exists challenges_opponent_idx on public.challenges (opponent_token, status);

-- Challenge data is private: RLS allows only the service role. The API reads
-- through the service key and authorizes participants by session token, so the
-- anon/authenticated roles get no access to these tables.
alter table public.player_codes enable row level security;
alter table public.challenges enable row level security;

drop policy if exists "player_codes service access" on public.player_codes;
create policy "player_codes service access"
  on public.player_codes
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "challenges service access" on public.challenges;
create policy "challenges service access"
  on public.challenges
  for all
  to service_role
  using (true)
  with check (true);
