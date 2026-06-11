import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { FinancialConclusionCheckpointData } from "../types";

type FinancialConclusionCheckpointProps = {
  data: FinancialConclusionCheckpointData;
};

const statusVariant: Record<FinancialConclusionCheckpointData["status"], "success" | "warning" | "danger" | "neutral"> = {
  "Xác nhận sơ bộ thesis": "success",
  "Chưa đủ dữ liệu": "neutral",
  "Có điểm cần theo dõi": "warning",
  "Có rủi ro đáng chú ý": "danger",
};

export function FinancialConclusionCheckpoint({ data }: FinancialConclusionCheckpointProps) {
  return (
    <Card className="border-border">
      <CardHeader
        chip={<Chip variant={statusVariant[data.status]}>{data.status}</Chip>}
        description="Tóm tắt phần BCTC trước khi dùng số liệu cho định giá."
        icon="K"
        title={data.title}
      />
      <CardBody className="space-y-4">
        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm font-bold leading-6 text-ink">
          {data.conclusion}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-subtle">Bằng chứng hỗ trợ</p>
            <div className="mt-2 space-y-2">
              {data.supportingEvidence.map((item) => (
                <p key={item} className="rounded-[4px] bg-success/10 px-3 py-2 text-xs leading-5 text-ink">{item}</p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-subtle">Cần thận trọng</p>
            <div className="mt-2 space-y-2">
              {data.cautionPoints.map((item) => (
                <p key={item} className="rounded-[4px] bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{item}</p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-subtle">Điều kiện làm thesis yếu đi</p>
            <div className="mt-2 space-y-2">
              {data.weakeningConditions.map((item) => (
                <p key={item} className="rounded-[4px] bg-danger/10 px-3 py-2 text-xs leading-5 text-ink">{item}</p>
              ))}
            </div>
          </div>
        </div>

        <Button size="sm" variant="secondary">{data.ctaLabel}</Button>
      </CardBody>
    </Card>
  );
}
