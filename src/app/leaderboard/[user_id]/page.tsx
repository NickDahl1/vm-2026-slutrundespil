import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/types";
import { PHASE_LABELS } from "@/lib/types";

type PredWithMatch = {
  id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  points_home_score: number;
  points_away_score: number;
  points_outcome: number;
  total_points: number;
  matches: {
    id: number;
    match_no: number;
    phase: string;
    group_name: string | null;
    home_team: string;
    away_team: string;
    home_score_90: number | null;
    away_score_90: number | null;
    status: string;
  } | null;
};

function PointBadge({ label, correct }: { label: string; correct: boolean }) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-bold ${
        correct ? "bg-pitch-50 text-pitch-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {correct ? "✓" : "✗"} {label}
    </span>
  );
}

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
             status
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
            ? `${entry.total_points} point · ${entry.perfect_results} perfekte · ${entry.correct_outcomes} korrekte udfald · ${entry.predictions_count} bud`
            : "Ingen point endnu"
        }
        eyebrow={entry ? `Placering #${entry.rank}` : "Placering —"}
        title={
          profileData.display_name + (isMe ? " (dig)" : "")
        }
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
        <div className="space-y-3">
          {finishedPreds.map((pred) => {
            const match = pred.matches!;
            return (
              <article key={pred.id} className="card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge">#{match.match_no}</span>
                    <span className="badge">
                      {PHASE_LABELS[match.phase as keyof typeof PHASE_LABELS] ??
                        match.phase}
                    </span>
                    {match.group_name && (
                      <span className="badge">{match.group_name}</span>
                    )}
                  </div>
                  <span className="text-base font-black text-slate-950">
                    {pred.total_points}{" "}
                    <span className="text-xs font-semibold text-slate-400">
                      pt
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                  <p className="font-bold text-slate-800">{match.home_team}</p>
                  <div className="space-y-1">
                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
                      {match.home_score_90} – {match.away_score_90}
                    </div>
                    <div className="rounded-lg bg-pitch-50 px-3 py-1 text-sm font-black text-pitch-700">
                      {pred.predicted_home_score} – {pred.predicted_away_score}
                    </div>
                  </div>
                  <p className="font-bold text-slate-800">{match.away_team}</p>
                </div>

                <p className="text-center text-xs font-semibold text-slate-400">
                  Resultat&nbsp;·&nbsp;Bud
                </p>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <PointBadge
                    correct={pred.points_home_score === 1}
                    label="Hjemmemål"
                  />
                  <PointBadge
                    correct={pred.points_away_score === 1}
                    label="Udemål"
                  />
                  <PointBadge
                    correct={pred.points_outcome === 1}
                    label="Udfald"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
