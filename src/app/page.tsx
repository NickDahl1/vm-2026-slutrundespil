import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithProfile } from "@/lib/auth";

export default async function HomePage() {
  const { user } = await getUserWithProfile();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="pt-4 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-pitch-500">
          Slutrundespil
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">VM 2026</h1>
        <p className="mt-3 text-base font-semibold text-slate-500">
          Giv dit bud på kampene, svar på udsagn og følg stillingen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="card bg-pitch-700 text-center text-white"
          href="/login"
        >
          <h2 className="text-lg font-black">Log ind</h2>
          <p className="mt-1 text-sm font-semibold text-pitch-100">
            Har du allerede en konto?
          </p>
        </Link>
        <Link
          className="card border border-pitch-100 bg-pitch-50 text-center"
          href="/signup"
        >
          <h2 className="text-lg font-black text-pitch-700">Opret konto</h2>
          <p className="mt-1 text-sm font-semibold text-pitch-500">
            Kom med i spillet nu.
          </p>
        </Link>
      </div>
    </div>
  );
}
