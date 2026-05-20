import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { signUpAction } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konto"
        title="Opret spiller"
        description="Oprettelse skal senere gå gennem Supabase Auth. Adgangskoder gemmes aldrig i klartekst."
      />

      <form action={signUpAction} className="card space-y-4">
        <FormMessage searchParams={params} />
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Visningsnavn</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            maxLength={40}
            minLength={2}
            name="displayName"
            placeholder="Dit spillernavn"
            required
            type="text"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Kan ikke ændres af brugeren bagefter.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            name="email"
            placeholder="din@email.dk"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Adgangskode</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            name="password"
            placeholder="Vælg en adgangskode"
            required
            type="password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-cup-500 px-4 py-3 text-sm font-black text-slate-950"
          type="submit"
        >
          Opret konto
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
