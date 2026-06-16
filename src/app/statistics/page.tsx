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
      .select("user_id, match_id, predicted_home_score, predicted_away_score, total_points, points_outcome"),
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
    supabase.from("matches").select("id").eq("status", "finished"),
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
  const finishedMatchIds = new Set((finishedMatchData ?? []).map((m: { id: number }) => m.id));
  const users = leaders.length;
  const preds = leaders.reduce((sum, l) => sum + l.predictions_count, 0);
  const stmtPreds = leaders.reduce((sum, l) => sum + l.statement_answers_count, 0);

  const tournamentStarted = finished > 0;

  // ── Goal stats ─────────────────────────────────────────────────────────────
  const totalGoals = goals.reduce(
    (s, m) => s + (m.home_score_90 ?? 0) + (m.away_score_90 ?? 0),
    0
  );
  const avgGoalsPerMatch = finished > 0 ? (totalGoals / finished).toFixed(2) : "0";
  const homeGoals = goals.reduce((s, m) => s + (m.home_score_90 ?? 0), 0);
  const awayGoals = goals.reduce((s, m) => s + (m.away_score_90 ?? 0), 0);
  const homeWins = goals.filter((m) => (m.home_score_90 ?? 0) > (m.away_score_90 ?? 0)).length;
  const draws = goals.filter((m) => m.home_score_90 === m.away_score_90).length;
  const awayWins = goals.filter((m) => (m.home_score_90 ?? 0) < (m.away_score_90 ?? 0)).length;

  // ── Prediction/participation stats ─────────────────────────────────────────
  const maxPreds = users * matches;
  const predPct = maxPreds > 0 ? Math.round((preds / maxPreds) * 100) : 0;
  const maxStmtPreds = users * stmts;
  const stmtPredPct = maxStmtPreds > 0 ? Math.round((stmtPreds / maxStmtPreds) * 100) : 0;

  // ── Per-user stats (computed from finished matches only for point averages) ─
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

  const predByUser = new Map<string, PredRow[]>();
  for (const p of allPreds) {
    const list = predByUser.get(p.user_id) ?? [];
    list.push(p);
    predByUser.set(p.user_id, list);
  }

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
      avgHome,
      avgAway,
      perfect,
      pts2,
      pts1,
      pts0,
      pts1plus,
      correct: l.correct_outcomes,
      avgPts: avgTotal,
      submitted: n,
      finishedCount: nFinished,
    };
  });

  const eligible = userPredStats.filter((s) => s.finishedCount > 0);

  function topTied<T>(arr: T[], key: (item: T) => number): T[] {
    if (arr.length === 0) return [];
    const sorted = [...arr].sort((a, b) => key(b) - key(a));
    const best = key(sorted[0]);
    return sorted.filter((item) => key(item) === best);
  }

  const highestAvgPts = topTied(eligible, (s) => s.avgPts);
  const mostPerfect = topTied(eligible, (s) => s.perfect);
  const mostPts2 = topTied(eligible, (s) => s.pts2);
  const mostPts1 = topTied(eligible, (s) => s.pts1);
  const mostPts0 = topTied(eligible, (s) => s.pts0);
  const mostPts1plus = topTied(eligible, (s) => s.pts1plus);
  const mostOptimistic = topTied(userPredStats, (s) => s.avgHome + s.avgAway);
  const mostDefensive = topTied(userPredStats, (s) => -(s.avgHome + s.avgAway));

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

  const snapshotsByUser = new Map<string, SnapshotRow[]>();
  for (const s of chartSnapshots) {
    const list = snapshotsByUser.get(s.user_id) ?? [];
    list.push(s);
    snapshotsByUser.set(s.user_id, list);
  }

  // Add a live "today" datapoint from the current leaderboard so the chart
  // is never a day behind (the nightly snapshot job may not have run yet).
  const todayMMDD = new Date().toISOString().slice(5, 10);
  const chartSeries: SnapshotSeries[] = leaders.map((l) => {
    const snapData = (snapshotsByUser.get(l.user_id) ?? []).map((s) => ({
      date: s.snapshotted_at.slice(5, 10),
      points: s.total_points,
    }));
    const hasToday = snapData.some((d) => d.date === todayMMDD);
    const data = hasToday
      ? snapData
      : [...snapData, { date: todayMMDD, points: l.total_points }];
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
        <section className="space-y-3">
          <h2 className="text-base font-black text-slate-950">Spillerstatistik</h2>
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
            {mostPerfect.length > 0 && mostPerfect[0].perfect > 0 && (
              <StatCard
                detail={`${mostPerfect[0].perfect} præcise (3 pt)`}
                label="Flest præcise resultater"
                tone="gold"
                value={<Names winners={mostPerfect} />}
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
                tone="neutral"
                value={<Names winners={mostPts0} />}
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

          {/* Detailed player table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
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
                tone="neutral"
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

      {/* ── Deltagere ────────────────────────────────────────────────────── */}
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
