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
        description="Opret, rediger og slet kampe. Indtast resultater og genberegn point."
        eyebrow="Admin"
        title="Kampe"
      />

      <FormMessage searchParams={params} />

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
