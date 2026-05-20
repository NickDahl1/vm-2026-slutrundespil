import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

const adminLinks = [
  { href: "/admin/matches", label: "Administrer kampe" },
  { href: "/admin/statements", label: "Administrer udsagn" },
  { href: "/admin/users", label: "Administrer brugere" }
];

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: matchCount },
    { count: predictionCount }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("match_predictions").select("*", { count: "exact", head: true })
  ]);

  const maxPossiblePredictions = (userCount ?? 0) * (matchCount ?? 0);
  const missingPredictions = Math.max(0, maxPossiblePredictions - (predictionCount ?? 0));

  return (
    <div className="space-y-5">
      <PageHeader
        description="Overblik over spillet — brugere, kampe og indsendte bud."
        eyebrow="Admin"
        title="Admin-overblik"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          detail="Registrerede spillere"
          label="Brugere"
          tone="green"
          value={String(userCount ?? 0)}
        />
        <StatCard
          detail="Oprettede VM-kampe"
          label="Kampe"
          value={String(matchCount ?? 0)}
        />
        <StatCard
          detail="Indsendte kampbud totalt"
          label="Kampbud"
          tone="green"
          value={String(predictionCount ?? 0)}
        />
        <StatCard
          detail="Mulige bud minus afgivne"
          label="Manglende bud"
          tone={missingPredictions > 0 ? "gold" : "neutral"}
          value={String(missingPredictions)}
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
