"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { copenhagenToUTC } from "@/lib/date-format";
import { requireAdmin } from "@/lib/auth";

export type SettingsState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireAdmin();
  const supabase = await createClient();

  const settingsId = formData.get("settings_id") as string;
  if (!settingsId) {
    return { status: "error", message: "Indstillings-ID mangler." };
  }

  const groupRaw = (formData.get("group_stage_lock_at") as string) ?? "";
  const knockoutRaw = (formData.get("knockout_stage_lock_at") as string) ?? "";
  const gameLocked = formData.get("game_locked") === "on";
  const knockoutPredictionsOpen = formData.get("knockout_predictions_open") === "on";

  // Validate dates when provided
  if (groupRaw && isNaN(new Date(groupRaw).getTime())) {
    return {
      status: "error",
      message: "Grundspilsdeadline er en ugyldig dato. Brug formatet YYYY-MM-DDTHH:MM."
    };
  }
  if (knockoutRaw && isNaN(new Date(knockoutRaw).getTime())) {
    return {
      status: "error",
      message: "Slutspilsdeadline er en ugyldig dato. Brug formatet YYYY-MM-DDTHH:MM."
    };
  }

  const groupUTC = copenhagenToUTC(groupRaw);
  const knockoutUTC = copenhagenToUTC(knockoutRaw);

  const { error } = await supabase
    .from("app_settings")
    .update({
      group_stage_lock_at: groupUTC,
      knockout_stage_lock_at: knockoutUTC,
      game_locked: gameLocked,
      knockout_predictions_open: knockoutPredictionsOpen,
    })
    .eq("id", settingsId);

  if (error) {
    return {
      status: "error",
      message: `Kunne ikke gemme: ${error.message}`
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  revalidatePath("/statements");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  return { status: "success", message: "Indstillinger gemt." };
}
