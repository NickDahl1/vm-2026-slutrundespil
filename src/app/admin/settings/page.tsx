import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import type { AppSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("*").single();
  const settings = data as AppSettings | null;

  return (
    <div className="space-y-5">
      <PageHeader
        description="Styr deadlines for kampbud og udsagn, og global låsning af spillet."
        eyebrow="Admin"
        title="Spilindstillinger"
      />

      {/* Current status summary */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 space-y-2">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Nuværende status
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">Grundspilsdeadline</span>
            <span className="font-black text-slate-950">
              {settings?.group_stage_lock_at
                ? formatDanishDateTime(settings.group_stage_lock_at)
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">Slutspilsdeadline</span>
            <span className="font-black text-slate-950">
              {settings?.knockout_stage_lock_at
                ? formatDanishDateTime(settings.knockout_stage_lock_at)
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">Global låsning</span>
            <span
              className={`font-black ${settings?.game_locked ? "text-red-600" : "text-pitch-700"}`}
            >
              {settings?.game_locked ? "Låst" : "Åben"}
            </span>
          </div>
        </div>
      </div>

      {settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <div className="card py-10 text-center">
          <p className="font-black text-slate-950">Ingen indstillinger fundet</p>
          <p className="mt-1 text-sm text-slate-500">
            app_settings-tabellen er tom. Indsæt en startræk i Supabase.
          </p>
        </div>
      )}
    </div>
  );
}
