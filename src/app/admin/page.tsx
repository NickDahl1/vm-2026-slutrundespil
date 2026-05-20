import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

const adminCards = [
  {
    label: "Antal brugere",
    value: "0",
    detail: "Brugere kommer fra Supabase Auth.",
    tone: "green" as const
  },
  {
    label: "Antal kampe",
    value: "48",
    detail: "Foreløbigt placeholder-program."
  },
  {
    label: "Manglende bud",
    value: "0",
    detail: "Beregnes, når kampbud er implementeret.",
    tone: "gold" as const
  },
  {
    label: "Dataopdatering",
    value: "Manuel",
    detail: "Automatik kommer i en senere opgave."
  }
];

const adminLinks = [
  { href: "/admin/matches", label: "Administrer kampe" },
  { href: "/admin/statements", label: "Administrer udsagn" },
  { href: "/admin/users", label: "Administrer brugere" }
];

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Admin-overblik"
        description="Et simpelt kontrolpanel til fremtidig styring af kampe, udsagn og brugere."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {adminLinks.map((link) => (
          <Link
            className="card text-center text-sm font-black text-pitch-700"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
