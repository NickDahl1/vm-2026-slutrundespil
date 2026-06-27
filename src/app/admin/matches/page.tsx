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

  const [{ data }, { data: teamData }] = await Promise.all([
    supabase.from("matches").select("*").order("match_no", { ascending: true }),
    supabase.from("matches").select("home_team, away_team"),
  ]);

  const matches = (data ?? []) as Match[];

  const teamNames = [
    ...new Set(
      (teamData ?? []).flatMap((m) => [
        (m as { home_team: string; away_team: string }).home_team,
        (m as { home_team: string; away_team: string }).away_team,
      ])
    ),
  ].sort();

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

      <AdminMatchesClient matches={matches} teamNames={teamNames} />
    </div>
  );
}
