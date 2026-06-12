import { Card, CardBody, Chip } from "@/components/ui";
import type { PVTObservationData, PVTStatusTone } from "../types";

type PVTHeroStatusProps = {
  data: PVTObservationData;
};

const toneVariant: Record<PVTStatusTone, "success" | "warning" | "danger" | "neutral"> = {
  positive: "success",
  caution: "warning",
  risk: "danger",
  neutral: "neutral",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function PVTHeroStatus({ data }: PVTHeroStatusProps) {
  const metrics = [
    { label: "Giá hiện tại", value: `${formatPrice(data.currentPrice)} đ/cp` },
    { label: "Hỗ trợ gần", value: data.keyLevels.support },
    { label: "Kháng cự gần", value: data.keyLevels.resistance },
    { label: "Volume", value: `${data.volume.currentVsAvg20}x TB20` },
    { label: "FOMO", value: `${data.fomo.level}, ${data.fomo.score}/${data.fomo.maxScore}` },
  ];

  return (
    <Card>
      <CardBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Quan sát Price - Volume - Time</Chip>
            <Chip variant={toneVariant[data.status.tone]}>{data.status.label}</Chip>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase text-subtle">
            {data.ticker} · {data.companyName} · {data.industry}
          </p>
          <h1 className="mt-2 font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
            Giá và dòng tiền hiện tại đang xác nhận luận điểm hay đang tạo FOMO?
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink">
            {data.status.conclusion}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Module này chỉ giúp quan sát hành vi thị trường sau các bước phân tích cơ bản, không phải màn hình giao dịch ngắn hạn.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
              <p className="mt-1 text-lg font-bold text-ink">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
