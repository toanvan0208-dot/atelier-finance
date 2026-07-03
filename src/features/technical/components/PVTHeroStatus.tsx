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
  const volumeValue =
    data.volume.currentVsAvg20 === null ? data.volume.label : `${data.volume.currentVsAvg20}x TB20`;
  const fomoValue = data.fomo.score === null ? "Không khả dụng" : `${data.fomo.level}, ${data.fomo.score}/${data.fomo.maxScore}`;
  const metrics = [
    { label: "Giá hiện tại", value: `${formatPrice(data.currentPrice)} đ/cp` },
    { label: "Vùng tham khảo dưới", value: data.keyLevels.support },
    { label: "Vùng tham khảo trên", value: data.keyLevels.resistance },
    { label: "Volume", value: volumeValue },
    { label: "FOMO", value: fomoValue },
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
            Giá và thanh khoản đang thay đổi như thế nào?
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink">
            {data.status.conclusion}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Module này giúp quan sát diễn biến giá, khối lượng và thanh khoản theo thời gian. PVT là chỉ báo kết hợp biến động giá và khối lượng, giúp quan sát xem thay đổi giá có đi kèm khối lượng đáng kể hay không. Đây không phải tín hiệu giao dịch hay lời khuyên đầu tư.
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
