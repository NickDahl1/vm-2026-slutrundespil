"use client";

import { useState } from "react";
import type { Match } from "@/lib/types";
import { STATUS_LABELS, PHASE_LABELS } from "@/lib/types";
import { formatDanishDateTime } from "@/lib/date-format";
import {
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
  resetManuallyCorrectedAction
} from "./actions";

type Mode = "list" | "create" | "edit";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white shadow-sm"
    >
      {label}
    </button>
  );
}

function MatchForm({
  match,
  action
}: {
  match?: Match;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      {match && <input type="hidden" name="id" value={match.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="match_no">
            Kampnummer *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match?.match_no ?? ""}
            id="match_no"
            min="1"
            name="match_no"
            required
            type="number"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="phase">
            Fase *
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match?.phase ?? "group_stage"}
            id="phase"
            name="phase"
          >
            <option value="group_stage">Gruppespil</option>
            <option value="knockout_stage">Slutspil</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700" htmlFor="group_name">
          Gruppe
        </label>
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
          defaultValue={match?.group_name ?? ""}
          id="group_name"
          name="group_name"
          placeholder="f.eks. Gruppe A"
          type="text"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="home_team">
            Hjemmehold *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match?.home_team ?? ""}
            id="home_team"
            name="home_team"
            required
            type="text"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="away_team">
            Udehold *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match?.away_team ?? ""}
            id="away_team"
            name="away_team"
            required
            type="text"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="kickoff_at">
            Afspark (UTC — vises i dansk tid for brugere) *
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match ? toDatetimeLocal(match.kickoff_at) : ""}
            id="kickoff_at"
            name="kickoff_at"
            required
            type="datetime-local"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700" htmlFor="status">
            Status *
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={match?.status ?? "scheduled"}
            id="status"
            name="status"
          >
            <option value="scheduled">Planlagt</option>
            <option value="live">Spilles nu</option>
            <option value="finished">Afsluttet</option>
            <option value="postponed">Udsat</option>
            <option value="cancelled">Aflyst</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-700">Resultat (udfyldes efter kampen)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-slate-500" htmlFor="home_score_90">
              Hjemmemål
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
              defaultValue={match?.home_score_90 ?? ""}
              id="home_score_90"
              min="0"
              name="home_score_90"
              type="number"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-slate-500" htmlFor="away_score_90">
              Udemål
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
              defaultValue={match?.away_score_90 ?? ""}
              id="away_score_90"
              min="0"
              name="away_score_90"
              type="number"
            />
          </div>
        </div>
      </div>

      <SubmitButton label={match ? "Gem ændringer" : "Opret kamp"} />
    </form>
  );
}

export function AdminMatchesClient({ matches }: { matches: Match[] }) {
  const [mode, setMode] = useState<Mode>("list");
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  function startEdit(match: Match) {
    setEditMatch(match);
    setMode("edit");
    setPendingDelete(null);
  }

  function startCreate() {
    setEditMatch(null);
    setMode("create");
    setPendingDelete(null);
  }

  function backToList() {
    setMode("list");
    setEditMatch(null);
    setPendingDelete(null);
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-4">
        <button
          className="flex items-center gap-1 text-sm font-bold text-pitch-700"
          onClick={backToList}
          type="button"
        >
          ← Tilbage til liste
        </button>

        <section className="card space-y-5">
          <h2 className="text-lg font-black text-slate-950">
            {mode === "create" ? "Ny kamp" : `Rediger kamp #${editMatch?.match_no}`}
          </h2>
          <MatchForm
            action={mode === "create" ? createMatchAction : updateMatchAction}
            key={mode === "edit" ? `edit-${editMatch?.id}` : "create"}
            match={editMatch ?? undefined}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {matches.length === 0 ? "Ingen kampe endnu" : `${matches.length} kamp${matches.length === 1 ? "" : "e"}`}
        </p>
        <button
          className="rounded-lg bg-pitch-700 px-4 py-2 text-sm font-black text-white shadow-sm"
          onClick={startCreate}
          type="button"
        >
          + Ny kamp
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Ingen kampe er oprettet endnu. Klik &quot;Ny kamp&quot; for at tilføje den første.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <article className="card space-y-3" key={match.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">#{match.match_no}</span>
                    <span className="badge">{PHASE_LABELS[match.phase]}</span>
                    {match.group_name && (
                      <span className="badge">{match.group_name}</span>
                    )}
                  </div>
                  <p className="mt-2 font-black text-slate-950">
                    {match.home_team} – {match.away_team}
                  </p>
                  {match.home_score_90 !== null && match.away_score_90 !== null && (
                    <p className="text-sm font-black text-pitch-700">
                      {match.home_score_90} – {match.away_score_90}
                    </p>
                  )}
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDanishDateTime(match.kickoff_at)} · {STATUS_LABELS[match.status]}
                  </p>
                  {match.manually_corrected && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      🔒 Manuelt rettet — auto-sync deaktiveret
                    </p>
                  )}
                </div>
              </div>

              {pendingDelete === match.id ? (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
                  <p className="flex-1 text-sm font-bold text-red-700">Slet denne kamp?</p>
                  <button
                    className="text-sm font-bold text-slate-600"
                    onClick={() => setPendingDelete(null)}
                    type="button"
                  >
                    Annuller
                  </button>
                  <form action={deleteMatchAction}>
                    <input name="id" type="hidden" value={match.id} />
                    <button
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-black text-white"
                      type="submit"
                    >
                      Ja, slet
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
                    onClick={() => startEdit(match)}
                    type="button"
                  >
                    Rediger
                  </button>
                  <button
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 shadow-sm"
                    onClick={() => setPendingDelete(match.id)}
                    type="button"
                  >
                    Slet
                  </button>
                  {match.manually_corrected && (
                    <form action={resetManuallyCorrectedAction}>
                      <input name="id" type="hidden" value={match.id} />
                      <button
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 shadow-sm"
                        type="submit"
                      >
                        Tillad auto-sync
                      </button>
                    </form>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
