/**
 * Server-side email notification helper.
 *
 * Required environment variables (set in .env.local or Vercel/GitHub Secrets):
 *   ADMIN_EMAIL            — email address to receive notifications
 *   EMAIL_FROM             — "From" header, e.g. "VM 2026 <noreply@yourdomain.com>"
 *   EMAIL_PROVIDER_API_KEY — API key for your email provider (see TODO below)
 *
 * If ADMIN_EMAIL or EMAIL_PROVIDER_API_KEY is not set, the function returns
 * silently — the message is already persisted in the database.
 *
 * Email failures NEVER propagate to the caller. The user always sees success.
 */

type AdminNotificationPayload = {
  senderName: string;
  senderEmail: string | null;
  subject: string;
  message: string;
  sentAt: string; // ISO string
  messagesUrl: string; // link to /admin/messages
};

export async function sendAdminNotification(
  payload: AdminNotificationPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@localhost";

  if (!adminEmail || !apiKey) {
    console.log(
      "[email] ADMIN_EMAIL or EMAIL_PROVIDER_API_KEY not configured — " +
        "skipping notification. Message is saved in the database."
    );
    return;
  }

  const danishTime = new Date(payload.sentAt).toLocaleString("da-DK", {
    timeZone: "Europe/Copenhagen",
    dateStyle: "long",
    timeStyle: "short",
  });

  const textBody = [
    `Ny besked fra ${payload.senderName}${payload.senderEmail ? ` (${payload.senderEmail})` : ""}`,
    "",
    `Emne: ${payload.subject}`,
    "",
    "Besked:",
    payload.message,
    "",
    `Sendt: ${danishTime}`,
    "",
    `Besvar i admin-panelet: ${payload.messagesUrl}`,
  ].join("\n");

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TODO: Implementér med din email-provider.
    //
    // Anbefalet: Resend (https://resend.com) — gratis plan: 3.000 emails/md.
    //   npm install resend
    //
    //   import { Resend } from "resend";
    //   const resend = new Resend(apiKey);
    //   await resend.emails.send({
    //     from: fromEmail,
    //     to:   adminEmail,
    //     subject: `[VM 2026] Ny besked: ${payload.subject}`,
    //     text: textBody,
    //   });
    //
    // Alternative: nodemailer (SMTP), Postmark, SendGrid, Brevo — alle bruger
    // samme mønster: from, to, subject, text/html.
    //
    // Fjern console.log nedenfor når du har implementeret provider.
    // ─────────────────────────────────────────────────────────────────────────

    console.log(
      "[email] Provider not yet implemented. Would have sent:",
      JSON.stringify({
        to: adminEmail,
        from: fromEmail,
        subject: `[VM 2026] Ny besked: ${payload.subject}`,
        bodyPreview: textBody.slice(0, 120),
      })
    );
  } catch (err) {
    // Log but never rethrow — email failure must not block message delivery.
    console.error("[email] Failed to send admin notification:", err);
  }
}
