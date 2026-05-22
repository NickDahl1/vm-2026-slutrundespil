import { PageHeader } from "@/components/page-header";
import { FormMessage } from "@/components/form-message";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteUserAction, updateUserAction } from "./actions";

type AdminProfile = {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

type LeaderboardRow = {
  user_id: string;
  predictions_count: number;
  statement_answers_count: number;
  total_points: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profilesData }, { data: leaderboardData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, is_admin, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("leaderboard_view")
      .select(
        "user_id, predictions_count, statement_answers_count, total_points"
      )
  ]);

  const profiles = (profilesData ?? []) as AdminProfile[];
  const leaderboardRows = (leaderboardData ?? []) as LeaderboardRow[];
  const leaderboardByUser = new Map(
    leaderboardRows.map((row) => [row.user_id, row])
  );

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${profiles.length} ${
          profiles.length === 1 ? "bruger" : "brugere"
        } registreret`}
        eyebrow="Admin"
        title="Brugere"
      />

      <FormMessage searchParams={params} />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Email ligger i Supabase Auth og vises ikke her uden en sikker server-side
        Auth Admin API-integration. Sletning rydder profil og spildata, men
        sletter ikke auth.users.
      </div>

      <section className="card overflow-hidden p-0">
        {profiles.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-black text-slate-950">Ingen brugere endnu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[76rem] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-3">Display name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Admin</th>
                  <th className="px-3 py-3">Oprettet</th>
                  <th className="px-3 py-3 text-right">Kampbud</th>
                  <th className="px-3 py-3 text-right">Udsagnssvar</th>
                  <th className="px-3 py-3 text-right">Point</th>
                  <th className="px-3 py-3">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile) => {
                  const editFormId = `edit-user-${profile.id}`;
                  const stats = leaderboardByUser.get(profile.id);
                  const isCurrentUser = profile.id === user.id;

                  return (
                    <tr className="align-top" key={profile.id}>
                      <td className="px-3 py-3">
                        <input
                          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 shadow-sm"
                          defaultValue={profile.display_name}
                          form={editFormId}
                          maxLength={40}
                          minLength={2}
                          name="display_name"
                          required
                        />
                        {isCurrentUser ? (
                          <p className="mt-1 text-xs font-semibold text-pitch-700">
                            Det er dig
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-400">
                        Ikke tilgængelig
                      </td>
                      <td className="px-3 py-3">
                        {isCurrentUser ? (
                          <input form={editFormId} name="is_admin" type="hidden" value="on" />
                        ) : null}
                        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                          <input
                            className="rounded border-slate-300 text-pitch-700 focus:ring-pitch-700"
                            defaultChecked={profile.is_admin}
                            disabled={isCurrentUser}
                            form={editFormId}
                            name="is_admin"
                            type="checkbox"
                          />
                          {profile.is_admin ? "Admin" : "Spiller"}
                        </label>
                        {isCurrentUser ? (
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Kan ikke fjernes her
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-600">
                        {formatDate(profile.created_at)}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-950">
                        {stats?.predictions_count ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-950">
                        {stats?.statement_answers_count ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-950">
                        {stats?.total_points ?? 0}
                      </td>
                      <td className="w-72 px-3 py-3">
                        <form action={updateUserAction} id={editFormId}>
                          <input name="id" type="hidden" value={profile.id} />
                        </form>
                        <div className="space-y-2">
                          <button
                            className="rounded-lg border border-pitch-100 bg-pitch-50 px-3 py-2 text-xs font-black text-pitch-700 shadow-sm"
                            form={editFormId}
                            type="submit"
                          >
                            Gem ændringer
                          </button>

                          {isCurrentUser ? (
                            <p className="text-xs font-semibold text-slate-400">
                              Du kan ikke slette dig selv.
                            </p>
                          ) : (
                            <details className="rounded-lg border border-red-200 bg-red-50 p-3">
                              <summary className="cursor-pointer text-xs font-black text-red-700">
                                Slet bruger
                              </summary>
                              <form
                                action={deleteUserAction}
                                className="mt-3 space-y-2"
                              >
                                <input name="id" type="hidden" value={profile.id} />
                                <label className="flex items-start gap-2 text-xs font-semibold text-red-800">
                                  <input
                                    className="mt-0.5 rounded border-red-300 text-red-700 focus:ring-red-700"
                                    name="confirm_delete"
                                    required
                                    type="checkbox"
                                  />
                                  Slet profil, kampbud, udsagnssvar, kontaktbeskeder og snapshots.
                                </label>
                                <input
                                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-900 placeholder:text-red-300"
                                  name="confirm_text"
                                  placeholder='Skriv "SLET"'
                                  required
                                />
                                <button
                                  className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white shadow-sm"
                                  type="submit"
                                >
                                  Slet permanent fra spillet
                                </button>
                              </form>
                            </details>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
