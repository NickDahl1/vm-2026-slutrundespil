-- Rebuild leaderboard_view to include statement_points.
-- Uses subquery joins to avoid Cartesian product when a user has
-- both match_predictions and statement_predictions.
drop view if exists public.leaderboard_view;

create view public.leaderboard_view as
select
  p.id                                                              as user_id,
  p.display_name,
  coalesce(mp.match_points, 0)::int                                as match_points,
  coalesce(sp.statement_points, 0)::int                            as statement_points,
  (coalesce(mp.match_points, 0) + coalesce(sp.statement_points, 0))::int
                                                                   as total_points,
  coalesce(mp.perfect_results, 0)::int                             as perfect_results,
  coalesce(mp.correct_outcomes, 0)::int                            as correct_outcomes,
  coalesce(mp.predictions_count, 0)::int                           as predictions_count,
  coalesce(sp.statement_answers_count, 0)::int                     as statement_answers_count,
  rank() over (
    order by
      (coalesce(mp.match_points, 0) + coalesce(sp.statement_points, 0)) desc,
      coalesce(mp.match_points, 0) desc,
      coalesce(mp.perfect_results, 0) desc,
      coalesce(mp.correct_outcomes, 0) desc,
      p.display_name asc
  )::int                                                           as rank
from public.profiles p
left join (
  select
    user_id,
    sum(total_points)::int                                    as match_points,
    count(case when total_points = 3 then 1 end)::int         as perfect_results,
    count(case when points_outcome = 1 then 1 end)::int       as correct_outcomes,
    count(id)::int                                            as predictions_count
  from public.match_predictions
  group by user_id
) mp on mp.user_id = p.id
left join (
  select
    user_id,
    sum(points)::int   as statement_points,
    count(id)::int     as statement_answers_count
  from public.statement_predictions
  group by user_id
) sp on sp.user_id = p.id;

grant select on public.leaderboard_view to authenticated;
