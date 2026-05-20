import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { statements } from "@/lib/placeholders";

export default function AdminStatementsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Udsagn"
        description="Placeholder til at oprette og lukke bonusudsagn."
      />

      <PlaceholderPanel title="15 udsagn" actionLabel="Rediger udsagn senere">
        <ol className="space-y-2">
          {statements.map((statement) => (
            <li
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700"
              key={statement}
            >
              {statement}
            </li>
          ))}
        </ol>
      </PlaceholderPanel>
    </div>
  );
}
