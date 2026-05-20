import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { dashboardCards } from "@/lib/placeholders";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Spiller"
        title="Dashboard"
        description="Dit overblik over placering, point, deadlines og åbne opgaver i slutrundespillet."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>
    </div>
  );
}
