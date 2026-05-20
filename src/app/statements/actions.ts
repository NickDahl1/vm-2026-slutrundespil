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
