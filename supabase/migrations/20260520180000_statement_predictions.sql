create table if not exists public.statement_predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  statement_id bigint not null references public.statements(id) on delete cascade,
  answer text not null,
  points int not null default 0,
  submitted_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint statement_predictions_unique unique (user_id, statement_id),
  constraint statement_predictions_points_min check (points >= 0),
  constraint statement_predictions_points_max check (points <= 3)
);

drop trigger if exists set_statement_predictions_updated_at on public.statement_predictions;
create trigger set_statement_predictions_updated_at
  before update on public.statement_predictions
  for each row execute function public.set_updated_at();

alter table public.statement_predictions enable row level security;

drop policy if exists "Users can read own statement predictions" on public.statement_predictions;
create policy "Users can read own statement predictions"
  on public.statement_predictions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all statement predictions" on public.statement_predictions;
create policy "Admins can read all statement predictions"
  on public.statement_predictions for select to authenticated
  using (public.is_admin());

drop policy if exists "Users can insert own statement predictions" on public.statement_predictions;
create policy "Users can insert own statement predictions"
  on public.statement_predictions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own statement predictions" on public.statement_predictions;
create policy "Users can update own statement predictions"
  on public.statement_predictions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can update all statement predictions" on public.statement_predictions;
create policy "Admins can update all statement predictions"
  on public.statement_predictions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
