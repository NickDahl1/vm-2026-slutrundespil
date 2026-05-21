"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

export type PredictionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type BulkPredictionState = {
  status: "idle" | "success" | "error";
  message: string;
  savedMatchIds: number[];
};

type BulkPrediction = {
  match_id: number;
  home: number;
  away: number;
};

export async function bulkUpsertPredictionsAction(
  _prev: BulkPredictionState,
  formData: FormData
): Promise<BulkPredictionState> {
  const raw = formData.get("predictions");
  if (typeof raw !== "string" || !raw) {
    return { status: "error", message: "Ingen bud at gemme.", savedMatchIds: [] };
  }

  let predictions: BulkPrediction[];
  try {
    predictions = JSON.parse(raw) as BulkPrediction[];
  } catch {
    return { status: "error", message: "Ugyldige data — prøv igen.", savedMatchIds: [] };
  }

  if (!Array.isArray(predictions) || predictions.length === 0) {
    return { status: "error", message: "Ingen bud at gemme.", savedMatchIds: [] };
  }

  for (const p of predictions) {
    if (
      typeof p.match_id !== "number" ||
      typeof p.home !== "number" ||
      typeof p.away !== "number" ||
      isNaN(p.match_id) ||
      isNaN(p.home) ||
      isNaN(p.away)
    ) {
      return { status: "error", message: "Udfyld alle scorer med gyldige tal.", savedMatchIds: [] };
    }
    if (p.home < 0 || p.away < 0) {
      return { status: "error", message: "Scorer må ikke være negative.", savedMatchIds: [] };
    }
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Du skal være logget ind.", savedMatchIds: [] };
  }

  const { data: settingsData } = await supabase
    .from("app_settings")
    .select("game_locked, group_stage_lock_at, knockout_stage_lock_at")
    .single();

  const settings = settingsData as AppSettings | null;
  if (settings?.game_locked) {
    return { status: "error", message: "Spillet er låst af admin.", savedMatchIds: [] };
  }

  const matchIds = predictions.map((p) => p.match_id);
  const { data: matchData } = await supabase
    .from("matches")
    .select("id, phase")
    .in("id", matchIds);

  const phaseMap: Record<number, string> = {};
  for (const m of matchData ?? []) {
    phaseMap[(m as { id: number; phase: string }).id] = (m as { id: number; phase: string }).phase;
  }

  const now = new Date();
  for (const p of predictions) {
    const phase = phaseMap[p.match_id];
    if (phase === "group_stage" && settings?.group_stage_lock_at) {
      if (new Date(settings.group_stage_lock_at) <= now) {
        return {
          status: "error",
          message: "Fristen for grundspilsbud er passeret.",
          savedMatchIds: []
        };
      }
    }
    if (phase === "knockout_stage" && settings?.knockout_stage_lock_at) {
      if (new Date(settings.knockout_stage_lock_at) <= now) {
        return {
          status: "error",
          message: "Fristen for slutspilsbud er passeret.",
          savedMatchIds: []
        };
      }
    }
  }

  const upserts = predictions.map((p) => ({
    user_id: user.id,
    match_id: p.match_id,
    predicted_home_score: p.home,
    predicted_away_score: p.away
  }));

  const { error } = await supabase
    .from("match_predictions")
    .upsert(upserts, { onConflict: "user_id,match_id" });

  if (error) {
    return {
      status: "error",
      message: "Buddet kunne ikke gemmes. Prøv igen.",
      savedMatchIds: []
    };
  }

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    status: "success",
    message: `${predictions.length} kampbud gemt.`,
    savedMatchIds: matchIds
  };
}
