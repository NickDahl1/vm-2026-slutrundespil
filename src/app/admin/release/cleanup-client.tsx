"use client";

import { useState } from "react";

type CleanupAction = {
  id: string;
  label: string;
  description: string;
  buttonLabel: string;
  confirmPhrase?: string;  // if set, user must type this exact phrase
  confirmPrompt?: string;  // shown above the input field
  tone: "warn" | "danger";
  action: (formData: FormData) => Promise<void>;
};

function CleanupCard({ item }: { item: CleanupAction }) {
  const [expanded, setExpanded] = useState(false);

  const borderCls =
    item.tone === "danger"
      ? "border-red-200 bg-red-50"
      : "border-amber-200 bg-amber-50";

  const btnCls =
    item.tone === "danger"
      ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm"
      : "rounded-lg bg-amber-600 px-4 py-2 text-sm font-black text-white shadow-sm";

  const expandBtnCls =
    item.tone === "danger"
      ? "rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 shadow-sm"
      : "rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-amber-700 shadow-sm";

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${borderCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-slate-950">{item.label}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600">{item.description}</p>
        </div>
        {!expanded && (
          <button
            className={`shrink-0 ${expandBtnCls}`}
            onClick={() => setExpanded(true)}
            type="button"
          >
            {item.buttonLabel}
          </button>
        )}
      </div>

      {expanded && (
        <form
          action={item.action}
          className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          {item.confirmPhrase ? (
            <>
              <p className="text-sm font-bold text-slate-700">
                {item.confirmPrompt ?? `Skriv "${item.confirmPhrase}" for at bekræfte:`}
              </p>
              <input
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-slate-950 focus:border-red-500 focus:outline-none"
                name="confirm"
                placeholder={item.confirmPhrase}
                required
                type="text"
              />
            </>
          ) : (
            <p className="text-sm font-bold text-slate-700">
              Er du sikker? Denne handling kan ikke fortrydes.
            </p>
          )}

          <div className="flex gap-2">
            <button className={btnCls} type="submit">
              Ja, {item.buttonLabel.toLowerCase()}
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              onClick={() => setExpanded(false)}
              type="button"
            >
              Annuller
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function CleanupSection({
  actions,
}: {
  actions: CleanupAction[];
}) {
  return (
    <div className="space-y-3">
      {actions.map((item) => (
        <CleanupCard item={item} key={item.id} />
      ))}
    </div>
  );
}
