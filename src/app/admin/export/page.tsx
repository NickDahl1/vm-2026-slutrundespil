import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

const EXPORTS = [
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "Placering, navn, total point, kamppoint, udsagnspoint, statistik pr. spiller.",
    primary: true,
  },
  {
    id: "predictions",
    label: "Kampbud",
    description: "Alle afgivne kampbud med point pr. bud.",
    primary: true,
  },
  {
    id: "statement-predictions",
    label: "Udsagnssvar",
    description: "Alle afgivne udsagnssvar med point.",
    primary: true,
  },
  {
    id: "matches",
    label: "Kampe",
    description: "Alle 104 VM-kampe med resultater og status.",
    primary: false,
  },
  {
    id: "statements",
    label: "Udsagn",
    description: "Alle udsagn med korrekte svar og afgørelsesstatus.",
    primary: false,
  },
  {
    id: "profiles",
    label: "Brugere",
    description: "Alle registrerede spillere (ingen passwords, kun navn og id).",
    primary: false,
  },
] as const;

export default async function AdminExportPage() {
  const supabase = await createClient();

  const [
    { count: predCount },
    { count: stmtPredCount },
    { count: userCount },
    { count: matchCount },
  ] = await Promise.all([
    supabase.from("match_predictions").select("*", { count: "exact", head: true }),
    supabase.from("statement_predictions").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ]);

  const counts: Record<string, number | null> = {
    leaderboard: userCount,
    predictions: predCount,
    "statement-predictions": stmtPredCount,
    matches: matchCount,
    statements: null,
    profiles: userCount,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        description="Download spildata som CSV-filer. Filer åbnes korrekt i Excel."
        eyebrow="Admin"
        title="Eksporter data"
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        CSV-filer er UTF-8 BOM-kodede og kan åbnes direkte i Excel.
        Download henter data fra databasen i realtid.
      </div>

      <section className="space-y-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Primære rapporter</p>
        <div className="space-y-3">
          {EXPORTS.filter((e) => e.primary).map((exp) => (
            <ExportCard
              key={exp.id}
              id={exp.id}
              label={exp.label}
              description={exp.description}
              count={counts[exp.id]}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stamdata</p>
        <div className="space-y-3">
          {EXPORTS.filter((e) => !e.primary).map((exp) => (
            <ExportCard
              key={exp.id}
              id={exp.id}
              label={exp.label}
              description={exp.description}
              count={counts[exp.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ExportCard({
  id,
  label,
  description,
  count,
}: {
  id: string;
  label: string;
  description: string;
  count: number | null | undefined;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-black text-slate-950">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-500">{description}</p>
        {count !== null && count !== undefined && (
          <p className="mt-1 text-xs font-bold text-slate-400">{count} rækker</p>
        )}
      </div>
      <Link
        className="shrink-0 rounded-lg bg-pitch-700 px-4 py-2 text-sm font-black text-white shadow-sm"
        href={`/admin/export/${id}`}
      >
        Download CSV
      </Link>
    </div>
  );
}
