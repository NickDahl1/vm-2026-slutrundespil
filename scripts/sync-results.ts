#!/usr/bin/env npx tsx
/**
 * sync-results.ts
 *
 * Syncs VM 2026 match results from an external data source into Supabase.
 * Designed to be run as a nightly GitHub Actions cron job (08:00 Danish time).
 *
 * ─── ADAPTER SELECTION ───────────────────────────────────────────────────────
 * USE_MOCK=true          → MockAdapter (reads scripts/mock-results.json)
 * FOOTBALL_API_KEY=<key> → FootballDataOrgAdapter (not yet implemented)
 * (neither)             → MockAdapter with a warning
 *
 * ─── SAFETY RULES ────────────────────────────────────────────────────────────
 * 1. Never overwrites a match with manually_corrected = true.
 *    Admin-corrected results are always considered ground truth.
 *    Admins can re-enable auto-sync via the "Tillad auto-sync" button.
 *
 * 2. Only updates matches whose status is "scheduled", "live", or "finished".
 *    Postponed / cancelled matches are skipped.
 *
 * 3. Only proceeds when isFinished = true in the external data.
 *    Partial/live scores are ignored.
 *
 * 4. Validates that both scores are non-negative integers before writing.
 *
 * 5. If a match is already finished with the same scores, skips the update
 *    (idempotent — safe to run multiple times per day).
 *
 * 6. All errors per match are logged but do not abort the rest of the run
 *    (fail-safe). A non-zero exit code is only returned if the adapter itself
 *    fails to fetch results.
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 * # Dry-run with mock data (no Supabase needed):
 *   DRY_RUN=true USE_MOCK=true npx tsx scripts/sync-results.ts
 *
 * # Real run with mock data:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   USE_MOCK=true \
 *   npx tsx scripts/sync-results.ts
 *
 * # Real run with football-data.org (once adapter is implemented):
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   FOOTBALL_API_KEY=abc123 \
 *   npx tsx scripts/sync-results.ts
 */

import { createClient } from "@supabase/supabase-js";
import { calculateScore } from "../src/lib/scoring.js";
import { MockAdapter } from "./adapters/mock.js";
import { FootballDataOrgAdapter } from "./adapters/football-data.js";
import type { MatchResultAdapter, ExternalMatchResult } from "./adapters/types.js";

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Minimal untyped DB client interface for the sync script.
 * The script uses the service-role createClient without a generated DB schema
 * type, so the generic SupabaseClient infers table rows as `never`.
 * Casting once here avoids noisy per-call assertions throughout the script.
 */
type DbClient = { from: (table: string) => ReturnType<typeof Object.create> };

type MatchRow = {
  id: number;
  match_no: number;
  external_match_id: string | null;
  home_score_90: number | null;
  away_score_90: number | null;
  status: string;
  manually_corrected: boolean;
};

type SyncStats = {
  updated: number;
  skippedManuallyCorrected: number;
  skippedNotFinished: number;
  skippedAlreadySynced: number;
  skippedNotFound: number;
  skippedInvalidScore: number;
  errors: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidScore(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function log(msg: string) {
  // Prefix with timestamp so GitHub Actions logs are easy to scan.
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[${new Date().toISOString()}] ⚠  ${msg}`);
}

function err(msg: string) {
  console.error(`[${new Date().toISOString()}] ✗  ${msg}`);
}

// ── Scoring recalculation ──────────────────────────────────────────────────

async function recalculatePointsForMatch(
  supabase: DbClient,
  matchId: number,
  homeScore: number,
  awayScore: number,
  dryRun: boolean
): Promise<void> {
  type PredRow = { id: number; predicted_home_score: number; predicted_away_score: number };

  const { data: predsRaw, error } = await supabase
    .from("match_predictions")
    .select("id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId);

  if (error) throw new Error(`Failed to fetch predictions: ${error.message}`);
  const preds = (predsRaw ?? []) as PredRow[];
  if (!preds.length) return;

  if (dryRun) {
    log(`  [dry-run] would recalculate points for ${preds.length} prediction(s)`);
    return;
  }

  const updates = preds.map((pred: PredRow) => {
    const pts = calculateScore({
      predictedHome: pred.predicted_home_score,
      predictedAway: pred.predicted_away_score,
      actualHome: homeScore,
      actualAway: awayScore,
    });
    return supabase.from("match_predictions").update(pts).eq("id", pred.id);
  });

  const results = await Promise.allSettled(updates);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    throw new Error(`${failed.length} prediction update(s) failed`);
  }
}

// ── Main sync logic ────────────────────────────────────────────────────────

async function syncResults(
  supabase: DbClient,
  results: ExternalMatchResult[],
  dryRun: boolean
): Promise<SyncStats> {
  const stats: SyncStats = {
    updated: 0,
    skippedManuallyCorrected: 0,
    skippedNotFinished: 0,
    skippedAlreadySynced: 0,
    skippedNotFound: 0,
    skippedInvalidScore: 0,
    errors: 0,
  };

  // Load all matches once; we'll look them up in-memory.
  const { data: allMatches, error: fetchErr } = await supabase
    .from("matches")
    .select("id, match_no, external_match_id, home_score_90, away_score_90, status, manually_corrected");

  if (fetchErr) {
    throw new Error(`Failed to load matches from database: ${fetchErr.message}`);
  }

  const matches = (allMatches ?? []) as MatchRow[];

  // Build lookup maps for fast access.
  const byExternalId = new Map<string, MatchRow>();
  const byMatchNo = new Map<number, MatchRow>();
  for (const m of matches) {
    if (m.external_match_id) byExternalId.set(m.external_match_id, m);
    byMatchNo.set(m.match_no, m);
  }

  for (const result of results) {
    const label = `external_id=${result.externalId}${result.matchNo ? ` (match_no=${result.matchNo})` : ""}`;

    // ── 1. Validate external data ────────────────────────────────────────
    if (!result.isFinished) {
      log(`  SKIP  ${label} — not finished yet`);
      stats.skippedNotFinished++;
      continue;
    }

    if (!isValidScore(result.homeScore90) || !isValidScore(result.awayScore90)) {
      warn(`SKIP  ${label} — invalid score (${result.homeScore90}:${result.awayScore90})`);
      stats.skippedInvalidScore++;
      continue;
    }

    // ── 2. Find matching DB row ──────────────────────────────────────────
    let dbMatch: MatchRow | undefined =
      byExternalId.get(result.externalId) ??
      (result.matchNo !== undefined ? byMatchNo.get(result.matchNo) : undefined);

    if (!dbMatch) {
      warn(`SKIP  ${label} — no matching match found in database`);
      stats.skippedNotFound++;
      continue;
    }

    const matchLabel = `#${dbMatch.match_no} (db_id=${dbMatch.id})`;

    // ── 3. Safety checks ─────────────────────────────────────────────────
    if (dbMatch.manually_corrected) {
      log(`  SKIP  ${matchLabel} — manually_corrected flag is set (admin override)`);
      stats.skippedManuallyCorrected++;
      continue;
    }

    if (dbMatch.status === "postponed" || dbMatch.status === "cancelled") {
      log(`  SKIP  ${matchLabel} — status is ${dbMatch.status}, not touching`);
      stats.skippedNotFinished++;
      continue;
    }

    // ── 4. Idempotency check ─────────────────────────────────────────────
    if (
      dbMatch.status === "finished" &&
      dbMatch.home_score_90 === result.homeScore90 &&
      dbMatch.away_score_90 === result.awayScore90
    ) {
      log(`  SKIP  ${matchLabel} — already synced (${result.homeScore90}:${result.awayScore90})`);
      stats.skippedAlreadySynced++;
      continue;
    }

    // ── 5. Update match result ───────────────────────────────────────────
    log(
      `  UPDATE ${matchLabel} — ` +
        `${result.homeScore90}:${result.awayScore90} ` +
        `(was: ${dbMatch.home_score_90 ?? "?"}:${dbMatch.away_score_90 ?? "?"})`
    );

    try {
      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from("matches")
          .update({
            home_score_90: result.homeScore90,
            away_score_90: result.awayScore90,
            status: "finished",
          })
          .eq("id", dbMatch.id);

        if (updateErr) throw new Error(updateErr.message);
      }

      // ── 6. Recalculate predictions ─────────────────────────────────────
      await recalculatePointsForMatch(
        supabase,
        dbMatch.id,
        result.homeScore90,
        result.awayScore90,
        dryRun
      );

      stats.updated++;
    } catch (e) {
      err(`ERROR  ${matchLabel} — ${e instanceof Error ? e.message : String(e)}`);
      stats.errors++;
    }
  }

  return stats;
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main() {
  log("=== VM 2026 result sync started ===");

  // dryRun is `let` — the mock path may upgrade it to true (see below).
  // The "DRY_RUN set" log is deferred until after adapter selection.
  let dryRun = process.env.DRY_RUN === "true";

  // ── Select adapter ───────────────────────────────────────────────────────
  let adapter: MatchResultAdapter;

  const footballApiKey = process.env.FOOTBALL_API_KEY;
  const useMock = process.env.USE_MOCK === "true";

  if (footballApiKey && !useMock) {
    // ── Real API path ──────────────────────────────────────────────────────
    log("Adapter: FootballDataOrgAdapter");
    adapter = new FootballDataOrgAdapter(footballApiKey);
  } else if (useMock) {
    // ── Explicit mock path ─────────────────────────────────────────────────
    // MockAdapter is only allowed when USE_MOCK=true is set explicitly.
    // To prevent test data reaching production by accident, DRY_RUN defaults
    // to true when running in mock mode — unless DRY_RUN=false is set explicitly.
    if (process.env.DRY_RUN !== "false") {
      dryRun = true;
      warn(
        "USE_MOCK=true: DRY_RUN forced to true. " +
          "Mock data will NOT be written to the database. " +
          "Set DRY_RUN=false explicitly if you intend to write mock data."
      );
    }
    log("Adapter: MockAdapter (USE_MOCK=true)");
    adapter = new MockAdapter();
  } else {
    // ── No adapter available — exit cleanly ───────────────────────────────
    // This is the expected state before the tournament starts and before
    // FOOTBALL_API_KEY is configured in GitHub Secrets.
    log("No real API key configured. Exiting without changes.");
    log("To enable automatic result sync: set FOOTBALL_API_KEY in GitHub Secrets.");
    log("To run a local dry-run with mock data: USE_MOCK=true npm run sync:results");
    process.exit(0);
  }

  if (dryRun) warn("DRY_RUN=true — no database writes will be made");

  // ── Fetch results ────────────────────────────────────────────────────────
  let results: ExternalMatchResult[];
  try {
    results = await adapter.fetchResults();
    log(`Fetched ${results.length} result(s) from adapter`);
  } catch (e) {
    err(`Fatal: adapter failed to fetch results — ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // ── Connect to Supabase ──────────────────────────────────────────────────
  if (dryRun) {
    log("[dry-run] Skipping Supabase connection — printing stats only");
    // Still run the sync logic so logs show what WOULD be done, but without DB.
    // We need a no-op Supabase client for dry-run. Use a dummy URL/key that
    // won't be called (we guard every write with !dryRun).
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    if (dryRun) {
      warn("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — dry-run only, skipping DB sync");
      log("=== Dry-run complete (no DB) ===");
      return;
    }
    err("Fatal: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  // Service role key bypasses RLS — never use in browser/frontend.
  // Cast to DbClient (see type alias above) to avoid per-call type assertions.
  const supabase: DbClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  }) as DbClient;

  // ── Run sync ─────────────────────────────────────────────────────────────
  let stats: SyncStats;
  try {
    stats = await syncResults(supabase, results, dryRun);
  } catch (e) {
    err(`Fatal: sync failed — ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  log("=== Sync complete ===");
  log(`  Updated:                  ${stats.updated}`);
  log(`  Skipped (already synced): ${stats.skippedAlreadySynced}`);
  log(`  Skipped (manual override):${stats.skippedManuallyCorrected}`);
  log(`  Skipped (not finished):   ${stats.skippedNotFinished}`);
  log(`  Skipped (not found in DB):${stats.skippedNotFound}`);
  log(`  Skipped (invalid score):  ${stats.skippedInvalidScore}`);
  log(`  Errors:                   ${stats.errors}`);

  if (stats.errors > 0) {
    err(`${stats.errors} error(s) occurred during sync`);
    process.exit(1);
  }
}

main().catch((e) => {
  err(`Unhandled error: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
