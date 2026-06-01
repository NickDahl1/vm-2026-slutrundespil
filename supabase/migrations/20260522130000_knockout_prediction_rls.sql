-- ── Block knockout predictions when not yet open ─────────────────────────────
-- RESTRICTIVE policies are AND-ed with all permissive policies, so they can
-- only make access more restrictive, never more permissive.
--
-- Effect: authenticated users cannot INSERT or UPDATE a match_prediction for a
-- knockout-stage match while app_settings.knockout_predictions_open = false.
--
-- Existing rows (from before the fix) are NOT affected — SELECT is untouched
-- and no data is deleted or modified.

drop policy if exists "Block knockout predict insert before open" on public.match_predictions;
drop policy if exists "Block knockout predict update before open" on public.match_predictions;

-- Block INSERT on knockout matches when not open
create policy "Block knockout predict insert before open"
  on public.match_predictions
  as restrictive
  for insert
  to authenticated
  with check (
    (select m.phase from public.matches m where m.id = match_id) = 'group_stage'
    or coalesce(
      (select s.knockout_predictions_open from public.app_settings s limit 1),
      false
    )
  );

-- Block UPDATE on knockout matches when not open
create policy "Block knockout predict update before open"
  on public.match_predictions
  as restrictive
  for update
  to authenticated
  using (
    (select m.phase from public.matches m where m.id = match_id) = 'group_stage'
    or coalesce(
      (select s.knockout_predictions_open from public.app_settings s limit 1),
      false
    )
  )
  with check (
    (select m.phase from public.matches m where m.id = match_id) = 'group_stage'
    or coalesce(
      (select s.knockout_predictions_open from public.app_settings s limit 1),
      false
    )
  );
