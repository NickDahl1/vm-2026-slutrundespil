import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import { LeaderboardChart, type SnapshotSeries } from "@/components/leaderboard-chart";
import type { AppSettings } from "@/lib/types";

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
};

export default async function StatisticsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: matchCount },
    { count: predCount },
    { count: finishedCount },
    { count: stmtCount },
    { count: stmtPredCount },
    { data: settingsData },
    { data: goalData },
    { data: allPredsData },
    { data: leaderData },
    { data: snapshotData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("match_predictions").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "finished"),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase.from("statement_predictions").select("*", { count: "exact", head: true }),
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
        "user_id, display_name, total_points, match_points, statement_points, perfect_results, correct_outcomes, predictions_count"
      )
      .order("rank", { ascending: true }),
    supabase
      .from("leaderboard_snapshots")
      .select("user_id, display_name, total_points, snapshotted_at")
      .order("snapshotted_at", { ascending: true }),
  ]);

  const settings = settingsData as AppSettings | null;
  const users = userCount ?? 0;
  const matches = matchCount ?? 0;
  const preds = predCount ?? 0;
  const finished = finishedCount ?? 0;
  const stmts = stmtCount ?? 0;
  const stmtPreds = stmtPredCount ?? 0;

  const goals = (goalData ?? []) as GoalRow[];
  const allPreds = (allPredsData ?? []) as PredRow[];
  const leaders = (leaderData ?? []) as LeaderRow[];
  const snapshots = (snapshotData ?? []) as SnapshotRow[];

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

  // ── Prediction stats ───────────────────────────────────────────────────────
  const maxPreds = users * matches;
  const predPct = maxPreds > 0 ? Math.round((preds / maxPreds) * 100) : 0;
  const maxStmtPreds = users * stmts;
  const stmtPredPct = maxStmtPreds > 0 ? Math.round((stmtPreds / maxStmtPreds) * 100) : 0;

  // Per-user prediction stats (for most optimistic / most defensive)
  type UserPredStats = {
    user_id: string;
    display_name: string;
    avgHome: number;
    avgAway: number;
    avgTotal: number;
    perfect: number;
    correct: number;
    avgPts: number;
    submitted: number;
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
    const finishedPreds = userPreds.filter((p) => p.total_points > 0 || p.points_outcome >= 0);
    const avgHome = n > 0 ? userPreds.reduce((s, p) => s + p.predicted_home_score, 0) / n : 0;
    const avgAway = n > 0 ? userPreds.reduce((s, p) => s + p.predicted_away_score, 0) / n : 0;
    const avgTotal = n > 0 ? userPreds.reduce((s, p) => s + p.total_points, 0) / n : 0;
    return {
      user_id: l.user_id,
      display_name: l.display_name,
      avgHome,
      avgAway,
      avgTotal,
      perfect: l.perfect_results,
      correct: l.correct_outcomes,
      avgPts: avgTotal,
      submitted: n,
    };
  });

  const mostOptimistic = [...userPredStats].sort(
    (a, b) => b.avgHome + b.avgAway - (a.avgHome + a.avgAway)
  )[0];
  const mostDefensive = [...userPredStats].sort(
    (a, b) => a.avgHome + a.avgAway - (b.avgHome + b.avgAway)
  )[0];
  const highestAvgPts = [...userPredStats].filter(s => s.submitted > 0).sort(
    (a, b) => b.avgPts - a.avgPts
  )[0];

  // ── Chart data ─────────────────────────────────────────────────────────────
  const snapshotsByUser = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const list = snapshotsByUser.get(s.user_id) ?? [];
    list.push(s);
    snapshotsByUser.set(s.user_id, list);
  }

  const chartSeries: SnapshotSeries[] = leaders.map((l) => ({
    name: l.display_name,
    isMe: l.user_id === user.id,
    data: (snapshotsByUser.get(l.user_id) ?? []).map((s) => ({
      date: s.snapshotted_at.slice(5, 10), // "MM-DD"
      points: s.total_points,
    })),
  }));

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

      {/* ── Kampresultater (only when tournament has started) ─────────────── */}
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

      {/* ── Spillerstatistik (only when predictions + results exist) ─────── */}
      {tournamentStarted && userPredStats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-black text-slate-950">Spillerstatistik</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highestAvgPts && (
              <StatCard
                detail={`${highestAvgPts.display_name} · ${highestAvgPts.avgPts.toFixed(2)} pt/kamp`}
                label="Bedst point pr. kamp"
                tone="gold"
                value={highestAvgPts.display_name.split(" ")[0]}
              />
            )}
            {mostOptimistic && (
              <StatCard
                detail={`Snit ${(mostOptimistic.avgHome + mostOptimistic.avgAway).toFixed(1)} mål pr. kamp`}
                label="Mest optimistisk"
                value={mostOptimistic.display_name.split(" ")[0]}
              />
            )}
            {mostDefensive && (
              <StatCard
                detail={`Snit ${(mostDefensive.avgHome + mostDefensive.avgAway).toFixed(1)} mål pr. kamp`}
                label="Mest defensiv"
                value={mostDefensive.display_name.split(" ")[0]}
              />
            )}
          </div>

          {/* Mini leaderboard table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase text-slate-500">
                      Spiller
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Bud
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Perfekte
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Udfald
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase text-slate-500">
                      Pt/kamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userPredStats
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
                            <span className="ml-1 text-xs font-black text-pitch-500">
                              (dig)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-500">
                          {s.submitted}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`font-bold ${
                              s.perfect > 0 ? "text-cup-500" : "text-slate-400"
                            }`}
                          >
                            {s.perfect}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                          {s.correct}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-950">
                          {s.submitted > 0 ? s.avgPts.toFixed(2) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Udvikling over tid (chart) ─────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-slate-950">Udvikling over tid</h2>
        {snapshots.length < 2 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-400">
              Grafen vises, når der er mindst to daglige snapshots (fra 11. juni 2026).
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

      {tournamentStarted && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Pointoverblik pr. spiller: se <strong>Leaderboard</strong>. Alle kampbud og udsagn:{" "}
          <strong>Alles bud</strong>.
        </div>
      )}
    </div>
  );
}
