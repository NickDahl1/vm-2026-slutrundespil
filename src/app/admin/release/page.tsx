import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import type { AppSettings } from "@/lib/types";
import {
  checkMatchCount,
  checkStatementCount,
  checkDeadline,
  checkGameLocked,
  checkTestResults,
  checkFinishedBeforeTournament,
  checkUserCount,
  checkPredictionCoverage,
  type CheckStatus,
  type ReleaseCheck,
} from "@/lib/release-checks";
import { CleanupSection } from "./cleanup-client";
import {
  resetAllMatchResultsAction,
  resetAllMatchPointsAction,
  deleteAllPredictionsAction,
  deleteAllStatementPredictionsAction,
  resetAllStatementsAction,
} from "./actions";

// VM 2026 starts 11 June 2026
const TOURNAMENT_START = new Date("2026-06-11T00:00:00Z");

const STATUS_STYLES: Record<CheckStatus, string> = {
  ok: "text-pitch-700 bg-pitch-50 border-pitch-100",
  warn: "text-amber-700 bg-amber-50 border-amber-200",
  error: "text-red-700 bg-red-50 border-red-200",
};

const STATUS_ICONS: Record<CheckStatus, string> = {
  ok: "✓",
  warn: "⚠",
  error: "✗",
};

function CheckRow({ check }: { check: ReleaseCheck }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-slate-700">{check.label}</span>
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${STATUS_STYLES[check.status]}`}
      >
        {STATUS_ICONS[check.status]} {check.detail}
      </span>
    </div>
  );
}

export default async function AdminReleasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { count: matchCount },
    { count: statementCount },
    { count: userCount },
    { count: predictionCount },
    { count: statementPredCount },
    { data: settingsData },
    { count: matchesWithResultsCount },
    { count: finishedEarlyCount },
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("match_predictions").select("*", { count: "exact", head: true }),
    supabase.from("statement_predictions").select("*", { count: "exact", head: true }),
    supabase.from("app_settings").select("*").single(),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .not("home_score_90", "is", null),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "finished")
      .lt("kickoff_at", TOURNAMENT_START.toISOString()),
  ]);

  const settings = settingsData as AppSettings | null;

  // Auto-sync: check server-side env (never exposed to browser)
  const footballApiKeyConfigured = !!process.env.FOOTBALL_API_KEY;

  const checks: ReleaseCheck[] = [
    checkMatchCount(matchCount ?? 0),
    checkStatementCount(statementCount ?? 0),
    checkDeadline(settings?.group_stage_lock_at ?? null),
    checkGameLocked(settings?.game_locked ?? false),
    checkTestResults(matchesWithResultsCount ?? 0),
    checkFinishedBeforeTournament(finishedEarlyCount ?? 0, TOURNAMENT_START),
    checkUserCount(userCount ?? 0),
    checkPredictionCoverage(predictionCount ?? 0, userCount ?? 0, matchCount ?? 0),
  ];

  const errorCount = checks.filter((c) => c.status === "error").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  const overallStatus: CheckStatus =
    errorCount > 0 ? "error" : warnCount > 0 ? "warn" : "ok";

  return (
    <div className="space-y-6">
      <PageHeader
        description="Tjek at alt er klar inden du sender linket ud."
        eyebrow="Admin"
        title="Release-tjekliste"
      />

      <FormMessage searchParams={params} />

      {/* Overall status banner */}
      {overallStatus === "ok" ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="font-black text-pitch-700">✓ Klar til release</p>
          <p className="mt-0.5 text-sm font-semibold text-pitch-500">
            Alle tjek er bestået. Send linket ud når du er klar.
          </p>
        </div>
      ) : overallStatus === "warn" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="font-black text-amber-700">⚠ {warnCount} advarsel{warnCount === 1 ? "" : "er"}</p>
          <p className="mt-0.5 text-sm font-semibold text-amber-600">
            Gennemgå advarslerne og afgør om de skal rettes inden release.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">✗ {errorCount} fejl skal rettes</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">
            Ret fejlene inden du sender linket ud.
          </p>
        </div>
      )}

      {/* Checklist */}
      <section className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Tjekliste</p>
        </div>
        {checks.map((check) => (
          <CheckRow check={check} key={check.label} />
        ))}
      </section>

      {/* Auto-sync status */}
      <section className="card space-y-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Auto-sync status
        </p>
        {footballApiKeyConfigured ? (
          <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3 space-y-1">
            <p className="font-black text-pitch-700">✓ Auto-sync aktiv</p>
            <p className="text-sm font-semibold text-pitch-600">
              FOOTBALL_API_KEY er sat. GitHub Actions kører dagligt kl. 08:00 CEST.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
            <p className="font-black text-amber-700">⚠ Auto-sync ikke aktiv</p>
            <div className="space-y-1 text-sm font-semibold text-amber-700">
              <p>
                <span className="font-black">Årsag:</span> FOOTBALL_API_KEY er ikke sat i GitHub Secrets.
              </p>
              <p>
                <span className="font-black">Testdata:</span> Deaktiveret som automatisk fallback — synkronisering stopper sikkert uden API-nøgle.
              </p>
              <p>
                <span className="font-black">GitHub Action:</span> Konfigureret og klar — kører dagligt kl. 08:00 CEST, men gør ingenting uden nøgle.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white px-3 py-2.5">
              <p className="text-xs font-black text-amber-700">Hvad betyder det?</p>
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Resultater opdateres <strong>ikke automatisk</strong>, før en rigtig API-nøgle er sat op i GitHub
                Secrets (FOOTBALL_API_KEY). Indtil da kan admin rette resultater manuelt på{" "}
                <strong>/admin/matches</strong>. Se{" "}
                <code className="rounded bg-amber-100 px-1 text-[11px]">README.md</code>{" "}
                for instruktioner til at sætte nøglen op.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Summary numbers */}
      <section className="card space-y-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Overblik</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Spillere", value: userCount ?? 0 },
            { label: "Kampbud", value: predictionCount ?? 0 },
            { label: "Udsagnssvar", value: statementPredCount ?? 0 },
          ].map(({ label, value }) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center" key={label}>
              <p className="text-2xl font-black text-slate-950">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        {settings?.group_stage_lock_at && (
          <p className="text-sm font-semibold text-slate-600">
            Grundspilsdeadline:{" "}
            <strong className="text-slate-950">
              {formatDanishDateTime(settings.group_stage_lock_at)}
            </strong>
          </p>
        )}
      </section>

      {/* Cleanup section */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Ryd testdata
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Brug disse funktioner til at fjerne testdata inden rigtige deltagere melder sig til.
            Alle handlinger er permanente.
          </p>
        </div>

        <CleanupSection
          actions={[
            {
              id: "reset-results",
              label: "Nulstil alle kampresultater",
              description:
                "Sætter home_score_90 og away_score_90 til null, status til 'planlagt' og manually_corrected til false for alle kampe.",
              buttonLabel: "Nulstil resultater",
              tone: "warn",
              action: resetAllMatchResultsAction,
            },
            {
              id: "reset-points",
              label: "Nulstil alle kamp-point",
              description:
                "Sætter alle point-kolonner til 0 på match_predictions. Bud forbliver.",
              buttonLabel: "Nulstil kamp-point",
              tone: "warn",
              action: resetAllMatchPointsAction,
            },
            {
              id: "reset-statements",
              label: "Nulstil udsagnsafgørelser",
              description:
                "Sætter correct_answer til null og is_resolved til false for alle udsagn. Svar fra brugere forbliver.",
              buttonLabel: "Nulstil afgørelser",
              tone: "warn",
              action: resetAllStatementsAction,
            },
            {
              id: "delete-predictions",
              label: "Slet alle kampbud",
              description:
                "Sletter alle bud fra alle brugere permanent. Kan ikke fortrydes.",
              buttonLabel: "Slet kampbud",
              confirmPhrase: "SLET KAMPBUD",
              confirmPrompt: 'Skriv "SLET KAMPBUD" for at bekræfte permanent sletning:',
              tone: "danger",
              action: deleteAllPredictionsAction,
            },
            {
              id: "delete-statement-predictions",
              label: "Slet alle udsagnssvar",
              description:
                "Sletter alle udsagnssvar fra alle brugere permanent. Kan ikke fortrydes.",
              buttonLabel: "Slet udsagnssvar",
              confirmPhrase: "SLET SVAR",
              confirmPrompt: 'Skriv "SLET SVAR" for at bekræfte permanent sletning:',
              tone: "danger",
              action: deleteAllStatementPredictionsAction,
            },
          ]}
        />
      </section>
    </div>
  );
}
