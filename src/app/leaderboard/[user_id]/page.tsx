import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry, PredWithMatch } from "@/lib/types";
import { PredictionFilter } from "./prediction-filter";

export default async function LeaderboardUserPage({
  params
}: {
  params: Promise<{ user_id: string }>;
}) {
  const { user } = await requireUser();
  const { user_id } = await params;
  const supabase = await createClient();

  const [{ data: profileData }, { data: entryData }, { data: predData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user_id)
        .single(),
      supabase
        .from("leaderboard_view" as never)
        .select("*")
        .eq("user_id", user_id)
        .single(),
      supabase
        .from("match_predictions")
        .select(
          `id,
           predicted_home_score,
           predicted_away_score,
           points_home_score,
           points_away_score,
           points_outcome,
           total_points,
           matches (
             id, match_no, phase, group_name,
             home_team, away_team,
             home_score_90, away_score_90,
             status, kickoff_at
           )`
        )
        .eq("user_id", user_id)
        .order("match_id", { ascending: true })
    ]);

  if (!profileData) notFound();

  const entry = entryData as LeaderboardEntry | null;
  const allPreds = (predData ?? []) as unknown as PredWithMatch[];
  const finishedPreds = allPreds.filter((p) => p.matches?.status === "finished");
  const isMe = user.id === user_id;

  return (
    <div className="space-y-5">
      <Link
        className="inline-block text-xs font-bold text-pitch-700"
        href="/leaderboard"
      >
        ← Leaderboard
      </Link>

      <PageHeader
        description={
          entry
            ? `${entry.total_points} point · ${entry.match_points} kamp · ${entry.statement_points} udsagn · ${entry.predictions_count} bud`
            : "Ingen point endnu"
        }
        eyebrow={entry ? `Placering #${entry.rank}` : "Placering —"}
        title={profileData.display_name + (isMe ? " (dig)" : "")}
      />

      {finishedPreds.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-2xl">⚽</p>
          <p className="mt-3 font-black text-slate-950">Ingen afsluttede kampe</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Resultater vises her, når kampe er afsluttet.
          </p>
        </div>
      ) : (
        <PredictionFilter
          correctOutcomes={entry?.correct_outcomes ?? 0}
          matchPoints={entry?.match_points ?? 0}
          perfectResults={entry?.perfect_results ?? 0}
          preds={finishedPreds}
        />
      )}
    </div>
  );
}
