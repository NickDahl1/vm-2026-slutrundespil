/**
 * Shared types for result-sync adapters.
 *
 * An "adapter" is a thin wrapper around a data source (API or mock file) that
 * returns a normalised list of finished match results. The sync script is
 * source-agnostic and only depends on this interface.
 */

export interface ExternalMatchResult {
  /**
   * Stable ID from the external data source.
   * Maps to matches.external_match_id in the database.
   * Used as the primary lookup key; fall back to matchNo if not set.
   */
  externalId: string;

  /** 90-minute home score (not extra time or penalties). */
  homeScore90: number;

  /** 90-minute away score (not extra time or penalties). */
  awayScore90: number;

  /**
   * True only when the match is definitively finished at 90 minutes.
   * Live matches, matches that went to extra time but aren't settled yet,
   * or postponed matches must return false.
   */
  isFinished: boolean;

  /**
   * Optional secondary lookup key.
   * Used when external_match_id is not populated in the database yet.
   * Matches the match_no column (1-indexed, 1–104 for VM 2026).
   */
  matchNo?: number;
}

export interface MatchResultAdapter {
  /** Fetch all available finished match results from the data source. */
  fetchResults(): Promise<ExternalMatchResult[]>;
}
