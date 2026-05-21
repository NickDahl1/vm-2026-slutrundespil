"use client";

import { useActionState, useEffect, useReducer } from "react";
import type { Match, Prediction, AppSettings } from "@/lib/types";
import { STATUS_LABELS, PHASE_LABELS } from "@/lib/types";
import { formatDanishDate, formatDanishTime, getDanishDateKey } from "@/lib/date-format";
import { bulkUpsertPredictionsAction, type BulkPredictionState } from "./actions";

type MatchInput = { home: string; away: string };

type FormState = {
  inputValues: Record<number, MatchInput>;
  savedIds: Set<number>;
  dirtyIds: Set<number>;
};

type FormAction =
  | { type: "edit"; matchId: number; home: string; away: string }
  | { type: "saved"; savedMatchIds: number[] };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "edit":
      return {
        ...state,
        inputValues: { ...state.inputValues, [action.matchId]: { home: action.home, away: action.away } },
        dirtyIds: new Set([...state.dirtyIds, action.matchId])
      };
    case "saved": {
      const newDirty = new Set(state.dirtyIds);
      for (const id of action.savedMatchIds) newDirty.delete(id);
      return {
        ...state,
        dirtyIds: newDirty,
        savedIds: new Set([...state.savedIds, ...action.savedMatchIds])
      };
    }
  }
}

function buildInitialFormState(predictions: Prediction[]): FormState {
  const inputValues: Record<number, MatchInput> = {};
  for (const p of predictions) {
    inputValues[p.match_id] = {
      home: String(p.predicted_home_score),
      away: String(p.predicted_away_score)
    };
  }
  return {
    inputValues,
    savedIds: new Set(predictions.map((p) => p.match_id)),
    dirtyIds: new Set()
  };
}

function groupByDanishDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const key = getDanishDateKey(match.kickoff_at);
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

type MatchStatus = "locked" | "saved" | "dirty" | "empty";

function getMatchStatus(
  match: Match,
  input: MatchInput | undefined,
  savedIds: Set<number>,
  dirtyIds: Set<number>,
  locked: boolean
): MatchStatus {
  if (locked || match.status === "finished") return "locked";
  const filled = input?.home !== "" && input?.away !== "" && input !== undefined;
  if (dirtyIds.has(match.id) && filled) return "dirty";
  if (savedIds.has(match.id)) return "saved";
  return "empty";
}

const STATUS_BADGE: Record<MatchStatus, string> = {
  locked: "rounded px-2 py-0.5 text-xs font-black bg-slate-100 text-slate-400",
  saved: "rounded px-2 py-0.5 text-xs font-black bg-pitch-50 text-pitch-700",
  dirty: "rounded px-2 py-0.5 text-xs font-black bg-cup-100 text-cup-500",
  empty: "rounded px-2 py-0.5 text-xs font-black bg-slate-100 text-slate-500"
};

const STATUS_LABEL: Record<MatchStatus, string> = {
  locked: "Låst",
  saved: "Gemt",
  dirty: "Ændret",
  empty: "Ikke udfyldt"
};

const matchStatusColors: Record<Match["status"], string> = {
  scheduled: "text-slate-600",
  live: "text-pitch-700",
  finished: "text-slate-500",
  postponed: "text-cup-500",
  cancelled: "text-red-500"
};

function PointRow({ label, correct }: { label: string; correct: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-black ${correct ? "text-pitch-700" : "text-slate-400"}`}>
        {correct ? "✓" : "✗"}
      </span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </div>
  );
}

function PointBreakdown({ prediction }: { prediction: Prediction }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <PointRow correct={prediction.points_home_score === 1} label="Hjemmemål" />
          <PointRow correct={prediction.points_away_score === 1} label="Udemål" />
          <PointRow correct={prediction.points_outcome === 1} label="Udfald" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-950">{prediction.total_points}</p>
          <p className="text-xs font-semibold text-slate-500">point</p>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  input,
  status,
  onInputChange
}: {
  match: Match;
  prediction: Prediction | undefined;
  input: MatchInput | undefined;
  status: MatchStatus;
  onInputChange: (matchId: number, home: string, away: string) => void;
}) {
  const isFinished = match.status === "finished";
  const isLocked = status === "locked";
  const hasResult = match.home_score_90 !== null && match.away_score_90 !== null;

  return (
    <article className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">#{match.match_no}</span>
          <span className="badge">{PHASE_LABELS[match.phase]}</span>
          {match.group_name && <span className="badge">{match.group_name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase ${matchStatusColors[match.status]}`}>
            {STATUS_LABELS[match.status]}
          </span>
          {!isFinished && (
            <span className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</span>
          )}
        </div>
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
        {formatDanishTime(match.kickoff_at)}
      </p>

      {isFinished && prediction && <PointBreakdown prediction={prediction} />}

      {isLocked && !isFinished && (
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
      )}

      {!isLocked && !isFinished && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700">Dit bud</p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-950 focus:border-pitch-700 focus:outline-none"
              min="0"
              onChange={(e) => onInputChange(match.id, e.target.value, input?.away ?? "")}
              placeholder="0"
              step="1"
              type="number"
              value={input?.home ?? ""}
            />
            <span className="text-sm font-black text-slate-400">–</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-950 focus:border-pitch-700 focus:outline-none"
              min="0"
              onChange={(e) => onInputChange(match.id, input?.home ?? "", e.target.value)}
              placeholder="0"
              step="1"
              type="number"
              value={input?.away ?? ""}
            />
          </div>
        </div>
      )}
    </article>
  );
}

const initialBulkState: BulkPredictionState = {
  status: "idle",
  message: "",
  savedMatchIds: []
};

export function MatchList({
  matches,
  predictions,
  settings
}: {
  matches: Match[];
  predictions: Prediction[];
  settings: AppSettings | null;
}) {
  const [bulkState, formAction, isPending] = useActionState<BulkPredictionState, FormData>(
    bulkUpsertPredictionsAction,
    initialBulkState
  );

  const [formState, dispatch] = useReducer(
    formReducer,
    predictions,
    buildInitialFormState
  );

  const { inputValues, savedIds, dirtyIds } = formState;

  // Sync successful save result into form state
  useEffect(() => {
    if (bulkState.status === "success" && bulkState.savedMatchIds.length > 0) {
      dispatch({ type: "saved", savedMatchIds: bulkState.savedMatchIds });
    }
  }, [bulkState]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (dirtyIds.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyIds]);

  function handleInputChange(matchId: number, home: string, away: string) {
    dispatch({ type: "edit", matchId, home, away });
  }

  const grouped = groupByDanishDate(matches);

  // Collect dirty + filled predictions to submit
  const dirtyPredictions = [...dirtyIds]
    .map((id) => {
      const inp = inputValues[id];
      if (!inp || inp.home === "" || inp.away === "") return null;
      const home = parseInt(inp.home, 10);
      const away = parseInt(inp.away, 10);
      if (isNaN(home) || isNaN(away)) return null;
      return { match_id: id, home, away };
    })
    .filter(Boolean);

  // Progress summary
  const unlocked = matches.filter(
    (m) => !isMatchLocked(m, settings) && m.status !== "finished"
  );
  const filledCount = unlocked.filter((m) => {
    const inp = inputValues[m.id];
    const hasInput = inp && inp.home !== "" && inp.away !== "";
    return savedIds.has(m.id) || hasInput;
  }).length;
  const missingCount = unlocked.length - filledCount;
  const unsavedCount = dirtyPredictions.length;

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

  const saveButtonLabel = isPending
    ? "Gemmer..."
    : dirtyPredictions.length > 0
      ? `Gem ${dirtyPredictions.length} kampbud`
      : "Gem alle kampbud";

  const predictionsJson = JSON.stringify(dirtyPredictions);

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-slate-950">
              {filledCount} af {unlocked.length} kampbud udfyldt
            </p>
            {missingCount > 0 && (
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                {missingCount} mangler
              </p>
            )}
          </div>
          {unsavedCount > 0 && (
            <span className="rounded bg-cup-100 px-2 py-0.5 text-xs font-black text-cup-500">
              {unsavedCount} ændring{unsavedCount === 1 ? "" : "er"} ikke gemt
            </span>
          )}
        </div>
      </div>

      {/* Top save button */}
      <form action={formAction}>
        <input name="predictions" type="hidden" value={predictionsJson} />
        <button
          className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50"
          disabled={isPending || dirtyPredictions.length === 0}
          type="submit"
        >
          {saveButtonLabel}
        </button>
        {bulkState.status === "success" && (
          <p className="mt-2 text-center text-xs font-black text-pitch-700">
            ✓ {bulkState.message}
          </p>
        )}
        {bulkState.status === "error" && (
          <p className="mt-2 text-center text-xs font-bold text-red-600">
            {bulkState.message}
          </p>
        )}
      </form>

      {/* Match list grouped by Danish date */}
      <div className="space-y-6">
        {grouped.map(([dateKey, dayMatches]) => (
          <section key={dateKey}>
            <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-pitch-700">
              {formatDanishDate(dayMatches[0].kickoff_at)}
            </h2>
            <div className="space-y-3">
              {dayMatches.map((match) => {
                const locked = isMatchLocked(match, settings);
                const prediction = predictions.find((p) => p.match_id === match.id);
                const input = inputValues[match.id];
                const status = getMatchStatus(match, input, savedIds, dirtyIds, locked);
                return (
                  <MatchCard
                    input={input}
                    key={match.id}
                    match={match}
                    onInputChange={handleInputChange}
                    prediction={prediction}
                    status={status}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom save button (only visible when there are unsaved changes) */}
      {dirtyPredictions.length > 0 && (
        <form action={formAction}>
          <input name="predictions" type="hidden" value={predictionsJson} />
          <button
            className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {saveButtonLabel}
          </button>
        </form>
      )}
    </div>
  );
}
