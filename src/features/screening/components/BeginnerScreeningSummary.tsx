import { Card, CardBody, CardHeader, Chip, MetricCard, SectionHeader } from "@/components/ui";
import type { BeginnerScreeningData } from "../types";

type BeginnerScreeningSummaryProps = {
  data: BeginnerScreeningData;
};

export function BeginnerScreeningSummary({ data }: BeginnerScreeningSummaryProps) {
  return (
    <section>
      <SectionHeader
        description={data.description}
        eyebrow={data.eyebrow}
        icon="1"
        title={data.title}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            description={metric.description}
            icon={metric.icon}
            period={metric.period}
            status={metric.status}
            title={metric.title}
            value={metric.value}
          />
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader chip={<Chip variant="accent">{data.mainQuestion}</Chip>} title={data.questionsTitle} />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.questions.map((question, index) => (
              <div
                key={question}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2"
              >
                <span className="font-mono text-[11px] font-bold text-ink">
                  {index + 1}
                </span>
                <p className="mt-1 text-sm leading-6 text-muted">{question}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
