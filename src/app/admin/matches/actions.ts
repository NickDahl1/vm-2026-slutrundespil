"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

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
      status
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") withError(`Kampnummer ${matchNo} er allerede i brug.`);
    withError("Kampen kunne ikke opdateres. Prøv igen.");
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
