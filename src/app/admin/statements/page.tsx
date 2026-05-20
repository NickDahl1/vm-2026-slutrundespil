import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";
import type { Statement } from "@/lib/types";
import { AdminStatementsClient } from "./statement-client";
import { recalculateAllStatementPointsAction } from "./actions";

export default async function AdminStatementsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: statementsData }, { data: answersData }] = await Promise.all([
    supabase.from("statements").select("*").order("sort_order", { ascending: true }),
    supabase.from("statement_predictions").select("statement_id")
  ]);

  const statements = (statementsData ?? []) as Statement[];

  const answerCounts: Record<number, number> = {};
  for (const row of answersData ?? []) {
    const r = row as { statement_id: number };
    answerCounts[r.statement_id] = (answerCounts[r.statement_id] ?? 0) + 1;
  }

  const resolved = statements.filter((s) => s.is_resolved).length;

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${statements.length} udsagn · ${resolved} afgjort`}
        eyebrow="Admin"
        title="Udsagn"
      />

      <FormMessage searchParams={params} />

      <form action={recalculateAllStatementPointsAction}>
        <button
          className="w-full rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3 text-sm font-black text-pitch-700 shadow-sm"
          type="submit"
        >
          Genberegn point for alle afgjorte udsagn
        </button>
      </form>

      <AdminStatementsClient
        answerCounts={answerCounts}
        statements={statements}
      />
    </div>
  );
}
