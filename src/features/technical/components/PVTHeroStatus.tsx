import { Chip } from "@/components/ui";
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

function formatVolumeRatio(value: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)}x TB20`;
}

export function PVTHeroStatus({ data }: PVTHeroStatusProps) {
  const volumeValue =
    data.volume.currentVsAvg20 === null ? data.volume.label : formatVolumeRatio(data.volume.currentVsAvg20);
  const metrics = [
    { label: "Giá hiện tại", value: `${formatPrice(data.currentPrice)} đ/cp` },
    { label: "Vùng tham khảo dưới", value: data.keyLevels.support },
    { label: "Vùng tham khảo trên", value: data.keyLevels.resistance },
    { label: "Thanh khoản", value: volumeValue },
  ];

  return (
    <section className="overflow-hidden rounded-[8px] border-[1.5px] border-slate-950 bg-white shadow-[5px_5px_0_rgb(15_23_42_/_0.24)]">
      <div className="grid gap-0 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-amber-300 bg-amber-200/40 blur-2xl lg:block" />
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Quan sát giá - thanh khoản - thời điểm</Chip>
            <Chip variant={toneVariant[data.status.tone]}>{data.status.label}</Chip>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase text-subtle">
            {data.ticker} · {data.companyName} · {data.industry}
          </p>
          <h1 className="mt-3 max-w-[760px] font-brand text-4xl font-black leading-[1.05] text-slate-950 md:text-5xl">
            Nhịp giá và thanh khoản đang kể câu chuyện gì?
          </h1>
          <p className="mt-5 max-w-3xl text-base font-bold leading-7 text-slate-950">
            {data.status.conclusion}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            PVT giúp đọc nhịp giá, khối lượng và thời điểm trong cùng một bối cảnh. Đây là lớp quan sát thị trường,
            không phải lời nhắc hành động hay lời khuyên đầu tư.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <HeroMini label="Giá" value={`${formatPrice(data.currentPrice)} đ/cp`} />
            <HeroMini label="Vùng dưới" value={data.keyLevels.support} />
            <HeroMini label="Vùng trên" value={data.keyLevels.resistance} />
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-amber-50 p-5 2xl:border-l 2xl:border-t-0">
          <div className="rounded-[8px] border border-amber-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Bản đồ quan sát</p>
            <div className="mt-4 grid gap-3">
              {["Giá", "Thanh khoản", "Thời điểm"].map((label, index) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{label}</span>
                    <span>{index === 1 ? volumeValue : index === 0 ? data.status.label : "Cần đối chiếu"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-amber-100">
                    <div className="h-2 rounded-full bg-amber-300" style={{ width: `${56 + index * 16}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[8px] border border-amber-200 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
              <p className="mt-1 text-lg font-bold text-ink">{metric.value}</p>
            </div>
          ))}
        </div>
        </aside>
      </div>
    </section>
  );
}

function HeroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}
