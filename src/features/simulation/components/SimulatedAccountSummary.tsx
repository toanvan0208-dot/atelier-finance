import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
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
  const items = [
    { label: "Tổng vốn giả lập", value: formatCurrency(account.totalCapital) },
    { label: "Tiền mặt còn lại", value: formatCurrency(account.cash) },
    { label: "Giá trị vị thế giả lập", value: formatCurrency(account.positionValue) },
    { label: "P/L tạm tính", value: formatPercent(account.unrealizedPnLPercent), signed: account.unrealizedPnLPercent },
    { label: "P/L đã thực hiện", value: formatPercent(account.realizedPnLPercent), signed: account.realizedPnLPercent },
    { label: "Tỷ lệ sử dụng vốn", value: `${account.capitalUsagePercent.toFixed(1).replace(".", ",")}%` },
    { label: "Vị thế đang mở", value: `${account.openPositions}`, onClick: onOpenPositions },
    { label: "Lệnh đã đóng", value: `${account.closedOrders}`, onClick: onOpenClosedPositions },
  ];

  return (
    <Card>
      <CardHeader
        action={<Button size="sm" variant="secondary" onClick={onCustomizeAccount}>Tùy chỉnh tài khoản giả lập</Button>}
        title="Tài khoản giả lập"
        description="Các con số chỉ phục vụ luyện quản lý vị thế mô phỏng."
        chip={<Chip variant="warning">Không phải giao dịch thật</Chip>}
      />
      <CardBody className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.label}
              className={`rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left ${
                item.onClick ? "transition hover:border-border hover:bg-accent-soft" : "cursor-default"
              }`}
              type="button"
              onClick={item.onClick}
            >
              <p className="text-[11px] font-bold uppercase text-subtle">{item.label}</p>
              <p className={`mt-2 text-lg font-bold text-ink ${typeof item.signed === "number" ? toneFromSignedValue(item.signed) : ""}`}>
                {item.value}
              </p>
              {item.onClick ? <p className="mt-1 text-[11px] font-semibold text-accent">Bấm để xem chi tiết</p> : null}
            </button>
          ))}
        </div>
        <p className="rounded-[4px] border border-border-soft bg-accent-soft/60 px-3 py-2 text-xs leading-5 text-muted">
          Lãi/lỗ chỉ dùng để học cách quản lý vị thế giả lập, không thể hiện thành tích đầu tư thật.
        </p>
      </CardBody>
    </Card>
  );
}
