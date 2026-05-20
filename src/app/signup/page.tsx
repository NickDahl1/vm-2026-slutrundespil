import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function SignupPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konto"
        title="Opret spiller"
        description="Oprettelse skal senere gå gennem Supabase Auth. Adgangskoder gemmes aldrig i klartekst."
      />

      <form className="card space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Navn</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            name="name"
            placeholder="Dit spillernavn"
            type="text"
          />
        </label>
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
            placeholder="Vælg en adgangskode"
            type="password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-cup-500 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          disabled
          type="button"
        >
          Opret med Supabase
        </button>
        <p className="text-center text-sm text-slate-600">
          Har du allerede en konto?{" "}
          <Link className="font-black text-pitch-700" href="/login">
            Log ind
          </Link>
        </p>
      </form>
    </div>
  );
}
