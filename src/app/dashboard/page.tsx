import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FormMessage } from "@/components/form-message";
import { requireUser } from "@/lib/auth";
import { dashboardCards } from "@/lib/placeholders";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { profile } = await requireUser();
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Spiller"
        title={`Dashboard${profile?.display_name ? ` for ${profile.display_name}` : ""}`}
        description="Dit overblik over placering, point, deadlines og åbne opgaver i slutrundespillet."
      />
      <FormMessage searchParams={params} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>
    </div>
  );
}
