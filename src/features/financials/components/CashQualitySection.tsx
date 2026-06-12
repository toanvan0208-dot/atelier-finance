type CashQualitySectionProps = {
  data: {
    title: string;
    summary: string;
    checks: string[];
  };
};

export function CashQualitySection({ data }: CashQualitySectionProps) {
  return (
    <section className="rounded-[6px] border border-warning/70 bg-warning/10 p-4">
      <h3 className="text-base font-extrabold text-ink">{data.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{data.summary}</p>
      <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-3">
        {data.checks.map((check) => (
          <li key={check} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
            {check}
          </li>
        ))}
      </ul>
    </section>
  );
}
