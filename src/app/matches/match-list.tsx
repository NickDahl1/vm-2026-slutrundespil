"use client";

import { useActionState, useEffect, useReducer } from "react";
import type { Match, Prediction, AppSettings } from "@/lib/types";
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
        inputValues: {
          ...state.inputValues,
          [action.matchId]: { home: action.home, away: action.away },
        },
        dirtyIds: new Set([...state.dirtyIds, action.matchId]),
      };
    case "saved": {
      const newDirty = new Set(state.dirtyIds);
      for (const id of action.savedMatchIds) newDirty.delete(id);
      return {
        ...state,
        dirtyIds: newDirty,
        savedIds: new Set([...state.savedIds, ...action.savedMatchIds]),
      };
    }
  }
}

function buildInitialFormState(predictions: Prediction[]): FormState {
  const inputValues: Record<number, MatchInput> = {};
  for (const p of predictions) {
    inputValues[p.match_id] = {
      home: String(p.predicted_home_score),
      away: String(p.predicted_away_score),
    };
  }
  return {
    inputValues,
    savedIds: new Set(predictions.map((p) => p.match_id)),
    dirtyIds: new Set(),
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
  const filled = input !== undefined && input.home !== "" && input.away !== "";
  if (dirtyIds.has(match.id) && filled) return "dirty";
  if (savedIds.has(match.id)) return "saved";
  return "empty";
}

// Compact per-row number input (suppresses browser spinners)
const inputBase =
  "h-10 w-11 rounded-lg border text-center text-base font-black text-slate-950 " +
  "focus:outline-none [appearance:textfield] [-moz-appearance:textfield] " +
  "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function inputVariantCls(status: MatchStatus): string {
  if (status === "dirty") return "border-cup-500 bg-cup-50 focus:border-cup-500";
  if (status === "saved") return "border-pitch-700 bg-white focus:border-pitch-700";
  return "border-slate-200 bg-white focus:border-pitch-700";
}

/**
 * Compact tippekupon-style row for one match.
 * Heights are ~44–52 px per row to keep the list scannable on mobile.
 */
function MatchRow({
  match,
  prediction,
  input,
  status,
  onInputChange,
}: {
  match: Match;
  prediction: Prediction | undefined;
  input: MatchInput | undefined;
  status: MatchStatus;
  onInputChange: (matchId: number, home: string, away: string) => void;
}) {
  const isFinished = match.status === "finished";
  const isLocked = status === "locked";

  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5 last:border-b-0">
      {/* Match number + kickoff time */}
      <div className="w-9 shrink-0 text-center">
        <p className="text-xs font-black text-slate-500">#{match.match_no}</p>
        <p className="mt-0.5 text-[10px] font-semibold leading-none text-slate-400">
          {formatDanishTime(match.kickoff_at)}
        </p>
      </div>

      {/* Home / away team names (stacked, truncated) */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight text-slate-950">
          {match.home_team}
        </p>
        <p className="truncate text-sm font-bold leading-tight text-slate-950">
          {match.away_team}
        </p>
      </div>

      {/* Right area: result / locked prediction / editable inputs */}
      {isFinished ? (
        /* Finished: actual score + user's prediction + points badge */
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-black text-slate-950">
              {match.home_score_90}&ndash;{match.away_score_90}
            </p>
            {prediction && (
              <p className="text-[10px] font-semibold text-slate-400">
                bud: {prediction.predicted_home_score}&ndash;
                {prediction.predicted_away_score}
              </p>
            )}
          </div>
          {prediction ? (
            <span
              className={`w-8 rounded px-1 py-0.5 text-center text-xs font-black ${
                prediction.total_points === 3
                  ? "bg-cup-100 text-cup-500"
                  : prediction.total_points >= 1
                    ? "bg-pitch-50 text-pitch-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {prediction.total_points}p
            </span>
          ) : (
            <span className="w-8 rounded bg-slate-100 px-1 py-0.5 text-center text-xs font-black text-slate-300">
              —
            </span>
          )}
        </div>
      ) : isLocked ? (
        /* Locked: show saved prediction or dash */
        <div className="shrink-0 text-right">
          {prediction ? (
            <p className="text-sm font-black text-slate-700">
              {prediction.predicted_home_score}&ndash;
              {prediction.predicted_away_score}
            </p>
          ) : (
            <p className="text-sm font-black text-slate-300">—</p>
          )}
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Låst</p>
        </div>
      ) : (
        /* Editable: two number inputs */
        <div className="flex shrink-0 items-center gap-1">
          <input
            className={`${inputBase} ${inputVariantCls(status)}`}
            inputMode="numeric"
            min="0"
            onChange={(e) =>
              onInputChange(match.id, e.target.value, input?.away ?? "")
            }
            placeholder="0"
            step="1"
            type="number"
            value={input?.home ?? ""}
          />
          <span className="text-xs font-black text-slate-300">–</span>
          <input
            className={`${inputBase} ${inputVariantCls(status)}`}
            inputMode="numeric"
            min="0"
            onChange={(e) =>
              onInputChange(match.id, input?.home ?? "", e.target.value)
            }
            placeholder="0"
            step="1"
            type="number"
            value={input?.away ?? ""}
          />
        </div>
      )}
    </div>
  );
}

const initialBulkState: BulkPredictionState = {
  status: "idle",
  message: "",
  savedMatchIds: [],
};

export function MatchList({
  matches,
  predictions,
  settings,
}: {
  matches: Match[];
  predictions: Prediction[];
  settings: AppSettings | null;
}) {
  const [bulkState, formAction, isPending] = useActionState<
    BulkPredictionState,
    FormData
  >(bulkUpsertPredictionsAction, initialBulkState);

  const [formState, dispatch] = useReducer(
    formReducer,
    predictions,
    buildInitialFormState
  );

  const { inputValues, savedIds, dirtyIds } = formState;

  // Sync successful save into local form state
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

  // Collect dirty + fully-filled predictions to submit
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
    <div className="space-y-4">
      {/* Progress summary + save button (sticky top area) */}
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
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
            className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-50"
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
      </div>

      {/* Legend (hidden on mobile, shown sm+) */}
      <div className="hidden items-center justify-end gap-3 text-xs font-semibold text-slate-400 sm:flex">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-slate-200 bg-white" />
          Ikke udfyldt
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-pitch-700 bg-white" />
          Gemt
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-cup-500 bg-cup-50" />
          Ændret
        </span>
      </div>

      {/* Match list grouped by Danish date */}
      <div className="space-y-4">
        {grouped.map(([dateKey, dayMatches]) => (
          <section key={dateKey}>
            <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-pitch-700">
              {formatDanishDate(dayMatches[0].kickoff_at)}
            </h2>
            <div className="card overflow-hidden p-0">
              {dayMatches.map((match) => {
                const locked = isMatchLocked(match, settings);
                const prediction = predictions.find((p) => p.match_id === match.id);
                const input = inputValues[match.id];
                const status = getMatchStatus(
                  match,
                  input,
                  savedIds,
                  dirtyIds,
                  locked
                );
                return (
                  <MatchRow
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

      {/* Bottom save button (shown when there are unsaved changes) */}
      {dirtyPredictions.length > 0 && (
        <form action={formAction}>
          <input name="predictions" type="hidden" value={predictionsJson} />
          <button
            className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-50"
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
