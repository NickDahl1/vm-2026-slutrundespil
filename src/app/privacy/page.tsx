import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        description="Kort forklaring om hvilke oplysninger spillet bruger, og hvem der kan se dem."
        eyebrow="Tryghed"
        title="Privatliv og data"
      />

      <section className="card space-y-4 text-sm font-semibold leading-7 text-slate-700">
        <p>Denne app bruges til et privat VM 2026-spil.</p>

        <p>
          Når du opretter dig, gemmes kun de oplysninger, der er nødvendige for
          spillet: dit navn, din emailadresse, dine kampbud, dine svar på
          udsagn, dine point og eventuelle beskeder du sender til admin.
        </p>

        <p>
          Din adgangskode kan ikke ses af admin. Login og adgangskoder håndteres
          sikkert via Supabase Auth.
        </p>

        <p>
          Andre deltagere kan ikke se din emailadresse. De kan se dit navn, dine
          bud, dine svar og dine point, når de selv har udfyldt deres egne bud
          og svar.
        </p>

        <p>
          Admin kan se dit navn, din emailadresse, dine bud, dine svar, dine
          point og eventuelle beskeder du sender via Kontakt admin. Admin kan
          ikke se din adgangskode.
        </p>

        <p>
          Oplysningerne bruges kun til at drive VM 2026-spillet, beregne point,
          vise leaderboard og hjælpe deltagere ved spørgsmål. Data sælges ikke
          og bruges ikke til reklamer.
        </p>

        <p>
          Deltagelse er frivillig. Hvis du vil have rettet eller slettet dine
          oplysninger, kan du kontakte admin via Kontakt admin.
        </p>

        <p>
          Data slettes eller anonymiseres efter turneringen, når spillet ikke
          længere skal bruges.
        </p>
      </section>

      <Link
        className="inline-flex rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-2 text-sm font-black text-pitch-700"
        href="/contact"
      >
        Kontakt admin
      </Link>
    </div>
  );
}
