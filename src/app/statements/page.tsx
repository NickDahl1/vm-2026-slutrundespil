import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { statements } from "@/lib/placeholders";

export default async function StatementsPage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Bonus"
        title="Udsagn"
        description="Svar ja eller nej på turneringsudsagn, når den rigtige funktionalitet er klar."
      />

      <section className="space-y-3">
        {statements.map((statement, index) => (
          <article className="card" key={statement}>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-pitch-50 text-sm font-black text-pitch-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-slate-950">{statement}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-500" type="button">
                    Ja
                  </button>
                  <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-500" type="button">
                    Nej
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
