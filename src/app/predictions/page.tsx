import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDate } from "@/lib/date-format";
import { calcMatchStats, isPredictionsEligible } from "@/lib/prediction-stats";
import type { Match, Statement } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

type Profile = { id: string; display_name: string; is_admin: boolean };

type MatchPredRow = {
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  total_points: number;
};

type StmtPredRow = {
  user_id: string;
  statement_id: number;
  answer: string;
  points: number;
};

function outcomeLabel(home: number, away: number): string {
  if (home > away) return "H";
  if (home < away) return "U";
  return "U";
}

function predBg(
  pred: { home: number; away: number },
  match: Match
): string {
  if (match.status !== "finished") return "";
  const h = match.home_score_90 ?? -1;
  const a = match.away_score_90 ?? -1;
  if (pred.home === h && pred.away === a) return "bg-cup-100 text-cup-500";
  const correctOutcome =
    (h > a && pred.home > pred.away) ||
    (h === a && pred.home === pred.away) ||
    (h < a && pred.home < pred.away);
  if (correctOutcome) return "bg-pitch-50 text-pitch-700";
  return "bg-slate-100 text-slate-400";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PredictionsPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  // ── Access gate checks ────────────────────────────────────────────────────
  const [
    { count: totalMatches },
    { count: myMatchPreds },
    { count: totalStmts },
    { count: myStmtPreds },
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("match_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase
      .from("statement_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const isAdmin = profile?.is_admin ?? false;
  const isEligible = isPredictionsEligible(
    myMatchPreds ?? 0,
    totalMatches ?? 0,
    myStmtPreds ?? 0,
    totalStmts ?? 0,
    isAdmin
  );

  if (!isEligible) {
    const missingMatches = Math.max(0, (totalMatches ?? 0) - (myMatchPreds ?? 0));
    const missingStmts = Math.max(0, (totalStmts ?? 0) - (myStmtPreds ?? 0));
    return (
      <div className="space-y-5">
        <PageHeader
          description="Se hvad alle andre har sat som kampbud og udsagnssvar."
          eyebrow="Alles bud"
          title="Bud og udsagn"
        />
        <div className="card space-y-4 py-8 text-center">
          <p className="text-3xl">🔒</p>
          <p className="font-black text-slate-950">
            Afgiv alle dine bud for at låse op
          </p>
          <p className="text-sm font-semibold text-slate-500">
            Du kan se alles kampbud og udsagn, når du selv har afgivet alle dine.
          </p>
          <div className="mx-auto max-w-xs space-y-2">
            {missingMatches > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-cup-50 px-4 py-2">
                <span className="text-sm font-semibold text-cup-500">Manglende kampbud</span>
                <span className="font-black text-cup-500">{missingMatches}</span>
              </div>
            )}
            {missingStmts > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-cup-50 px-4 py-2">
                <span className="text-sm font-semibold text-cup-500">Manglende udsagn</span>
                <span className="font-black text-cup-500">{missingStmts}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const [
    { data: matchesData },
    { data: profilesData },
    { data: allMatchPredsData },
    { data: statementsData },
    { data: allStmtPredsData },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, display_name, is_admin")
      .order("display_name", { ascending: true }),
    supabase
      .from("match_predictions")
      .select(
        "user_id, match_id, predicted_home_score, predicted_away_score, total_points"
      ),
    supabase
      .from("statements")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("statement_predictions")
      .select("user_id, statement_id, answer, points"),
  ]);

  const matches = (matchesData ?? []) as Match[];
  const participants = (profilesData ?? []) as Profile[];
  const matchPreds = (allMatchPredsData ?? []) as MatchPredRow[];
  const statements = (statementsData ?? []) as Statement[];
  const stmtPreds = (allStmtPredsData ?? []) as StmtPredRow[];

  // Build lookup maps
  const matchPredMap = new Map<string, MatchPredRow>();
  for (const p of matchPreds) {
    matchPredMap.set(`${p.user_id}:${p.match_id}`, p);
  }
  const stmtPredMap = new Map<string, StmtPredRow>();
  for (const p of stmtPreds) {
    stmtPredMap.set(`${p.user_id}:${p.statement_id}`, p);
  }

  // Group matches by date
  const matchesByDate = new Map<string, Match[]>();
  for (const m of matches) {
    const d = m.kickoff_at.slice(0, 10);
    const group = matchesByDate.get(d) ?? [];
    group.push(m);
    matchesByDate.set(d, group);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${participants.length} deltagere · ${matches.length} kampe · ${statements.length} udsagn`}
        eyebrow="Alles bud"
        title="Bud og udsagn"
      />

      {/* ── Match predictions ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-slate-950">Kampbud</h2>

        <div className="space-y-4">
          {[...matchesByDate.entries()].map(([date, dayMatches]) => (
            <div key={date}>
              <h3 className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-pitch-700">
                {formatDanishDate(dayMatches[0].kickoff_at)}
              </h3>
              <div className="card overflow-hidden p-0">
                {dayMatches.map((match) => {
                  // Collect all predictions for this match
                  const predsForMatch = participants
                    .map((p) => {
                      const pred = matchPredMap.get(`${p.id}:${match.id}`);
                      return pred ? { participant: p, pred } : null;
                    })
                    .filter(Boolean) as {
                    participant: Profile;
                    pred: MatchPredRow;
                  }[];

                  const stats = calcMatchStats(
                    predsForMatch.map((x) => ({
                      home: x.pred.predicted_home_score,
                      away: x.pred.predicted_away_score,
                    }))
                  );

                  return (
                    <div
                      key={match.id}
                      className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                    >
                      {/* Match header */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400">
                          #{match.match_no}
                        </span>
                        <span className="text-sm font-black text-slate-950">
                          {match.home_team}
                          <span className="mx-1 font-semibold text-slate-400">vs</span>
                          {match.away_team}
                        </span>
                        {match.status === "finished" && (
                          <span className="ml-auto rounded bg-pitch-50 px-2 py-0.5 text-xs font-black text-pitch-700">
                            {match.home_score_90}–{match.away_score_90}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      {stats && (
                        <div className="mb-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                          <span>
                            Snit:{" "}
                            <strong className="text-slate-600">
                              {stats.avgHome}–{stats.avgAway}
                            </strong>
                          </span>
                          <span>
                            Populæreste:{" "}
                            <strong className="text-slate-600">{stats.mostPopular}</strong>
                          </span>
                          <span className="text-pitch-500">
                            {stats.pctHome}% H
                          </span>
                          <span className="text-slate-500">
                            {stats.pctDraw}% U
                          </span>
                          <span className="text-cup-500">
                            {stats.pctAway}% B
                          </span>
                          <span className="ml-auto">
                            {stats.totalBets}/{participants.length} bud
                          </span>
                        </div>
                      )}

                      {/* Individual picks */}
                      <div className="flex flex-wrap gap-1.5">
                        {predsForMatch.length === 0 ? (
                          <span className="text-xs font-semibold text-slate-300">
                            Ingen bud afgivet
                          </span>
                        ) : (
                          predsForMatch.map(({ participant, pred }) => {
                            const bg = predBg(
                              {
                                home: pred.predicted_home_score,
                                away: pred.predicted_away_score,
                              },
                              match
                            );
                            const isCurrentUser = participant.id === user.id;
                            return (
                              <span
                                key={participant.id}
                                className={`rounded px-2 py-0.5 text-xs font-black ${
                                  bg || "bg-slate-100 text-slate-600"
                                } ${isCurrentUser ? "ring-2 ring-pitch-700 ring-offset-1" : ""}`}
                                title={participant.display_name}
                              >
                                {pred.predicted_home_score}–{pred.predicted_away_score}
                                {" "}
                                <span className="font-semibold opacity-70">
                                  {participant.display_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Statement predictions ──────────────────────────────────────────── */}
      {statements.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-black text-slate-950">Udsagnssvar</h2>

          <div className="card overflow-hidden p-0">
            {statements.map((stmt) => {
              const predsForStmt = participants
                .map((p) => {
                  const pred = stmtPredMap.get(`${p.id}:${stmt.id}`);
                  return pred ? { participant: p, pred } : null;
                })
                .filter(Boolean) as { participant: Profile; pred: StmtPredRow }[];

              return (
                <div
                  key={stmt.id}
                  className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded bg-pitch-50 text-xs font-black text-pitch-700">
                      {stmt.sort_order}
                    </span>
                    <p className="text-sm font-bold text-slate-950">
                      {stmt.question}
                    </p>
                    {stmt.is_resolved && (
                      <span className="ml-auto shrink-0 rounded bg-pitch-50 px-2 py-0.5 text-xs font-black text-pitch-700">
                        {stmt.correct_answer}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {predsForStmt.length === 0 ? (
                      <span className="text-xs font-semibold text-slate-300">
                        Ingen svar
                      </span>
                    ) : (
                      predsForStmt.map(({ participant, pred }) => {
                        const correct =
                          stmt.is_resolved && pred.points > 0;
                        const wrong =
                          stmt.is_resolved && pred.points === 0;
                        const isCurrentUser = participant.id === user.id;
                        return (
                          <span
                            key={participant.id}
                            className={`rounded px-2 py-0.5 text-xs font-bold ${
                              correct
                                ? "bg-pitch-50 text-pitch-700"
                                : wrong
                                  ? "bg-slate-100 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                            } ${isCurrentUser ? "ring-2 ring-pitch-700 ring-offset-1" : ""}`}
                            title={participant.display_name}
                          >
                            {pred.answer}
                            {" "}
                            <span className="opacity-60">
                              {participant.display_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-center text-xs font-semibold text-slate-400">
        Dine picks er markeret med en ring · Initialer er for identificering
      </p>
    </div>
  );
}
