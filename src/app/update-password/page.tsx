import { updatePasswordAction } from "@/app/auth/actions";
import { FormMessage } from "@/components/form-message";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export default async function UpdatePasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konto"
        title="Vælg ny adgangskode"
        description="Din nye adgangskode sendes direkte til Supabase Auth og gemmes ikke i appens database."
      />

      <form action={updatePasswordAction} className="card space-y-4">
        <FormMessage searchParams={params} />
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Ny adgangskode</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            minLength={8}
            name="password"
            placeholder="Mindst 8 tegn"
            required
            type="password"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Gentag adgangskode</span>
          <input
            className="mt-1 w-full rounded-lg border-slate-300 bg-white"
            minLength={8}
            name="confirmPassword"
            placeholder="Gentag adgangskoden"
            required
            type="password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Opdater adgangskode
        </button>
      </form>
    </div>
  );
}
