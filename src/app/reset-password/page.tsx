import Link from "next/link";
import { resetPasswordAction } from "@/app/auth/actions";
import { FormMessage } from "@/components/form-message";
import { PageHeader } from "@/components/page-header";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konto"
        title="Nulstil adgangskode"
        description="Skriv din email, så sender Supabase et sikkert link til at vælge en ny adgangskode."
      />

      <form action={resetPasswordAction} className="card space-y-4">
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
        <button
          className="w-full rounded-lg bg-pitch-700 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Send nulstillingslink
        </button>
        <p className="text-center text-sm text-slate-600">
          <Link className="font-black text-pitch-700" href="/login">
            Tilbage til login
          </Link>
        </p>
      </form>
    </div>
  );
}
