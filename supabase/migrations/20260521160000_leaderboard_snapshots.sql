-- ── Leaderboard snapshots ─────────────────────────────────────────────────────
-- Daily snapshots of the leaderboard, taken by the snapshot-leaderboard GitHub
-- Action at 07:00 UTC. Used to render a rank-over-time chart on /statistics.

create table if not exists public.leaderboard_snapshots (
  id            bigint generated always as identity primary key,
  user_id       uuid    not null references public.profiles (id) on delete cascade,
  display_name  text    not null,
  rank          integer not null,
  total_points  integer not null,
  match_points  integer not null,
  statement_points integer not null,
  snapshotted_at timestamp with time zone not null default now()
);

create index if not exists leaderboard_snapshots_user_id_idx
  on public.leaderboard_snapshots (user_id);

create index if not exists leaderboard_snapshots_at_idx
  on public.leaderboard_snapshots (snapshotted_at);

-- RLS: anyone authenticated can read; only service role can insert/delete
alter table public.leaderboard_snapshots enable row level security;

create policy "Authenticated users can read snapshots"
  on public.leaderboard_snapshots for select
  to authenticated
  using (true);
