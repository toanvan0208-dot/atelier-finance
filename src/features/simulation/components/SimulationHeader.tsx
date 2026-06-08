import { Button, Chip } from "@/components/ui";
import type { SimulationHeaderData } from "../types";

type SimulationHeaderProps = {
  data: SimulationHeaderData;
};

export function SimulationHeader({ data }: SimulationHeaderProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <Chip variant="neutral">{data.mode}</Chip>
            <Chip variant="success">{data.status}</Chip>
          </div>
          <h2 className="text-2xl font-bold leading-tight text-ink">
            {data.ticker} - {data.companyName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{data.subtitle}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.04em] text-subtle">
            Ngành: {data.industry}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {data.actions.map((action) => (
            <Button key={action.label} size="sm" variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
