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
  "Kiểm tra thesis",
  "Giá về vùng quan sát",
  "Thanh khoản cải thiện",
  "Giá trên MA20/MA50",
  "Cần luyện kỷ luật mốc cảnh báo",
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

    return { fee, riskReward, tax, total, value };
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
        title="Tạo tình huống mô phỏng"
        description="Ghi rõ giả định, mốc cảnh báo và lý do trước khi đưa tình huống vào nhật ký."
        chip={<Chip variant="warning">Không phải lệnh thật</Chip>}
      />
      <CardBody className="space-y-4">
        {!selectedStock ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
            Chọn một mã trong bảng điện để bắt đầu mô phỏng.
          </div>
        ) : (
          <>
            <div className="rounded-[4px] border border-border bg-ink px-4 py-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-white/60">Đang chọn</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold">{selectedStock.symbol}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{formatNumber(selectedStock.price)}</p>
                  <p className="text-xs text-white/60">{selectedStock.exchange}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant={side === "buy" ? "primary" : "secondary"} onClick={() => setSide("buy")}>
                Giả định tăng
              </Button>
              <Button variant={side === "sell" ? "primary" : "secondary"} onClick={() => setSide("sell")}>
                Giả định giảm
              </Button>
            </div>

            <label className="grid gap-1 text-xs font-bold text-ink">
              Khối lượng giả lập
              <input
                className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold outline-none focus:border-accent"
                min={0}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>

            <div className="grid gap-2">
              <label className="grid min-w-0 gap-1 text-xs font-bold text-ink">
                Mốc cảnh báo
                <input
                  className="h-10 min-w-0 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                  placeholder="Ví dụ 87500"
                  type="number"
                  value={stopLoss}
                  onChange={(event) => setStopLoss(event.target.value)}
                />
              </label>
              <label className="grid min-w-0 gap-1 text-xs font-bold text-ink">
                Mốc theo dõi
                <input
                  className="h-10 min-w-0 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                  placeholder="Ví dụ 102000"
                  type="number"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs text-muted">
              <PreviewRow label="Giá trị mô phỏng" value={formatCurrency(values.value)} />
              <PreviewRow label="Phí ước tính" value={formatCurrency(values.fee)} />
              {side === "sell" ? <PreviewRow label="Thuế ước tính" value={formatCurrency(values.tax)} /> : null}
              <PreviewRow label="Tổng giá trị dự kiến" value={formatCurrency(values.total)} strong />
              <PreviewRow label="Tỷ lệ theo dõi" value={values.riskReward ? `${values.riskReward.toFixed(2)}:1` : "Chưa đủ dữ liệu"} />
            </div>

            <div className="flex flex-wrap gap-2">
              {reasonHints.map((hint) => (
                <button
                  key={hint}
                  className="rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1 text-[11px] font-semibold text-muted transition hover:border-border hover:text-ink"
                  type="button"
                  onClick={() => setReason((current) => (current ? `${current}; ${hint}` : hint))}
                >
                  {hint}
                </button>
              ))}
            </div>

            <label className="grid gap-1 text-xs font-bold text-ink">
              Lý do tạo tình huống
              <textarea
                className="min-h-24 rounded-[3px] border border-border bg-surface px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-accent"
                placeholder="Viết ngắn lý do bạn muốn mô phỏng tình huống này..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>

            <div className="space-y-2">
              {cashWarning ? <WarningText>Giá trị mô phỏng vượt tiền mặt giả lập hiện có.</WarningText> : null}
              {sellWarning ? <WarningText>Giả định giảm cần có theo dõi đang mở trước đó.</WarningText> : null}
              {lowRiskReward ? <WarningText>Tỷ lệ theo dõi chưa rõ, hãy kiểm tra lại mốc cảnh báo và mốc theo dõi.</WarningText> : null}
              {!reason.trim() ? <WarningText>Cần ghi lý do trước khi tạo tình huống.</WarningText> : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
              <Button
                disabled={disabled}
                onClick={() => onSubmit({ side, quantity, stopLoss: Number(stopLoss) || undefined, target: Number(target) || undefined, reason })}
              >
                Tạo tình huống
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

function PreviewRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span>{label}</span>
      <strong className={strong ? "text-sm text-ink" : "text-ink"}>{value}</strong>
    </p>
  );
}

function WarningText({ children }: { children: string }) {
  return (
    <p className="rounded-[3px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
      {children}
    </p>
  );
}
