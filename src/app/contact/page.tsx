import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    (profileData as { display_name: string | null } | null)?.display_name ??
    "Spiller";

  return (
    <div className="space-y-5">
      <PageHeader
        description="Har du spørgsmål eller feedback? Skriv direkte til admin."
        eyebrow="Hjælp"
        title="Kontakt admin"
      />

      <div className="card space-y-5">
        <ContactForm displayName={displayName} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        Beskeder gemmes i systemet og besvares normalt inden for et par dage.
        Du modtager ikke en email-kvittering.
      </div>
    </div>
  );
}
