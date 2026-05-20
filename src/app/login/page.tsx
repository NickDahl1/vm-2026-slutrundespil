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
        eyebrow="Konto"
        title="Log ind"
        description="Login-formularen er klar til Supabase Auth, men selve auth-flowet implementeres i en senere opgave."
      />

      <form action={loginAction} className="card space-y-4">
        <FormMessage searchParams={params} />
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
