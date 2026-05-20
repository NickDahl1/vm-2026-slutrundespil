import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as Profile[];

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${profiles.length} ${profiles.length === 1 ? "bruger" : "brugere"} registreret`}
        eyebrow="Admin"
        title="Brugere"
      />

      <section className="card overflow-hidden p-0">
        {profiles.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-black text-slate-950">Ingen brugere endnu</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
              key={profile.id}
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-950">
                  {profile.display_name}
                </p>
                <p className="text-xs text-slate-400">
                  Oprettet{" "}
                  {new Date(profile.created_at).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-black ${
                  profile.is_admin
                    ? "bg-pitch-50 text-pitch-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {profile.is_admin ? "Admin" : "Spiller"}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
