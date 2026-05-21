import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FormMessage } from "@/components/form-message";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
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

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { user, profile } = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { count: matchCount },
    { count: predictionCount },
    { data: settingsData },
    { data: finishedMatchData },
    { data: userPredData },
    { data: rankData },
    { count: participantCount },
    { count: statementCount },
    { count: statementAnswerCount }
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("match_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("app_settings").select("*").single(),
    supabase
      .from("matches")
      .select("id")
      .eq("status", "finished")
      .not("home_score_90", "is", null),
    supabase
      .from("match_predictions")
      .select("match_id, total_points, points_outcome")
      .eq("user_id", user.id),
    supabase
      .from("leaderboard_view" as never)
      .select("rank, match_points, statement_points, total_points")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("leaderboard_view" as never)
      .select("*", { count: "exact", head: true }),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase
      .from("statement_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
  ]);

  const settings = settingsData as AppSettings | null;
  const total = matchCount ?? 0;
  const submitted = predictionCount ?? 0;
  const missing = Math.max(0, total - submitted);
  const entry = rankData as RankEntry | null;
  const participants = participantCount ?? 0;
  const totalStatements = statementCount ?? 0;
  const answeredStatements = statementAnswerCount ?? 0;
  const missingStatements = Math.max(0, totalStatements - answeredStatements);

  const finishedIds = new Set(
    (finishedMatchData ?? []).map((m) => (m as { id: number }).id)
  );
  const preds = (userPredData ?? []) as PredSummary[];
  const finishedPreds = preds.filter((p) => finishedIds.has(p.match_id));

  const matchPoints = entry?.match_points ?? finishedPreds.reduce((s, p) => s + p.total_points, 0);
  const statementPoints = entry?.statement_points ?? 0;
  const totalPoints = entry?.total_points ?? matchPoints;
  const perfectResults = finishedPreds.filter((p) => p.total_points === 3).length;
  const correctOutcomes = finishedPreds.filter((p) => p.points_outcome === 1).length;
  const myRank = entry?.rank ?? null;

  const now = new Date();
  const groupLocked =
    settings?.game_locked ||
    (settings?.group_stage_lock_at
      ? new Date(settings.group_stage_lock_at) <= now
      : false);

  const deadlineDetail = settings?.group_stage_lock_at
    ? groupLocked
      ? `Låst siden ${formatDanishDateTime(settings.group_stage_lock_at)}`
      : `Frist: ${formatDanishDateTime(settings.group_stage_lock_at)}`
    : "Ingen frist sat endnu";

  return (
    <div className="space-y-5">
      <PageHeader
        description="Dit overblik over point, kampbud, udsagn, deadlines og åbne opgaver."
        eyebrow="Spiller"
        title={`Dashboard${profile?.display_name ? ` for ${profile.display_name}` : ""}`}
      />
      <FormMessage searchParams={params} />

      {/* Lock / deadline status banner */}
      {settings?.game_locked ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">🔒 Spillet er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">
            Ingen kampbud eller udsagn kan ændres lige nu.
          </p>
        </div>
      ) : groupLocked ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-black text-slate-700">🔒 Grundspilsbud er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Fristen passerede {settings?.group_stage_lock_at
              ? formatDanishDateTime(settings.group_stage_lock_at)
              : ""}.
          </p>
        </div>
      ) : settings?.group_stage_lock_at ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="font-black text-pitch-700">⏰ Spillet er åbent</p>
          <p className="mt-0.5 text-sm font-semibold text-pitch-500">
            Du kan afgive kampbud og udsagn frem til{" "}
            <strong>{formatDanishDateTime(settings.group_stage_lock_at)}</strong>.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          detail={`${matchPoints} kamp + ${statementPoints} udsagn`}
          label="Samlet point"
          tone="green"
          value={String(totalPoints)}
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
          detail={`Ud af ${total} kampe i alt`}
          label="Kampbud afgivet"
          tone="green"
          value={String(submitted)}
        />
        <StatCard
          detail={missing === 0 ? "Du er ajour med alle kampe" : "Afgiv dem inden deadline"}
          label="Manglende kampbud"
          tone={missing > 0 ? "gold" : "neutral"}
          value={String(missing)}
        />
        <StatCard
          detail={`Af ${participants} ${participants === 1 ? "deltager" : "deltagere"} i alt`}
          label="Min placering"
          tone={myRank !== null && myRank <= 3 ? "gold" : "neutral"}
          value={myRank !== null ? `#${myRank}` : "—"}
        />
        <StatCard
          detail={`Af ${totalStatements} udsagn i alt`}
          label="Udsagn besvaret"
          tone={answeredStatements === totalStatements && totalStatements > 0 ? "green" : "neutral"}
          value={String(answeredStatements)}
        />
        <StatCard
          detail={missingStatements === 0 ? "Du har svaret på alle udsagn" : "Besvar dem inden deadline"}
          label="Manglende udsagn"
          tone={missingStatements > 0 ? "gold" : "neutral"}
          value={String(missingStatements)}
        />
      </section>
    </div>
  );
}
