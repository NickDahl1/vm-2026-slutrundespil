"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { calculateStatementScore } from "@/lib/statement-scoring";

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
  redirect(`/admin/statements?error=${encodeURIComponent(msg)}`);
}

function withMessage(msg: string): never {
  redirect(`/admin/statements?message=${encodeURIComponent(msg)}`);
}

async function recalculateForStatement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  statementId: number,
  correctAnswer: string
): Promise<void> {
  const { data: preds } = await supabase
    .from("statement_predictions")
    .select("id, answer")
    .eq("statement_id", statementId);

  if (!preds?.length) return;

  await Promise.all(
    preds.map((pred) => {
      const points = calculateStatementScore({
        answer: (pred as { answer: string }).answer,
        correctAnswer,
        isResolved: true
      });
      return supabase
        .from("statement_predictions")
        .update({ points })
        .eq("id", (pred as { id: number }).id);
    })
  );
}

export async function createStatementAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const sortOrder = readOptionalInt(formData, "sort_order");
  const question = readString(formData, "question");
  const answerType = readString(formData, "answer_type");
  const rawOptions = readString(formData, "options");
  const options =
    rawOptions && answerType === "multiple_choice"
      ? rawOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

  if (!sortOrder || !question || !answerType) {
    withError("Udfyld alle påkrævede felter.");
  }

  const { error } = await supabase.from("statements").insert({
    sort_order: sortOrder,
    question,
    answer_type: answerType,
    options: options ? JSON.stringify(options) : null,
    points: 3
  });

  if (error) {
    if (error.code === "23514")
      withError("Sort_order skal være mellem 1 og 15, og points skal være 3.");
    withError("Udsagnet kunne ikke oprettes. Prøv igen.");
  }

  revalidatePath("/admin/statements");
  revalidatePath("/statements");
  withMessage("Udsagnet er oprettet.");
}

export async function updateStatementAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldigt udsagn.");

  const sortOrder = readOptionalInt(formData, "sort_order");
  const question = readString(formData, "question");
  const answerType = readString(formData, "answer_type");
  const rawOptions = readString(formData, "options");
  const options =
    rawOptions && answerType === "multiple_choice"
      ? rawOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

  if (!sortOrder || !question || !answerType) {
    withError("Udfyld alle påkrævede felter.");
  }

  const { error } = await supabase
    .from("statements")
    .update({
      sort_order: sortOrder,
      question,
      answer_type: answerType,
      options: options ? JSON.stringify(options) : null
    })
    .eq("id", id);

  if (error) withError("Udsagnet kunne ikke opdateres. Prøv igen.");

  revalidatePath("/admin/statements");
  revalidatePath("/statements");
  withMessage("Udsagnet er opdateret.");
}

export async function deleteStatementAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldigt udsagn.");

  const { error } = await supabase.from("statements").delete().eq("id", id);
  if (error) withError("Udsagnet kunne ikke slettes. Prøv igen.");

  revalidatePath("/admin/statements");
  revalidatePath("/statements");
  withMessage("Udsagnet er slettet.");
}

export async function resolveStatementAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = readOptionalInt(formData, "id");
  if (!id) withError("Ugyldigt udsagn.");

  const correctAnswer = readString(formData, "correct_answer");
  if (!correctAnswer) withError("Angiv det korrekte svar.");

  const { error } = await supabase
    .from("statements")
    .update({
      is_resolved: true,
      correct_answer: correctAnswer,
      resolved_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) withError("Udsagnet kunne ikke afgøres. Prøv igen.");

  await recalculateForStatement(supabase, id, correctAnswer);

  revalidatePath("/admin/statements");
  revalidatePath("/statements");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  withMessage("Udsagnet er afgjort og point er beregnet.");
}

export async function recalculateAllStatementPointsAction(
  _formData: FormData
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: resolved } = await supabase
    .from("statements")
    .select("id, correct_answer")
    .eq("is_resolved", true)
    .not("correct_answer", "is", null);

  if (!resolved?.length) {
    withMessage("Ingen afgjorte udsagn fundet.");
  }

  await Promise.all(
    resolved!.map((s) => {
      const st = s as { id: number; correct_answer: string };
      return recalculateForStatement(supabase, st.id, st.correct_answer);
    })
  );

  revalidatePath("/statements");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  withMessage(
    `Point genberegnet for ${resolved!.length} afgjort${resolved!.length === 1 ? "" : "e"} udsagn.`
  );
}
