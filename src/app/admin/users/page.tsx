import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const users = [
  { name: "Maja", status: "Aktiv", role: "Spiller" },
  { name: "Jonas", status: "Aktiv", role: "Spiller" },
  { name: "Nick", status: "Admin", role: "Admin" }
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Brugere"
        description="Placeholder til brugeroversigt, roller og status fra Supabase."
      />

      <PlaceholderPanel title="Brugeroversigt">
        <div className="space-y-3">
          {users.map((user) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              key={user.name}
            >
              <div>
                <p className="font-black text-slate-950">{user.name}</p>
                <p className="text-sm text-slate-600">{user.role}</p>
              </div>
              <span className="badge">{user.status}</span>
            </div>
          ))}
        </div>
      </PlaceholderPanel>
    </div>
  );
}
