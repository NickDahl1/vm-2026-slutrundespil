"use client";

import { useState } from "react";
import type { Statement } from "@/lib/types";
import {
  createStatementAction,
  updateStatementAction,
  deleteStatementAction,
  resolveStatementAction
} from "./actions";

const ANSWER_TYPES: { value: Statement["answer_type"]; label: string }[] = [
  { value: "yes_no", label: "Ja/Nej" },
  { value: "over_under", label: "Over/Under" },
  { value: "number", label: "Tal" },
  { value: "player", label: "Spiller" },
  { value: "team", label: "Hold" },
  { value: "text", label: "Fritekst" },
  { value: "multiple_choice", label: "Multiple choice" }
];

const STATUS_BADGE = {
  resolved: "rounded px-2 py-0.5 text-xs font-black bg-pitch-50 text-pitch-700",
  open: "rounded px-2 py-0.5 text-xs font-black bg-slate-100 text-slate-500"
};

type Mode = "list" | "create" | "edit" | "resolve";

function StatementForm({
  defaultValues,
  action,
  submitLabel,
  onCancel
}: {
  defaultValues?: Partial<Statement>;
  action: (formData: FormData) => void;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [answerType, setAnswerType] = useState<string>(
    defaultValues?.answer_type ?? "yes_no"
  );

  return (
    <form action={action} className="card space-y-4">
      {defaultValues?.id && (
        <input name="id" type="hidden" value={defaultValues.id} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            Sort order (1–15) *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-pitch-700 focus:outline-none"
            defaultValue={defaultValues?.sort_order ?? ""}
            max={15}
            min={1}
            name="sort_order"
            required
            type="number"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            Svartype *
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-pitch-700 focus:outline-none"
            defaultValue={defaultValues?.answer_type ?? "yes_no"}
            name="answer_type"
            onChange={(e) => setAnswerType(e.target.value)}
          >
            {ANSWER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Spørgsmål *</label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-pitch-700 focus:outline-none"
          defaultValue={defaultValues?.question ?? ""}
          name="question"
          required
          rows={3}
        />
      </div>

      {answerType === "multiple_choice" && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            Svarmuligheder (kommasepareret) *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-pitch-700 focus:outline-none"
            defaultValue={
              Array.isArray(defaultValues?.options)
                ? defaultValues.options.join(", ")
                : ""
            }
            name="options"
            placeholder="Option A, Option B, Option C"
            type="text"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm"
          type="submit"
        >
          {submitLabel}
        </button>
        <button
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600"
          onClick={onCancel}
          type="button"
        >
          Annuller
        </button>
      </div>
    </form>
  );
}

function ResolveForm({
  statement,
  onCancel
}: {
  statement: Statement;
  onCancel: () => void;
}) {
  return (
    <form action={resolveStatementAction} className="card space-y-4 border-pitch-200 bg-pitch-50">
      <input name="id" type="hidden" value={statement.id} />
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Afgør udsagn #{statement.sort_order}
        </p>
        <p className="mt-1 font-black text-slate-950">{statement.question}</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">
          Korrekt svar *
        </label>
        <input
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pitch-700 focus:outline-none"
          defaultValue={statement.correct_answer ?? ""}
          name="correct_answer"
          placeholder="Angiv korrekt svar..."
          required
          type="text"
        />
      </div>
      <div className="flex gap-3">
        <button
          className="flex-1 rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm"
          type="submit"
        >
          Afgør og beregn point
        </button>
        <button
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600"
          onClick={onCancel}
          type="button"
        >
          Annuller
        </button>
      </div>
    </form>
  );
}

export function AdminStatementsClient({
  statements,
  answerCounts
}: {
  statements: Statement[];
  answerCounts: Map<number, number>;
}) {
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Statement | null>(null);
  const [resolving, setResolving] = useState<Statement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  if (mode === "create") {
    return (
      <StatementForm
        action={createStatementAction}
        onCancel={() => setMode("list")}
        submitLabel="Opret udsagn"
      />
    );
  }

  if (mode === "edit" && editing) {
    return (
      <StatementForm
        action={updateStatementAction}
        defaultValues={editing}
        onCancel={() => { setMode("list"); setEditing(null); }}
        submitLabel="Gem ændringer"
      />
    );
  }

  if (mode === "resolve" && resolving) {
    return (
      <ResolveForm
        onCancel={() => { setMode("list"); setResolving(null); }}
        statement={resolving}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button
        className="w-full rounded-lg border border-dashed border-pitch-300 bg-pitch-50 px-4 py-3 text-sm font-black text-pitch-700"
        onClick={() => setMode("create")}
        type="button"
      >
        + Nyt udsagn
      </button>

      {statements.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-black text-slate-950">Ingen udsagn oprettet endnu</p>
        </div>
      ) : (
        statements.map((s) => {
          const count = answerCounts.get(s.id) ?? 0;
          const isDeleting = pendingDelete === s.id;

          return (
            <article className="card space-y-3" key={s.id}>
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded bg-slate-100 text-sm font-black text-slate-600">
                  {s.sort_order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-950">{s.question}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={s.is_resolved ? STATUS_BADGE.resolved : STATUS_BADGE.open}>
                      {s.is_resolved ? "Afgjort" : "Åbent"}
                    </span>
                    <span className="rounded px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500">
                      {s.answer_type}
                    </span>
                    <span className="rounded px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500">
                      {count} svar
                    </span>
                    {s.is_resolved && s.correct_answer && (
                      <span className="rounded px-2 py-0.5 text-xs font-bold bg-pitch-50 text-pitch-700">
                        Korrekt: {s.correct_answer}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isDeleting ? (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="flex-1 text-sm font-bold text-red-700">
                    Slet dette udsagn?
                  </p>
                  <form action={deleteStatementAction}>
                    <input name="id" type="hidden" value={s.id} />
                    <button
                      className="rounded bg-red-600 px-3 py-1 text-xs font-black text-white"
                      type="submit"
                    >
                      Slet
                    </button>
                  </form>
                  <button
                    className="text-xs font-bold text-slate-500"
                    onClick={() => setPendingDelete(null)}
                    type="button"
                  >
                    Annuller
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    onClick={() => { setEditing(s); setMode("edit"); }}
                    type="button"
                  >
                    Rediger
                  </button>
                  <button
                    className="rounded-lg border border-pitch-200 bg-pitch-50 px-3 py-1.5 text-xs font-bold text-pitch-700 hover:bg-pitch-100"
                    onClick={() => { setResolving(s); setMode("resolve"); }}
                    type="button"
                  >
                    {s.is_resolved ? "Genafgør" : "Afgør"}
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                    onClick={() => setPendingDelete(s.id)}
                    type="button"
                  >
                    Slet
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
