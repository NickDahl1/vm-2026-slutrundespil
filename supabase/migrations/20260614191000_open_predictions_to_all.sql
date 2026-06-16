-- Open "Alles bud" to all authenticated users.
-- The knockout stage has not started yet, so the previous requirement of
-- submitting all predictions before viewing others' bets is lifted.
-- Access is now gated solely by authentication.

create or replace function public.can_view_all_predictions(_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select _user_id is not null;
$$;
