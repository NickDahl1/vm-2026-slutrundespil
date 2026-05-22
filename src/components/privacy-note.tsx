import Link from "next/link";

export function PrivacyNote() {
  return (
    <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3 text-sm font-semibold leading-6 text-pitch-900">
      <p>
        Dine oplysninger bruges kun til VM 2026-spillet. Din adgangskode
        håndteres sikkert af Supabase Auth og kan ikke ses af admin. Andre
        deltagere kan ikke se din emailadresse. De kan kun se dit navn, dine bud
        og dine point, når spillet kræver det.
      </p>
      <Link className="mt-2 inline-block font-black text-pitch-700" href="/privacy">
        Læs mere om privatliv og data
      </Link>
    </div>
  );
}
