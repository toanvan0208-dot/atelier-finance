import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ValuationReadinessData, ValuationReadinessItem } from "../types";

type ValuationReadinessPanelProps = {
  data: ValuationReadinessData;
};

const itemVariant: Record<ValuationReadinessItem["status"], "success" | "warning" | "neutral"> = {
  done: "success",
  needs_review: "warning",
  missing: "neutral",
};

const itemLabel: Record<ValuationReadinessItem["status"], string> = {
  done: "Đã xong",
  needs_review: "Cần xem lại",
  missing: "Chưa có",
};

const statusVariant: Record<ValuationReadinessData["status"], "success" | "warning" | "neutral"> = {
  "Có thể sang định giá": "success",
  "Nên kiểm tra thêm": "warning",
  "Chưa đủ điều kiện": "neutral",
};

export function ValuationReadinessPanel({ data }: ValuationReadinessPanelProps) {
  const canContinue = data.completed === data.total;

  return (
    <Card className="border-border">
      <CardHeader
        chip={<Chip variant={statusVariant[data.status]}>{data.status}</Chip>}
        description={data.description}
        icon="V"
        title={data.title}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[0.55fr_1.45fr] lg:items-start">
          <div className="rounded-[4px] bg-surface-soft px-4 py-4">
            <p className="font-brand text-3xl font-bold text-ink">{data.completed}/{data.total}</p>
            <p className="mt-1 text-xs leading-5 text-muted">điều kiện đã hoàn thành</p>
            <div className="mt-3 h-2 overflow-hidden rounded-[3px] bg-surface">
              <div className="h-full bg-accent" style={{ width: `${(data.completed / data.total) * 100}%` }} />
            </div>
            <Button className="mt-4 w-full" size="sm" variant={canContinue ? "primary" : "secondary"} disabled={!canContinue}>
              {canContinue ? data.ctaLabel : data.disabledCtaLabel}
            </Button>
            {!canContinue ? <p className="mt-2 text-xs leading-5 text-muted">{data.helperText}</p> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{item.label}</p>
                  <Chip size="sm" variant={itemVariant[item.status]}>{itemLabel[item.status]}</Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.helperText}</p>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
