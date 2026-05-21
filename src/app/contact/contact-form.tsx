"use client";

import { useActionState, useState } from "react";
import { sendContactMessageAction, type ContactState } from "./actions";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 2000;

const initialState: ContactState = { status: "idle", message: "" };

export function ContactForm({ displayName }: { displayName: string }) {
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    sendContactMessageAction,
    initialState
  );

  // Track lengths for live character counters (uncontrolled inputs)
  const [subjectLen, setSubjectLen] = useState(0);
  const [messageLen, setMessageLen] = useState(0);

  // Show success panel in place of form (no reset needed — contact forms are single-use per session)
  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-4">
          <p className="text-2xl">✉️</p>
          <p className="mt-2 font-black text-pitch-700">✓ {state.message}</p>
          <p className="mt-1 text-sm font-semibold text-pitch-500">
            Admin vil vende tilbage hurtigst muligt.
          </p>
        </div>
        <p className="text-center text-xs font-semibold text-slate-400">
          Vil du sende en ny besked? Genindlæs siden.
        </p>
      </div>
    );
  }

  const subjectOver = subjectLen > SUBJECT_MAX;
  const messageOver = messageLen > MESSAGE_MAX;
  const canSubmit =
    !isPending && subjectLen > 0 && messageLen > 0 && !subjectOver && !messageOver;

  return (
    <form action={formAction} className="space-y-4">
      {/* Sender info (read-only) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-500">
          Sender som{" "}
          <span className="font-black text-slate-700">{displayName}</span>
        </p>
      </div>

      {/* Subject */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-black text-slate-700" htmlFor="subject">
            Emne
          </label>
          <span
            className={`text-xs font-semibold ${
              subjectOver ? "text-red-500" : "text-slate-400"
            }`}
          >
            {subjectLen}/{SUBJECT_MAX}
          </span>
        </div>
        <input
          autoComplete="off"
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-slate-950 focus:outline-none ${
            subjectOver
              ? "border-red-300 bg-red-50 focus:border-red-500"
              : "border-slate-200 bg-white focus:border-pitch-700"
          }`}
          id="subject"
          name="subject"
          onChange={(e) => setSubjectLen(e.target.value.length)}
          placeholder="Fx: Spørgsmål om pointberegning"
          required
          type="text"
        />
      </div>

      {/* Message */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-black text-slate-700" htmlFor="message">
            Besked
          </label>
          <span
            className={`text-xs font-semibold ${
              messageOver ? "text-red-500" : "text-slate-400"
            }`}
          >
            {messageLen}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-slate-950 focus:outline-none ${
            messageOver
              ? "border-red-300 bg-red-50 focus:border-red-500"
              : "border-slate-200 bg-white focus:border-pitch-700"
          }`}
          id="message"
          name="message"
          onChange={(e) => setMessageLen(e.target.value.length)}
          placeholder="Skriv din besked her..."
          required
          rows={5}
        />
      </div>

      {/* Submit */}
      <button
        className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        {isPending ? "Sender…" : "Send besked"}
      </button>

      {state.status === "error" && (
        <p className="text-sm font-bold text-red-600">{state.message}</p>
      )}
    </form>
  );
}
