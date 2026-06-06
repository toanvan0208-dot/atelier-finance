import { Button, Chip } from "@/components/ui";
import type { TechnicalHeaderData } from "../types";

type TechnicalHeaderProps = {
  data: TechnicalHeaderData;
};

export function TechnicalHeader({ data }: TechnicalHeaderProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <Chip variant="neutral">{data.subtitle}</Chip>
            <Chip variant="warning">{data.status}</Chip>
          </div>
          <h1 className="mt-3 font-brand text-2xl font-bold text-ink">
            {data.ticker} - {data.companyName}
          </h1>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">
            {data.previousContext}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[360px] xl:grid-cols-1">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
            <p className="text-sm font-bold text-ink">{data.industry}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Khung thời gian</p>
            <p className="text-sm font-bold text-ink">{data.timeframe}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Trạng thái</p>
            <p className="text-sm font-bold text-ink">{data.status}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.actions.map((action) => (
          <Button key={action.label} size="sm" variant={action.variant}>
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
