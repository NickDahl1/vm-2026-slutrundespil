-- Release review hardening.
-- Keep the app-level gates backed by RLS so users cannot bypass deadlines or
-- "Alles bud" access from a direct Supabase client.

create or replace function public.can_view_all_predictions(_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(public.is_admin(_user_id), false)
    or (
      _user_id is not null
      and (select count(*) from public.matches) > 0
      and (select count(*) from public.statements) > 0
      and (
        select count(*)
        from public.match_predictions mp
        where mp.user_id = _user_id
      ) >= (select count(*) from public.matches)
      and (
        select count(*)
        from public.statement_predictions sp
        where sp.user_id = _user_id
      ) >= (select count(*) from public.statements)
    );
$$;

create or replace function public.can_write_match_prediction(_match_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches m
    cross join public.app_settings s
    where m.id = _match_id
      and s.id = 'global'
      and s.game_locked = false
      and m.status = 'scheduled'
      and (
        (
          m.phase = 'group_stage'
          and (s.group_stage_lock_at is null or s.group_stage_lock_at > now())
        )
        or (
          m.phase = 'knockout_stage'
          and (s.knockout_stage_lock_at is null or s.knockout_stage_lock_at > now())
        )
      )
  );
$$;

create or replace function public.can_write_statement_prediction(_statement_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.statements st
    cross join public.app_settings s
    where st.id = _statement_id
      and s.id = 'global'
      and s.game_locked = false
      and st.is_resolved = false
      and (s.group_stage_lock_at is null or s.group_stage_lock_at > now())
  );
$$;

drop policy if exists "Authenticated users can view all match predictions" on public.match_predictions;
create policy "Eligible users can view all match predictions"
  on public.match_predictions for select
  to authenticated
  using (public.can_view_all_predictions());

drop policy if exists "Authenticated users can view all statement predictions" on public.statement_predictions;
create policy "Eligible users can view all statement predictions"
  on public.statement_predictions for select
  to authenticated
  using (public.can_view_all_predictions());

drop policy if exists "Eligible users can read participant profiles" on public.profiles;
create policy "Eligible users can read participant profiles"
  on public.profiles for select
  to authenticated
  using (public.can_view_all_predictions());

drop policy if exists "Users can insert own predictions" on public.match_predictions;
create policy "Users can insert own predictions"
  on public.match_predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_write_match_prediction(match_id)
  );

drop policy if exists "Users can update own predictions" on public.match_predictions;
create policy "Users can update own predictions"
  on public.match_predictions for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.can_write_match_prediction(match_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_write_match_prediction(match_id)
  );

drop policy if exists "Users can insert own statement predictions" on public.statement_predictions;
create policy "Users can insert own statement predictions"
  on public.statement_predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_write_statement_prediction(statement_id)
  );

drop policy if exists "Users can update own statement predictions" on public.statement_predictions;
create policy "Users can update own statement predictions"
  on public.statement_predictions for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.can_write_statement_prediction(statement_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_write_statement_prediction(statement_id)
  );
