import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { PrivacyNote } from "@/components/privacy-note";
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
        description="Opret din konto og kom med i slutrundespillet."
        eyebrow="Konto"
        title="Opret spiller"
      />

      <form action={signUpAction} className="card space-y-4">
        <FormMessage searchParams={params} />
        <PrivacyNote />
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Visningsnavn</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
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
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
            name="email"
            placeholder="din@email.dk"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Adgangskode</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 focus:border-pitch-700 focus:outline-none"
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
