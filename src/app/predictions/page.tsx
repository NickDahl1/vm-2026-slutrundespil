import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import { calcMatchStats, isPredictionsEligible } from "@/lib/prediction-stats";
import { isKnockoutOpen } from "@/lib/match-utils";
import type { Match, Statement } from "@/lib/types";

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

type PredictionsTab = "matches" | "statements";

const tabs: { id: PredictionsTab; label: string; href: string }[] = [
  { id: "matches", label: "Kampbud", href: "/predictions?tab=matches" },
  { id: "statements", label: "Udsagn", href: "/predictions?tab=statements" }
];

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function selectedTab(value: string | string[] | undefined): PredictionsTab {
  return firstValue(value) === "statements" ? "statements" : "matches";
}

function outcomeLabel(home: number, away: number): string {
  if (home > away) return "Hjemme";
  if (home < away) return "Ude";
  return "Uafgjort";
}

function predictionResultClass(
  pred: { home: number; away: number },
  match: Match
): string {
  if (
    match.status !== "finished" ||
    match.home_score_90 === null ||
    match.away_score_90 === null
  ) {
    return "bg-slate-100 text-slate-600";
  }

  const h = match.home_score_90;
  const a = match.away_score_90;
  if (pred.home === h && pred.away === a) return "bg-cup-100 text-cup-500";

  const correctOutcome =
    (h > a && pred.home > pred.away) ||
    (h === a && pred.home === pred.away) ||
    (h < a && pred.home < pred.away);

  if (correctOutcome) return "bg-pitch-50 text-pitch-700";
  return "bg-slate-100 text-slate-400";
}

function MatchCard({
  match,
  participants,
  matchPredMap,
  currentUserId,
}: {
  match: Match;
  participants: Profile[];
  matchPredMap: Map<string, MatchPredRow>;
  currentUserId: string;
}) {
  const predsForMatch = participants
    .map((participant) => {
      const pred = matchPredMap.get(`${participant.id}:${match.id}`);
      return pred ? { participant, pred } : null;
    })
    .filter(Boolean) as { participant: Profile; pred: MatchPredRow }[];

  const stats = calcMatchStats(
    predsForMatch.map((x) => ({
      home: x.pred.predicted_home_score,
      away: x.pred.predicted_away_score,
    }))
  );

  return (
    <article className="card space-y-4" key={match.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-slate-400">
            Kamp #{match.match_no}
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            {match.home_team}
            <span className="mx-2 font-semibold text-slate-400">vs</span>
            {match.away_team}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatDanishDateTime(match.kickoff_at)}
          </p>
        </div>

        {match.status === "finished" &&
        match.home_score_90 !== null &&
        match.away_score_90 !== null ? (
          <div className="rounded-lg bg-pitch-50 px-3 py-2 text-right">
            <p className="text-xs font-black uppercase text-pitch-500">Resultat</p>
            <p className="text-sm font-black text-pitch-700">
              {match.home_score_90}-{match.away_score_90}
            </p>
          </div>
        ) : null}
      </div>

      {stats ? (
        <div className="grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            Snit hjemme:{" "}
            <strong className="text-slate-800">{stats.avgHome}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            Snit ude:{" "}
            <strong className="text-slate-800">{stats.avgAway}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            Antal bud:{" "}
            <strong className="text-slate-800">{stats.totalBets}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            Populærest:{" "}
            <strong className="text-slate-800">{stats.mostPopular}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            H/U/B:{" "}
            <strong className="text-slate-800">
              {stats.pctHome}% / {stats.pctDraw}% / {stats.pctAway}%
            </strong>
          </div>
        </div>
      ) : null}

      {predsForMatch.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="font-black text-slate-950">Ingen bud endnu</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Når deltagerne har afgivet kampbud, vises de i tabellen her.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[38rem] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Deltager</th>
                <th className="px-3 py-2">Bud</th>
                <th className="px-3 py-2">Udfald</th>
                <th className="px-3 py-2 text-right">Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {predsForMatch.map(({ participant, pred }) => {
                const isCurrentUser = participant.id === currentUserId;
                const home = pred.predicted_home_score;
                const away = pred.predicted_away_score;

                return (
                  <tr
                    className={isCurrentUser ? "bg-pitch-50/60" : "bg-white"}
                    key={participant.id}
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-950">
                      {participant.display_name}
                      {isCurrentUser ? (
                        <span className="ml-2 rounded bg-pitch-100 px-1.5 py-0.5 text-[0.65rem] font-black uppercase text-pitch-700">
                          Dig
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-black ${predictionResultClass(
                          { home, away },
                          match
                        )}`}
                      >
                        {home}-{away}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
                      {outcomeLabel(home, away)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-black text-slate-950">
                      {match.status === "finished"
                        ? pred.total_points
                        : "Ikke afgjort"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function TabNav({ activeTab }: { activeTab: PredictionsTab }) {
  return (
    <nav
      aria-label="Vælg type af bud"
      className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-4 py-2.5 text-center text-sm font-black transition ${
              isActive
                ? "bg-pitch-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
            }`}
            href={tab.href}
            key={tab.id}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SectionToggle({ title, count, defaultOpen }: { title: string; count: number; defaultOpen: boolean }) {
  return (
    <summary className="flex cursor-pointer list-none select-none items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
      <span className="font-black text-slate-800">
        {title}{" "}
        <span className="font-semibold text-slate-400">({count})</span>
      </span>
      <svg
        className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </summary>
  );
}

export default async function PredictionsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeTab = selectedTab(params.tab);
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const [
    { count: allMatchCount },
    { count: groupMatchCount },
    { data: settingsForGate },
    { count: myAllMatchPreds },
    { count: totalStmts },
    { count: myStmtPreds }
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("phase", "group_stage"),
    supabase.from("app_settings").select("knockout_predictions_open").single(),
    supabase
      .from("match_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase
      .from("statement_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
  ]);

  const isAdmin = profile?.is_admin ?? false;
  const knockoutOpen = (settingsForGate as { knockout_predictions_open?: boolean } | null)
    ?.knockout_predictions_open ?? false;

  const relevantMatchTotal = knockoutOpen ? (allMatchCount ?? 0) : (groupMatchCount ?? 0);
  const myRelevantMatchPreds = myAllMatchPreds ?? 0;

  const isEligible = isPredictionsEligible(
    myRelevantMatchPreds,
    relevantMatchTotal,
    myStmtPreds ?? 0,
    totalStmts ?? 0,
    isAdmin
  );

  if (!isEligible) {
    const missingMatches = Math.max(0, relevantMatchTotal - myRelevantMatchPreds);
    const missingStmts = Math.max(0, (totalStmts ?? 0) - (myStmtPreds ?? 0));

    return (
      <div className="space-y-5">
        <PageHeader
          description="Se hvad alle andre har sat som kampbud og udsagnssvar."
          eyebrow="Alles bud"
          title="Bud og udsagn"
        />

        <div className="card space-y-5 py-8 text-center">
          <div>
            <p className="text-3xl">🔒</p>
            <p className="mt-3 font-black text-slate-950">
              Afgiv alle dine bud for at låse op
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Du kan se alles kampbud og udsagn, når du selv har afgivet alle dine.
            </p>
          </div>

          <div className="mx-auto grid max-w-sm gap-2">
            {missingMatches > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-cup-50 px-4 py-2">
                <span className="text-sm font-semibold text-cup-500">
                  Manglende {knockoutOpen ? "" : "grundspils"}kampbud
                </span>
                <span className="font-black text-cup-500">{missingMatches}</span>
              </div>
            )}
            {!knockoutOpen && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-500">
                🔒 Slutspilsbud åbner senere og tæller ikke med endnu
              </div>
            )}
            {missingStmts > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-cup-50 px-4 py-2">
                <span className="text-sm font-semibold text-cup-500">
                  Manglende udsagn
                </span>
                <span className="font-black text-cup-500">{missingStmts}</span>
              </div>
            )}
          </div>

          <div className="mx-auto grid max-w-sm gap-2 sm:grid-cols-2">
            <Link
              className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-2 text-sm font-black text-pitch-700"
              href="/matches"
            >
              Gå til kampbud
            </Link>
            <Link
              className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-2 text-sm font-black text-pitch-700"
              href="/statements"
            >
              Gå til udsagn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [
    { data: matchesData },
    { data: profilesData },
    { data: allMatchPredsData },
    { data: statementsData },
    { data: allStmtPredsData }
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
    supabase.from("statement_predictions").select("user_id, statement_id, answer, points")
  ]);

  const matches = (matchesData ?? []) as Match[];
  const participants = (profilesData ?? []) as Profile[];
  const matchPreds = (allMatchPredsData ?? []) as MatchPredRow[];
  const statements = (statementsData ?? []) as Statement[];
  const stmtPreds = (allStmtPredsData ?? []) as StmtPredRow[];

  const matchPredMap = new Map<string, MatchPredRow>();
  for (const p of matchPreds) {
    matchPredMap.set(`${p.user_id}:${p.match_id}`, p);
  }

  const stmtPredMap = new Map<string, StmtPredRow>();
  for (const p of stmtPreds) {
    stmtPredMap.set(`${p.user_id}:${p.statement_id}`, p);
  }

  const finishedMatches = matches.filter((m) => m.status === "finished");
  const upcomingMatches = matches.filter((m) => m.status !== "finished");

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${participants.length} deltagere · ${matches.length} kampe · ${statements.length} udsagn`}
        eyebrow="Alles bud"
        title="Bud og udsagn"
      />

      <TabNav activeTab={activeTab} />

      {activeTab === "matches" ? (
        <section className="space-y-3">
          {matches.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="font-black text-slate-950">Ingen kampe fundet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Kampbud vises her, når kampene er oprettet.
              </p>
            </div>
          ) : (
            <>
              {/* Afsluttede kampe */}
              <details className="group">
                <SectionToggle
                  count={finishedMatches.length}
                  defaultOpen={false}
                  title="Afsluttede kampe"
                />
                <div className="space-y-4 pt-3">
                  {finishedMatches.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-slate-400">
                        Ingen afsluttede kampe endnu
                      </p>
                    </div>
                  ) : (
                    finishedMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        currentUserId={user.id}
                        match={match}
                        matchPredMap={matchPredMap}
                        participants={participants}
                      />
                    ))
                  )}
                </div>
              </details>

              {/* Kommende kampe */}
              <details className="group" open>
                <SectionToggle
                  count={upcomingMatches.length}
                  defaultOpen
                  title="Kommende kampe"
                />
                <div className="space-y-4 pt-3">
                  {upcomingMatches.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-slate-400">
                        Ingen kommende kampe
                      </p>
                    </div>
                  ) : (
                    upcomingMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        currentUserId={user.id}
                        match={match}
                        matchPredMap={matchPredMap}
                        participants={participants}
                      />
                    ))
                  )}
                </div>
              </details>
            </>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {statements.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="font-black text-slate-950">Ingen udsagn fundet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Udsagnssvar vises her, når udsagnene er oprettet.
              </p>
            </div>
          ) : (
            statements.map((statement) => {
              const predsForStatement = participants
                .map((participant) => {
                  const pred = stmtPredMap.get(`${participant.id}:${statement.id}`);
                  return pred ? { participant, pred } : null;
                })
                .filter(Boolean) as { participant: Profile; pred: StmtPredRow }[];

              return (
                <article className="card space-y-4" key={statement.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Udsagn #{statement.sort_order}
                      </p>
                      <h2 className="mt-1 text-base font-black text-slate-950">
                        {statement.question}
                      </h2>
                    </div>

                    <div
                      className={`rounded-lg px-3 py-2 text-right ${
                        statement.is_resolved
                          ? "bg-pitch-50 text-pitch-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <p className="text-xs font-black uppercase">
                        {statement.is_resolved ? "Korrekt svar" : "Status"}
                      </p>
                      <p className="text-sm font-black">
                        {statement.is_resolved
                          ? (statement.correct_answer ?? "Ikke angivet")
                          : "Ikke afgjort"}
                      </p>
                    </div>
                  </div>

                  {predsForStatement.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="font-black text-slate-950">Ingen svar endnu</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Når deltagerne har svaret, vises de i tabellen her.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-[34rem] w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-3 py-2">Deltager</th>
                            <th className="px-3 py-2">Svar</th>
                            <th className="px-3 py-2 text-right">Point</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {predsForStatement.map(({ participant, pred }) => {
                            const isCurrentUser = participant.id === user.id;
                            const isResolved = statement.is_resolved;
                            const pointClass = !isResolved
                              ? "bg-slate-100 text-slate-500"
                              : pred.points > 0
                                ? "bg-pitch-50 text-pitch-700"
                                : "bg-slate-100 text-slate-400";

                            return (
                              <tr
                                className={isCurrentUser ? "bg-pitch-50/60" : "bg-white"}
                                key={participant.id}
                              >
                                <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-950">
                                  {participant.display_name}
                                  {isCurrentUser ? (
                                    <span className="ml-2 rounded bg-pitch-100 px-1.5 py-0.5 text-[0.65rem] font-black uppercase text-pitch-700">
                                      Dig
                                    </span>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-700">
                                  {pred.answer}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right">
                                  <span
                                    className={`inline-flex rounded px-2 py-1 text-xs font-black ${pointClass}`}
                                  >
                                    {isResolved ? pred.points : "Ikke afgjort"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}

      <p className="text-center text-xs font-semibold text-slate-400">
        Dine rækker er markeret med Dig.
      </p>
    </div>
  );
}
