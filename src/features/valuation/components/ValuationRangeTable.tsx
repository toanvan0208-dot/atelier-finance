import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationRefactoredData } from "../types";

type ValuationRangeTableProps = {
  data: ValuationRefactoredData["ranges"];
};

export function ValuationRangeTable({ data }: ValuationRangeTableProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-xl font-bold leading-7 text-ink">Các chỉ số định giá nào đang có thể đọc?</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
            Bảng này chỉ hiển thị trạng thái dữ liệu và chỉ số có thể tính được. Thiếu dữ liệu sẽ giữ là “Chưa đủ dữ liệu” hoặc “N/A”.
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-[4px] border border-border-soft md:block">
          <div className="grid grid-cols-[140px_1.3fr_160px_140px_1fr] gap-3 border-b border-border-soft bg-surface-soft px-4 py-3 text-xs font-bold text-ink">
            <span>Chỉ số</span>
            <span>Điều kiện cần</span>
            <span>Kết quả</span>
            <span>Độ tin cậy</span>
            <span>Cần kiểm tra</span>
          </div>
          {data.rows.map((row) => (
            <div key={row.method} className="grid grid-cols-[140px_1.3fr_160px_140px_1fr] gap-3 border-b border-border-soft px-4 py-3 text-sm last:border-b-0">
              <span className="font-bold text-ink">{row.method}</span>
              <span className="leading-6 text-muted">{row.keyAssumption}</span>
              <span className="font-bold text-ink">{row.range}</span>
              <span className="text-muted">{row.confidence}</span>
              <span className="leading-6 text-muted">{row.risk}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          {data.rows.map((row) => (
            <div key={row.method} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">{row.method}</h3>
                <Chip size="sm" variant="neutral">{row.confidence}</Chip>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{row.range}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{row.keyAssumption}</p>
              <p className="mt-2 text-xs leading-5 text-muted">Cần kiểm tra: {row.risk}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3">
          <p className="text-sm font-bold text-ink">Tổng hợp trạng thái: {data.combinedRange}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{data.explanation}</p>
        </div>
      </CardBody>
    </Card>
  );
}
