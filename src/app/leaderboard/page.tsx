import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("leaderboard_view" as never)
    .select("*")
    .order("rank", { ascending: true });

  const entries = (data ?? []) as LeaderboardEntry[];

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${entries.length} ${entries.length === 1 ? "deltager" : "deltagere"}`}
        eyebrow="Stillingen"
        title="Leaderboard"
      />

      <section className="card overflow-hidden p-0">
        <div className="grid grid-cols-[40px_1fr_52px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
          <span>Pl.</span>
          <span>Spiller</span>
          <span className="text-right">Point</span>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-2xl">🏆</p>
            <p className="mt-3 font-black text-slate-950">Ingen data endnu</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Leaderboard opdateres, når kampe er afsluttet.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const isMe = entry.user_id === user.id;
            const medal = MEDALS[entry.rank - 1];

            return (
              <Link
                key={entry.user_id}
                className={`grid grid-cols-[40px_1fr_52px] items-start border-b border-slate-100 px-4 py-3 last:border-b-0 active:bg-slate-100 ${
                  isMe ? "bg-pitch-50" : "hover:bg-slate-50"
                }`}
                href={`/leaderboard/${entry.user_id}`}
              >
                <span className="pt-1 text-sm font-black text-slate-950">
                  {medal ?? `#${entry.rank}`}
                </span>

                <div className="min-w-0">
                  <p
                    className={`truncate font-bold ${
                      isMe ? "text-pitch-700" : "text-slate-800"
                    }`}
                  >
                    {entry.display_name}
                    {isMe && (
                      <span className="ml-1.5 text-xs font-black text-pitch-500">
                        (dig)
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.match_points > 0 || entry.statement_points > 0 ? (
                      <>
                        {entry.match_points > 0 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                            {entry.match_points}K
                          </span>
                        )}
                        {entry.statement_points > 0 && (
                          <span className="rounded bg-cup-100 px-1.5 py-0.5 text-xs font-bold text-cup-500">
                            {entry.statement_points}U
                          </span>
                        )}
                      </>
                    ) : null}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                      {entry.perfect_results} perfekte
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                      {entry.correct_outcomes} udfald
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                      {entry.predictions_count} bud
                    </span>
                  </div>
                </div>

                <span className="pt-1 text-right text-base font-black text-slate-950">
                  {entry.total_points}
                </span>
              </Link>
            );
          })
        )}
      </section>

      <p className="text-center text-xs font-semibold text-slate-400">
        Tryk på en spiller for at se kampdetaljerne
      </p>
    </div>
  );
}
