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
        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-10 px-3 py-3 text-left text-xs font-black uppercase text-slate-500">
                  Pl.
                </th>
                <th className="px-3 py-3 text-left text-xs font-black uppercase text-slate-500">
                  Navn
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-pitch-700">
                  Total
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-slate-500">
                  Kamp
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-slate-500">
                  Udsagn
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-slate-500">
                  Perfekte
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-slate-500">
                  Udfald
                </th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase text-slate-500">
                  Bud
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={8}>
                    <p className="text-2xl">🏆</p>
                    <p className="mt-3 font-black text-slate-950">Ingen data endnu</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Leaderboard opdateres, når kampe er afsluttet.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isMe = entry.user_id === user.id;
                  const medal = MEDALS[entry.rank - 1];

                  return (
                    <tr
                      key={entry.user_id}
                      className={`border-b border-slate-100 last:border-b-0 ${
                        isMe ? "bg-pitch-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Rank */}
                      <td className="w-10 px-3 py-3">
                        <span className="text-base font-black text-slate-950">
                          {medal ?? `#${entry.rank}`}
                        </span>
                      </td>

                      {/* Name — links to detail page */}
                      <td className="px-3 py-3">
                        <Link
                          className="block min-w-0 truncate font-bold underline-offset-2 hover:underline"
                          href={`/leaderboard/${entry.user_id}`}
                        >
                          <span
                            className={isMe ? "text-pitch-700" : "text-slate-800"}
                          >
                            {entry.display_name}
                          </span>
                          {isMe && (
                            <span className="ml-1.5 text-xs font-black text-pitch-500">
                              (dig)
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* Total */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-base font-black text-slate-950">
                          {entry.total_points}
                        </span>
                      </td>

                      {/* Match points */}
                      <td className="px-3 py-3 text-right font-semibold text-slate-600">
                        {entry.match_points}
                      </td>

                      {/* Statement points */}
                      <td className="px-3 py-3 text-right font-semibold text-slate-600">
                        {entry.statement_points}
                      </td>

                      {/* Perfect results */}
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`font-bold ${
                            entry.perfect_results > 0
                              ? "text-cup-500"
                              : "text-slate-400"
                          }`}
                        >
                          {entry.perfect_results}
                        </span>
                      </td>

                      {/* Correct outcomes */}
                      <td className="px-3 py-3 text-right font-semibold text-slate-600">
                        {entry.correct_outcomes}
                      </td>

                      {/* Predictions submitted */}
                      <td className="px-3 py-3 text-right font-semibold text-slate-400">
                        {entry.predictions_count}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs font-semibold text-slate-400">
        Klik på et navn for at se kampdetaljerne · Kamp- og udsagnspoint tæller i alt
      </p>
    </div>
  );
}
