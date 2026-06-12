type RiskCheckSectionProps = {
  data: {
    title: string;
    summary: string;
    checks: string[];
  };
};

export function RiskCheckSection({ data }: RiskCheckSectionProps) {
  return (
    <section className="rounded-[6px] border border-danger/50 bg-danger/5 p-4">
      <h3 className="text-base font-extrabold text-ink">{data.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{data.summary}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {data.checks.map((check) => (
          <p key={check} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-sm leading-5 text-muted">
            {check}
          </p>
        ))}
      </div>
    </section>
  );
}
