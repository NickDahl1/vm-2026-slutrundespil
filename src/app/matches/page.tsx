import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";
import { STATUS_LABELS, PHASE_LABELS } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function groupByDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const key = dateKey(match.kickoff_at);
    const group = map.get(key) ?? [];
    group.push(match);
    map.set(key, group);
  }
  return Array.from(map.entries());
}

const statusColors: Record<Match["status"], string> = {
  scheduled: "text-slate-600",
  live: "text-pitch-700",
  finished: "text-slate-500",
  postponed: "text-cup-500",
  cancelled: "text-red-500"
};

export default async function MatchesPage() {
  await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true })
    .order("match_no", { ascending: true });

  const matches = (data ?? []) as Match[];
  const grouped = groupByDate(matches);

  return (
    <div className="space-y-5">
      <PageHeader
        description="Alle kampe i turneringen, sorteret efter dato og afspark."
        eyebrow="Kampbud"
        title="Kampe"
      />

      {matches.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-2xl">⚽</p>
          <p className="mt-3 font-black text-slate-950">Ingen kampe endnu</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Kampene vises her, når admin har oprettet dem.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([, dayMatches]) => (
            <section key={dateKey(dayMatches[0].kickoff_at)}>
              <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-pitch-700">
                {formatDate(dayMatches[0].kickoff_at)}
              </h2>
              <div className="space-y-3">
                {dayMatches.map((match) => (
                  <article className="card" key={match.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge">#{match.match_no}</span>
                        <span className="badge">{PHASE_LABELS[match.phase]}</span>
                        {match.group_name && (
                          <span className="badge">{match.group_name}</span>
                        )}
                      </div>
                      <span className={`text-xs font-black uppercase ${statusColors[match.status]}`}>
                        {STATUS_LABELS[match.status]}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                      <p className="font-black text-slate-950">{match.home_team}</p>

                      {match.home_score_90 !== null && match.away_score_90 !== null ? (
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-base font-black text-slate-950">
                          {match.home_score_90} – {match.away_score_90}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-500">
                          vs
                        </span>
                      )}

                      <p className="font-black text-slate-950">{match.away_team}</p>
                    </div>

                    <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                      {formatTime(match.kickoff_at)} UTC
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
