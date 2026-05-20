import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konto"
        title="Log ind"
        description="Login-formularen er klar til Supabase Auth, men selve auth-flowet implementeres i en senere opgave."
      />

      <form className="card space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            name="email"
            placeholder="din@email.dk"
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Adgangskode</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            name="password"
            placeholder="Din adgangskode"
            type="password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled
          type="button"
        >
          Log ind med Supabase
        </button>
        <p className="text-center text-sm text-slate-600">
          Ny spiller?{" "}
          <Link className="font-black text-pitch-700" href="/signup">
            Opret konto
          </Link>
        </p>
      </form>
    </div>
  );
}
