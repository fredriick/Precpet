-- Coach drill assignments schema for Precept
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).
-- Safe to re-run (uses "if not exists" guards).

create table if not exists public.drill_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_token text not null,
  coach_name text not null default 'Coach',
  skill_id text not null,
  skill_name text not null,
  sport text,
  note text,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_claims (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.drill_assignments(id) on delete cascade,
  athlete_token text not null,
  athlete_name text not null default 'Anonymous',
  completed boolean not null default false,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (assignment_id, athlete_token)
);

create index if not exists drill_assignments_coach_idx on public.drill_assignments (coach_token, created_at);
create index if not exists assignment_claims_athlete_idx on public.assignment_claims (athlete_token);

-- Assignments are private: only the service role touches these tables. The API
-- authorizes coaches and athletes by session token.
alter table public.drill_assignments enable row level security;
alter table public.assignment_claims enable row level security;

drop policy if exists "drill_assignments service access" on public.drill_assignments;
create policy "drill_assignments service access"
  on public.drill_assignments
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "assignment_claims service access" on public.assignment_claims;
create policy "assignment_claims service access"
  on public.assignment_claims
  for all
  to service_role
  using (true)
  with check (true);
