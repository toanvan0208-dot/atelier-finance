import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  BeginnerFitLevel,
  ScreeningMetricStatus,
  ScreeningStock,
  ScreeningStockCardLabels,
  ScreeningTone,
} from "../types";

type ScreeningStockCardProps = {
  labels: ScreeningStockCardLabels;
  stock: ScreeningStock;
  tone: ScreeningTone;
  onExplain: (stock: ScreeningStock) => void;
};

function fitTone(fit: BeginnerFitLevel) {
  if (fit === "Dễ hiểu") return "success";
  if (fit === "Trung bình") return "warning";
  return "danger";
}

function metricTone(status: ScreeningMetricStatus) {
  if (status === "pass") return "success";
  if (status === "watch") return "warning";
  if (status === "risk") return "danger";
  return "neutral";
}

function primaryAction(stock: ScreeningStock) {
  if (stock.groupKey === "priority") return "Mở hồ sơ phân tích";
  if (stock.groupKey === "review") return "Thêm vào watchlist";
  return "Xem vì sao chưa phù hợp";
}

function secondaryActions(stock: ScreeningStock, labels: ScreeningStockCardLabels) {
  if (stock.groupKey === "excluded") return [labels.explainAction, "Ẩn khỏi danh sách"];
  return [labels.explainAction, labels.compareAction];
}

export function ScreeningStockCard({
  labels,
  onExplain,
  stock,
  tone,
}: ScreeningStockCardProps) {
  return (
    <Card className="h-full">
      <CardHeader
        chip={<Chip variant={tone}>{stock.classification}</Chip>}
        description={`${stock.companyName} · ${stock.sector}`}
        title={stock.ticker}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stock.metrics.slice(0, 7).map((metric) => (
            <div
              key={metric.id}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
              title={metric.explanation}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                  {metric.label}
                </p>
                {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{metric.value}</p>
                <Chip size="sm" variant={metricTone(metric.status)}>{metric.status}</Chip>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {labels.reason}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">{stock.mainReason}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {labels.needToCheck}
            </p>
            <div className="mt-1 grid gap-1">
              {stock.checks.slice(0, 3).map((check) => (
                <p key={check} className="text-xs leading-5 text-muted">{check}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-subtle">
            {labels.beginnerFit}
          </span>
          <Chip variant={fitTone(stock.beginnerFitLevel)}>
            {stock.beginnerFitLevel}
          </Chip>
          <span className="text-xs font-semibold text-subtle">
            {labels.status}
          </span>
          <Chip variant="neutral">Ứng viên sau vòng sơ lọc</Chip>
        </div>

        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          {labels.note}
        </p>

        <div className="flex flex-col gap-2 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button size="sm" variant="primary">
            {primaryAction(stock)}
          </Button>
          <div className="flex flex-wrap gap-2">
            {secondaryActions(stock, labels).map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === labels.explainAction ? "secondary" : "ghost"}
                onClick={action === labels.explainAction ? () => onExplain(stock) : undefined}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
