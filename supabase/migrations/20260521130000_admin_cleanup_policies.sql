-- Admin cleanup policies.
-- Ensures admins can bulk-update and bulk-delete predictions for release cleanup tools.
-- Some of these policies may already exist from earlier migrations; drop-if-exists is safe.

-- match_predictions: admin update (needed for recalculate-all and reset-all-points)
drop policy if exists "Admins can update all match_predictions" on public.match_predictions;
create policy "Admins can update all match_predictions"
  on public.match_predictions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- match_predictions: admin delete (needed for release cleanup)
drop policy if exists "Admins can delete all match_predictions" on public.match_predictions;
create policy "Admins can delete all match_predictions"
  on public.match_predictions for delete
  to authenticated
  using (public.is_admin());

-- statement_predictions: admin update (needed for resolve-statement to set points for all users)
drop policy if exists "Admins can update all statement_predictions" on public.statement_predictions;
create policy "Admins can update all statement_predictions"
  on public.statement_predictions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- statement_predictions: admin delete (needed for release cleanup)
drop policy if exists "Admins can delete all statement_predictions" on public.statement_predictions;
create policy "Admins can delete all statement_predictions"
  on public.statement_predictions for delete
  to authenticated
  using (public.is_admin());
