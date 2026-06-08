import { Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningContextData } from "../types";

type ScreeningContextSummaryProps = {
  data: ScreeningContextData;
  activeIndustry?: string;
};

const contextItems = [
  { key: "tailwind", title: "Gió thuận" },
  { key: "risks", title: "Rủi ro" },
  { key: "confirmations", title: "Cần xác nhận" },
] as const;

export function ScreeningContextSummary({
  activeIndustry = "retail",
  data,
}: ScreeningContextSummaryProps) {
  const summary = data.summariesByIndustry[activeIndustry] ?? data.summariesByIndustry.retail;

  return (
    <Card className="bg-accent-soft">
      <CardHeader description={data.subtitle} icon={data.icon} title={data.title} />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-3">
          {contextItems.map((item) => (
            <div
              key={item.key}
              className="rounded-[4px] border border-border-soft bg-surface/80 px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{summary[item.key]}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
