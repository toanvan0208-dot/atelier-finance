import { Button, Chip } from "@/components/ui";
import type { SimulationPositionState } from "../types";

type SimulationPositionBuilderProps = {
  value: SimulationPositionState;
  canCreate: boolean;
  allowWarningCreate: boolean;
  onChange: (value: SimulationPositionState) => void;
};

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function getPositionNumbers(value: SimulationPositionState, currentPrice: number) {
  const positionValue = Math.floor((value.capital * value.weight) / 100);
  const shareQuantity = Math.floor(positionValue / value.referencePrice / 10) * 10;
  const actualPositionValue = shareQuantity * value.referencePrice;
  const remainingCash = value.capital - actualPositionValue;
  const simulatedPnL = shareQuantity * (currentPrice - value.referencePrice);

  return {
    positionValue,
    shareQuantity,
    actualPositionValue,
    remainingCash,
    simulatedPnL,
  };
}

export function SimulationPositionBuilder({
  value,
  canCreate,
  allowWarningCreate,
  onChange,
}: SimulationPositionBuilderProps) {
  const numbers = getPositionNumbers(value, 95000);
  const buttonLabel = canCreate ? "Tạo mô phỏng" : allowWarningCreate ? "Tiếp tục mô phỏng với cảnh báo" : "Hoàn thiện thesis trước";

  return (
    <div className="space-y-4">
      <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
        Vốn và tỷ trọng chỉ để tạo vị thế theo dõi giả lập. Lãi/lỗ chỉ là kết quả theo dõi, không phải mục tiêu chính của mô phỏng.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <NumberField
          label="Vốn giả lập"
          value={value.capital}
          step={1000000}
          onChange={(capital) => onChange({ ...value, capital })}
        />
        <NumberField
          label="Tỷ trọng muốn phân bổ (%)"
          value={value.weight}
          step={1}
          onChange={(weight) => onChange({ ...value, weight })}
        />
        <NumberField
          label="Giá tham chiếu"
          value={value.referencePrice}
          step={100}
          onChange={(referencePrice) => onChange({ ...value, referencePrice })}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Số cổ phiếu giả lập" value={`${numbers.shareQuantity} cổ phiếu`} />
        <Metric label="Tiền mặt còn lại" value={formatVnd(numbers.remainingCash)} />
        <Metric label="Giá trị vị thế" value={formatVnd(numbers.actualPositionValue)} />
        <Metric label="Lãi/lỗ giả lập" value={formatVnd(numbers.simulatedPnL)} muted />
        <Metric label="Thesis Health" value={canCreate ? "Tạm đủ để theo dõi" : "Cần bổ sung"} />
        <Metric label="Trạng thái tạo mô phỏng" value={canCreate ? "Đủ điều kiện" : "Chưa đủ điều kiện"} />
      </div>
      {!canCreate && allowWarningCreate ? (
        <p className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
          Mô phỏng này chưa đủ dữ liệu để xem là quyết định thật. Chỉ dùng để luyện theo dõi thesis.
        </p>
      ) : null}
      <Button disabled={!canCreate && !allowWarningCreate} onClick={() => onChange({ ...value, created: true })}>
        {buttonLabel}
      </Button>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-ink">{label}</span>
      <input
        className="h-10 rounded-[4px] border-[1.5px] border-border-soft bg-surface px-3 text-sm font-bold text-ink outline-none focus:border-border"
        min={0}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}

function Metric({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-semibold text-subtle">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-bold leading-5 text-ink">{value}</p>
        {muted ? <Chip size="sm">theo dõi</Chip> : null}
      </div>
    </div>
  );
}
