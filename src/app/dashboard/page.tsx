import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FormMessage } from "@/components/form-message";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString("da-DK", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

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
    { data: settingsData }
  ] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("match_predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("app_settings").select("*").single()
  ]);

  const settings = settingsData as AppSettings | null;
  const total = matchCount ?? 0;
  const submitted = predictionCount ?? 0;
  const missing = Math.max(0, total - submitted);

  const deadlineDetail = settings?.group_stage_lock_at
    ? `Frist: ${formatDeadline(settings.group_stage_lock_at)} UTC`
    : "Ingen frist sat endnu";

  return (
    <div className="space-y-5">
      <PageHeader
        description="Dit overblik over kampbud, deadlines og åbne opgaver i slutrundespillet."
        eyebrow="Spiller"
        title={`Dashboard${profile?.display_name ? ` for ${profile.display_name}` : ""}`}
      />
      <FormMessage searchParams={params} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          detail={deadlineDetail}
          label="Deadline — grundspil"
          value={settings?.game_locked ? "Låst" : missing === 0 ? "Klar" : "Åben"}
        />
        <StatCard
          detail="Beregnes, når alle resultater er indtastet"
          label="Mine point"
          value="—"
        />
        <StatCard
          detail="Placering opdateres, når point beregnes"
          label="Min placering"
          tone="gold"
          value="—"
        />
      </section>
    </div>
  );
}
