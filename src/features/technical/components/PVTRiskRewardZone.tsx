import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTRiskRewardZoneData } from "../types";

type PVTRiskRewardZoneProps = {
  data: PVTRiskRewardZoneData;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function PVTRiskRewardZone({ data }: PVTRiskRewardZoneProps) {
  const rows = [
    { label: "Giá hiện tại", value: formatPrice(data.currentPrice) },
    { label: "Hỗ trợ gần", value: formatPrice(data.supportPrice) },
    { label: "Kháng cự gần", value: formatPrice(data.resistancePrice) },
    { label: "Upside gần", value: data.upside },
    { label: "Downside gần", value: data.downside },
  ];

  return (
    <Card>
      <CardHeader
        title="Tỷ lệ rủi ro/lợi nhuận theo vùng quan sát"
        description="Chỉ là vùng cần quan sát, không phải vùng hành động chắc chắn."
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[4px] border border-border-soft bg-surface-soft p-3">
              <p className="text-[11px] font-bold uppercase text-subtle">{row.label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{row.value}</p>
            </div>
          ))}
        </div>
        <Chip variant="warning">Cần thận trọng</Chip>
        <p className="text-sm font-semibold leading-6 text-ink">{data.conclusion}</p>
      </CardBody>
    </Card>
  );
}
