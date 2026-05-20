import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction, AppSettings } from "@/lib/types";
import { MatchList } from "./match-list";

export default async function MatchesPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [{ data: matchData }, { data: predData }, { data: settingsData }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at").order("match_no"),
    supabase
      .from("match_predictions")
      .select("*")
      .eq("user_id", user.id),
    supabase.from("app_settings").select("*").single()
  ]);

  const matches = (matchData ?? []) as Match[];
  const predictions = (predData ?? []) as Prediction[];
  const settings = settingsData as AppSettings | null;

  return (
    <div className="space-y-5">
      <PageHeader
        description="Afgiv dine bud på kampresultater inden deadline. Du kan rette dit bud, så længe fristen ikke er passeret."
        eyebrow="Kampbud"
        title="Kampe"
      />
      <MatchList matches={matches} predictions={predictions} settings={settings} />
    </div>
  );
}
