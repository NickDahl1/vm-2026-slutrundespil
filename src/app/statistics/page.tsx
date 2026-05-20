import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { requireUser } from "@/lib/auth";

export default async function StatisticsPage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Indsigt"
        title="Statistik"
        description="Her kommer samlet spilstatistik, budfordeling og turneringstal senere."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceholderPanel title="Budfordeling">
          <p className="text-sm leading-6 text-slate-600">
            Diagrammer og procentfordelinger kobles på, når kampbud findes i
            databasen.
          </p>
        </PlaceholderPanel>
        <PlaceholderPanel title="Turneringsstatus">
          <p className="text-sm leading-6 text-slate-600">
            Kampdata og resultater opdateres senere via automatisk dataflow.
          </p>
        </PlaceholderPanel>
      </div>
    </div>
  );
}
