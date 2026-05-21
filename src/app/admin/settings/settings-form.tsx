"use client";

import { useActionState } from "react";
import type { AppSettings } from "@/lib/types";
import { toCopenhagenDatetimeLocal } from "@/lib/date-format";
import { updateSettingsAction, type SettingsState } from "./actions";

const initialState: SettingsState = { status: "idle", message: "" };

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <input name="settings_id" type="hidden" value={settings.id} />

      {/* Group stage deadline */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-black text-slate-950">Grundspilsdeadline</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Låser kampbud og udsagn inden turneringen starter. Brugere kan
            ikke ændre bud efter dette tidspunkt.
          </p>
        </div>

        <div className="space-y-1">
          <label
            className="block text-xs font-bold text-slate-700"
            htmlFor="group_stage_lock_at"
          >
            Tidspunkt (dansk tid)
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={toCopenhagenDatetimeLocal(settings.group_stage_lock_at)}
            id="group_stage_lock_at"
            name="group_stage_lock_at"
            type="datetime-local"
          />
          <p className="text-xs text-slate-400">
            Lad feltet stå tomt for at fjerne deadlinen.
          </p>
        </div>
      </div>

      {/* Knockout stage deadline */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-black text-slate-950">Slutspilsdeadline</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Bruges later, når knockoutkampe åbnes for bud. Sættes typisk
            kort inden slutspillet begynder.
          </p>
        </div>

        <div className="space-y-1">
          <label
            className="block text-xs font-bold text-slate-700"
            htmlFor="knockout_stage_lock_at"
          >
            Tidspunkt (dansk tid)
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            defaultValue={toCopenhagenDatetimeLocal(settings.knockout_stage_lock_at)}
            id="knockout_stage_lock_at"
            name="knockout_stage_lock_at"
            type="datetime-local"
          />
          <p className="text-xs text-slate-400">
            Lad feltet stå tomt for at fjerne deadlinen.
          </p>
        </div>
      </div>

      {/* Global lock */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-black text-slate-950">Lås hele spillet</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Global låsning forhindrer alle brugere i at ændre kampbud og
            udsagn — uanset deadlines. Brug dette til pauser eller nødsituationer.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            className="size-5 rounded border-slate-300 text-pitch-700 focus:ring-pitch-700"
            defaultChecked={settings.game_locked}
            id="game_locked"
            name="game_locked"
            type="checkbox"
          />
          <span className="text-sm font-bold text-slate-700">
            Lås hele spillet nu
          </span>
        </label>

        {settings.game_locked && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm font-black text-red-700">
              ⚠ Spillet er i øjeblikket låst for alle brugere.
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Gemmer..." : "Gem indstillinger"}
      </button>

      {state.status === "success" && (
        <p className="text-center text-sm font-black text-pitch-700">
          ✓ {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-center text-sm font-bold text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
