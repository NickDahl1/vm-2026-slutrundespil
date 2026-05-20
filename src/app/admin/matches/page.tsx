import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { matches } from "@/lib/placeholders";

export default function AdminMatchesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Kampe"
        description="Placeholder til oprettelse, redigering og publicering af kampe."
      />

      <PlaceholderPanel title="Kampoversigt" actionLabel="Tilføj kamp senere">
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              key={`${match.home}-${match.away}`}
            >
              <p className="font-black text-slate-950">
                {match.home} - {match.away}
              </p>
              <p className="text-sm text-slate-600">
                {match.group} · {match.date}
              </p>
            </div>
          ))}
        </div>
      </PlaceholderPanel>
    </div>
  );
}
