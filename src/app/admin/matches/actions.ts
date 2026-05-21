"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { calculateScore } from "@/lib/scoring";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalInt(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = parseInt(raw.trim(), 10);
  return isNaN(n) ? null : n;
}

function withError(msg: string): never {
  redirect(`/admin/matches?error=${encodeURIComponent(msg)}`);
}

function withMessage(msg: string): never {
  redirect(`/admin/matches?message=${encodeURIComponent(msg)}`);
}

async function recalculateForMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const { data: preds } = await supabase
    .from("match_predictions")
    .select("id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId);

  if (!preds?.length) return;

  await Promise.all(
    preds.map((pred) => {
      const pts = calculateScore({
        predictedHome: (pred as { predicted_home_score: number }).predicted_home_score,
        predictedAway: (pred as { predicted_away_score: number }).predicted_away_score,
        actualHome: homeScore,
        actualAway: awayScore
      });
      return supabase
        .from("match_predictions")
        .update(pts)
        .eq("id", (pred as { id: number }).id);
    })
  );
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const matchNo = readOptionalInt(formData, "match_no");
  const phase = readString(formData, "phase");
  const groupName = readString(formData, "group_name") || null;
  const homeTeam = readString(formData, "home_team");
  const awayTeam = readString(formData, "away_team");
  const kickoffAt = readString(formData, "kickoff_at");
  const homeScore = readOptionalInt(formData, "home_score_90");
  const awayScore = readOptionalInt(formData, "away_score_90");
  const status = readString(formData, "status");

  if (!matchNo || !homeTeam || !awayTeam || !kickoffAt || !phase || !status) {
    withError("Udfyld alle påkrævede felter.");
  }

  const { error } = await supabase.from("matches").insert({
    match_no: matchNo,
    phase,
    group_name: groupName,
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: kickoffAt,
    home_score_90: homeScore,
    away_score_90: awayScore,
    status
  });

  if (error) {
    if (error.code === "23505") withError(`Kampnummer ${matchNo} er allerede i brug.`);
    withError("Kampen kunne ikke oprettes. Prøv igen.");
  }

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  withMessage(`Kamp #${matchNo} er oprettet.`);
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldig kamp.");

  const matchNo = readOptionalInt(formData, "match_no");
  const phase = readString(formData, "phase");
  const groupName = readString(formData, "group_name") || null;
  const homeTeam = readString(formData, "home_team");
  const awayTeam = readString(formData, "away_team");
  const kickoffAt = readString(formData, "kickoff_at");
  const homeScore = readOptionalInt(formData, "home_score_90");
  const awayScore = readOptionalInt(formData, "away_score_90");
  const status = readString(formData, "status");

  if (!matchNo || !homeTeam || !awayTeam || !kickoffAt || !phase || !status) {
    withError("Udfyld alle påkrævede felter.");
  }

  // If the admin is explicitly saving scores, flag the match as manually corrected
  // so the nightly sync job does not silently overwrite their result.
  const manuallyCorrected =
    homeScore !== null && awayScore !== null ? true : undefined;

  const { error } = await supabase
    .from("matches")
    .update({
      match_no: matchNo,
      phase,
      group_name: groupName,
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_at: kickoffAt,
      home_score_90: homeScore,
      away_score_90: awayScore,
      status,
      ...(manuallyCorrected !== undefined ? { manually_corrected: manuallyCorrected } : {})
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") withError(`Kampnummer ${matchNo} er allerede i brug.`);
    withError("Kampen kunne ikke opdateres. Prøv igen.");
  }

  if (status === "finished" && homeScore !== null && awayScore !== null) {
    await recalculateForMatch(supabase, id, homeScore, awayScore);
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");
  }

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  withMessage(`Kamp #${matchNo} er opdateret.`);
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldig kamp.");

  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) withError("Kampen kunne ikke slettes. Prøv igen.");

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  withMessage("Kampen er slettet.");
}

export async function resetManuallyCorrectedAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldig kamp.");

  const { error } = await supabase
    .from("matches")
    .update({ manually_corrected: false })
    .eq("id", id);

  if (error) withError("Kunne ikke nulstille auto-sync-flaget. Prøv igen.");

  revalidatePath("/admin/matches");
  withMessage("Auto-sync er genaktiveret for denne kamp.");
}

export async function recalculateAllPointsAction(_formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("id, home_score_90, away_score_90")
    .eq("status", "finished")
    .not("home_score_90", "is", null)
    .not("away_score_90", "is", null);

  if (!finishedMatches?.length) {
    withMessage("Ingen færdige kampe med resultat fundet.");
  }

  await Promise.all(
    finishedMatches!.map((m) => {
      const match = m as { id: number; home_score_90: number; away_score_90: number };
      return recalculateForMatch(supabase, match.id, match.home_score_90, match.away_score_90);
    })
  );

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  withMessage(`Point genberegnet for ${finishedMatches!.length} færdig${finishedMatches!.length === 1 ? "" : "e"} kamp${finishedMatches!.length === 1 ? "" : "e"}.`);
}
