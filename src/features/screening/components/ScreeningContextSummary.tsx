import { Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningContextData } from "../types";

type ScreeningContextSummaryProps = {
  data: ScreeningContextData;
  activeIndustry?: string;
  ticker?: string | null;
  tickerSector?: string;
};

const contextItems = [
  { key: "tailwind", title: "Gió thuận" },
  { key: "risks", title: "Rủi ro" },
  { key: "confirmations", title: "Cần xác nhận" },
  { key: "priority", title: "Hệ thống sẽ ưu tiên gì" },
] as const;

export function ScreeningContextSummary({
  activeIndustry = "retail",
  data,
  ticker,
  tickerSector,
}: ScreeningContextSummaryProps) {
  const summary = data.summariesByIndustry[activeIndustry] ?? data.summariesByIndustry.retail;
  const description = ticker
    ? `${ticker} thuộc ngành ${tickerSector}. Vì vậy hệ thống kiểm tra mã này trong bối cảnh ngành, chất lượng vận hành, các điểm cần xác nhận và thanh khoản giao dịch.`
    : data.subtitle;

  return (
    <Card className="bg-accent-soft">
      <CardHeader
        description={description}
        icon={data.icon}
        title={ticker ? "Luận điểm bối cảnh của mã này" : data.title}
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
