import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import type { SimulatedPosition } from "../types";
import { formatCurrency, formatNumber } from "../utils";

type ClosePositionDrawerProps = {
  position?: SimulatedPosition;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    position: SimulatedPosition;
    closePrice: number;
    quantity: number;
    closeReason: string;
    lesson: string;
  }) => void;
};

const closeReasons = [
  "Chạm stop-loss",
  "Chạm target",
  "Kịch bản ban đầu không còn đúng",
  "Thị trường chuyển xấu",
  "Thanh khoản yếu",
  "Muốn giảm rủi ro",
  "Khác",
];

export function ClosePositionDrawer({ position, open, onClose, onConfirm }: ClosePositionDrawerProps) {
  if (!open || !position) return null;

  return <ClosePositionForm key={position.id} position={position} onClose={onClose} onConfirm={onConfirm} />;
}

function ClosePositionForm({
  onClose,
  onConfirm,
  position,
}: {
  position: SimulatedPosition;
  onClose: () => void;
  onConfirm: ClosePositionDrawerProps["onConfirm"];
}) {
  const [closePrice, setClosePrice] = useState(String(position.currentPrice));
  const [quantity, setQuantity] = useState(String(position.quantity));
  const [closeReason, setCloseReason] = useState("");
  const [lesson, setLesson] = useState("");

  const numericPrice = Number(closePrice);
  const numericQuantity = Number(quantity);
  const projectedPnL = (numericPrice - position.averagePrice) * numericQuantity;
  const disabled = numericPrice <= 0 || numericQuantity <= 0 || !closeReason.trim() || !lesson.trim();

  return (
    <div className="fixed inset-0 z-50 bg-ink/30">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l-[1.5px] border-border bg-surface shadow-hard">
        <div className="border-b border-border-soft bg-surface-soft px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">Đóng vị thế giả lập</h3>
                <Chip variant="warning">Không phải giao dịch thật</Chip>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">
                Ghi lý do đóng và bài học để giữ trọng tâm giáo dục.
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="rounded-[4px] border border-border-soft bg-accent-soft/50 px-3 py-3">
            <p className="text-xs font-bold text-subtle">Vị thế</p>
            <p className="mt-1 text-xl font-bold text-ink">{position.symbol}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{position.name}</p>
            <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
              <p>Giá vốn: <strong className="text-ink">{formatNumber(position.averagePrice)}</strong></p>
              <p>Giá hiện tại: <strong className="text-ink">{formatNumber(position.currentPrice)}</strong></p>
              <p>Khối lượng: <strong className="text-ink">{formatNumber(position.quantity)}</strong></p>
              <p>Giá trị: <strong className="text-ink">{formatCurrency(position.marketValue)}</strong></p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-ink">
              Giá đóng giả lập
              <input
                className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                type="number"
                value={closePrice}
                onChange={(event) => setClosePrice(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs font-bold text-ink">
              Khối lượng đóng
              <input
                className="h-10 rounded-[3px] border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
                max={position.quantity}
                min={1}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
          </div>

          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-sm font-bold text-ink">
            P/L giả lập dự kiến: {formatCurrency(projectedPnL)}
          </p>

          <div className="flex flex-wrap gap-2">
            {closeReasons.map((reason) => (
              <button
                key={reason}
                className="rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1 text-[11px] font-semibold text-muted hover:border-border"
                type="button"
                onClick={() => setCloseReason((current) => (current ? `${current}; ${reason}` : reason))}
              >
                {reason}
              </button>
            ))}
          </div>

          <label className="grid gap-1 text-xs font-bold text-ink">
            Lý do đóng
            <textarea
              className="min-h-24 rounded-[3px] border border-border bg-surface px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-accent"
              placeholder="Vì sao bạn đóng vị thế giả lập này?"
              value={closeReason}
              onChange={(event) => setCloseReason(event.target.value)}
            />
          </label>

          <label className="grid gap-1 text-xs font-bold text-ink">
            Bài học rút ra
            <textarea
              className="min-h-24 rounded-[3px] border border-border bg-surface px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-accent"
              placeholder="Bạn học được gì từ lệnh mô phỏng này?"
              value={lesson}
              onChange={(event) => setLesson(event.target.value)}
            />
          </label>
        </div>

        <div className="border-t border-border-soft bg-surface-soft px-5 py-4">
          <Button
            disabled={disabled}
            onClick={() =>
              onConfirm({
                position,
                closePrice: numericPrice,
                quantity: Math.min(numericQuantity, position.quantity),
                closeReason,
                lesson,
              })
            }
          >
            Xác nhận đóng vị thế giả lập
          </Button>
        </div>
      </div>
    </div>
  );
}
