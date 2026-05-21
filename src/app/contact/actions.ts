"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAdminNotification } from "@/lib/email";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
};

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 2000;

export async function sendContactMessageAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  // Validate
  if (!subject) {
    return { status: "error", message: "Emne må ikke være tomt." };
  }
  if (subject.length > SUBJECT_MAX) {
    return {
      status: "error",
      message: `Emne er for langt (maks ${SUBJECT_MAX} tegn).`,
    };
  }
  if (!message) {
    return { status: "error", message: "Besked må ikke være tom." };
  }
  if (message.length > MESSAGE_MAX) {
    return {
      status: "error",
      message: `Besked er for lang (maks ${MESSAGE_MAX} tegn).`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Du skal være logget ind." };
  }

  // Fetch display_name from profiles
  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    (profileData as { display_name: string | null } | null)?.display_name ??
    "Ukendt spiller";

  // Save message to database
  const { error: insertError } = await supabase
    .from("admin_contact_messages")
    .insert({ user_id: user.id, subject, message });

  if (insertError) {
    console.error("[contact] Insert failed:", insertError);
    return {
      status: "error",
      message: "Beskeden kunne ikke sendes. Prøv igen.",
    };
  }

  // Attempt email notification (never blocks success)
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  await sendAdminNotification({
    senderName: displayName,
    senderEmail: user.email ?? null,
    subject,
    message,
    sentAt: new Date().toISOString(),
    messagesUrl: `${appUrl}/admin/messages`,
  });

  return {
    status: "success",
    message: "Din besked er sendt til admin.",
  };
}
