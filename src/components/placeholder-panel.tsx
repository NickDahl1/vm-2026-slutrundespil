import type { ReactNode } from "react";

export function PlaceholderPanel({
  title,
  children,
  actionLabel
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <span className="badge">Placeholder</span>
      </div>
      <div>{children}</div>
      {actionLabel ? (
        <button
          className="mt-4 w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
          disabled
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
