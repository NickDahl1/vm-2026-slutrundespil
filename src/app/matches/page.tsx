import { PageHeader } from "@/components/page-header";
import { matches } from "@/lib/placeholders";

export default function MatchesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kampbud"
        title="Kampe"
        description="Her kommer brugeren senere til at afgive bud på kampresultater før deadline."
      />

      <section className="space-y-3">
        {matches.map((match) => (
          <article className="card" key={`${match.home}-${match.away}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="badge">{match.group}</span>
              <span className="text-xs font-black uppercase text-pitch-700">
                {match.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <p className="text-lg font-black text-slate-950">{match.home}</p>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-500">
                vs
              </span>
              <p className="text-lg font-black text-slate-950">{match.away}</p>
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-slate-500">
              {match.date}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
