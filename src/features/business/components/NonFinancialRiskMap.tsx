import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessJourneyRiskData } from "../types";

type NonFinancialRiskMapProps = {
  data: BusinessJourneyRiskData;
  onDeepDive: () => void;
};

function severityTone(severity: string) {
  if (severity === "Cảnh báo") return "danger" as const;
  if (severity === "Quan trọng") return "warning" as const;
  return "neutral" as const;
}

export function NonFinancialRiskMap({ data, onDeepDive }: NonFinancialRiskMapProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-7 text-ink">{data.question}</h2>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">{data.shortExplanation}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onDeepDive}>
            Xem sâu hơn
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {data.risks.map((risk) => (
            <section key={risk.riskName} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant={severityTone(risk.severity)}>
                  {risk.severity}
                </Chip>
                <Chip size="sm" variant="neutral">
                  {risk.riskType}
                </Chip>
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink">{risk.riskName}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{risk.whyItMatters}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {risk.realWorldSignals.slice(0, 3).map((signal) => (
                  <Chip key={signal} size="sm" variant="neutral">
                    {signal}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-ink">{risk.practicalConclusion}</p>
            </section>
          ))}
        </div>

        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
          {data.practicalConclusion}
        </p>
      </CardBody>
    </Card>
  );
}
