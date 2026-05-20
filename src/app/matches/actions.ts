"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

export type PredictionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function upsertPredictionAction(
  _prevState: PredictionState,
  formData: FormData
): Promise<PredictionState> {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Du skal være logget ind." };
  }

  const matchIdRaw = formData.get("match_id");
  const homeRaw = formData.get("predicted_home_score");
  const awayRaw = formData.get("predicted_away_score");

  const matchId = typeof matchIdRaw === "string" ? parseInt(matchIdRaw, 10) : NaN;
  const homeScore = typeof homeRaw === "string" ? parseInt(homeRaw, 10) : NaN;
  const awayScore = typeof awayRaw === "string" ? parseInt(awayRaw, 10) : NaN;

  if (isNaN(matchId) || isNaN(homeScore) || isNaN(awayScore)) {
    return { status: "error", message: "Udfyld begge scorer med gyldige tal." };
  }

  if (homeScore < 0 || awayScore < 0) {
    return { status: "error", message: "Scorer må ikke være negative." };
  }

  const { data: settingsData } = await supabase
    .from("app_settings")
    .select("game_locked, group_stage_lock_at, knockout_stage_lock_at")
    .single();

  const settings = settingsData as AppSettings | null;

  if (settings?.game_locked) {
    return { status: "error", message: "Spillet er låst af admin." };
  }

  const { data: matchData } = await supabase
    .from("matches")
    .select("phase")
    .eq("id", matchId)
    .single();

  if (!matchData) {
    return { status: "error", message: "Kampen findes ikke." };
  }

  const now = new Date();

  if (matchData.phase === "group_stage" && settings?.group_stage_lock_at) {
    if (new Date(settings.group_stage_lock_at) <= now) {
      return { status: "error", message: "Fristen for grundspilsbud er passeret." };
    }
  }

  if (matchData.phase === "knockout_stage" && settings?.knockout_stage_lock_at) {
    if (new Date(settings.knockout_stage_lock_at) <= now) {
      return { status: "error", message: "Fristen for slutspilsbud er passeret." };
    }
  }

  const { error } = await supabase.from("match_predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    return { status: "error", message: "Buddet kunne ikke gemmes. Prøv igen." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return { status: "success", message: "Bud gemt." };
}
