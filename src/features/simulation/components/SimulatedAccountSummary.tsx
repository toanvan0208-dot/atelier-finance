import { Button, Chip } from "@/components/ui";
import type { SimulatedAccountSummary as AccountSummary } from "../types";
import { formatCurrency, formatPercent, toneFromSignedValue } from "../utils";

type SimulatedAccountSummaryProps = {
  account: AccountSummary;
  onCustomizeAccount: () => void;
  onOpenClosedPositions: () => void;
  onOpenPositions: () => void;
};

export function SimulatedAccountSummary({
  account,
  onCustomizeAccount,
  onOpenClosedPositions,
  onOpenPositions,
}: SimulatedAccountSummaryProps) {
  const capitalUsed = Math.min(Math.max(account.capitalUsagePercent, 0), 100);

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="grid gap-5 border-b border-border-soft px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Không gian mô phỏng</Chip>
            <Chip variant="warning">Không phải giao dịch thật</Chip>
          </div>
          <h2 className="mt-3 font-brand text-2xl font-bold leading-tight text-ink">
            Vốn giả lập đang được dùng ra sao?
          </h2>
          <p className="mt-2 max-w-[720px] text-sm leading-6 text-muted">
            Phần này giúp bạn giữ kỷ luật về tỷ trọng, mốc cảnh báo và bài học sau mỗi tình huống. Các con số chỉ dùng để luyện quy trình.
          </p>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase text-subtle">Tỷ lệ sử dụng vốn</p>
            <p className="text-lg font-bold text-ink">{capitalUsed.toFixed(1).replace(".", ",")}%</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-border-soft">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${capitalUsed}%` }} />
          </div>
          <Button className="mt-4 w-full" size="sm" variant="secondary" onClick={onCustomizeAccount}>
            Tùy chỉnh vốn giả lập
          </Button>
        </div>
      </div>

      <div className="grid gap-0 divide-y divide-border-soft md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        <MetricBlock label="Tổng vốn giả lập" value={formatCurrency(account.totalCapital)} />
        <MetricBlock label="Tiền mặt còn lại" value={formatCurrency(account.cash)} />
        <MetricBlock label="Giá trị đang theo dõi" value={formatCurrency(account.positionValue)} />
        <MetricBlock
          label="Sai số tạm tính"
          value={formatPercent(account.unrealizedPnLPercent)}
          valueClassName={toneFromSignedValue(account.unrealizedPnLPercent)}
        />
      </div>

      <div className="grid gap-3 border-t border-border-soft bg-surface-soft/60 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
        <p className="text-xs leading-5 text-muted">
          Cập nhật gần nhất: {account.updatedAt}. Hãy xem số liệu như nhật ký luyện tập, không phải thành tích đầu tư.
        </p>
        <button className="text-left text-xs font-bold text-accent hover:text-ink" type="button" onClick={onOpenPositions}>
          {account.openPositions} theo dõi đang mở
        </button>
        <button className="text-left text-xs font-bold text-accent hover:text-ink" type="button" onClick={onOpenClosedPositions}>
          {account.closedOrders} tình huống đã đóng
        </button>
      </div>
    </section>
  );
}

function MetricBlock({
  label,
  value,
  valueClassName = "text-ink",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">{label}</p>
      <p className={`mt-2 text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}
