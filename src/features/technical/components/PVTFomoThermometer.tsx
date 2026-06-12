import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTFomoData } from "../types";

type PVTFomoThermometerProps = {
  data: PVTFomoData;
};

export function PVTFomoThermometer({ data }: PVTFomoThermometerProps) {
  const ratio = Math.min(100, (data.score / data.maxScore) * 100);

  return (
    <Card>
      <CardHeader
        title="Thước đo FOMO"
        description="Nhận diện lúc cảm xúc có thể kéo bạn đi nhanh hơn dữ liệu."
        chip={<Chip variant="warning">{data.level} · {data.score}/{data.maxScore}</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="h-3 rounded-full bg-neutral">
          <div className="h-3 rounded-full bg-warning" style={{ width: `${ratio}%` }} />
        </div>
        <div className="grid gap-2">
          {data.signs.map((sign) => (
            <p key={sign} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
              {sign}
            </p>
          ))}
        </div>
        <p className="text-sm font-semibold leading-6 text-ink">{data.conclusion}</p>
      </CardBody>
    </Card>
  );
}
