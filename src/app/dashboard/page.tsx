import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FormMessage } from "@/components/form-message";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime, formatDanishTime } from "@/lib/date-format";
import type { AppSettings } from "@/lib/types";

type PredSummary = {
  match_id: number;
  total_points: number;
  points_outcome: number;
};

type RankEntry = {
  rank: number;
  match_points: number;
  statement_points: number;
  total_points: number;
};

type LeaderEntry = {
  user_id: string;
  display_name: string;
  rank: number;
  total_points: number;
};

type UpcomingMatch = {
  id: number;
  match_no: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

type UpcomingPredRow = {
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
};

type OpenMatchRow = {
  id: number;
  phase: string;
  status: string;
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    timeZone: "Europe/Copenhagen",
    day: "numeric",
    month: "short",
  });
}

function fmtDev(dev: number): string {
  if (Math.abs(dev) < 0.05) return "±0";
  return (dev > 0 ? "+" : "") + dev.toFixed(1);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { user, profile } = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: openMatchData },
    { data: settingsData },
    { data: finishedMatchData },
    { data: userPredData },
    { data: rankData },
    { count: participantCount },
    { count: statementCount },
    { count: statementAnswerCount },
    { data: allLeadersData },
    { data: upcomingMatchData },
  ] = await Promise.all([
    supabase.from("matches").select("id, phase, status").eq("predictions_open", true),
    supabase.from("app_settings").select("*").single(),
    supabase.from("matches").select("id").eq("status", "finished").not("home_score_90", "is", null),
    supabase.from("match_predictions").select("match_id, total_points, points_outcome").eq("user_id", user.id),
    supabase.from("leaderboard_view" as never).select("rank, match_points, statement_points, total_points").eq("user_id", user.id).single(),
    supabase.from("leaderboard_view" as never).select("*", { count: "exact", head: true }),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase.from("statement_predictions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("leaderboard_view" as never).select("user_id, display_name, rank, total_points").order("rank", { ascending: true }),
    supabase.from("matches").select("id, match_no, home_team, away_team, kickoff_at, status").in("status", ["scheduled", "live"]).order("kickoff_at", { ascending: true }).limit(4),
  ]);

  const settings = settingsData as AppSettings | null;
  const openMatches = (openMatchData ?? []) as OpenMatchRow[];
  const openMatchIds = new Set(openMatches.map((m) => m.id));
  const total = openMatches.length;

  const allUserPreds = (userPredData ?? []) as PredSummary[];
  const submitted = allUserPreds.filter((p) => openMatchIds.has(p.match_id)).length;
  const missing = Math.max(0, total - submitted);


  const entry = rankData as RankEntry | null;
  const participants = participantCount ?? 0;
  const totalStatements = statementCount ?? 0;
  const answeredStatements = statementAnswerCount ?? 0;
  const missingStatements = Math.max(0, totalStatements - answeredStatements);

  const finishedIds = new Set((finishedMatchData ?? []).map((m) => (m as { id: number }).id));
  const finishedPreds = allUserPreds.filter((p) => finishedIds.has(p.match_id));

  const matchPoints = entry?.match_points ?? finishedPreds.reduce((s, p) => s + p.total_points, 0);
  const statementPoints = entry?.statement_points ?? 0;
  const totalPoints = entry?.total_points ?? matchPoints;
  const perfectResults = finishedPreds.filter((p) => p.total_points === 3).length;
  const correctOutcomes = finishedPreds.filter((p) => p.points_outcome === 1).length;
  const myRank = entry?.rank ?? null;

  const leaders = (allLeadersData ?? []) as LeaderEntry[];
  const upcomingMatches = (upcomingMatchData ?? []) as UpcomingMatch[];

  // Fetch all predictions for the next few matches (2nd pass — depends on match IDs)
  const upcomingMatchIds = upcomingMatches.map((m) => m.id);
  let upcomingPreds: UpcomingPredRow[] = [];
  if (upcomingMatchIds.length > 0) {
    const { data } = await supabase
      .from("match_predictions")
      .select("user_id, match_id, predicted_home_score, predicted_away_score")
      .in("match_id", upcomingMatchIds);
    upcomingPreds = (data ?? []) as UpcomingPredRow[];
  }

  const predsByMatch = new Map<number, UpcomingPredRow[]>();
  for (const p of upcomingPreds) {
    const list = predsByMatch.get(p.match_id) ?? [];
    list.push(p);
    predsByMatch.set(p.match_id, list);
  }

  const upcomingDetails = upcomingMatches.map((m) => {
    const allPreds = predsByMatch.get(m.id) ?? [];
    const myPred = allPreds.find((p) => p.user_id === user.id) ?? null;
    const n = allPreds.length;
    const avgHome = n > 0 ? allPreds.reduce((s, p) => s + p.predicted_home_score, 0) / n : null;
    const avgAway = n > 0 ? allPreds.reduce((s, p) => s + p.predicted_away_score, 0) / n : null;
    const devHome = myPred && avgHome !== null ? myPred.predicted_home_score - avgHome : null;
    const devAway = myPred && avgAway !== null ? myPred.predicted_away_score - avgAway : null;
    const totalDev = devHome !== null && devAway !== null ? devHome + devAway : null;
    return { match: m, myPred, avgHome, avgAway, devHome, devAway, totalDev, predCount: n };
  });

  const now = new Date();
  const groupLocked =
    settings?.game_locked ||
    (settings?.group_stage_lock_at ? new Date(settings.group_stage_lock_at) <= now : false);

  const deadlineDetail = settings?.group_stage_lock_at
    ? groupLocked
      ? `Låst siden ${formatDanishDateTime(settings.group_stage_lock_at)}`
      : `Frist: ${formatDanishDateTime(settings.group_stage_lock_at)}`
    : "Ingen frist sat endnu";

  const lastPlace = leaders.length > 0 ? leaders[leaders.length - 1] : null;

  return (
    <div className="space-y-6">
      {lastPlace && (
        <p className="text-2xl font-black text-slate-950">
          Spilleren på sidstepladsen er:{" "}
          <span className="text-pitch-700">{lastPlace.display_name.split(" ")[0]}</span>
        </p>
      )}
      <PageHeader
        description="Stillingen, næste kampe og dit pointoverblik."
        eyebrow="Spiller"
        title={`Hej${profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}`}
      />
      <FormMessage searchParams={params} />

      {settings?.game_locked ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">Spillet er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">
            Ingen kampbud eller udsagn kan ændres lige nu.
          </p>
        </div>
      ) : groupLocked ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-black text-slate-700">Grundspilsbud er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Fristen passerede{" "}
            {settings?.group_stage_lock_at ? formatDanishDateTime(settings.group_stage_lock_at) : ""}.
          </p>
        </div>
      ) : settings?.group_stage_lock_at ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="font-black text-pitch-700">Spillet er åbent</p>
          <p className="mt-0.5 text-sm font-semibold text-pitch-500">
            Du kan afgive bud frem til{" "}
            <strong>{formatDanishDateTime(settings.group_stage_lock_at)}</strong>.
          </p>
        </div>
      ) : null}

      {/* CTA: any open matches waiting for prediction */}
      {missing > 0 && (
        <Link
          className="flex items-center justify-between rounded-lg border border-pitch-700 bg-pitch-700 px-4 py-3.5 hover:bg-pitch-600"
          href="/matches"
        >
          <div>
            <p className="font-black text-white">
              {missing === 1
                ? "1 kamp mangler dit bud"
                : `${missing} kampe mangler dit bud`}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-pitch-200">
              Udfyld dit bud nu
            </p>
          </div>
          <span className="text-lg font-black text-white">→</span>
        </Link>
      )}

      {/* ── Stillingen ─────────────────────────────────────────────────────── */}
      {leaders.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">Stillingen</h2>
            <Link href="/leaderboard" className="text-xs font-bold text-pitch-700">
              Fuld leaderboard →
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <tbody>
                {leaders.map((l) => {
                  const isMe = l.user_id === user.id;
                  return (
                    <tr
                      key={l.user_id}
                      className={`border-b border-slate-100 last:border-b-0 ${isMe ? "bg-pitch-50" : ""}`}
                    >
                      <td className="w-10 px-4 py-2.5 text-center font-black text-slate-400">
                        {l.rank}
                      </td>
                      <td className="py-2.5 pr-2 font-bold text-slate-800">
                        {l.display_name.split(" ")[0]}
                        {isMe && (
                          <span className="ml-1 text-xs font-black text-pitch-500">(dig)</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-950">
                        {l.total_points}
                        <span className="ml-0.5 text-xs font-semibold text-slate-400">pt</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Næste kampe ────────────────────────────────────────────────────── */}
      {upcomingDetails.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-950">Næste kampe</h2>
          <div className="space-y-2">
            {upcomingDetails.map(({ match, myPred, avgHome, avgAway, devHome, devAway, totalDev, predCount }) => {
              const hasAvg = avgHome !== null && avgAway !== null;
              const hasPred = myPred !== null;
              return (
                <article key={match.id} className="card space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge">Kamp {match.match_no}</span>
                    <span className="badge">{shortDate(match.kickoff_at)}</span>
                    <span className="badge">{formatDanishTime(match.kickoff_at)}</span>
                    {match.status === "live" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-600">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="font-black text-slate-950">
                    {match.home_team} – {match.away_team}
                  </p>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Dit bud
                      </p>
                      {hasPred ? (
                        <p className="text-base font-black text-pitch-700">
                          {myPred!.predicted_home_score}–{myPred!.predicted_away_score}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-amber-600">Ikke budt</p>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Snit ({predCount})
                      </p>
                      {hasAvg ? (
                        <p className="text-base font-black text-slate-700">
                          {avgHome!.toFixed(1)}–{avgAway!.toFixed(1)}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-300">—</p>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Afvigelse
                      </p>
                      {hasPred && devHome !== null && devAway !== null ? (
                        <p
                          className={`text-base font-black ${
                            totalDev !== null && Math.abs(totalDev) < 0.05
                              ? "text-slate-400"
                              : totalDev !== null && totalDev > 0
                              ? "text-pitch-700"
                              : "text-cup-600"
                          }`}
                        >
                          {fmtDev(devHome)} / {fmtDev(devAway)}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-300">—</p>
                      )}
                    </div>
                  </div>

                  {hasPred && totalDev !== null && (
                    <p className="text-xs font-semibold text-slate-400">
                      {Math.abs(totalDev) < 0.05
                        ? "Du er præcis på snittet"
                        : totalDev > 0
                        ? `Du byder ${totalDev.toFixed(1)} mål mere end snittet`
                        : `Du byder ${Math.abs(totalDev).toFixed(1)} mål færre end snittet`}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Dit overblik ───────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-base font-black text-slate-950">Dit overblik</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            detail={`${matchPoints} kamp + ${statementPoints} udsagn`}
            label="Samlet point"
            tone="green"
            value={String(totalPoints)}
          />
          <StatCard
            detail={`Af ${participants} ${participants === 1 ? "deltager" : "deltagere"} i alt`}
            label="Min placering"
            tone={myRank !== null && myRank <= 3 ? "gold" : "neutral"}
            value={myRank !== null ? `#${myRank}` : "—"}
          />
          <StatCard
            detail={`${perfectResults} perfekte, ${correctOutcomes} korrekte udfald`}
            label="Præcise resultater"
            tone={perfectResults > 0 ? "gold" : "neutral"}
            value={String(perfectResults)}
          />
          <StatCard
            detail={deadlineDetail}
            label="Deadline — grundspil"
            value={settings?.game_locked ? "Låst" : missing === 0 && missingStatements === 0 ? "Klar" : "Åben"}
          />
          <StatCard
            detail={`Ud af ${total} åbne kampe`}
            label="Kampbud afgivet"
            tone={missing === 0 ? "green" : "neutral"}
            value={String(submitted)}
          />
          {missing > 0 && (
            <StatCard
              detail="Afgiv dem inden deadline"
              label="Manglende kampbud"
              tone="gold"
              value={String(missing)}
            />
          )}
          <StatCard
            detail={`Af ${totalStatements} udsagn i alt`}
            label="Udsagn besvaret"
            tone={answeredStatements === totalStatements && totalStatements > 0 ? "green" : "neutral"}
            value={String(answeredStatements)}
          />
          {missingStatements > 0 && (
            <StatCard
              detail="Besvar dem inden deadline"
              label="Manglende udsagn"
              tone="gold"
              value={String(missingStatements)}
            />
          )}
        </div>
      </section>

      <Link
        className="flex items-center justify-between rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3 hover:bg-pitch-100"
        href="/rules#startskærm"
      >
        <div>
          <p className="text-sm font-black text-pitch-700">Sæt appen på din startskærm</p>
          <p className="text-xs font-semibold text-pitch-500">Åbn som app — tager 10 sekunder</p>
        </div>
        <span className="text-sm font-black text-pitch-700">→</span>
      </Link>

      <Link
        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100"
        href="/contact"
      >
        <div>
          <p className="text-sm font-black text-slate-700">Har du spørgsmål?</p>
          <p className="text-xs font-semibold text-slate-500">Kontakt admin direkte i appen</p>
        </div>
        <span className="text-sm font-black text-pitch-700">→</span>
      </Link>
    </div>
  );
}
