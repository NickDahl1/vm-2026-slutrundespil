"use client";

import { useActionState, useEffect, useReducer } from "react";
import type { Statement, StatementPrediction, AppSettings } from "@/lib/types";
import { formatDanishDateTime } from "@/lib/date-format";
import {
  bulkUpsertStatementPredictionsAction,
  type BulkStatementState,
} from "./actions";

// ── Types ────────────────────────────────────────────────────────────────────

type StatementInput = { answer: string };

type FormState = {
  inputValues: Record<number, StatementInput>;
  savedIds: Set<number>;
  dirtyIds: Set<number>;
};

type FormAction =
  | { type: "edit"; statementId: number; answer: string }
  | { type: "saved"; savedStatementIds: number[] };

type StatementStatus = "empty" | "dirty" | "saved" | "locked" | "resolved";

// ── Reducer ──────────────────────────────────────────────────────────────────

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "edit":
      return {
        ...state,
        inputValues: {
          ...state.inputValues,
          [action.statementId]: { answer: action.answer },
        },
        dirtyIds: new Set([...state.dirtyIds, action.statementId]),
      };
    case "saved": {
      const newDirty = new Set(state.dirtyIds);
      for (const id of action.savedStatementIds) newDirty.delete(id);
      return {
        ...state,
        dirtyIds: newDirty,
        savedIds: new Set([...state.savedIds, ...action.savedStatementIds]),
      };
    }
  }
}

function buildInitialFormState(predictions: StatementPrediction[]): FormState {
  const inputValues: Record<number, StatementInput> = {};
  for (const p of predictions) {
    inputValues[p.statement_id] = { answer: p.answer };
  }
  return {
    inputValues,
    savedIds: new Set(predictions.map((p) => p.statement_id)),
    dirtyIds: new Set(),
  };
}

function getStatementStatus(
  statement: Statement,
  savedIds: Set<number>,
  dirtyIds: Set<number>,
  locked: boolean
): StatementStatus {
  if (statement.is_resolved) return "resolved";
  if (locked) return "locked";
  if (dirtyIds.has(statement.id)) return "dirty";
  if (savedIds.has(statement.id)) return "saved";
  return "empty";
}

function isGloballyLocked(settings: AppSettings | null): boolean {
  if (!settings) return false;
  if (settings.game_locked) return true;
  if (settings.group_stage_lock_at) {
    return new Date(settings.group_stage_lock_at) <= new Date();
  }
  return false;
}

// ── Answer type labels ───────────────────────────────────────────────────────

const ANSWER_TYPE_LABELS: Record<Statement["answer_type"], string> = {
  yes_no: "Ja/Nej",
  over_under: "Over/Under",
  number: "Tal",
  player: "Spiller",
  team: "Hold",
  text: "Fritekst",
  multiple_choice: "Valg",
};

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatementStatus }) {
  if (status === "empty") return null;
  const styles: Record<Exclude<StatementStatus, "empty">, string> = {
    dirty: "bg-cup-100 text-cup-500",
    saved: "bg-pitch-50 text-pitch-700",
    locked: "bg-slate-100 text-slate-400",
    resolved: "bg-pitch-50 text-pitch-700",
  };
  const labels: Record<Exclude<StatementStatus, "empty">, string> = {
    dirty: "Ændret",
    saved: "Gemt",
    locked: "Låst",
    resolved: "Afgjort",
  };
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-xs font-black ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ── Controlled answer input ───────────────────────────────────────────────────

function AnswerInput({
  statement,
  value,
  onChange,
  disabled,
}: {
  statement: Statement;
  value: string;
  onChange: (answer: string) => void;
  disabled: boolean;
}) {
  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold " +
    "text-slate-950 focus:border-pitch-700 focus:outline-none disabled:opacity-50";

  if (statement.answer_type === "yes_no" || statement.answer_type === "over_under") {
    const opts =
      statement.answer_type === "yes_no" ? ["Ja", "Nej"] : ["Over", "Under"];
    return (
      <div className="flex gap-2">
        {opts.map((opt) => (
          <button
            className={`flex h-10 min-w-[80px] items-center justify-center rounded-lg border-2 px-4 text-sm font-black transition-colors disabled:opacity-50 ${
              value === opt
                ? "border-pitch-700 bg-pitch-50 text-pitch-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
            }`}
            disabled={disabled}
            key={opt}
            onClick={() => !disabled && onChange(opt)}
            type="button"
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (statement.answer_type === "multiple_choice" && statement.options?.length) {
    return (
      <select
        className={inputCls}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option disabled value="">
          Vælg...
        </option>
        {statement.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={inputCls}
      disabled={disabled}
      min={statement.answer_type === "number" ? "0" : undefined}
      onChange={(e) => onChange(e.target.value)}
      placeholder={statement.answer_type === "number" ? "Antal..." : "Dit svar..."}
      step={statement.answer_type === "number" ? "1" : undefined}
      type={statement.answer_type === "number" ? "number" : "text"}
      value={value}
    />
  );
}

// ── Statement card ────────────────────────────────────────────────────────────

function StatementCard({
  statement,
  prediction,
  value,
  status,
  onAnswerChange,
}: {
  statement: Statement;
  prediction: StatementPrediction | undefined;
  value: string;
  status: StatementStatus;
  onAnswerChange: (statementId: number, answer: string) => void;
}) {
  const isResolved = statement.is_resolved;
  const isEditable = status !== "locked" && status !== "resolved";

  return (
    <article
      className={`card space-y-2.5 py-3 ${
        status === "dirty" ? "border-cup-300" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded bg-pitch-50 text-xs font-black text-pitch-700">
          {statement.sort_order}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black leading-snug text-slate-950">
            {statement.question}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {ANSWER_TYPE_LABELS[statement.answer_type]} · {statement.points} point
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Resolved: show correct answer + user's answer + points */}
      {isResolved && (
        <div className="space-y-1.5 rounded-lg border border-pitch-100 bg-pitch-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-pitch-700">Korrekt svar</span>
            <span className="font-black text-pitch-700">{statement.correct_answer}</span>
          </div>
          {prediction ? (
            <div className="flex items-center justify-between gap-2 border-t border-pitch-100 pt-1.5">
              <span className="text-xs font-bold text-slate-500">Dit svar</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{prediction.answer}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-black ${
                    prediction.points > 0
                      ? "bg-pitch-50 text-pitch-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {prediction.points > 0 ? `✓ ${prediction.points} pt` : "✗ 0 pt"}
                </span>
              </div>
            </div>
          ) : (
            <p className="border-t border-pitch-100 pt-1.5 text-xs font-semibold text-slate-400">
              Ingen svar afgivet
            </p>
          )}
        </div>
      )}

      {/* Locked (not resolved): show saved answer or "no answer" */}
      {!isResolved && status === "locked" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          {prediction ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Dit svar</span>
              <span className="font-black text-slate-950">{prediction.answer}</span>
              <span className="badge">Låst</span>
            </div>
          ) : (
            <p className="text-center text-sm font-semibold text-slate-500">
              Fristen er passeret — ingen svar afgivet
            </p>
          )}
        </div>
      )}

      {/* Editable input */}
      {isEditable && (
        <AnswerInput
          disabled={false}
          onChange={(answer) => onAnswerChange(statement.id, answer)}
          statement={statement}
          value={value}
        />
      )}
    </article>
  );
}

// ── Statement list (top-level client component) ───────────────────────────────

const initialBulkState: BulkStatementState = {
  status: "idle",
  message: "",
  savedStatementIds: [],
};

export function StatementList({
  statements,
  predictions,
  settings,
}: {
  statements: Statement[];
  predictions: StatementPrediction[];
  settings: AppSettings | null;
}) {
  const [bulkState, formAction, isPending] = useActionState<
    BulkStatementState,
    FormData
  >(bulkUpsertStatementPredictionsAction, initialBulkState);

  const [formState, dispatch] = useReducer(
    formReducer,
    predictions,
    buildInitialFormState
  );

  const { inputValues, savedIds, dirtyIds } = formState;

  // Sync successful saves back into local state
  useEffect(() => {
    if (
      bulkState.status === "success" &&
      bulkState.savedStatementIds.length > 0
    ) {
      dispatch({ type: "saved", savedStatementIds: bulkState.savedStatementIds });
    }
  }, [bulkState]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (dirtyIds.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyIds]);

  const locked = isGloballyLocked(settings);
  const deadlinePassed =
    settings?.group_stage_lock_at
      ? new Date(settings.group_stage_lock_at) <= new Date()
      : false;

  const deadlineLabel = settings?.group_stage_lock_at
    ? deadlinePassed
      ? `Låst siden ${formatDanishDateTime(settings.group_stage_lock_at)}`
      : `Frist: ${formatDanishDateTime(settings.group_stage_lock_at)}`
    : "Ingen frist sat endnu";

  // Collect dirty answers that have a non-empty value
  const dirtyAnswers = [...dirtyIds]
    .map((id) => {
      const inp = inputValues[id];
      return inp && inp.answer.trim()
        ? { statement_id: id, answer: inp.answer.trim() }
        : null;
    })
    .filter(Boolean) as { statement_id: number; answer: string }[];

  const answeredCount = statements.filter((s) => {
    const inp = inputValues[s.id];
    const hasInput = inp && inp.answer.trim();
    return savedIds.has(s.id) || hasInput;
  }).length;

  const unansweredEditable = statements.filter(
    (s) =>
      !s.is_resolved &&
      !locked &&
      !savedIds.has(s.id) &&
      !dirtyIds.has(s.id)
  ).length;

  const unsavedCount = dirtyAnswers.length;

  const saveLabel = isPending
    ? "Gemmer..."
    : unsavedCount > 0
      ? `Gem ${unsavedCount} svar`
      : "Gem alle svar";

  const answersJson = JSON.stringify(dirtyAnswers);

  return (
    <div className="space-y-5">
      {/* Lock / deadline banner */}
      {settings?.game_locked ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-black text-red-700">🔒 Udsagn er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">
            Spillet er låst af admin. Ingen svar kan ændres.
          </p>
        </div>
      ) : locked && deadlinePassed ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-black text-slate-700">🔒 Udsagn er låst</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Fristen for udsagn er passeret.
          </p>
        </div>
      ) : settings?.group_stage_lock_at && !locked ? (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
          <p className="text-sm font-semibold text-pitch-700">
            Du kan svare på udsagn frem til{" "}
            <strong>{formatDanishDateTime(settings.group_stage_lock_at)}</strong>.
          </p>
        </div>
      ) : null}

      {/* Progress + save button */}
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-slate-950">
                {answeredCount} af {statements.length} besvaret
              </p>
              {unansweredEditable > 0 && (
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {unansweredEditable} mangler svar
                </p>
              )}
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                {deadlineLabel}
              </p>
            </div>
            {unsavedCount > 0 && (
              <span className="rounded bg-cup-100 px-2 py-0.5 text-xs font-black text-cup-500">
                {unsavedCount} ændring{unsavedCount === 1 ? "" : "er"} ikke gemt
              </span>
            )}
          </div>
        </div>

        {!locked && (
          <form action={formAction}>
            <input name="answers" type="hidden" value={answersJson} />
            <button
              className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-50"
              disabled={isPending || unsavedCount === 0}
              type="submit"
            >
              {saveLabel}
            </button>
            {bulkState.status === "success" && (
              <p className="mt-2 text-center text-xs font-black text-pitch-700">
                ✓ {bulkState.message}
              </p>
            )}
            {bulkState.status === "error" && (
              <p className="mt-2 text-center text-xs font-bold text-red-600">
                {bulkState.message}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Statement cards */}
      <div className="space-y-3">
        {statements.map((s) => {
          const status = getStatementStatus(s, savedIds, dirtyIds, locked);
          const inp = inputValues[s.id];
          const value = inp?.answer ?? "";
          const prediction = predictions.find((p) => p.statement_id === s.id);
          return (
            <StatementCard
              key={s.id}
              onAnswerChange={(id, answer) =>
                dispatch({ type: "edit", statementId: id, answer })
              }
              prediction={prediction}
              statement={s}
              status={status}
              value={value}
            />
          );
        })}
      </div>

      {/* Bottom save button (only when there are unsaved changes) */}
      {!locked && unsavedCount > 0 && (
        <form action={formAction}>
          <input name="answers" type="hidden" value={answersJson} />
          <button
            className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {saveLabel}
          </button>
        </form>
      )}
    </div>
  );
}
