import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Statement, StatementPrediction, AppSettings } from "@/lib/types";
import { StatementList } from "./statement-list";

export default async function StatementsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [
    { data: statementsData },
    { data: predictionsData },
    { data: settingsData }
  ] = await Promise.all([
    supabase
      .from("statements")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("statement_predictions")
      .select("*")
      .eq("user_id", user.id),
    supabase.from("app_settings").select("*").single()
  ]);

  const statements = (statementsData ?? []) as Statement[];
  const predictions = (predictionsData ?? []) as StatementPrediction[];
  const settings = settingsData as AppSettings | null;

  const resolved = statements.filter((s) => s.is_resolved).length;
  const answered = predictions.length;

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${statements.length} udsagn · ${answered} besvaret · ${resolved} afgjort`}
        eyebrow="Bonus"
        title="Udsagn"
      />

      {statements.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-2xl">📋</p>
          <p className="mt-3 font-black text-slate-950">Ingen udsagn endnu</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Udsagn oprettes af admin inden turneringen.
          </p>
        </div>
      ) : (
        <StatementList
          predictions={predictions}
          settings={settings}
          statements={statements}
        />
      )}
    </div>
  );
}
