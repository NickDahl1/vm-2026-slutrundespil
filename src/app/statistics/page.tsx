import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import type { AppSettings } from "@/lib/types";

export default async function StatisticsPage() {
  await requireUser();
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
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("match_predictions").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "finished"),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase
      .from("statement_predictions")
      .select("*", { count: "exact", head: true }),
    supabase.from("app_settings").select("*").single(),
    supabase
      .from("matches")
      .select("home_score_90, away_score_90")
      .eq("status", "finished")
      .not("home_score_90", "is", null),
  ]);

  const settings = settingsData as AppSettings | null;
  const users = userCount ?? 0;
  const matches = matchCount ?? 0;
  const preds = predCount ?? 0;
  const finished = finishedCount ?? 0;
  const stmts = stmtCount ?? 0;
  const stmtPreds = stmtPredCount ?? 0;

  const totalGoals = (goalData ?? []).reduce((sum, m) => {
    const row = m as { home_score_90: number | null; away_score_90: number | null };
    return sum + (row.home_score_90 ?? 0) + (row.away_score_90 ?? 0);
  }, 0);

  const maxPreds = users * matches;
  const predPct = maxPreds > 0 ? Math.round((preds / maxPreds) * 100) : 0;
  const maxStmtPreds = users * stmts;
  const stmtPredPct = maxStmtPreds > 0 ? Math.round((stmtPreds / maxStmtPreds) * 100) : 0;

  const tournamentStarted = finished > 0;

  return (
    <div className="space-y-5">
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        {tournamentStarted && (
          <>
            <StatCard
              detail={`Af ${matches} planlagte VM-kampe`}
              label="Kampe afsluttet"
              tone="green"
              value={String(finished)}
            />
            <StatCard
              detail={`Snit ${finished > 0 ? (totalGoals / finished).toFixed(1) : "0"} mål pr. kamp`}
              label="Mål i alt"
              tone="gold"
              value={String(totalGoals)}
            />
          </>
        )}
      </section>

      {tournamentStarted && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Pointoverblik pr. spiller: se <strong>Leaderboard</strong>. Kampdetaljer for en spiller
          finder du ved at klikke på spillerens navn.
        </div>
      )}
    </div>
  );
}
