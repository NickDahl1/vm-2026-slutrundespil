"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function withMessage(msg: string): never {
  redirect(`/admin/release?message=${encodeURIComponent(msg)}`);
}

function withError(msg: string): never {
  redirect(`/admin/release?error=${encodeURIComponent(msg)}`);
}

/**
 * Nulstil alle kampresultater.
 * Sætter home_score_90 = null, away_score_90 = null,
 * status = 'scheduled', manually_corrected = false for alle kampe.
 */
export async function resetAllMatchResultsAction(_formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("matches")
    .update({
      home_score_90: null,
      away_score_90: null,
      status: "scheduled",
      manually_corrected: false,
    })
    .gte("id", 1);

  if (error) withError(`Nulstilling af kampresultater fejlede: ${error.message}`);

  revalidatePath("/admin/release");
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  withMessage("Alle kampresultater er nulstillet (status = planlagt).");
}

/**
 * Nulstil alle kamp-point på bud.
 * Sætter points_home_score/away_score/outcome/total = 0 for alle match_predictions.
 */
export async function resetAllMatchPointsAction(_formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("match_predictions")
    .update({
      points_home_score: 0,
      points_away_score: 0,
      points_outcome: 0,
      total_points: 0,
    })
    .gte("id", 1);

  if (error) withError(`Nulstilling af kamp-point fejlede: ${error.message}`);

  revalidatePath("/admin/release");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  withMessage("Alle kamp-point er nulstillet til 0.");
}

/**
 * Slet alle kampbud.
 * Kræver bekræftelsestekst "SLET KAMPBUD".
 */
export async function deleteAllPredictionsAction(formData: FormData) {
  await requireAdmin();

  const confirm = formData.get("confirm");
  if (confirm !== "SLET KAMPBUD") {
    withError("Forkert bekræftelsestekst — skriv nøjagtigt: SLET KAMPBUD");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("match_predictions")
    .delete()
    .gte("id", 1);

  if (error) withError(`Sletning af kampbud fejlede: ${error.message}`);

  revalidatePath("/admin/release");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  withMessage("Alle kampbud er slettet.");
}

/**
 * Slet alle udsagnssvar.
 * Kræver bekræftelsestekst "SLET SVAR".
 */
export async function deleteAllStatementPredictionsAction(formData: FormData) {
  await requireAdmin();

  const confirm = formData.get("confirm");
  if (confirm !== "SLET SVAR") {
    withError("Forkert bekræftelsestekst — skriv nøjagtigt: SLET SVAR");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("statement_predictions")
    .delete()
    .gte("id", 1);

  if (error) withError(`Sletning af udsagnssvar fejlede: ${error.message}`);

  revalidatePath("/admin/release");
  revalidatePath("/statements");
  withMessage("Alle udsagnssvar er slettet.");
}

/**
 * Nulstil afgørelsesstatus på alle udsagn.
 * Sætter correct_answer = null, is_resolved = false, resolved_at = null.
 */
export async function resetAllStatementsAction(_formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("statements")
    .update({
      correct_answer: null,
      is_resolved: false,
      resolved_at: null,
    })
    .gte("id", 1);

  if (error) withError(`Nulstilling af udsagn fejlede: ${error.message}`);

  revalidatePath("/admin/release");
  revalidatePath("/statements");
  revalidatePath("/admin/statements");
  withMessage("Alle udsagns afgørelsesstatus er nulstillet.");
}
