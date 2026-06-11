import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PossibleScenario, SimulatedPosition, SimulatedStockQuote } from "../types";
import { formatNumber, formatPercent, positionStatusLabel, toneFromSignedValue } from "../utils";
import { ScenarioCard } from "./ScenarioCard";

type PossibleScenariosPanelProps = {
  selectedStock?: SimulatedStockQuote;
  selectedPosition?: SimulatedPosition;
  scenarios: PossibleScenario[];
  openPositions: SimulatedPosition[];
  onSelectStockFromPosition: (position: SimulatedPosition) => void;
  onUpdateStopLoss: (position: SimulatedPosition) => void;
  onUpdateTarget: (position: SimulatedPosition) => void;
  onClosePosition: (position: SimulatedPosition) => void;
};

export function PossibleScenariosPanel({
  openPositions,
  onClosePosition,
  onSelectStockFromPosition,
  onUpdateStopLoss,
  onUpdateTarget,
  scenarios,
  selectedPosition,
  selectedStock,
}: PossibleScenariosPanelProps) {
  const symbol = selectedPosition?.symbol ?? selectedStock?.symbol;
  const position = selectedPosition ?? openPositions.find((item) => item.symbol === symbol);
  const quote = selectedStock;
  const filteredScenarios = scenarios.filter((scenario) => scenario.symbol === symbol);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Kịch bản có thể xảy ra"
          description="Dựa trên mã hoặc vị thế giả lập đang chọn để luyện phản ứng trong mô phỏng."
          chip={<Chip variant="warning">Không phải khuyến nghị</Chip>}
        />
        <CardBody className="space-y-4">
          {openPositions.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase text-subtle">Chọn vị thế/mã để xem kịch bản</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {openPositions.map((item) => (
                  <button
                    key={item.id}
                    className={`rounded-[3px] border px-3 py-2 text-xs font-bold ${
                      item.symbol === symbol ? "border-border bg-accent-soft text-ink" : "border-border-soft bg-surface-soft text-muted"
                    }`}
                    type="button"
                    onClick={() => onSelectStockFromPosition(item)}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!symbol ? (
            <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
              Chọn một mã hoặc một vị thế giả lập đang mở để xem kịch bản có thể xảy ra.
            </p>
          ) : (
            <div className="rounded-[4px] border border-border-soft bg-accent-soft/50 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-subtle">Tổng quan mã đang mô phỏng</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{symbol}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{quote?.name ?? position?.name}</p>
                </div>
                {position ? <Chip variant="accent">{positionStatusLabel(position.status)}</Chip> : <Chip>Đang theo dõi</Chip>}
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Ngành" value={quote?.industry ?? "Đang cập nhật"} />
                <Metric label="Giá hiện tại" value={formatNumber(quote?.price ?? position?.currentPrice ?? 0)} />
                <Metric label="Giá vốn" value={position ? formatNumber(position.averagePrice) : "Chưa có vị thế"} />
                <Metric
                  label="P/L tạm tính"
                  value={position ? formatPercent(position.unrealizedPnLPercent) : "Chưa có vị thế"}
                  className={position ? toneFromSignedValue(position.unrealizedPnL) : ""}
                />
                <Metric label="Stop-loss" value={position?.stopLoss ? formatNumber(position.stopLoss) : "Chưa đặt"} />
                <Metric label="Target" value={position?.target ? formatNumber(position.target) : "Chưa đặt"} />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {symbol ? (
        <Card>
          <CardHeader
            title="Danh sách kịch bản"
            description="Các card này là mock/local state. Sau này AI/API có thể thay bằng phân tích dữ liệu thực tế."
          />
          <CardBody className="space-y-3">
            {filteredScenarios.length > 0 ? (
              filteredScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  hasPosition={Boolean(position)}
                  onClosePosition={() => position && onClosePosition(position)}
                  onUpdateStopLoss={() => position && onUpdateStopLoss(position)}
                  onUpdateTarget={() => position && onUpdateTarget(position)}
                />
              ))
            ) : (
              <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
                Chưa có kịch bản mock cho mã này. Có thể bổ sung bằng backend/AI ở bước sau.
              </p>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className={`mt-1 font-bold text-ink ${className}`}>{value}</p>
    </div>
  );
}
