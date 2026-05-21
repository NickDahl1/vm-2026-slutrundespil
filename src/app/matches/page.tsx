import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
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

  const now = new Date();
  const groupLocked =
    settings?.game_locked ||
    (settings?.group_stage_lock_at
      ? new Date(settings.group_stage_lock_at) <= now
      : false);

  return (
    <div className="space-y-5">
      <PageHeader
        description="Afgiv dine bud på kampresultater inden deadline. Du kan rette dit bud, så længe fristen ikke er passeret."
        eyebrow="Kampbud"
        title="Kampe"
      />

      {/* Lock / deadline banner */}
      {settings?.game_locked ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">🔒 Kampbud er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">
            Spillet er låst af admin. Ingen bud kan ændres.
          </p>
        </div>
      ) : groupLocked ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-black text-slate-700">🔒 Kampbud er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Fristen for grundspilsbud er passeret.
          </p>
        </div>
      ) : settings?.group_stage_lock_at ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="text-sm font-semibold text-pitch-700">
            Du kan afgive kampbud frem til{" "}
            <strong>{formatDanishDateTime(settings.group_stage_lock_at)}</strong>.
          </p>
        </div>
      ) : null}

      <MatchList matches={matches} predictions={predictions} settings={settings} />
    </div>
  );
}
