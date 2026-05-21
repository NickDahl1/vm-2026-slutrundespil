import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { loginAction } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        description="Log ind med din email og adgangskode."
        eyebrow="Konto"
        title="Log ind"
      />

      <form action={loginAction} className="card space-y-4">
        <FormMessage searchParams={params} />
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
            placeholder="Din adgangskode"
            required
            type="password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Log ind
        </button>
        <p className="text-center text-sm text-slate-600">
          <Link className="font-black text-pitch-700" href="/reset-password">
            Glemt adgangskode?
          </Link>
        </p>
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
