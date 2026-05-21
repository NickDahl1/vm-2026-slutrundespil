"use client";

import { useActionState } from "react";
import type { Statement, StatementPrediction, AppSettings } from "@/lib/types";
import { formatDanishDateTime } from "@/lib/date-format";
import {
  upsertStatementPredictionAction,
  type StatementState
} from "./actions";

const ANSWER_TYPE_LABELS: Record<Statement["answer_type"], string> = {
  yes_no: "Ja/Nej",
  over_under: "Over/Under",
  number: "Tal",
  player: "Spiller",
  team: "Hold",
  text: "Fritekst",
  multiple_choice: "Valg"
};

function isLocked(settings: AppSettings | null): boolean {
  if (!settings) return false;
  if (settings.game_locked) return true;
  if (settings.group_stage_lock_at) {
    return new Date(settings.group_stage_lock_at) <= new Date();
  }
  return false;
}

const initialState: StatementState = { status: "idle", message: "" };

function AnswerInput({
  statement,
  defaultValue
}: {
  statement: Statement;
  defaultValue?: string;
}) {
  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none";

  if (statement.answer_type === "yes_no" || statement.answer_type === "over_under") {
    const opts =
      statement.answer_type === "yes_no" ? ["Ja", "Nej"] : ["Over", "Under"];
    return (
      <div className="grid grid-cols-2 gap-2">
        {opts.map((opt) => (
          <label className="cursor-pointer" key={opt}>
            <input
              className="peer sr-only"
              defaultChecked={defaultValue === opt}
              name="answer"
              required
              type="radio"
              value={opt}
            />
            <span className="flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white py-2 text-sm font-black text-slate-500 peer-checked:border-pitch-700 peer-checked:bg-pitch-50 peer-checked:text-pitch-700">
              {opt}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (statement.answer_type === "multiple_choice" && statement.options?.length) {
    return (
      <select
        className={inputCls}
        defaultValue={defaultValue ?? ""}
        name="answer"
        required
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
      defaultValue={defaultValue ?? ""}
      name="answer"
      placeholder={
        statement.answer_type === "number" ? "Antal..." : "Dit svar..."
      }
      required
      type={statement.answer_type === "number" ? "number" : "text"}
      {...(statement.answer_type === "number" ? { min: "0", step: "1" } : {})}
    />
  );
}

function StatementCard({
  statement,
  prediction,
  locked
}: {
  statement: Statement;
  prediction: StatementPrediction | undefined;
  locked: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    StatementState,
    FormData
  >(upsertStatementPredictionAction, initialState);

  const isResolved = statement.is_resolved;
  const showForm = !locked && !isResolved;

  return (
    <article className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-pitch-50 text-sm font-black text-pitch-700">
          {statement.sort_order}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-black text-slate-950">{statement.question}</h2>
          <p className="text-xs font-semibold text-slate-400">
            {ANSWER_TYPE_LABELS[statement.answer_type]}
          </p>
        </div>
      </div>

      {isResolved && (
        <div className="rounded-lg border border-pitch-100 bg-pitch-50 p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-pitch-700">Korrekt svar</span>
            <span className="font-black text-pitch-700">{statement.correct_answer}</span>
          </div>
          {prediction && (
            <div className="flex items-center justify-between gap-2 border-t border-pitch-100 pt-1.5">
              <span className="text-xs font-bold text-slate-500">Dit svar</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{prediction.answer}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-black ${
                    prediction.points === 3
                      ? "bg-pitch-50 text-pitch-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {prediction.points === 3 ? "✓ 3 pt" : "✗ 0 pt"}
                </span>
              </div>
            </div>
          )}
          {!prediction && (
            <p className="text-xs font-semibold text-slate-400 border-t border-pitch-100 pt-1.5">
              Ingen svar afgivet
            </p>
          )}
        </div>
      )}

      {!isResolved && !showForm && (
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

      {showForm && (
        <form action={formAction} className="space-y-3">
          <input name="statement_id" type="hidden" value={statement.id} />

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">Dit svar</p>
            <AnswerInput
              defaultValue={prediction?.answer}
              statement={statement}
            />
          </div>

          <button
            className="w-full rounded-lg bg-pitch-700 px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Gemmer..." : "Gem svar"}
          </button>

          {state.status === "success" && (
            <p className="text-center text-xs font-black text-pitch-700">
              ✓ {state.message}
            </p>
          )}
          {state.status === "error" && (
            <p className="text-center text-xs font-bold text-red-600">
              {state.message}
            </p>
          )}
          {state.status === "idle" && !prediction && (
            <p className="text-center text-xs font-semibold text-slate-400">
              Du mangler at afgive svar
            </p>
          )}
        </form>
      )}
    </article>
  );
}

export function StatementList({
  statements,
  predictions,
  settings
}: {
  statements: Statement[];
  predictions: StatementPrediction[];
  settings: AppSettings | null;
}) {
  const locked = isLocked(settings);
  const predMap = new Map(predictions.map((p) => [p.statement_id, p]));
  const answered = predictions.length;
  const total = statements.length;
  const missing = Math.max(0, total - answered);

  const deadlinePassed =
    settings?.group_stage_lock_at
      ? new Date(settings.group_stage_lock_at) <= new Date()
      : false;

  const deadlineLabel = settings?.group_stage_lock_at
    ? deadlinePassed
      ? `Låst siden ${formatDanishDateTime(settings.group_stage_lock_at)}`
      : `Frist: ${formatDanishDateTime(settings.group_stage_lock_at)}`
    : "Ingen frist sat endnu";

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

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="space-y-0.5">
            <p className="font-black text-slate-950">
              {answered} af {total} besvaret
            </p>
            <p className="text-xs font-semibold text-slate-400">{deadlineLabel}</p>
          </div>
          {missing > 0 ? (
            <span className="rounded-lg bg-cup-100 px-3 py-1.5 text-xs font-black text-cup-500">
              {missing} mangler
            </span>
          ) : (
            <span className="rounded-lg bg-pitch-50 px-3 py-1.5 text-xs font-black text-pitch-700">
              Klar ✓
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {statements.map((s) => (
          <StatementCard
            key={s.id}
            locked={locked}
            prediction={predMap.get(s.id)}
            statement={s}
          />
        ))}
      </div>
    </div>
  );
}
