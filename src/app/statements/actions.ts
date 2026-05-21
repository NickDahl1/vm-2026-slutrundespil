"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type StatementState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function upsertStatementPredictionAction(
  _prevState: StatementState,
  formData: FormData
): Promise<StatementState> {
  let userId: string;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch {
    return { status: "error", message: "Log ind for at svare." };
  }

  const rawId = formData.get("statement_id");
  const statementId =
    typeof rawId === "string" ? parseInt(rawId, 10) : NaN;
  if (isNaN(statementId)) {
    return { status: "error", message: "Ugyldigt udsagn." };
  }

  const rawAnswer = formData.get("answer");
  const answer =
    typeof rawAnswer === "string" ? rawAnswer.trim() : "";
  if (!answer) {
    return { status: "error", message: "Svar mangler." };
  }

  const supabase = await createClient();

  const [{ data: statement }, { data: settings }] = await Promise.all([
    supabase
      .from("statements")
      .select("id, is_resolved")
      .eq("id", statementId)
      .single(),
    supabase.from("app_settings").select("*").single()
  ]);

  if (!statement) return { status: "error", message: "Udsagnet findes ikke." };
  if (statement.is_resolved)
    return { status: "error", message: "Udsagnet er allerede afgjort." };

  if (settings?.game_locked)
    return { status: "error", message: "Spillet er låst." };
  if (
    settings?.group_stage_lock_at &&
    new Date(settings.group_stage_lock_at) <= new Date()
  ) {
    return { status: "error", message: "Fristen for udsagn er passeret." };
  }

  const { error } = await supabase
    .from("statement_predictions")
    .upsert(
      { user_id: userId, statement_id: statementId, answer, points: 0 },
      { onConflict: "user_id,statement_id" }
    );

  if (error) return { status: "error", message: "Svaret kunne ikke gemmes. Prøv igen." };

  return { status: "success", message: "Svar gemt." };
}

// ── Bulk upsert ──────────────────────────────────────────────────────────────

export type BulkStatementState = {
  status: "idle" | "success" | "error";
  message: string;
  savedStatementIds: number[];
};

type RawAnswer = { statement_id: unknown; answer: unknown };

export async function bulkUpsertStatementPredictionsAction(
  _prevState: BulkStatementState,
  formData: FormData
): Promise<BulkStatementState> {
  let userId: string;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch {
    return { status: "error", message: "Log ind for at svare.", savedStatementIds: [] };
  }

  const rawAnswers = formData.get("answers");
  if (typeof rawAnswers !== "string") {
    return { status: "error", message: "Ingen svar at gemme.", savedStatementIds: [] };
  }

  let parsed: RawAnswer[];
  try {
    const json = JSON.parse(rawAnswers);
    if (!Array.isArray(json)) throw new Error("not array");
    parsed = json as RawAnswer[];
  } catch {
    return { status: "error", message: "Ugyldigt format.", savedStatementIds: [] };
  }

  const answers = parsed
    .filter(
      (a) =>
        typeof a.statement_id === "number" &&
        !isNaN(a.statement_id) &&
        typeof a.answer === "string" &&
        (a.answer as string).trim().length > 0
    )
    .map((a) => ({
      statement_id: a.statement_id as number,
      answer: (a.answer as string).trim(),
    }));

  if (answers.length === 0) {
    return { status: "error", message: "Ingen gyldige svar at gemme.", savedStatementIds: [] };
  }

  const supabase = await createClient();

  const { data: settings } = await supabase.from("app_settings").select("*").single();
  if (settings?.game_locked) {
    return { status: "error", message: "Spillet er låst.", savedStatementIds: [] };
  }
  if (
    settings?.group_stage_lock_at &&
    new Date(settings.group_stage_lock_at) <= new Date()
  ) {
    return { status: "error", message: "Fristen for udsagn er passeret.", savedStatementIds: [] };
  }

  // Filter out already-resolved statements
  const ids = answers.map((a) => a.statement_id);
  const { data: stmts } = await supabase
    .from("statements")
    .select("id, is_resolved")
    .in("id", ids);

  const resolvedSet = new Set(
    ((stmts ?? []) as { id: number; is_resolved: boolean }[])
      .filter((s) => s.is_resolved)
      .map((s) => s.id)
  );

  const valid = answers.filter((a) => !resolvedSet.has(a.statement_id));
  if (valid.length === 0) {
    return {
      status: "error",
      message: "Alle valgte udsagn er allerede afgjort.",
      savedStatementIds: [],
    };
  }

  const rows = valid.map((a) => ({
    user_id: userId,
    statement_id: a.statement_id,
    answer: a.answer,
    points: 0,
  }));

  const { error } = await supabase
    .from("statement_predictions")
    .upsert(rows, { onConflict: "user_id,statement_id" });

  if (error) {
    return {
      status: "error",
      message: "Svarene kunne ikke gemmes. Prøv igen.",
      savedStatementIds: [],
    };
  }

  return {
    status: "success",
    message: `${valid.length} svar gemt.`,
    savedStatementIds: valid.map((a) => a.statement_id),
  };
}
