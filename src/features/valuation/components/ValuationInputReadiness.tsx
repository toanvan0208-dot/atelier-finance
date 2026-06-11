import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ValuationInputReadinessData, ValuationInputReadinessItem } from "../types";

type ValuationInputReadinessProps = {
  data: ValuationInputReadinessData;
};

const itemVariant: Record<ValuationInputReadinessItem["status"], "success" | "warning" | "danger" | "neutral"> = {
  done: "success",
  needs_check: "warning",
  risk: "danger",
  missing: "neutral",
};

const itemLabel: Record<ValuationInputReadinessItem["status"], string> = {
  done: "Đã rõ",
  needs_check: "Cần kiểm tra",
  risk: "Rủi ro",
  missing: "Thiếu dữ liệu",
};

export function ValuationInputReadiness({ data }: ValuationInputReadinessProps) {
  return (
    <Card className="border-border-soft">
      <CardHeader
        chip={<Chip variant="warning">Độ tin cậy đầu vào: {data.confidenceLabel}</Chip>}
        description="Định giá sai thường đến từ đầu vào sai, không chỉ từ công thức."
        icon="I"
        title={data.title}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[0.55fr_1.45fr]">
          <div className="rounded-[4px] bg-surface-soft px-4 py-4">
            <p className="font-brand text-3xl font-bold text-ink">{data.completed}/{data.total}</p>
            <p className="mt-1 text-xs leading-5 text-muted">đầu vào đã rõ</p>
            <div className="mt-3 h-2 overflow-hidden rounded-[3px] bg-surface">
              <div className="h-full bg-accent" style={{ width: `${(data.completed / data.total) * 100}%` }} />
            </div>
            <p className="mt-3 rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.warning}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.concernItems.map((item) => <Chip key={item} size="sm" variant="warning">{item}</Chip>)}
            </div>
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

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary">Quay lại BCTC</Button>
          <Button size="sm" variant="secondary">Xem giả định</Button>
          <Button size="sm" variant="primary">Tiếp tục với độ tin cậy trung bình</Button>
        </div>
      </CardBody>
    </Card>
  );
}
