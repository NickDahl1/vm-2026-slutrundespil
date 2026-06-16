import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import { LeaderboardChart, type SnapshotSeries } from "@/components/leaderboard-chart";
import type { AppSettings } from "@/lib/types";

function Names({ winners }: { winners: { display_name: string }[] }) {
  return (
    <>
      {winners.map((w, i) => (
        <span key={w.display_name}>
          {i > 0 && <br />}
          {w.display_name.split(" ")[0]}
        </span>
      ))}
    </>
  );
}

type GoalRow = { home_score_90: number | null; away_score_90: number | null };
type PredRow = {
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  total_points: number;
  points_outcome: number;
  points_home_score: number;
  points_away_score: number;
};
type SnapshotRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  snapshotted_at: string;
};
type LeaderRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  match_points: number;
  statement_points: number;
  perfect_results: number;
  correct_outcomes: number;
  predictions_count: number;
  statement_answers_count: number;
};
type FinishedMatchRow = {
  id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type MatchOutcome = "H" | "D" | "A";

function getPredOutcome(p: Pick<PredRow, "predicted_home_score" | "predicted_away_score">): MatchOutcome {
  if (p.predicted_home_score > p.predicted_away_score) return "H";
  if (p.predicted_home_score === p.predicted_away_score) return "D";
  return "A";
}

function topTied<T>(arr: T[], key: (item: T) => number): T[] {
  if (arr.length === 0) return [];
  const sorted = [...arr].sort((a, b) => key(b) - key(a));
  const best = key(sorted[0]);
  return sorted.filter((item) => key(item) === best);
}

function calcStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

const DANISH_MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function formatDay(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return `${d.getUTCDate()}. ${DANISH_MONTHS[d.getUTCMonth()]}`;
}

export default async function StatisticsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [
    { count: matchCount },
    { count: finishedCount },
    { count: groupStageCount },
    { count: stmtCount },
    { data: settingsData },
    { data: goalData },
    { data: allPredsData },
    { data: leaderData },
    { data: snapshotData },
    { data: finishedMatchData },
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "finished"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("phase", "group_stage"),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase.from("app_settings").select("*").single(),
    supabase
      .from("matches")
      .select("home_score_90, away_score_90")
      .eq("status", "finished")
      .not("home_score_90", "is", null),
    supabase
      .from("match_predictions")
      .select(
        "user_id, match_id, predicted_home_score, predicted_away_score, total_points, points_outcome, points_home_score, points_away_score"
      ),
    supabase
      .from("leaderboard_view" as never)
      .select(
        "user_id, display_name, total_points, match_points, statement_points, perfect_results, correct_outcomes, predictions_count, statement_answers_count"
      )
      .order("rank", { ascending: true }),
    supabase
      .from("leaderboard_snapshots")
      .select("user_id, display_name, total_points, snapshotted_at")
      .order("snapshotted_at", { ascending: true }),
    supabase
      .from("matches")
      .select("id, kickoff_at, home_team, away_team")
      .eq("status", "finished")
      .order("kickoff_at", { ascending: true }),
  ]);

  const settings = settingsData as AppSettings | null;
  const matches = matchCount ?? 0;
  const finished = finishedCount ?? 0;
  const groupStage = groupStageCount ?? 0;
  const stmts = stmtCount ?? 0;

  const goals = (goalData ?? []) as GoalRow[];
  const allPreds = (allPredsData ?? []) as PredRow[];
  const leaders = (leaderData ?? []) as LeaderRow[];
  const snapshots = (snapshotData ?? []) as SnapshotRow[];
  const finishedMatches = (finishedMatchData ?? []) as FinishedMatchRow[];
  const finishedMatchIds = new Set(finishedMatches.map((m) => m.id));
  const users = leaders.length;
  const preds = leaders.reduce((sum, l) => sum + l.predictions_count, 0);
  const stmtPreds = leaders.reduce((sum, l) => sum + l.statement_answers_count, 0);

  const tournamentStarted = finished > 0;

  // ── Goal stats ─────────────────────────────────────────────────────────────
  const totalGoals = goals.reduce((s, m) => s + (m.home_score_90 ?? 0) + (m.away_score_90 ?? 0), 0);
  const avgGoalsPerMatch = finished > 0 ? (totalGoals / finished).toFixed(2) : "0";
  const homeGoals = goals.reduce((s, m) => s + (m.home_score_90 ?? 0), 0);
  const awayGoals = goals.reduce((s, m) => s + (m.away_score_90 ?? 0), 0);
  const homeWins = goals.filter((m) => (m.home_score_90 ?? 0) > (m.away_score_90 ?? 0)).length;
  const draws = goals.filter((m) => m.home_score_90 === m.away_score_90).length;
  const awayWins = goals.filter((m) => (m.home_score_90 ?? 0) < (m.away_score_90 ?? 0)).length;

  // ── Participation stats ────────────────────────────────────────────────────
  const maxPreds = users * matches;
  const predPct = maxPreds > 0 ? Math.round((preds / maxPreds) * 100) : 0;
  const maxStmtPreds = users * stmts;
  const stmtPredPct = maxStmtPreds > 0 ? Math.round((stmtPreds / maxStmtPreds) * 100) : 0;

  // ── Index structures ───────────────────────────────────────────────────────
  const predByUser = new Map<string, PredRow[]>();
  const predByUserMatch = new Map<string, Map<number, PredRow>>();
  for (const p of allPreds) {
    const list = predByUser.get(p.user_id) ?? [];
    list.push(p);
    predByUser.set(p.user_id, list);

    const matchMap = predByUserMatch.get(p.user_id) ?? new Map<number, PredRow>();
    matchMap.set(p.match_id, p);
    predByUserMatch.set(p.user_id, matchMap);
  }

  // Per-match outcome distribution (finished matches only)
  const matchOutcomeDistrib = new Map<number, Map<MatchOutcome, string[]>>();
  for (const p of allPreds) {
    if (!finishedMatchIds.has(p.match_id)) continue;
    const outcome = getPredOutcome(p);
    const matchMap = matchOutcomeDistrib.get(p.match_id) ?? new Map<MatchOutcome, string[]>();
    const list = matchMap.get(outcome) ?? [];
    list.push(p.user_id);
    matchMap.set(outcome, list);
    matchOutcomeDistrib.set(p.match_id, matchMap);
  }

  function getMajorityOutcome(matchId: number): MatchOutcome | null {
    const distrib = matchOutcomeDistrib.get(matchId);
    if (!distrib) return null;
    let max = 0;
    let majority: MatchOutcome | null = null;
    for (const [o, uids] of distrib.entries()) {
      if (uids.length > max) { max = uids.length; majority = o; }
    }
    return majority;
  }

  // ── Basic per-user stats ───────────────────────────────────────────────────
  type UserPredStats = {
    user_id: string;
    display_name: string;
    avgHome: number;
    avgAway: number;
    perfect: number;
    pts2: number;
    pts1: number;
    pts0: number;
    pts1plus: number;
    correct: number;
    avgPts: number;
    submitted: number;
    finishedCount: number;
  };

  const userPredStats: UserPredStats[] = leaders.map((l) => {
    const userPreds = predByUser.get(l.user_id) ?? [];
    const n = userPreds.length;
    const finishedPreds = userPreds.filter((p) => finishedMatchIds.has(p.match_id));
    const nFinished = finishedPreds.length;
    const avgHome = n > 0 ? userPreds.reduce((s, p) => s + p.predicted_home_score, 0) / n : 0;
    const avgAway = n > 0 ? userPreds.reduce((s, p) => s + p.predicted_away_score, 0) / n : 0;
    const avgTotal =
      nFinished > 0 ? finishedPreds.reduce((s, p) => s + p.total_points, 0) / nFinished : 0;
    const perfect = finishedPreds.filter((p) => p.total_points === 3).length;
    const pts2 = finishedPreds.filter((p) => p.total_points === 2).length;
    const pts1 = finishedPreds.filter((p) => p.total_points === 1).length;
    const pts0 = finishedPreds.filter((p) => p.total_points === 0).length;
    const pts1plus = finishedPreds.filter((p) => p.total_points >= 1).length;
    return {
      user_id: l.user_id,
      display_name: l.display_name,
      avgHome, avgAway, perfect, pts2, pts1, pts0, pts1plus,
      correct: l.correct_outcomes,
      avgPts: avgTotal,
      submitted: n,
      finishedCount: nFinished,
    };
  });

  const eligible = userPredStats.filter((s) => s.finishedCount > 0);

  // ── Basic stat cards ───────────────────────────────────────────────────────
  const highestAvgPts = topTied(eligible, (s) => s.avgPts);
  const mostPerfect = topTied(eligible, (s) => s.perfect);
  const mostPts2 = topTied(eligible, (s) => s.pts2);
  const mostPts1 = topTied(eligible, (s) => s.pts1);
  const mostPts0 = topTied(eligible, (s) => s.pts0);
  const mostPts1plus = topTied(eligible, (s) => s.pts1plus);
  const mostOptimistic = topTied(userPredStats, (s) => s.avgHome + s.avgAway);
  const mostDefensive = topTied(userPredStats, (s) => -(s.avgHome + s.avgAway));

  // ── Udfaldsmester — highest % correct outcomes (min 3 finished) ───────────
  const userOutcomeStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    const correct = fp.filter((p) => p.points_outcome > 0).length;
    return {
      user_id: s.user_id, display_name: s.display_name,
      correct, outcomePct: fp.length > 0 ? correct / fp.length : 0, count: fp.length,
    };
  });
  const udfaldsmester = topTied(userOutcomeStats.filter((s) => s.count >= 3), (s) => s.outcomePct);

  // ── Konsistenskonge — lowest std dev in pts/match (min 3 finished) ─────────
  const userVarianceStats = eligible
    .map((s) => {
      const pts = (predByUser.get(s.user_id) ?? [])
        .filter((p) => finishedMatchIds.has(p.match_id))
        .map((p) => p.total_points);
      return { user_id: s.user_id, display_name: s.display_name, sd: calcStdDev(pts), count: pts.length };
    })
    .filter((s) => s.count >= 3);
  const konsistensKonge = topTied(userVarianceStats, (s) => -s.sd);

  // ── Scoringsekspert — highest % perfect matches (min 3 finished) ──────────
  const scoringsekspert = topTied(
    eligible.filter((s) => s.finishedCount >= 3).map((s) => ({
      user_id: s.user_id, display_name: s.display_name,
      perfectPct: s.perfect / s.finishedCount, perfect: s.perfect, count: s.finishedCount,
    })),
    (s) => s.perfectPct
  );

  // ── Bedste streak — longest consecutive ≥1pt run ──────────────────────────
  const userStreaks = eligible.map((s) => {
    const matchMap = predByUserMatch.get(s.user_id) ?? new Map<number, PredRow>();
    let best = 0, cur = 0;
    for (const m of finishedMatches) {
      const pred = matchMap.get(m.id);
      if (pred && pred.total_points >= 1) { cur++; if (cur > best) best = cur; }
      else cur = 0;
    }
    return { user_id: s.user_id, display_name: s.display_name, streak: best };
  });
  const bedsteStreak = topTied(userStreaks.filter((s) => s.streak > 1), (s) => s.streak);

  // ── Målrytter — most correct home scores ──────────────────────────────────
  const userGoalStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    return {
      user_id: s.user_id, display_name: s.display_name,
      correctHome: fp.filter((p) => p.points_home_score > 0).length,
    };
  });
  const målrytter = topTied(userGoalStats.filter((s) => s.correctHome > 0), (s) => s.correctHome);

  // ── Pointkilde-fordeling — goal pts vs outcome pts split ──────────────────
  const userPointSource = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    const goalPts = fp.reduce((sum, p) => sum + p.points_home_score + p.points_away_score, 0);
    const outcomePts = fp.reduce((sum, p) => sum + p.points_outcome, 0);
    const total = goalPts + outcomePts;
    return {
      user_id: s.user_id, display_name: s.display_name,
      goalPts, outcomePts, total,
      goalPct: total > 0 ? Math.round((goalPts / total) * 100) : 0,
    };
  });

  // ── Koldblodighed — most draw predictions ─────────────────────────────────
  const userDrawStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    const drawPreds = fp.filter((p) => getPredOutcome(p) === "D");
    return {
      user_id: s.user_id, display_name: s.display_name,
      drawPreds: drawPreds.length,
      correctDraws: drawPreds.filter((p) => p.points_outcome > 0).length,
    };
  });
  const koldblodighed = topTied(userDrawStats.filter((s) => s.drawPreds > 0), (s) => s.drawPreds);

  // ── Nultolerance — most low-scoring predictions (≤1 total goals) ──────────
  const userNultoleranceStats = userPredStats.map((s) => ({
    user_id: s.user_id, display_name: s.display_name,
    lowScoring: (predByUser.get(s.user_id) ?? []).filter(
      (p) => p.predicted_home_score + p.predicted_away_score <= 1
    ).length,
  }));
  const nultolerance = topTied(userNultoleranceStats.filter((s) => s.lowScoring > 0), (s) => s.lowScoring);

  // ── Ensom ulv — predictions where user is the only one picking that outcome
  const userLonerStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    let lonerCount = 0, lonerHits = 0;
    for (const p of fp) {
      const distrib = matchOutcomeDistrib.get(p.match_id);
      if (!distrib) continue;
      const same = distrib.get(getPredOutcome(p)) ?? [];
      if (same.length === 1) { lonerCount++; if (p.total_points >= 1) lonerHits++; }
    }
    return {
      user_id: s.user_id, display_name: s.display_name, lonerCount, lonerHits,
      lonerHitRate: lonerCount > 0 ? lonerHits / lonerCount : 0,
    };
  });
  const ensomUlv = topTied(userLonerStats.filter((s) => s.lonerCount > 0), (s) => s.lonerCount);
  const ensomUlvHit = topTied(
    userLonerStats.filter((s) => s.lonerCount >= 3 && s.lonerHits > 0),
    (s) => s.lonerHitRate
  );

  // ── Favoritdræber — correct predictions against the majority outcome ───────
  const userContrarianStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    let hits = 0;
    for (const p of fp) {
      const majority = getMajorityOutcome(p.match_id);
      if (majority && getPredOutcome(p) !== majority && p.total_points >= 1) hits++;
    }
    return { user_id: s.user_id, display_name: s.display_name, hits };
  });
  const favoritdræber = topTied(userContrarianStats.filter((s) => s.hits > 0), (s) => s.hits);

  // ── Den store favorit — most often picked the majority outcome ────────────
  const userFavoriteStats = eligible.map((s) => {
    const fp = (predByUser.get(s.user_id) ?? []).filter((p) => finishedMatchIds.has(p.match_id));
    let count = 0;
    for (const p of fp) {
      const majority = getMajorityOutcome(p.match_id);
      if (majority && getPredOutcome(p) === majority) count++;
    }
    return { user_id: s.user_id, display_name: s.display_name, count };
  });
  const denStoreFavorit = topTied(userFavoriteStats.filter((s) => s.count > 0), (s) => s.count);

  // ── Comeback-kid — biggest single-day points gain ─────────────────────────
  type DayGain = { date: string; gain: number };
  type ComebackCandidate = {
    user_id: string;
    display_name: string;
    bestGain: DayGain;
    bestDayMatches: { home_team: string; away_team: string; points: number }[];
  };

  const snapshotsByUser = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const list = snapshotsByUser.get(s.user_id) ?? [];
    list.push(s);
    snapshotsByUser.set(s.user_id, list);
  }

  const matchByDay = new Map<string, FinishedMatchRow[]>();
  for (const m of finishedMatches) {
    const day = m.kickoff_at.slice(0, 10);
    const list = matchByDay.get(day) ?? [];
    list.push(m);
    matchByDay.set(day, list);
  }

  const comebackCandidates: ComebackCandidate[] = [];
  for (const leader of leaders) {
    const snaps = snapshotsByUser.get(leader.user_id) ?? [];
    let bestGain: DayGain | null = null;

    for (let i = 1; i < snaps.length; i++) {
      const gain = snaps[i].total_points - snaps[i - 1].total_points;
      if (gain > 0 && (!bestGain || gain > bestGain.gain)) {
        bestGain = { date: snaps[i].snapshotted_at.slice(0, 10), gain };
      }
    }
    if (snaps.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const last = snaps[snaps.length - 1];
      const todayGain = leader.total_points - last.total_points;
      if (todayGain > 0 && today > last.snapshotted_at.slice(0, 10) && (!bestGain || todayGain > bestGain.gain)) {
        bestGain = { date: today, gain: todayGain };
      }
    }

    if (!bestGain) continue;
    const matchMap = predByUserMatch.get(leader.user_id) ?? new Map<number, PredRow>();
    const dayMatches = matchByDay.get(bestGain.date) ?? [];
    const bestDayMatches = dayMatches
      .map((m) => ({ home_team: m.home_team, away_team: m.away_team, points: matchMap.get(m.id)?.total_points ?? 0 }))
      .filter((m) => m.points > 0)
      .sort((a, b) => b.points - a.points);

    comebackCandidates.push({ user_id: leader.user_id, display_name: leader.display_name, bestGain, bestDayMatches });
  }
  const comebackKid = topTied(comebackCandidates, (s) => s.bestGain.gain);

  // ── Dage som nr. 1 — days each player led the leaderboard ────────────────
  const snapshotsByDate = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const day = s.snapshotted_at.slice(0, 10);
    const list = snapshotsByDate.get(day) ?? [];
    list.push(s);
    snapshotsByDate.set(day, list);
  }
  const daysAtTop = new Map<string, number>();
  for (const [, daySnaps] of snapshotsByDate.entries()) {
    if (daySnaps.length === 0) continue;
    const maxPts = Math.max(...daySnaps.map((s) => s.total_points));
    if (maxPts === 0) continue;
    for (const s of daySnaps) {
      if (s.total_points === maxPts) {
        daysAtTop.set(s.user_id, (daysAtTop.get(s.user_id) ?? 0) + 1);
      }
    }
  }

  // ── Forecast ───────────────────────────────────────────────────────────────
  const remainingMatches = matches - finished;
  const projectedPlayers = [...leaders]
    .map((l) => {
      const stat = userPredStats.find((u) => u.user_id === l.user_id);
      if (!stat || stat.finishedCount === 0) return { ...l, projected: l.total_points };
      const projectedMatch = l.match_points + Math.round(stat.avgPts * remainingMatches);
      return { ...l, projected: projectedMatch + l.statement_points };
    })
    .sort((a, b) => b.projected - a.projected);

  const groupStageGoalsProjected =
    finished > 0 && groupStage > 0
      ? Math.round(parseFloat(avgGoalsPerMatch) * groupStage)
      : null;
  const tournamentGoalsProjected =
    finished > 0 && matches > 0
      ? Math.round(parseFloat(avgGoalsPerMatch) * matches)
      : null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const firstPointsDate = snapshots.find((s) => s.total_points > 0)?.snapshotted_at.slice(0, 10);
  const chartSnapshots = firstPointsDate
    ? snapshots.filter((s) => s.snapshotted_at.slice(0, 10) >= firstPointsDate)
    : snapshots;

  const chartSnapshotsByUser = new Map<string, SnapshotRow[]>();
  for (const s of chartSnapshots) {
    const list = chartSnapshotsByUser.get(s.user_id) ?? [];
    list.push(s);
    chartSnapshotsByUser.set(s.user_id, list);
  }

  const todayMMDD = new Date().toISOString().slice(5, 10);
  const chartSeries: SnapshotSeries[] = leaders.map((l) => {
    const snapData = (chartSnapshotsByUser.get(l.user_id) ?? []).map((s) => ({
      date: s.snapshotted_at.slice(5, 10),
      points: s.total_points,
    }));
    const hasToday = snapData.some((d) => d.date === todayMMDD);
    const data = hasToday ? snapData : [...snapData, { date: todayMMDD, points: l.total_points }];
    return { name: l.display_name, isMe: l.user_id === user.id, data };
  });
  const hasChartData = tournamentStarted && chartSeries.some((s) => s.data.length >= 2);

  return (
    <div className="space-y-8">
      <PageHeader
        description={
          tournamentStarted
            ? `${finished} kamp${finished === 1 ? "" : "e"} afsluttet af ${matches} i alt.`
            : "Turneringen starter 11. juni 2026. Her ses live-statistik under VM."
        }
        eyebrow="Turneringsstatistik"
        title="Statistik"
      />

      {!tournamentStarted && (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-4 text-center">
          <p className="text-3xl">⚽</p>
          <p className="mt-2 font-black text-pitch-700">Turneringen starter 11. juni 2026</p>
          <p className="mt-1 text-sm font-semibold text-pitch-500">
            Kampstatistik og scoringsoverblik vises her, efterhånden som kampe spilles.
          </p>
          {settings?.group_stage_lock_at && (
            <p className="mt-2 text-xs font-semibold text-pitch-400">
              Deadline for kampbud og udsagn:{" "}
              <strong>{formatDanishDateTime(settings.group_stage_lock_at)}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── Udvikling over tid ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-slate-950">Udvikling over tid</h2>
        {!hasChartData ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-400">
              Grafen vises, når der er mindst to dages data (fra 11. juni 2026).
            </p>
          </div>
        ) : (
          <div className="card p-4">
            <p className="mb-4 text-xs font-semibold text-slate-400">
              Samlet point pr. dag · Din linje er tykkere
            </p>
            <LeaderboardChart series={chartSeries} />
          </div>
        )}
      </section>

      {/* ── Spillerstatistik ──────────────────────────────────────────────── */}
      {tournamentStarted && userPredStats.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-base font-black text-slate-950">Spillerstatistik</h2>

          {/* Pointudbytte */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Pointudbytte
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {highestAvgPts.length > 0 && (
                <StatCard
                  detail={`${highestAvgPts[0].avgPts.toFixed(2)} pt/kamp`}
                  label="Bedst point pr. kamp"
                  tone="gold"
                  value={<Names winners={highestAvgPts} />}
                />
              )}
              {mostPts1plus.length > 0 && mostPts1plus[0].pts1plus > 0 && (
                <StatCard
                  detail={`${mostPts1plus[0].pts1plus} kampe med ≥1 pt`}
                  label="Flest kampe med point"
                  tone="green"
                  value={<Names winners={mostPts1plus} />}
                />
              )}
              {bedsteStreak.length > 0 && (
                <StatCard
                  detail={`${bedsteStreak[0].streak} kampe i træk med mindst 1 point`}
                  label="Bedste streak"
                  tone="green"
                  value={<Names winners={bedsteStreak} />}
                />
              )}
              {udfaldsmester.length > 0 && (
                <StatCard
                  detail={`${Math.round(udfaldsmester[0].outcomePct * 100)}% korrekte udfald (H/U/B)`}
                  label="Udfaldsmester"
                  tone="gold"
                  value={<Names winners={udfaldsmester} />}
                />
              )}
              {konsistensKonge.length > 0 && (
                <StatCard
                  detail={`Std. afv. ${konsistensKonge[0].sd.toFixed(2)} — mindst spredning i point pr. kamp`}
                  label="Konsistenskonge"
                  value={<Names winners={konsistensKonge} />}
                />
              )}
            </div>
          </div>

          {/* Præcision */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Præcision
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mostPerfect.length > 0 && mostPerfect[0].perfect > 0 && (
                <StatCard
                  detail={`${mostPerfect[0].perfect} præcise resultater (3 pt)`}
                  label="Flest præcise resultater"
                  tone="gold"
                  value={<Names winners={mostPerfect} />}
                />
              )}
              {scoringsekspert.length > 0 && scoringsekspert[0].perfectPct > 0 && (
                <StatCard
                  detail={`${Math.round(scoringsekspert[0].perfectPct * 100)}% af spilede kampe er præcise (min. 3 kampe)`}
                  label="Scoringsekspert"
                  tone="gold"
                  value={<Names winners={scoringsekspert} />}
                />
              )}
              {mostPts2.length > 0 && mostPts2[0].pts2 > 0 && (
                <StatCard
                  detail={`${mostPts2[0].pts2} kampe med 2 pt`}
                  label="Flest 2-point kampe"
                  value={<Names winners={mostPts2} />}
                />
              )}
              {mostPts1.length > 0 && mostPts1[0].pts1 > 0 && (
                <StatCard
                  detail={`${mostPts1[0].pts1} kampe med 1 pt`}
                  label="Flest 1-point kampe"
                  value={<Names winners={mostPts1} />}
                />
              )}
              {mostPts0.length > 0 && mostPts0[0].pts0 > 0 && (
                <StatCard
                  detail={`${mostPts0[0].pts0} kampe med 0 pt`}
                  label="Flest kampe uden point"
                  value={<Names winners={mostPts0} />}
                />
              )}
              {målrytter.length > 0 && (
                <StatCard
                  detail={`${målrytter[0].correctHome} korrekte hjemmemål`}
                  label="Målrytter"
                  tone="green"
                  value={<Names winners={målrytter} />}
                />
              )}
            </div>
          </div>

          {/* Pointkilde-fordeling */}
          {userPointSource.length > 0 && userPointSource.some((s) => s.total > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Pointkilde
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Mål-pt = point fra korrekte hjemme- og udemål · Udfald-pt = point fra korrekt H/U/B
              </p>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-black uppercase text-slate-500">
                          Spiller
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                          Mål-pt
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                          Udfald-pt
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                          I alt
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                          Mål-andel
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...userPointSource]
                        .sort((a, b) => b.goalPct - a.goalPct)
                        .map((s) => (
                          <tr
                            key={s.user_id}
                            className={`border-b border-slate-100 last:border-b-0 ${
                              s.user_id === user.id ? "bg-pitch-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-4 py-2.5 font-bold text-slate-800">
                              {s.display_name}
                              {s.user_id === user.id && (
                                <span className="ml-1 text-xs font-black text-pitch-500">(dig)</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                              {s.goalPts}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                              {s.outcomePts}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-950">
                              {s.total}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-pitch-500"
                                    style={{ width: `${s.goalPct}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right font-semibold text-slate-600">
                                  {s.goalPct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modsvar og dristighed */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Modsvar og dristighed
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ensomUlv.length > 0 && (
                <StatCard
                  detail={`${ensomUlv[0].lonerCount} kampe som eneste med det udfaldsbud`}
                  label="Ensom ulv"
                  value={<Names winners={ensomUlv} />}
                />
              )}
              {ensomUlvHit.length > 0 && (
                <StatCard
                  detail={`${Math.round(ensomUlvHit[0].lonerHitRate * 100)}% hit-rate på ensomme bud (min. 3 bud)`}
                  label="Ensom ulv — træffer"
                  tone="green"
                  value={<Names winners={ensomUlvHit} />}
                />
              )}
              {favoritdræber.length > 0 && (
                <StatCard
                  detail={`${favoritdræber[0].hits} gange scoret point imod flertallets bud`}
                  label="Favoritdræber"
                  tone="gold"
                  value={<Names winners={favoritdræber} />}
                />
              )}
              {denStoreFavorit.length > 0 && (
                <StatCard
                  detail={`${denStoreFavorit[0].count} gange budt på det samme som flertallet`}
                  label="Den store favorit"
                  value={<Names winners={denStoreFavorit} />}
                />
              )}
              {koldblodighed.length > 0 && (
                <StatCard
                  detail={`${koldblodighed[0].drawPreds} uafgjorte-bud · ${koldblodighed[0].correctDraws} korrekte`}
                  label="Koldblodighed"
                  value={<Names winners={koldblodighed} />}
                />
              )}
              {nultolerance.length > 0 && (
                <StatCard
                  detail={`${nultolerance[0].lowScoring} bud på 0-0, 1-0 eller 0-1`}
                  label="Nultolerance"
                  value={<Names winners={nultolerance} />}
                />
              )}
              {mostOptimistic.length > 0 && (
                <StatCard
                  detail={`Snit ${(mostOptimistic[0].avgHome + mostOptimistic[0].avgAway).toFixed(1)} mål pr. kamp`}
                  label="Mest optimistisk"
                  value={<Names winners={mostOptimistic} />}
                />
              )}
              {mostDefensive.length > 0 && (
                <StatCard
                  detail={`Snit ${(mostDefensive[0].avgHome + mostDefensive[0].avgAway).toFixed(1)} mål pr. kamp`}
                  label="Mest defensiv"
                  value={<Names winners={mostDefensive} />}
                />
              )}
            </div>
          </div>

          {/* Bedste øjeblik */}
          {comebackKid.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Bedste øjeblik
              </h3>
              <article className="card space-y-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Comeback-kid — flest point på én dag
                  </p>
                  <p className="mt-1 text-2xl font-black leading-tight text-slate-950">
                    {comebackKid.map((k, i) => (
                      <span key={k.user_id}>
                        {i > 0 && <br />}
                        {k.display_name.split(" ")[0]}
                      </span>
                    ))}
                  </p>
                  <p className="mt-1 text-sm font-bold text-pitch-700">
                    +{comebackKid[0].bestGain.gain} pt den {formatDay(comebackKid[0].bestGain.date)}
                  </p>
                </div>
                {comebackKid[0].bestDayMatches.length > 0 && (
                  <div className="space-y-1.5 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Bidragende kampe
                    </p>
                    {comebackKid[0].bestDayMatches.map((m) => (
                      <div
                        key={`${m.home_team}-${m.away_team}`}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="font-semibold text-slate-700">
                          {m.home_team} – {m.away_team}
                        </span>
                        <span
                          className={`font-black ${m.points === 3 ? "text-cup-500" : "text-pitch-700"}`}
                        >
                          +{m.points} pt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          )}

          {/* Detailed player table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase text-slate-500">
                      Spiller
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Bud
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500 text-cup-500">
                      3 pt
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      2 pt
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      1 pt
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-400">
                      0 pt
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Pt/kamp
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500" title="Antal dage som delt førsteplads (flest point)">
                      Dage #1
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...userPredStats]
                    .sort((a, b) => b.avgPts - a.avgPts)
                    .map((s) => (
                      <tr
                        key={s.user_id}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          s.user_id === user.id ? "bg-pitch-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold text-slate-800">
                          {s.display_name}
                          {s.user_id === user.id && (
                            <span className="ml-1 text-xs font-black text-pitch-500">(dig)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-500">
                          {s.submitted}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`font-bold ${
                              s.perfect > 0 ? "text-cup-500" : "text-slate-300"
                            }`}
                          >
                            {s.perfect}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                          {s.pts2}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-500">
                          {s.pts1}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-300">
                          {s.pts0}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-950">
                          {s.finishedCount > 0 ? s.avgPts.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                          {daysAtTop.get(s.user_id) ?? 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Forudsigelser ─────────────────────────────────────────────────── */}
      {tournamentStarted && (
        <section className="space-y-3">
          <h2 className="text-base font-black text-slate-950">Forudsigelser</h2>
          <p className="text-xs font-semibold text-slate-400">
            Estimater baseret på nuværende rate · Præcisionen stiger jo flere kampe der spilles
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupStageGoalsProjected !== null && (
              <StatCard
                detail={`${finished} kampe spillet · snit ${avgGoalsPerMatch} mål/kamp`}
                label="Forventede mål – grundspil"
                tone="gold"
                value={String(groupStageGoalsProjected)}
              />
            )}
            {tournamentGoalsProjected !== null && (
              <StatCard
                detail={`${matches} kampe i alt · snit ${avgGoalsPerMatch} mål/kamp`}
                label="Forventede mål – hele turneringen"
                value={String(tournamentGoalsProjected)}
              />
            )}
          </div>

          {projectedPlayers.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-xs font-black uppercase text-slate-500">
                        Spiller
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                        Point nu
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                        Estimeret slutpoint
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectedPlayers.map((l) => (
                      <tr
                        key={l.user_id}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          l.user_id === user.id ? "bg-pitch-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold text-slate-800">
                          {l.display_name}
                          {l.user_id === user.id && (
                            <span className="ml-1 text-xs font-black text-pitch-500">(dig)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-500">
                          {l.total_points}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-950">
                          ~{l.projected}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Deltagere ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-slate-950">Deltagere</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            detail="Registrerede spillere"
            label="Deltagere"
            tone="green"
            value={String(users)}
          />
          <StatCard
            detail={`${preds} af ${maxPreds} mulige (${predPct}%)`}
            label="Kampbud afgivet"
            tone={predPct === 100 ? "green" : predPct > 50 ? "gold" : "neutral"}
            value={`${predPct}%`}
          />
          <StatCard
            detail={`${stmtPreds} af ${maxStmtPreds} mulige (${stmtPredPct}%)`}
            label="Udsagnssvar afgivet"
            tone={stmtPredPct === 100 ? "green" : stmtPredPct > 50 ? "gold" : "neutral"}
            value={`${stmtPredPct}%`}
          />
        </div>
      </section>

      {/* ── Kampresultater ────────────────────────────────────────────────── */}
      {tournamentStarted && (
        <section className="space-y-3">
          <h2 className="text-base font-black text-slate-950">Kampresultater</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              detail={`Af ${matches} planlagte VM-kampe`}
              label="Kampe afsluttet"
              tone="green"
              value={String(finished)}
            />
            <StatCard
              detail={`Snit ${avgGoalsPerMatch} mål pr. kamp`}
              label="Mål i alt"
              tone="gold"
              value={String(totalGoals)}
            />
            <StatCard
              detail={`${homeGoals} hjem · ${awayGoals} ude`}
              label="Mål hjemme vs. ude"
              value={`${homeGoals}–${awayGoals}`}
            />
            <StatCard
              detail={`Af ${finished} afsluttede kampe`}
              label="Hjemmesejre"
              tone={homeWins > awayWins ? "green" : "neutral"}
              value={String(homeWins)}
            />
            <StatCard
              detail={`Af ${finished} afsluttede kampe`}
              label="Uafgjorte"
              value={String(draws)}
            />
            <StatCard
              detail={`Af ${finished} afsluttede kampe`}
              label="Udesejre"
              value={String(awayWins)}
            />
          </div>
        </section>
      )}

      {tournamentStarted && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Pointoverblik pr. spiller: se <strong>Leaderboard</strong>. Alle kampbud og udsagn:{" "}
          <strong>Alles bud</strong>.
        </div>
      )}
    </div>
  );
}
