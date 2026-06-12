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
          <h2 className="text-xl font-bold leading-7 text-ink">Các phương pháp đang cho vùng giá nào?</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
            Vùng giá không đến từ một công thức duy nhất. Mỗi phương pháp cho một vùng khác nhau, sau đó hệ thống tổng hợp lại.
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-[4px] border border-border-soft md:block">
          <div className="grid grid-cols-[140px_1.3fr_160px_140px_1fr] gap-3 border-b border-border-soft bg-surface-soft px-4 py-3 text-xs font-bold text-ink">
            <span>Phương pháp</span>
            <span>Giả định chính</span>
            <span>Vùng giá</span>
            <span>Độ tin cậy</span>
            <span>Điểm dễ sai</span>
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
              <p className="mt-2 text-xs leading-5 text-muted">Điểm dễ sai: {row.risk}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3">
          <p className="text-sm font-bold text-ink">Vùng tổng hợp: {data.combinedRange}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{data.explanation}</p>
        </div>
      </CardBody>
    </Card>
  );
}
