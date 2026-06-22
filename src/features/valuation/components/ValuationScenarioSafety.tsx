import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationRefactoredData, ValuationScenarioSafetyItem } from "../types";

type ValuationScenarioSafetyProps = {
  data: ValuationRefactoredData["scenarios"];
};

function scenarioVariant(tone: ValuationScenarioSafetyItem["tone"]) {
  if (tone === "upper") return "success";
  if (tone === "lower") return "warning";
  return "accent";
}

function formatCurrentPrice(value: number | null) {
  return value !== null && value > 0 ? new Intl.NumberFormat("vi-VN").format(value) : "Chưa đủ dữ liệu";
}

const scenarioLabel = (name: ValuationScenarioSafetyItem["name"]): string => {
  if (name === "Kịch bản xấu") return "Thiếu dữ liệu";
  if (name === "Kịch bản tốt") return "Có thể tính";
  return "Cần kiểm tra";
};

export function ValuationScenarioSafety({ data }: ValuationScenarioSafetyProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-xl font-bold leading-7 text-ink">Nếu dữ liệu thay đổi, chỉ số cần kiểm tra gì?</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
            Phần này là checklist dữ liệu, không tạo kịch bản giá hoặc kết luận hành động.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {data.items.map((item) => (
            <section
              key={item.name}
              className={[
                "rounded-[4px] border px-4 py-4",
                item.tone === "base" ? "border-border bg-accent-soft" : "border-border-soft bg-surface-soft",
              ].join(" ")}
            >
              <Chip size="sm" variant={scenarioVariant(item.tone)}>
                {scenarioLabel(item.name)}
              </Chip>
              <p className="mt-3 text-lg font-bold text-ink">{item.range}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.explanation}</p>
            </section>
          ))}
        </div>

        <div>
          <div className="grid h-3 overflow-hidden rounded-[3px] border border-border bg-surface md:grid-cols-3">
            <div className="bg-warning/25" />
            <div className="bg-accent/35" />
            <div className="bg-accent-green/20" />
          </div>
          <div className="mt-2 grid grid-cols-3 text-[11px] font-bold text-subtle">
            <span>Thiếu dữ liệu</span>
            <span className="text-center">Cần kiểm tra</span>
            <span className="text-right">Có thể tính</span>
          </div>
        </div>

        <p className="rounded-[4px] border border-border bg-surface px-4 py-3 text-sm font-bold leading-6 text-ink">
          Giá hiện tại: {formatCurrentPrice(data.currentPrice)}. Trạng thái chính: {data.baseRange}. {data.conclusion}
        </p>
      </CardBody>
    </Card>
  );
}
