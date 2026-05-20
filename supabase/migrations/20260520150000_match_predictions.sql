create table if not exists public.match_predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,
  predicted_home_score int not null,
  predicted_away_score int not null,
  points_home_score int not null default 0,
  points_away_score int not null default 0,
  points_outcome int not null default 0,
  total_points int not null default 0,
  submitted_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint match_predictions_unique unique (user_id, match_id),
  constraint match_predictions_predicted_home_non_negative
    check (predicted_home_score >= 0),
  constraint match_predictions_predicted_away_non_negative
    check (predicted_away_score >= 0),
  constraint match_predictions_points_home_non_negative
    check (points_home_score >= 0),
  constraint match_predictions_points_away_non_negative
    check (points_away_score >= 0),
  constraint match_predictions_points_outcome_non_negative
    check (points_outcome >= 0),
  constraint match_predictions_total_points_non_negative
    check (total_points >= 0)
);

drop trigger if exists set_match_predictions_updated_at on public.match_predictions;
create trigger set_match_predictions_updated_at
before update on public.match_predictions
for each row execute function public.set_updated_at();

alter table public.match_predictions enable row level security;

drop policy if exists "Users can read own predictions" on public.match_predictions;
create policy "Users can read own predictions"
on public.match_predictions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read all predictions" on public.match_predictions;
create policy "Admins can read all predictions"
on public.match_predictions for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can insert own predictions" on public.match_predictions;
create policy "Users can insert own predictions"
on public.match_predictions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own predictions" on public.match_predictions;
create policy "Users can update own predictions"
on public.match_predictions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
