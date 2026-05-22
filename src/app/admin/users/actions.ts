"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withError(msg: string): never {
  redirect(`/admin/users?error=${encodeURIComponent(msg)}`);
}

function withMessage(msg: string): never {
  redirect(`/admin/users?message=${encodeURIComponent(msg)}`);
}

export async function updateUserAction(formData: FormData) {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const id = readString(formData, "id");
  const displayName = readString(formData, "display_name");
  const isAdmin = formData.get("is_admin") === "on";

  if (!id) withError("Ugyldig bruger.");
  if (displayName.length < 2 || displayName.length > 40) {
    withError("Display name skal være mellem 2 og 40 tegn.");
  }
  if (id === user.id && !isAdmin) {
    withError("Du kan ikke fjerne din egen admin-adgang her.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, is_admin: isAdmin })
    .eq("id", id);

  if (error) withError("Brugeren kunne ikke opdateres. Prøv igen.");

  revalidatePath("/admin/users");
  revalidatePath("/leaderboard");
  revalidatePath("/predictions");
  withMessage("Brugeren er opdateret.");
}

export async function deleteUserAction(formData: FormData) {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const id = readString(formData, "id");
  const confirmDelete = formData.get("confirm_delete") === "on";
  const confirmText = readString(formData, "confirm_text").toUpperCase();

  if (!id) withError("Ugyldig bruger.");
  if (id === user.id) withError("Du kan ikke slette dig selv.");
  if (!confirmDelete || confirmText !== "SLET") {
    withError('Sletning kræver bekræftelse og teksten "SLET".');
  }

  const cleanupTables = [
    "match_predictions",
    "statement_predictions",
    "admin_contact_messages",
    "leaderboard_snapshots"
  ];

  for (const table of cleanupTables) {
    const { error } = await supabase.from(table).delete().eq("user_id", id);
    if (error) {
      withError("Brugerens data kunne ikke slettes sikkert. Prøv igen.");
    }
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) withError("Profilen kunne ikke slettes. Prøv igen.");

  revalidatePath("/admin/users");
  revalidatePath("/admin/messages");
  revalidatePath("/leaderboard");
  revalidatePath("/predictions");
  revalidatePath("/statistics");
  withMessage(
    "Brugeren og brugerens spildata er slettet. Auth-brugeren kan stadig findes i Supabase Auth."
  );
}
