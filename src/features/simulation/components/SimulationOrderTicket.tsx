import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { SimulatedOrderSide, SimulatedStockQuote } from "../types";
import { formatCurrency, formatNumber } from "../utils";

type SimulationOrderTicketProps = {
  selectedStock?: SimulatedStockQuote;
  availableCash: number;
  hasPosition: boolean;
  onSubmit: (order: {
    side: SimulatedOrderSide;
    quantity: number;
    stopLoss?: number;
    target?: number;
    reason: string;
  }) => void;
  onSaveDraft: (reason: string) => void;
};

const reasonHints = [
  "Breakout",
  "Pullback",
  "Gần hỗ trợ",
  "Vượt MA20/MA50",
  "Dòng tiền vào ngành",
  "Kiểm tra chiến lược cá nhân",
  "Khác",
];

export function SimulationOrderTicket({
  selectedStock,
  availableCash,
  hasPosition,
  onSubmit,
  onSaveDraft,
}: SimulationOrderTicketProps) {
  const [side, setSide] = useState<SimulatedOrderSide>("buy");
  const [quantity, setQuantity] = useState(100);
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");

  const values = useMemo(() => {
    const price = selectedStock?.price ?? 0;
    const value = price * Math.max(quantity, 0);
    const fee = value * 0.0015;
    const tax = side === "sell" ? value * 0.001 : 0;
    const total = side === "buy" ? value + fee : value - fee - tax;
    const stop = Number(stopLoss);
    const targetPrice = Number(target);
    const risk = stop > 0 ? price - stop : 0;
    const reward = targetPrice > 0 ? targetPrice - price : 0;
    const riskReward = risk > 0 && reward > 0 ? reward / risk : undefined;

    return { value, fee, tax, total, riskReward };
  }, [quantity, selectedStock?.price, side, stopLoss, target]);

  const cashWarning = side === "buy" && values.total > availableCash;
  const sellWarning = side === "sell" && !hasPosition;
  const lowRiskReward = typeof values.riskReward === "number" && values.riskReward < 1;
  const disabled = !selectedStock || quantity <= 0 || !reason.trim();

  function resetForm() {
    setSide("buy");
    setQuantity(100);
    setStopLoss("");
    setTarget("");
    setReason("");
  }

  return (
    <Card className="h-full">
      <CardHeader
        title="Vé lệnh giả lập"
        description="Tạo lệnh mô phỏng để luyện quy trình, không phải đặt lệnh thật."
        chip={<Chip variant="warning">Mô phỏng</Chip>}
      />
      <CardBody className="space-y-4">
        {!selectedStock ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
            Chọn một mã trong Bảng điện mô phỏng để tạo lệnh giả lập.
          </div>
        ) : (
          <>
            <div className="rounded-[4px] border border-border-soft bg-accent-soft/50 px-3 py-3">
              <p className="text-xs font-bold text-subtle">Mã đang chọn</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-ink">{selectedStock.symbol}</p>
                  <p className="text-xs leading-5 text-muted">{selectedStock.name}</p>
                </div>
                <p className="text-base font-bold text-ink">{formatNumber(selectedStock.price)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant={side === "buy" ? "primary" : "secondary"} onClick={() => setSide("buy")}>
                Mua giả lập
              </Button>
              <Button variant={side === "sell" ? "primary" : "secondary"} onClick={() => setSide("sell")}>
                Bán giả lập
              </Button>
            </div>

            <label className="grid gap-1 text-xs font-bold text-ink">
              Khối lượng
              <input
                className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold outline-none focus:border-accent"
                min={0}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-ink">
                Stop-loss giả lập
                <input
                  className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                  placeholder="Ví dụ 87500"
                  type="number"
                  value={stopLoss}
                  onChange={(event) => setStopLoss(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-ink">
                Target giả lập
                <input
                  className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                  placeholder="Ví dụ 102000"
                  type="number"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs text-muted">
              <p className="flex justify-between gap-3"><span>Giá trị lệnh</span><strong className="text-ink">{formatCurrency(values.value)}</strong></p>
              <p className="flex justify-between gap-3"><span>Phí giao dịch giả lập</span><strong className="text-ink">{formatCurrency(values.fee)}</strong></p>
              {side === "sell" ? (
                <p className="flex justify-between gap-3"><span>Thuế bán giả lập</span><strong className="text-ink">{formatCurrency(values.tax)}</strong></p>
              ) : null}
              <p className="flex justify-between gap-3"><span>Tổng giá trị dự kiến</span><strong className="text-ink">{formatCurrency(values.total)}</strong></p>
              <p className="flex justify-between gap-3"><span>Risk/reward</span><strong className="text-ink">{values.riskReward ? `${values.riskReward.toFixed(2)}:1` : "Chưa đủ dữ liệu"}</strong></p>
            </div>

            <div className="flex flex-wrap gap-2">
              {reasonHints.map((hint) => (
                <button
                  key={hint}
                  className="rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1 text-[11px] font-semibold text-muted hover:border-border"
                  type="button"
                  onClick={() => setReason((current) => (current ? `${current}; ${hint}` : hint))}
                >
                  {hint}
                </button>
              ))}
            </div>

            <label className="grid gap-1 text-xs font-bold text-ink">
              Lý do mở lệnh giả lập
              <textarea
                className="min-h-24 rounded-[3px] border border-border bg-surface px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-accent"
                placeholder="Viết ngắn lý do bạn tạo lệnh mô phỏng này..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>

            <div className="space-y-2">
              {cashWarning ? <WarningText>Giá trị lệnh vượt tiền mặt giả lập hiện có.</WarningText> : null}
              {sellWarning ? <WarningText>Lệnh bán giả lập yêu cầu đã có vị thế trước đó.</WarningText> : null}
              {lowRiskReward ? <WarningText>Rủi ro/lợi nhuận giả lập chưa hấp dẫn, hãy kiểm tra lại kế hoạch.</WarningText> : null}
              {!reason.trim() ? <WarningText>Lý do mở lệnh giả lập cần được ghi rõ trước khi tạo lệnh.</WarningText> : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
              <Button
                disabled={disabled}
                onClick={() => onSubmit({ side, quantity, stopLoss: Number(stopLoss) || undefined, target: Number(target) || undefined, reason })}
              >
                Tạo lệnh giả lập
              </Button>
              <Button variant="secondary" onClick={() => onSaveDraft(reason)}>
                Lưu nháp
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Xóa form
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function WarningText({ children }: { children: string }) {
  return (
    <p className="rounded-[3px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
      {children}
    </p>
  );
}
