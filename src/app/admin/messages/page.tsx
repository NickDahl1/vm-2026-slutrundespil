import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatDanishDateTime } from "@/lib/date-format";
import { markMessageReadAction, archiveMessageAction } from "./actions";

type ContactMessage = {
  id: number;
  user_id: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
  read_at: string | null;
  profiles: { display_name: string | null } | null;
};

const STATUS_LABEL: Record<ContactMessage["status"], string> = {
  new: "Ny",
  read: "Læst",
  archived: "Arkiveret",
};

const STATUS_CLS: Record<ContactMessage["status"], string> = {
  new: "bg-cup-100 text-cup-500",
  read: "bg-pitch-50 text-pitch-700",
  archived: "bg-slate-100 text-slate-400",
};

export default async function AdminMessagesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_contact_messages")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as ContactMessage[];
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="space-y-5">
      <PageHeader
        description={
          newCount > 0
            ? `${newCount} ulæst${newCount === 1 ? "" : "e"} besked${newCount === 1 ? "" : "er"}`
            : messages.length === 0
              ? "Ingen beskeder endnu"
              : "Alle beskeder er læst"
        }
        eyebrow="Admin"
        title="Beskeder fra spillere"
      />

      {messages.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-2xl">✉️</p>
          <p className="mt-3 font-black text-slate-950">Ingen beskeder endnu</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Beskeder fra spillere vises her.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageCard key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ message: msg }: { message: ContactMessage }) {
  const senderName = msg.profiles?.display_name ?? "Ukendt spiller";
  const isNew = msg.status === "new";
  const isArchived = msg.status === "archived";

  return (
    <article
      className={`card space-y-3 ${isNew ? "border-cup-200 bg-cup-50/30" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-black text-slate-950">{msg.subject}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Fra <span className="font-black text-slate-700">{senderName}</span>
            {" · "}
            {formatDanishDateTime(msg.created_at)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-black ${STATUS_CLS[msg.status]}`}
        >
          {STATUS_LABEL[msg.status]}
        </span>
      </div>

      {/* Message body */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="whitespace-pre-wrap text-sm font-semibold text-slate-800">
          {msg.message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isNew && (
          <form action={markMessageReadAction}>
            <input name="id" type="hidden" value={msg.id} />
            <button
              className="rounded-lg border border-pitch-200 bg-white px-3 py-1.5 text-xs font-black text-pitch-700 shadow-sm"
              type="submit"
            >
              Markér som læst
            </button>
          </form>
        )}
        {!isArchived && (
          <form action={archiveMessageAction}>
            <input name="id" type="hidden" value={msg.id} />
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm"
              type="submit"
            >
              Arkiver
            </button>
          </form>
        )}
        {isArchived && (
          <p className="text-xs font-semibold text-slate-400">Arkiveret</p>
        )}
      </div>

      {/* Read timestamp if available */}
      {msg.read_at && (
        <p className="text-xs font-semibold text-slate-400">
          Læst: {formatDanishDateTime(msg.read_at)}
        </p>
      )}
    </article>
  );
}
