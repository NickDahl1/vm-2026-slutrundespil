"use client";

import { useActionState } from "react";
import type { Match, Prediction, AppSettings } from "@/lib/types";
import { STATUS_LABELS, PHASE_LABELS } from "@/lib/types";
import { upsertPredictionAction, type PredictionState } from "./actions";

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

function groupByDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const key = match.kickoff_at.slice(0, 10);
    const group = map.get(key) ?? [];
    group.push(match);
    map.set(key, group);
  }
  return Array.from(map.entries());
}

function isMatchLocked(match: Match, settings: AppSettings | null): boolean {
  if (!settings) return false;
  if (settings.game_locked) return true;
  const now = new Date();
  if (match.phase === "group_stage" && settings.group_stage_lock_at) {
    return new Date(settings.group_stage_lock_at) <= now;
  }
  if (match.phase === "knockout_stage" && settings.knockout_stage_lock_at) {
    return new Date(settings.knockout_stage_lock_at) <= now;
  }
  return false;
}

const statusColors: Record<Match["status"], string> = {
  scheduled: "text-slate-600",
  live: "text-pitch-700",
  finished: "text-slate-500",
  postponed: "text-cup-500",
  cancelled: "text-red-500"
};

const initialState: PredictionState = { status: "idle", message: "" };

function MatchCard({
  match,
  prediction,
  locked
}: {
  match: Match;
  prediction: Prediction | undefined;
  locked: boolean;
}) {
  const [state, formAction, isPending] = useActionState<PredictionState, FormData>(
    upsertPredictionAction,
    initialState
  );

  const hasResult = match.home_score_90 !== null && match.away_score_90 !== null;

  return (
    <article className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">#{match.match_no}</span>
          <span className="badge">{PHASE_LABELS[match.phase]}</span>
          {match.group_name && <span className="badge">{match.group_name}</span>}
        </div>
        <span className={`text-xs font-black uppercase ${statusColors[match.status]}`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <p className="font-black text-slate-950">{match.home_team}</p>
        {hasResult ? (
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

      <p className="text-center text-xs font-semibold text-slate-500">
        {formatTime(match.kickoff_at)} UTC
      </p>

      {locked ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          {prediction ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Dit bud</span>
              <span className="font-black text-slate-950">
                {prediction.predicted_home_score} – {prediction.predicted_away_score}
              </span>
              <span className="badge">Låst</span>
            </div>
          ) : (
            <p className="text-center text-sm font-semibold text-slate-500">
              Fristen er passeret — ingen bud afgivet
            </p>
          )}
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input name="match_id" type="hidden" value={match.id} />

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">Dit bud</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-950 focus:border-pitch-700 focus:outline-none"
                defaultValue={prediction?.predicted_home_score ?? ""}
                min="0"
                name="predicted_home_score"
                placeholder="0"
                required
                type="number"
              />
              <span className="text-sm font-black text-slate-400">–</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-950 focus:border-pitch-700 focus:outline-none"
                defaultValue={prediction?.predicted_away_score ?? ""}
                min="0"
                name="predicted_away_score"
                placeholder="0"
                required
                type="number"
              />
            </div>
          </div>

          <button
            className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Gemmer..." : "Gem bud"}
          </button>

          {state.status === "success" && (
            <p className="text-center text-xs font-black text-pitch-700">✓ {state.message}</p>
          )}
          {state.status === "error" && (
            <p className="text-center text-xs font-bold text-red-600">{state.message}</p>
          )}
          {state.status === "idle" && !prediction && (
            <p className="text-center text-xs font-semibold text-slate-400">
              Du mangler at afgive bud
            </p>
          )}
        </form>
      )}
    </article>
  );
}

export function MatchList({
  matches,
  predictions,
  settings
}: {
  matches: Match[];
  predictions: Prediction[];
  settings: AppSettings | null;
}) {
  const predMap = new Map(predictions.map((p) => [p.match_id, p]));
  const grouped = groupByDate(matches);

  if (matches.length === 0) {
    return (
      <div className="card py-12 text-center">
        <p className="text-2xl">⚽</p>
        <p className="mt-3 font-black text-slate-950">Ingen kampe endnu</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Kampene vises her, når admin har oprettet dem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([, dayMatches]) => (
        <section key={dayMatches[0].kickoff_at.slice(0, 10)}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-pitch-700">
            {formatDate(dayMatches[0].kickoff_at)}
          </h2>
          <div className="space-y-3">
            {dayMatches.map((match) => (
              <MatchCard
                key={match.id}
                locked={isMatchLocked(match, settings)}
                match={match}
                prediction={predMap.get(match.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
