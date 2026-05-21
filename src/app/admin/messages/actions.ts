"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markMessageReadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("admin_contact_messages")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/messages");
}

export async function archiveMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("admin_contact_messages")
    .update({ status: "archived" })
    .eq("id", id);

  revalidatePath("/admin/messages");
}
