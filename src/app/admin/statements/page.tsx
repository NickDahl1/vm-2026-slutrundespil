import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";
import type { Statement } from "@/lib/types";
import { AdminStatementsClient } from "./statement-client";
import { recalculateAllStatementPointsAction } from "./actions";

const TARGET_COUNT = 15;

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

  const count = statements.length;
  const resolved = statements.filter((s) => s.is_resolved).length;

  const statusOk = count === TARGET_COUNT;
  const statusEmpty = count === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${count} udsagn · ${resolved} afgjort`}
        eyebrow="Admin"
        title="Udsagn"
      />

      <FormMessage searchParams={params} />

      {/* Statement count status banner */}
      {statusOk ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="font-black text-pitch-700">✓ {TARGET_COUNT}/{TARGET_COUNT} udsagn klar</p>
          <p className="mt-0.5 text-sm font-semibold text-pitch-500">
            Alle 15 udsagn er oprettet og klar til release.
          </p>
        </div>
      ) : statusEmpty ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">✗ Ingen udsagn oprettet endnu</p>
          <p className="mt-1 text-sm font-semibold text-red-600">
            Kør seed-filen i Supabase SQL Editor for at oprette de 15 standardudsagn:
          </p>
          <code className="mt-2 block rounded bg-red-100 px-3 py-2 text-xs font-mono text-red-800">
            supabase/seed/2026_default_statements.sql
          </code>
          <p className="mt-2 text-xs font-semibold text-red-500">
            Åbn Supabase Dashboard → SQL Editor → indsæt indholdet af filen → kør.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="font-black text-amber-700">⚠ {count} af {TARGET_COUNT} udsagn oprettet</p>
          <p className="mt-0.5 text-sm font-semibold text-amber-600">
            Kør seed-filen igen for at oprette de manglende udsagn (seed er idempotent):
          </p>
          <code className="mt-2 block rounded bg-amber-100 px-3 py-2 text-xs font-mono text-amber-800">
            supabase/seed/2026_default_statements.sql
          </code>
        </div>
      )}

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
