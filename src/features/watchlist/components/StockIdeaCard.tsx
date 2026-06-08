import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StockIdea, WatchlistStatus } from "../types";
import {
  ModuleStatusBadge,
  StatusBadge,
  TextStack,
} from "./WatchlistPrimitives";

type StockIdeaCardProps = {
  data: StockIdea;
  isExpanded?: boolean;
  onOpenDetails?: (ticker: string) => void;
  onToggle?: (ticker: string) => void;
};

const primaryCtaByStatus: Partial<Record<WatchlistStatus, string>> = {
  "Cần xem lại": "Xem lại thesis",
  "Đang mô phỏng": "Ghi nhật ký",
  "Đang phân tích": "Phân tích tiếp",
  "Mới thêm": "Bắt đầu phân tích",
  "Sẵn sàng mô phỏng": "Tạo mô phỏng",
  "Tạm loại": "Xem lý do tạm loại",
};

const compactModuleNames = ["Hiểu DN", "Ngành", "BCTC", "Định giá", "PVT", "Rủi ro"];

function clampText(text: string, fallback: string) {
  return text || fallback;
}

function getModuleStatus(data: StockIdea, compactName: string) {
  const fullName = compactName === "Hiểu DN" ? "Hiểu doanh nghiệp" : compactName;
  return data.progress.find((item) => item.moduleName === fullName)?.status ?? "Chưa làm";
}

export function StockIdeaCard({
  data,
  isExpanded = false,
  onOpenDetails,
  onToggle,
}: StockIdeaCardProps) {
  const primaryLabel = primaryCtaByStatus[data.status] ?? "Xem hồ sơ";

  return (
    <Card className={isExpanded ? "bg-accent-soft/30" : undefined}>
      <button
        className="block w-full text-left"
        type="button"
        aria-expanded={isExpanded}
        onClick={() => onToggle?.(data.ticker)}
      >
        <CardHeader
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status={data.status} />
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[3px] border border-border-soft bg-surface-soft text-sm font-bold text-ink",
                  isExpanded && "border-border bg-accent-soft"
                )}
                aria-hidden="true"
              >
                {isExpanded ? "−" : "+"}
              </span>
            </div>
          }
          description={`${data.companyName} · ${data.industry}`}
          icon={data.ticker.slice(0, 2)}
          title={data.ticker}
        />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
            {[
              { label: "Giá hiện tại", value: data.currentPrice },
              { label: "Biến động 30 ngày", value: data.recentMove },
              { label: "Thanh khoản", value: data.liquidity },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
              </div>
            ))}
            <p className="rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1 text-xs font-bold text-muted">
              {isExpanded ? "Thu gọn" : "Xổ chi tiết"}
            </p>
          </div>
        </CardBody>
      </button>

      {isExpanded ? (
        <CardBody className="border-t border-border-soft">
          <div className="space-y-4">
            <section>
              <p className="text-xs font-bold text-ink">Lý do theo dõi</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                {clampText(data.reason, "Chưa có lý do theo dõi rõ ràng.")}
              </p>
            </section>

            <section>
              <p className="text-xs font-bold text-ink">Thesis đang kiểm tra</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                {clampText(data.thesis, "Chưa có thesis. Cần viết lại trước khi đi tiếp.")}
              </p>
            </section>

            <section>
              <p className="mb-2 text-xs font-bold text-ink">Rủi ro chính</p>
              <TextStack items={data.risks.slice(0, 3)} />
            </section>

            <section>
              <p className="mb-2 text-xs font-bold text-ink">Tiến độ phân tích</p>
              <div className="flex flex-wrap gap-1.5">
                {compactModuleNames.map((moduleName) => (
                  <div
                    key={moduleName}
                    className="flex items-center gap-1 rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1"
                  >
                    <span className="text-[11px] font-bold text-ink">{moduleName}</span>
                    <ModuleStatusBadge status={getModuleStatus(data, moduleName)} />
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Chip variant="accent">Bước tiếp theo</Chip>
                <p className="text-xs font-bold text-ink">{data.readiness}</p>
              </div>
              <p className="text-xs leading-5 text-muted">{data.nextStep}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => onOpenDetails?.(data.ticker)}>
                {primaryLabel}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onOpenDetails?.(data.ticker)}>
                Xem hồ sơ
              </Button>
            </div>
          </div>
        </CardBody>
      ) : null}
    </Card>
  );
}
