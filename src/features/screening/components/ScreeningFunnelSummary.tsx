import { Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningFunnelSummaryData, ScreeningMode } from "../types";

type ScreeningFunnelSummaryProps = {
  data: ScreeningFunnelSummaryData;
  mode: ScreeningMode;
};

export function ScreeningFunnelSummary({ data, mode }: ScreeningFunnelSummaryProps) {
  const isTicker = mode === "ticker";

  return (
    <Card className="bg-surface-soft">
      <CardHeader
        icon="5"
        title={isTicker ? data.tickerTitle : data.contextTitle}
        description="Một dòng tóm tắt đủ để hiểu kết quả đi qua những cửa nào."
      />
      <CardBody>
        <p className="rounded-[4px] border border-border-soft bg-surface px-3 py-3 text-sm font-bold leading-7 text-ink">
          {isTicker ? data.tickerText : data.contextText}
        </p>
      </CardBody>
    </Card>
  );
}
