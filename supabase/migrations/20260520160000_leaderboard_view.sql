-- Leaderboard view
-- Owned by postgres (superuser) so it bypasses RLS on underlying tables,
-- allowing aggregation across all users' predictions.
create or replace view public.leaderboard_view as
select
  p.id                                                             as user_id,
  p.display_name,
  coalesce(sum(mp.total_points), 0)::int                          as match_points,
  coalesce(sum(mp.total_points), 0)::int                          as total_points,
  count(case when mp.total_points = 3 then 1 end)::int            as perfect_results,
  count(case when mp.points_outcome = 1 then 1 end)::int          as correct_outcomes,
  count(mp.id)::int                                               as predictions_count,
  rank() over (
    order by
      coalesce(sum(mp.total_points), 0) desc,
      count(case when mp.total_points = 3 then 1 end) desc,
      count(case when mp.points_outcome = 1 then 1 end) desc,
      p.display_name asc
  )::int                                                          as rank
from public.profiles p
left join public.match_predictions mp on mp.user_id = p.id
group by p.id, p.display_name;

grant select on public.leaderboard_view to authenticated;

-- Allow authenticated users to read any prediction for a finished match.
-- This enables the leaderboard detail page to show another user's results.
-- Predictions for unfinished matches remain private (only own predictions visible).
drop policy if exists "Authenticated can read finished predictions" on public.match_predictions;
create policy "Authenticated can read finished predictions"
  on public.match_predictions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_predictions.match_id
        and m.status = 'finished'
    )
  );
