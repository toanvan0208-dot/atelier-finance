import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { IndustryImpactFactorsData } from "../types";

type IndustryImpactFactorsProps = {
  data: IndustryImpactFactorsData;
};

export function IndustryImpactFactors({ data }: IndustryImpactFactorsProps) {
  return (
    <Card>
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.factors.map((factor) => (
            <article
              key={factor.id}
              className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[11px] font-bold text-accent">
                    {factor.icon}
                  </span>
                  <h3 className="truncate text-sm font-bold text-ink">
                    {factor.label}
                  </h3>
                </div>
                <Chip size="sm">{factor.impactLevel}</Chip>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {factor.description}
              </p>
            </article>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
