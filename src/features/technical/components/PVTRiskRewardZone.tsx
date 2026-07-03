import { Chip } from "@/components/ui";
import type { PVTRiskRewardZoneData } from "../types";

type PVTRiskRewardZoneProps = {
  data: PVTRiskRewardZoneData;
};

function formatPrice(value: number | null) {
  if (value === null) return "Không khả dụng";
  return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}

export function PVTRiskRewardZone({ data }: PVTRiskRewardZoneProps) {
  const hasComputedZone = data.supportPrice !== null || data.resistancePrice !== null;
  const conclusion = hasComputedZone
    ? "Vùng hỗ trợ/kháng cự là vùng quan sát tham khảo được ước tính từ chuỗi giá đang hiển thị."
    : data.conclusion;
  const rows = [
    { label: "Giá hiện tại", value: formatPrice(data.currentPrice), tone: "strong" },
    { label: "Vùng tham khảo dưới", value: formatPrice(data.supportPrice), tone: "soft" },
    { label: "Vùng tham khảo trên", value: formatPrice(data.resistancePrice), tone: "soft" },
    { label: "Khoảng cách tới kháng cự", value: data.upside, tone: "soft" },
    { label: "Khoảng cách tới hỗ trợ", value: data.downside, tone: "soft" },
  ];

  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Vùng giá tham khảo</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Tóm tắt vùng giá cần quan sát</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Chỉ giúp đặt câu hỏi tiếp theo, không phải vùng hành động chắc chắn.
            </p>
          </div>
          <Chip variant="warning">Cần thận trọng</Chip>
        </div>
      </header>
      <div className="grid gap-4 p-5 2xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-[8px] border border-slate-950 bg-slate-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-300">Giá hiện tại</p>
          <p className="mt-3 text-4xl font-black">{formatPrice(data.currentPrice)}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">Dùng làm mốc đọc các vùng còn lại.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.slice(1).map((row) => (
            <div key={row.label} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">{row.label}</p>
              <p className="mt-2 text-lg font-black text-slate-950">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-950">
        {conclusion}
      </div>
    </section>
  );
}
