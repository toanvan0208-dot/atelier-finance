import type { SimulatedPositionStatus, SimulatedStockStatus } from "./types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} triệu`;
  return formatCurrency(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2).replace(".", ",")}%`;
}

export function getNowLabel() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function stockStatusLabel(status: SimulatedStockStatus) {
  const labels: Record<SimulatedStockStatus, string> = {
    watching: "Đang theo dõi",
    has_position: "Có vị thế",
    near_stop_loss: "Gần stop-loss",
    near_target: "Gần target",
    low_liquidity: "Thanh khoản thấp",
    need_review: "Cần xem lại",
  };
  return labels[status];
}

export function positionStatusLabel(status: SimulatedPositionStatus) {
  const labels: Record<SimulatedPositionStatus, string> = {
    normal: "Bình thường",
    near_stop_loss: "Gần stop-loss",
    near_target: "Gần target",
    profit: "Đang lời",
    loss: "Đang lỗ",
    need_review: "Cần xem lại kịch bản",
    low_liquidity: "Thanh khoản thấp",
  };
  return labels[status];
}

export function toneFromSignedValue(value: number) {
  if (value > 0) return "text-accent-green";
  if (value < 0) return "text-danger";
  return "text-muted";
}
