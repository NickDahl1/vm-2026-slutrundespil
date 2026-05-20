create table if not exists public.matches (
  id bigint generated always as identity primary key,
  phase text not null default 'group_stage',
  match_no int not null,
  group_name text,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamp with time zone not null,
  home_score_90 int,
  away_score_90 int,
  status text not null default 'scheduled',
  external_match_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint matches_status_check
    check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  constraint matches_phase_check
    check (phase in ('group_stage', 'knockout_stage')),
  constraint matches_match_no_unique
    unique (match_no),
  constraint matches_home_score_non_negative
    check (home_score_90 is null or home_score_90 >= 0),
  constraint matches_away_score_non_negative
    check (away_score_90 is null or away_score_90 >= 0)
);

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

alter table public.matches enable row level security;

drop policy if exists "Authenticated users can read matches" on public.matches;
create policy "Authenticated users can read matches"
on public.matches for select
to authenticated
using (true);

drop policy if exists "Admins can manage matches" on public.matches;
create policy "Admins can manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
