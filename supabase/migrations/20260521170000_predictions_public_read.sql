-- ── Allow authenticated users to read all predictions ────────────────────────
-- Required for the /predictions page, which shows everyone's picks once a user
-- has submitted all their own predictions + statement answers.
-- Access gating is enforced at the page level — RLS just unlocks the data.

do $$ begin

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'match_predictions'
      and policyname = 'Authenticated users can view all match predictions'
  ) then
    create policy "Authenticated users can view all match predictions"
      on public.match_predictions for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'statement_predictions'
      and policyname = 'Authenticated users can view all statement predictions'
  ) then
    create policy "Authenticated users can view all statement predictions"
      on public.statement_predictions for select
      to authenticated
      using (true);
  end if;

end $$;
