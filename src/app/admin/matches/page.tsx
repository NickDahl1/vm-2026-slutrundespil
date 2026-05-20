import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";
import { AdminMatchesClient } from "./match-client";

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
        description="Opret, rediger og slet kampe. Indtast resultater efter endt kamp."
        eyebrow="Admin"
        title="Kampe"
      />

      <FormMessage searchParams={params} />

      <AdminMatchesClient matches={matches} />
    </div>
  );
}
