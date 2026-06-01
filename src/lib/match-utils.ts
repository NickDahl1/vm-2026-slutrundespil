/**
 * Pure helpers for phase-aware match logic.
 * Extracted so they can be unit-tested without any I/O.
 */

import type { Match, AppSettings } from "./types";

/**
 * Whether knockout-stage predictions are open.
 * Defaults to false when settings are unavailable.
 */
export function isKnockoutOpen(settings: AppSettings | null | undefined): boolean {
  return settings?.knockout_predictions_open ?? false;
}

/**
 * Whether a match is "relevant" for the current phase —
 * i.e. whether users are expected to have submitted (or should submit) a
 * prediction for it.
 *
 * Group-stage matches are always relevant.
 * Knockout-stage matches are only relevant once knockout predictions are open.
 */
export function isMatchRelevant(
  match: Pick<Match, "phase">,
  knockoutOpen: boolean
): boolean {
  if (match.phase === "group_stage") return true;
  return knockoutOpen;
}

/**
 * Returns the relevant match count for the current phase state.
 * Used to avoid requiring knockout predictions before knockout is open.
 */
export function relevantMatchCount(
  groupStageCount: number,
  knockoutStageCount: number,
  knockoutOpen: boolean
): number {
  return knockoutOpen ? groupStageCount + knockoutStageCount : groupStageCount;
}
