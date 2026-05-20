"use client";

import { useState } from "react";
import type { PredWithMatch } from "@/lib/types";
import { PHASE_LABELS } from "@/lib/types";

type FilterMode =
  | "alle"
  | "pointgivende"
  | "perfekte"
  | "ingen_point"
  | "gruppe"
  | "slutspil";

const FILTER_LABELS: Record<FilterMode, string> = {
  alle: "Alle",
  pointgivende: "Pointgivende",
  perfekte: "Perfekte",
  ingen_point: "Ingen point",
  gruppe: "Gruppespil",
  slutspil: "Slutspil"
};

function applyFilter(preds: PredWithMatch[], filter: FilterMode): PredWithMatch[] {
  switch (filter) {
    case "pointgivende":
      return preds.filter((p) => p.total_points > 0);
    case "perfekte":
      return preds.filter((p) => p.total_points === 3);
    case "ingen_point":
      return preds.filter((p) => p.total_points === 0);
    case "gruppe":
      return preds.filter((p) => p.matches?.phase === "group_stage");
    case "slutspil":
      return preds.filter((p) => p.matches?.phase === "knockout_stage");
    default:
      return preds;
  }
}

function PointBadge({ label, correct }: { label: string; correct: boolean }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold ${
        correct
          ? "bg-pitch-50 text-pitch-700"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {correct ? "✓" : "✗"} {label}
    </span>
  );
}

function MatchCard({ pred }: { pred: PredWithMatch }) {
  const match = pred.matches!;
  return (
    <article className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">#{match.match_no}</span>
          <span className="badge">
            {PHASE_LABELS[match.phase as keyof typeof PHASE_LABELS] ?? match.phase}
          </span>
          {match.group_name && <span className="badge">{match.group_name}</span>}
        </div>
        <span className="text-base font-black text-slate-950">
          {pred.total_points}{" "}
          <span className="text-xs font-semibold text-slate-400">pt</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center text-sm">
        <p className="font-bold text-slate-800 truncate">{match.home_team}</p>
        <div className="space-y-1 shrink-0">
          <div className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 whitespace-nowrap">
            {match.home_score_90} – {match.away_score_90}
          </div>
          <div className="rounded-lg bg-pitch-50 px-3 py-1 text-xs font-black text-pitch-700 whitespace-nowrap">
            {pred.predicted_home_score} – {pred.predicted_away_score}
          </div>
        </div>
        <p className="font-bold text-slate-800 truncate">{match.away_team}</p>
      </div>

      <p className="text-center text-xs font-semibold text-slate-400">
        Resultat&nbsp;·&nbsp;Bud
      </p>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        <PointBadge correct={pred.points_home_score === 1} label="Hjemmemål" />
        <PointBadge correct={pred.points_away_score === 1} label="Udemål" />
        <PointBadge correct={pred.points_outcome === 1} label="Udfald" />
      </div>
    </article>
  );
}

export function PredictionFilter({
  preds,
  matchPoints,
  perfectResults,
  correctOutcomes
}: {
  preds: PredWithMatch[];
  matchPoints: number;
  perfectResults: number;
  correctOutcomes: number;
}) {
  const [filter, setFilter] = useState<FilterMode>("alle");
  const filtered = applyFilter(preds, filter);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div>
            <p className="text-xl font-black text-slate-950">{matchPoints}</p>
            <p className="text-xs font-semibold text-slate-400">point</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">{preds.length}</p>
            <p className="text-xs font-semibold text-slate-400">kampe</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">{perfectResults}</p>
            <p className="text-xs font-semibold text-slate-400">perfekte</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">{correctOutcomes}</p>
            <p className="text-xs font-semibold text-slate-400">udfald</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(Object.keys(FILTER_LABELS) as FilterMode[]).map((f) => (
          <button
            key={f}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition ${
              filter === f
                ? "bg-pitch-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setFilter(f)}
            type="button"
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="font-black text-slate-950">Ingen kampe matcher filteret</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-400">
            Viser {filtered.length} af {preds.length} kampe
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((pred) => (
              <MatchCard key={pred.id} pred={pred} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
