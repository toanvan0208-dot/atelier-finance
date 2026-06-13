import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationSummaryData } from "../types";

type ValuationSummaryHeroProps = {
  data: ValuationSummaryData;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function hasValidRange(low: number, high: number) {
  return low > 0 && high > 0 && high >= low;
}

function markerPosition(current: number | null, low: number, high: number) {
  if (!hasValidRange(low, high) || current === null || current <= 0) return 50;
  const min = Math.round(low * 0.82);
  const max = Math.round(high * 1.18);
  const percent = ((current - min) / (max - min)) * 100;
  return Math.min(94, Math.max(6, percent));
}

export function ValuationSummaryHero({ data }: ValuationSummaryHeroProps) {
  const marker = markerPosition(data.currentPrice, data.fairValueRange.low, data.fairValueRange.high);
  const rangeLabel = hasValidRange(data.fairValueRange.low, data.fairValueRange.high)
    ? `${formatPrice(data.fairValueRange.low)} đến ${formatPrice(data.fairValueRange.high)} đ/cp`
    : "Chưa đủ dữ liệu";
  const currentPriceLabel = data.currentPrice !== null && data.currentPrice > 0 ? `${formatPrice(data.currentPrice)} đ/cp` : "Chưa đủ dữ liệu";

  return (
    <Card className="border-border">
      <CardBody className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Kết luận định giá sơ bộ</Chip>
            <Chip variant="neutral">{data.ticker}</Chip>
            <Chip variant="neutral">{data.companyName}</Chip>
          </div>
          <h1 className="mt-4 text-2xl font-bold leading-tight text-ink md:text-[30px]">
            Giá hiện tại đang ở đâu so với dữ liệu định giá hiện có?
          </h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Giá hiện tại" value={currentPriceLabel} />
            <Metric label="Vùng giá trị nội tại" value={rangeLabel} />
            <Metric label="Biên an toàn" value={data.fairValueRange.marginOfSafety} />
          </div>
          <p className="mt-4 rounded-[4px] border border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
            {data.fairValueRange.conclusion}
          </p>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Chip variant="success">{data.fairValueRange.status}</Chip>
            <Chip variant="neutral">Độ tin cậy: {data.fairValueRange.confidence}</Chip>
          </div>
          <div className="mt-6">
            <div className="relative h-4 rounded-[3px] border border-border bg-surface">
              <div className="absolute inset-y-0 left-0 w-[31%] rounded-l-[2px] bg-accent-green/20" />
              <div className="absolute inset-y-0 left-[31%] w-[38%] bg-accent/35" />
              <div className="absolute inset-y-0 right-0 w-[31%] rounded-r-[2px] bg-danger/15" />
              <div
                className="absolute top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-ink"
                style={{ left: `${marker}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold leading-4 text-muted">
              <span>Thấp hơn vùng tham chiếu</span>
              <span className="text-center">Vùng tham chiếu</span>
              <span className="text-right">Cao hơn vùng tham chiếu</span>
            </div>
            <p className="mt-4 text-sm font-bold text-ink">
              Giá hiện tại: {currentPriceLabel}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
    </div>
  );
}
