import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/auth/actions";
import { getUserWithProfile } from "@/lib/auth";

const guestNavigation = [{ href: "/", label: "Hjem" }];

const userNavigation = [
  { href: "/dashboard", label: "Hjem" },
  { href: "/matches", label: "Kampe" },
  { href: "/statements", label: "Udsagn" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/predictions", label: "Alles bud" },
  { href: "/statistics", label: "Statistik" },
  { href: "/rules", label: "Regler" },
  { href: "/contact", label: "Kontakt" },
];

export async function SiteShell({ children }: { children: ReactNode }) {
  const { user, profile } = await getUserWithProfile();
  const navigation = user
    ? [
        ...userNavigation,
        ...(profile?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : guestNavigation;

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-white/70 bg-white/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-pitch-700 text-sm font-black text-white shadow-card">
              VM
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-slate-950">
                VM 2026
              </span>
              <span className="block truncate text-xs font-semibold text-pitch-700">
                Slutrundespil
              </span>
            </span>
          </Link>

          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-36 truncate text-sm font-bold text-slate-700 sm:block">
                {profile?.display_name ?? "Spiller"}
              </span>
              <form action={logoutAction}>
                <button
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
                  type="submit"
                >
                  Log ud
                </button>
              </form>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
              >
                Log ind
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-cup-500 px-3 py-2 text-sm font-black text-slate-950 shadow-sm"
              >
                Opret
              </Link>
            </div>
          )}
        </div>
        <nav className="mx-auto mt-3 flex max-w-5xl gap-2 overflow-x-auto pb-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
