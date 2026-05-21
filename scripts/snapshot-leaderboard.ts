#!/usr/bin/env npx tsx
/**
 * snapshot-leaderboard.ts
 *
 * Reads the current leaderboard_view and inserts a snapshot row for each
 * participant into leaderboard_snapshots. Designed to run as a daily GitHub
 * Actions cron job at 07:00 UTC.
 *
 * ─── SAFETY RULES ────────────────────────────────────────────────────────────
 * 1. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — exits cleanly if
 *    either is missing (no writes, no crash).
 * 2. Service role key is never logged or exposed in any output.
 * 3. If the leaderboard is empty (no finished matches yet), the script exits
 *    cleanly with a message — no snapshot is written.
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 * # Dry run (no database writes):
 *   DRY_RUN=true SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/snapshot-leaderboard.ts
 *
 * # Real run:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/snapshot-leaderboard.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.env.DRY_RUN === "true";

// ── Pre-flight checks ─────────────────────────────────────────────────────────

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    "[snapshot] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Exiting without changes."
  );
  process.exit(0);
}

if (dryRun) {
  console.log("[snapshot] DRY_RUN=true — no database writes will occur.");
}

// ── Client ────────────────────────────────────────────────────────────────────

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  rank: number;
  total_points: number;
  match_points: number;
  statement_points: number;
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[snapshot] Reading leaderboard_view...");

  const { data, error } = await supabase
    .from("leaderboard_view")
    .select("user_id, display_name, rank, total_points, match_points, statement_points")
    .order("rank", { ascending: true });

  if (error) {
    console.error("[snapshot] Failed to read leaderboard_view:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as LeaderboardRow[];

  if (rows.length === 0) {
    console.log("[snapshot] Leaderboard is empty — no snapshot written.");
    process.exit(0);
  }

  console.log(`[snapshot] ${rows.length} participants found.`);

  const now = new Date().toISOString();
  const insertRows = rows.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    rank: r.rank,
    total_points: r.total_points,
    match_points: r.match_points,
    statement_points: r.statement_points,
    snapshotted_at: now,
  }));

  if (dryRun) {
    console.log("[snapshot] DRY_RUN — would insert rows:");
    for (const row of insertRows) {
      console.log(
        `  #${row.rank} ${row.display_name}: ${row.total_points} pts (${row.match_points}K + ${row.statement_points}U)`
      );
    }
    console.log("[snapshot] Done (dry run).");
    process.exit(0);
  }

  const { error: insertError } = await supabase
    .from("leaderboard_snapshots")
    .insert(insertRows);

  if (insertError) {
    console.error("[snapshot] Failed to insert snapshots:", insertError.message);
    process.exit(1);
  }

  console.log(`[snapshot] ✓ Inserted ${insertRows.length} snapshot rows at ${now}.`);
}

main().catch((err: unknown) => {
  console.error("[snapshot] Unexpected error:", err);
  process.exit(1);
});
