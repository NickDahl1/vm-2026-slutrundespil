-- ── Per-match prediction open/close control ──────────────────────────────────
-- Replaces the global app_settings.knockout_predictions_open gate with a
-- per-match flag so admin can open individual knockout fixtures as teams are
-- confirmed, without having to open all knockout predictions at once.
--
-- group_stage matches are set to predictions_open = true immediately so
-- existing behaviour is preserved.
-- knockout_stage matches default to false; admin toggles them per match.

-- 1. Add the column
alter table public.matches
  add column if not exists predictions_open boolean not null default false;

-- 2. Back-fill: all group_stage matches are always open
update public.matches
  set predictions_open = true
  where phase = 'group_stage';

-- 3. Drop the old global-flag RLS policies
drop policy if exists "Block knockout predict insert before open" on public.match_predictions;
drop policy if exists "Block knockout predict update before open" on public.match_predictions;

-- 4. New per-match RESTRICTIVE policies
-- INSERT: only allowed when the match itself has predictions_open = true
create policy "Block predict insert when not open"
  on public.match_predictions
  as restrictive
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.predictions_open = true
    )
  );

-- UPDATE: only allowed when the match itself has predictions_open = true
create policy "Block predict update when not open"
  on public.match_predictions
  as restrictive
  for update
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.predictions_open = true
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.predictions_open = true
    )
  );
