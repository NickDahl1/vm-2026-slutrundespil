import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { leaderboard } from "@/lib/placeholders";

export default async function LeaderboardPage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Stillingen"
        title="Leaderboard"
        description="En foreløbig tabel, hvor point og placeringer bliver dynamiske senere."
      />

      <section className="card overflow-hidden p-0">
        <div className="grid grid-cols-[56px_1fr_72px_104px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
          <span>Pl.</span>
          <span>Spiller</span>
          <span className="text-right">Point</span>
          <span className="text-right">Status</span>
        </div>
        {leaderboard.map((player) => (
          <div
            className="grid grid-cols-[56px_1fr_72px_104px] items-center border-b border-slate-100 px-4 py-4 last:border-b-0"
            key={player.name}
          >
            <span className="font-black text-slate-950">#{player.rank}</span>
            <span className="font-bold text-slate-800">{player.name}</span>
            <span className="text-right font-black text-slate-950">
              {player.points}
            </span>
            <span className="text-right">
              <span className="badge">{player.badge}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
