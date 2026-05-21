import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

const adminLinks = [
  { href: "/admin/settings", label: "Spilindstillinger" },
  { href: "/admin/matches", label: "Administrer kampe" },
  { href: "/admin/statements", label: "Administrer udsagn" },
  { href: "/admin/users", label: "Administrer brugere" }
];

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: matchCount },
    { count: predictionCount },
    { count: statementCount },
    { count: statementAnswerCount }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("match_predictions").select("*", { count: "exact", head: true }),
    supabase.from("statements").select("*", { count: "exact", head: true }),
    supabase.from("statement_predictions").select("*", { count: "exact", head: true })
  ]);

  const users = userCount ?? 0;
  const matches = matchCount ?? 0;
  const predictions = predictionCount ?? 0;
  const stmts = statementCount ?? 0;
  const stmtAnswers = statementAnswerCount ?? 0;

  const maxPossiblePredictions = users * matches;
  const missingPredictions = Math.max(0, maxPossiblePredictions - predictions);
  const maxPossibleStatementAnswers = users * stmts;
  const missingStatementAnswers = Math.max(0, maxPossibleStatementAnswers - stmtAnswers);

  const { data: resolvedData } = await supabase
    .from("statements")
    .select("id", { count: "exact", head: false })
    .eq("is_resolved", true);
  const resolvedCount = resolvedData?.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        description="Overblik over spillet — brugere, kampe, udsagn og indsendte bud."
        eyebrow="Admin"
        title="Admin-overblik"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          detail="Registrerede spillere"
          label="Brugere"
          tone="green"
          value={String(users)}
        />
        <StatCard
          detail="Oprettede VM-kampe"
          label="Kampe"
          value={String(matches)}
        />
        <StatCard
          detail="Indsendte kampbud totalt"
          label="Kampbud"
          tone="green"
          value={String(predictions)}
        />
        <StatCard
          detail="Mulige bud minus afgivne"
          label="Manglende kampbud"
          tone={missingPredictions > 0 ? "gold" : "neutral"}
          value={String(missingPredictions)}
        />
        <StatCard
          detail={`${resolvedCount} afgjort af ${stmts} i alt`}
          label="Udsagn"
          value={String(stmts)}
        />
        <StatCard
          detail="Indsendte udsagnssvar totalt"
          label="Udsagnssvar"
          tone="green"
          value={String(stmtAnswers)}
        />
        <StatCard
          detail="Mulige svar minus afgivne"
          label="Manglende udsagnssvar"
          tone={missingStatementAnswers > 0 ? "gold" : "neutral"}
          value={String(missingStatementAnswers)}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {adminLinks.map((link) => (
          <Link
            className="card text-center text-sm font-black text-pitch-700"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
