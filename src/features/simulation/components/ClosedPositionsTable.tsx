import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ClosedSimulatedPosition } from "../types";
import { formatCurrency, formatNumber, formatPercent, toneFromSignedValue } from "../utils";

type ClosedPositionsTableProps = {
  positions: ClosedSimulatedPosition[];
  onAddLesson: (position: ClosedSimulatedPosition) => void;
};

export function ClosedPositionsTable({ positions, onAddLesson }: ClosedPositionsTableProps) {
  return (
    <Card>
      <CardHeader
        title="Lệnh đã đóng"
        description="Không chỉ xem lời/lỗ. Mỗi lệnh cần có lý do đóng và bài học rút ra."
        chip={<Chip variant="neutral">{positions.length} lệnh</Chip>}
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse text-left text-xs">
            <thead className="bg-surface-soft text-[11px] uppercase text-subtle">
              <tr>
                {["Mã", "Ngày mở", "Ngày đóng", "Giá mở", "Giá đóng", "KL", "P/L đã thực hiện", "Lý do đóng", "Bài học rút ra", "Hành động"].map((header) => (
                  <th key={header} className="border-b border-border-soft px-3 py-3 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-border-soft bg-surface align-top">
                  <td className="px-3 py-3">
                    <p className="font-bold text-ink">{position.symbol}</p>
                    <p className="max-w-[160px] text-[11px] leading-4 text-muted">{position.name}</p>
                  </td>
                  <td className="px-3 py-3 text-muted">{position.openedAt}</td>
                  <td className="px-3 py-3 text-muted">{position.closedAt}</td>
                  <td className="px-3 py-3 text-muted">{formatNumber(position.openPrice)}</td>
                  <td className="px-3 py-3 text-muted">{formatNumber(position.closePrice)}</td>
                  <td className="px-3 py-3 text-muted">{formatNumber(position.quantity)}</td>
                  <td className={`px-3 py-3 font-semibold ${toneFromSignedValue(position.realizedPnL)}`}>
                    {formatCurrency(position.realizedPnL)}
                    <br />
                    <span className="text-[11px]">{formatPercent(position.realizedPnLPercent)}</span>
                  </td>
                  <td className="max-w-[220px] px-3 py-3 leading-5 text-muted">{position.closeReason}</td>
                  <td className="max-w-[240px] px-3 py-3 leading-5 text-muted">{position.lesson}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-[210px] flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onAddLesson(position)}>Ghi thêm bài học</Button>
                      <Button size="sm" variant="ghost" onClick={() => onAddLesson(position)}>Mở lại case để học</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
