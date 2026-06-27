/**
 * Pure helpers for phase-aware match logic.
 * Extracted so they can be unit-tested without any I/O.
 */

import type { Match, AppSettings } from "./types";

/**
 * Whether knockout-stage predictions are open (global settings flag).
 * Still used as a convenience helper in a few places.
 * Defaults to false when settings are unavailable.
 */
export function isKnockoutOpen(settings: AppSettings | null | undefined): boolean {
  return settings?.knockout_predictions_open ?? false;
}

/**
 * Whether a match should be shown in the main prediction list.
 * Uses the per-match `predictions_open` flag.
 * Group-stage matches are back-filled to predictions_open = true in the DB.
 */
export function isMatchRelevant(
  match: Pick<Match, "predictions_open">,
): boolean {
  return match.predictions_open;
}

/**
 * Returns the relevant match count for the current phase state.
 * Kept for reference; callers should prefer counting openMatchIds directly.
 */
export function relevantMatchCount(
  groupStageCount: number,
  knockoutStageCount: number,
  knockoutOpen: boolean
): number {
  return knockoutOpen ? groupStageCount + knockoutStageCount : groupStageCount;
}
