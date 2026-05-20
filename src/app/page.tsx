import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function HomePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Velkommen"
        title="VM 2026"
        description="Et simpelt fundament til slutrundespillet: kampbud, udsagn, point og leaderboard samles her, når auth og data er klar."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <Link className="card bg-pitch-700 text-white" href="/dashboard">
          <p className="text-sm font-bold text-pitch-100">Efter login</p>
          <h2 className="mt-2 text-2xl font-black">Dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-pitch-50">
            Forsiden efter login tænkes som spillerens overblik.
          </p>
        </Link>
        <PlaceholderPanel title="Næste skridt" actionLabel="Kommer senere">
          <p className="text-sm leading-6 text-slate-600">
            Supabase Auth, kampbud og pointlogik bliver koblet på i kommende
            opgaver.
          </p>
        </PlaceholderPanel>
      </section>
    </div>
  );
}
