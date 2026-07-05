import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationRefactoredData } from "../types";

type ValuationRangeTableProps = {
  data: ValuationRefactoredData["ranges"];
};

const missingFormulaPriceRange = "Chưa đủ dữ liệu hoặc chưa có giả định hệ số";

export function ValuationRangeTable({ data }: ValuationRangeTableProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-xl font-bold leading-7 text-ink">Vùng giá theo công thức đang đọc được?</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
            Bảng này tách rõ chỉ số thị trường hiện tại và vùng giá/cp suy ra từ công thức. Vùng giá chỉ là tham chiếu theo giả định, không phải kết luận hành động.
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-[4px] border border-border-soft md:block">
          <div className="grid grid-cols-[110px_140px_220px_1.2fr_1fr] gap-3 border-b border-border-soft bg-surface-soft px-4 py-3 text-xs font-bold text-ink">
            <span>Phương pháp</span>
            <span>Chỉ số hiện tại</span>
            <span>Vùng giá theo công thức</span>
            <span>Giả định/công thức</span>
            <span>Cần kiểm tra</span>
          </div>
          {data.rows.map((row) => (
            <div
              key={row.method}
              className="grid grid-cols-[110px_140px_220px_1.2fr_1fr] gap-3 border-b border-border-soft px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-bold text-ink">{row.method}</span>
              <span className="font-bold text-ink">{row.range}</span>
              <span className="font-bold text-ink">{row.formulaPriceRange?.label ?? missingFormulaPriceRange}</span>
              <span className="leading-6 text-muted">
                {row.formulaPriceRange
                  ? `${row.formulaPriceRange.formula}. ${row.formulaPriceRange.assumption}`
                  : row.keyAssumption}
              </span>
              <span className="leading-6 text-muted">{row.risk}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          {data.rows.map((row) => (
            <div key={row.method} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">{row.method}</h3>
                <Chip size="sm" variant="neutral">
                  {row.confidence}
                </Chip>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">Chỉ số: {row.range}</p>
              <p className="mt-2 text-sm font-bold text-ink">
                Vùng giá: {row.formulaPriceRange?.label ?? missingFormulaPriceRange}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{row.keyAssumption}</p>
              {row.formulaPriceRange ? (
                <p className="mt-2 text-xs leading-5 text-muted">
                  {row.formulaPriceRange.formula}. {row.formulaPriceRange.assumption}
                </p>
              ) : null}
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
