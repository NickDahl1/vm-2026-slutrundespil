export function StatCard({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "gold" | "green";
}) {
  const toneClasses = {
    neutral: "border-slate-200 bg-white",
    gold: "border-cup-300 bg-cup-100",
    green: "border-pitch-100 bg-pitch-50"
  };

  return (
    <article className={`card border ${toneClasses[tone]}`}>
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  );
}
