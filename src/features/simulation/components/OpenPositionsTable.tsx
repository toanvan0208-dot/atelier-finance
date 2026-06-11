import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { SimulatedPosition } from "../types";
import { formatCurrency, formatNumber, formatPercent, positionStatusLabel, toneFromSignedValue } from "../utils";

type OpenPositionsTableProps = {
  positions: SimulatedPosition[];
  onClose: (position: SimulatedPosition) => void;
  onReviewScenario: (position: SimulatedPosition) => void;
  onUpdateStopLoss: (position: SimulatedPosition) => void;
  onUpdateTarget: (position: SimulatedPosition) => void;
  onAddNote: (position: SimulatedPosition) => void;
};

export function OpenPositionsTable({
  positions,
  onClose,
  onReviewScenario,
  onUpdateStopLoss,
  onUpdateTarget,
  onAddNote,
}: OpenPositionsTableProps) {
  return (
    <Card>
      <CardHeader
        title="Vị thế giả lập đang mở"
        description="Theo dõi trạng thái từng vị thế mô phỏng và ghi lại hành động học tập."
        chip={<Chip variant="accent">{positions.length} vị thế</Chip>}
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-xs">
            <thead className="bg-surface-soft text-[11px] uppercase text-subtle">
              <tr>
                {["Mã", "Ngày mở", "Giá vốn", "Giá hiện tại", "KL", "Giá trị", "Tỷ trọng", "P/L tạm tính", "Stop-loss", "Target", "Trạng thái", "Hành động"].map((header) => (
                  <th key={header} className="border-b border-border-soft px-3 py-3 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-border-soft bg-surface align-top">
                  <td className="px-3 py-3">
                    <p className="font-bold text-ink">{position.symbol}</p>
                    <p className="max-w-[180px] text-[11px] leading-4 text-muted">{position.name}</p>
                  </td>
                  <td className="px-3 py-3 text-muted">{position.openedAt}</td>
                  <td className="px-3 py-3 text-muted">{formatNumber(position.averagePrice)}</td>
                  <td className="px-3 py-3 font-bold text-ink">{formatNumber(position.currentPrice)}</td>
                  <td className="px-3 py-3 text-muted">{formatNumber(position.quantity)}</td>
                  <td className="px-3 py-3 text-muted">{formatCurrency(position.marketValue)}</td>
                  <td className="px-3 py-3 text-muted">{position.weight.toFixed(1).replace(".", ",")}%</td>
                  <td className={`px-3 py-3 font-semibold ${toneFromSignedValue(position.unrealizedPnL)}`}>
                    {formatCurrency(position.unrealizedPnL)}
                    <br />
                    <span className="text-[11px]">{formatPercent(position.unrealizedPnLPercent)}</span>
                  </td>
                  <td className="px-3 py-3 text-muted">{position.stopLoss ? formatNumber(position.stopLoss) : "-"}</td>
                  <td className="px-3 py-3 text-muted">{position.target ? formatNumber(position.target) : "-"}</td>
                  <td className="px-3 py-3"><Chip size="sm" variant={position.status === "near_stop_loss" || position.status === "loss" ? "warning" : "neutral"}>{positionStatusLabel(position.status)}</Chip></td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onClose(position)}>Đóng vị thế giả lập</Button>
                      <Button size="sm" variant="ghost" onClick={() => onUpdateStopLoss(position)}>Cập nhật stop-loss</Button>
                      <Button size="sm" variant="ghost" onClick={() => onUpdateTarget(position)}>Cập nhật target</Button>
                      <Button size="sm" variant="ghost" onClick={() => onAddNote(position)}>Ghi chú</Button>
                      <Button size="sm" variant="ghost" onClick={() => onReviewScenario(position)}>Xem kịch bản</Button>
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
