import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  BeginnerFitLevel,
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

export function ScreeningStockCard({
  labels,
  onExplain,
  stock,
  tone,
}: ScreeningStockCardProps) {
  return (
    <Card>
      <CardHeader
        chip={<Chip variant={tone}>{stock.classification}</Chip>}
        description={stock.companyName}
        title={stock.ticker}
      />
      <CardBody className="space-y-4">
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
            <p className="mt-1 text-sm leading-6 text-muted">{stock.needToCheck}</p>
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

        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          <Button size="sm" variant="primary" onClick={() => onExplain(stock)}>
            {labels.explainAction}
          </Button>
          <Button size="sm" variant="secondary">
            {labels.compareAction}
          </Button>
          <Button size="sm" variant="ghost">
            {labels.nextAction}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
