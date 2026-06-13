import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationRefactoredData, ValuationScenarioSafetyItem } from "../types";

type ValuationScenarioSafetyProps = {
  data: ValuationRefactoredData["scenarios"];
};

function scenarioVariant(tone: ValuationScenarioSafetyItem["tone"]) {
  if (tone === "upside") return "success";
  if (tone === "downside") return "warning";
  return "accent";
}

function formatCurrentPrice(value: number | null) {
  return value !== null && value > 0 ? new Intl.NumberFormat("vi-VN").format(value) : "Chưa đủ dữ liệu";
}

export function ValuationScenarioSafety({ data }: ValuationScenarioSafetyProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-xl font-bold leading-7 text-ink">Nếu giả định thay đổi, vùng giá sẽ ra sao?</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
            Định giá là một vùng kịch bản, không phải một con số chắc chắn.
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
                {item.name}
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
            <span>Downside</span>
            <span className="text-center">Base</span>
            <span className="text-right">Upside</span>
          </div>
        </div>

        <p className="rounded-[4px] border border-border bg-surface px-4 py-3 text-sm font-bold leading-6 text-ink">
          Giá hiện tại: {formatCurrentPrice(data.currentPrice)}. Vùng cơ sở: {data.baseRange}. {data.conclusion}
        </p>
      </CardBody>
    </Card>
  );
}
