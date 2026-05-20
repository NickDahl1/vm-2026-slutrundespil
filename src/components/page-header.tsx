export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mb-5">
      {eyebrow ? (
        <p className="mb-2 text-xs font-black uppercase text-pitch-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
    </section>
  );
}
