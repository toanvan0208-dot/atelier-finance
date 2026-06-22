import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationSummaryData } from "../types";

type ValuationSummaryHeroProps = {
  data: ValuationSummaryData;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function ValuationSummaryHero({ data }: ValuationSummaryHeroProps) {
  const currentPriceLabel =
    data.currentPrice !== null && data.currentPrice > 0
      ? `${formatPrice(data.currentPrice)} đ/cp`
      : "Chưa đủ dữ liệu";

  return (
    <Card className="border-border">
      <CardBody className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Tóm tắt chỉ số định giá</Chip>
            <Chip variant="neutral">{data.ticker}</Chip>
            <Chip variant="neutral">{data.companyName}</Chip>
          </div>
          <h1 className="mt-4 text-2xl font-bold leading-tight text-ink md:text-[30px]">
            Chỉ số nào có thể tính được từ dữ liệu hiện có?
          </h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Giá hiện tại" value={currentPriceLabel} />
            <Metric label="Trạng thái mô hình nâng cao" value="Chưa đủ dữ liệu" />
            <Metric label="Kết luận hành động" value="Không tự kết luận" />
          </div>
          <p className="mt-4 rounded-[4px] border border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
            {data.fairValueRange.conclusion}
          </p>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Chip variant="warning">{data.fairValueRange.status}</Chip>
            <Chip variant="neutral">Độ tin cậy dữ liệu: {data.fairValueRange.confidence}</Chip>
          </div>
          <div className="mt-6">
            <div className="grid gap-3">
              <Metric label="P/E" value="Tính khi EPS > 0 và có giá hợp lệ" />
              <Metric label="P/B và BVPS" value="Tính khi vốn chủ và số cổ phiếu hợp lệ" />
              <Metric label="Vốn hóa" value="Tính khi có giá và số cổ phiếu hợp lệ" />
            </div>
            <p className="mt-4 text-sm font-bold text-ink">
              Giá hiện tại: {currentPriceLabel}. Nếu thiếu dữ liệu, hệ thống không thay bằng 0 hoặc suy đoán.
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
