import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";
import { AdminMatchesClient } from "./match-client";
import { recalculateAllPointsAction } from "./actions";

export default async function AdminMatchesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("match_no", { ascending: true });

  const matches = (data ?? []) as Match[];

  return (
    <div className="space-y-5">
      <PageHeader
        description="Opret, rediger og slet kampe. Tider vises i dansk tid (Europe/Copenhagen) for brugerne."
        eyebrow="Admin"
        title="Kampe"
      />

      <FormMessage searchParams={params} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
        Alle 104 VM 2026-kampe kan importeres via seed-filen{" "}
        <code className="font-mono font-bold text-slate-700">
          supabase/seed/2026_world_cup_matches.sql
        </code>
        . Kør den i Supabase SQL Editor. Filen er idempotent.
      </div>

      <form action={recalculateAllPointsAction}>
        <button
          className="w-full rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3 text-sm font-black text-pitch-700 shadow-sm"
          type="submit"
        >
          Genberegn point for alle færdige kampe
        </button>
      </form>

      <AdminMatchesClient matches={matches} />
    </div>
  );
}
