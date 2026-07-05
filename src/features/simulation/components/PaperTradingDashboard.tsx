import { useState } from "react";
import type { ReactNode } from "react";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import type {
  ClosedSimulatedPosition,
  SimulatedAccountSummary,
  SimulationHistoryEvent,
  SimulatedPosition,
  SimulatedStockQuote,
} from "../types";
import { formatCompactCurrency, formatNumber, formatPercent, toneFromSignedValue } from "../utils";
import { ClosedPositionsTable } from "./ClosedPositionsTable";
import { OpenPositionsTable } from "./OpenPositionsTable";
import { SimulatedAccountSummary as AccountSummaryCards } from "./SimulatedAccountSummary";
import { SimulationHistoryTimeline } from "./SimulationHistoryTimeline";
import { SimulationMarketBoard } from "./SimulationMarketBoard";
import { SimulationOrderTicket } from "./SimulationOrderTicket";

type PaperTradingDashboardProps = {
  account: SimulatedAccountSummary;
  quotes: SimulatedStockQuote[];
  selectedStock?: SimulatedStockQuote;
  openPositions: SimulatedPosition[];
  closedPositions: ClosedSimulatedPosition[];
  historyEvents: SimulationHistoryEvent[];
  onSelectStock: (quote: SimulatedStockQuote) => void;
  onCreateOrder: Parameters<typeof SimulationOrderTicket>[0]["onSubmit"];
  onSaveDraft: (reason: string) => void;
  onClosePosition: (position: SimulatedPosition) => void;
  onReviewScenario: (position: SimulatedPosition) => void;
  onUpdateStopLoss: (position: SimulatedPosition) => void;
  onUpdateTarget: (position: SimulatedPosition) => void;
  onAddNote: (position: SimulatedPosition) => void;
  onAddClosedLesson: (position: ClosedSimulatedPosition) => void;
  onCustomizeAccount: () => void;
};

export function PaperTradingDashboard({
  account,
  closedPositions,
  historyEvents,
  onAddClosedLesson,
  onAddNote,
  onClosePosition,
  onCreateOrder,
  onCustomizeAccount,
  onReviewScenario,
  onSaveDraft,
  onSelectStock,
  onUpdateStopLoss,
  onUpdateTarget,
  openPositions,
  quotes,
  selectedStock,
}: PaperTradingDashboardProps) {
  const [detailModal, setDetailModal] = useState<"openPositions" | "closedPositions" | null>(null);
  const selectedPosition = openPositions.find((position) => position.symbol === selectedStock?.symbol);
  const hasSelectedPosition = Boolean(selectedPosition);
  const nextStep = selectedPosition
    ? "Xem lại mốc cảnh báo, thanh khoản và lý do ban đầu."
    : selectedStock
      ? "Tạo tình huống nhỏ trước, ghi rõ lý do và mốc cần kiểm tra."
      : "Chọn một mã trong bảng điện để bắt đầu mô phỏng.";

  return (
    <div className="space-y-5">
      <section className="grid overflow-hidden rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-6 py-6 md:px-8">
          <div className="flex flex-wrap gap-2">
            <Chip variant="accent">Phòng tập quyết định</Chip>
            <Chip variant="warning">Dữ liệu tham khảo</Chip>
          </div>
          <h1 className="mt-4 max-w-[760px] font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
            Hôm nay mô phỏng tình huống nào?
          </h1>
          <p className="mt-3 max-w-[780px] text-sm leading-7 text-muted">
            Chọn mã, đặt giả định, ghi lý do và xem lại sau. Mục tiêu là luyện quy trình ra quyết định, không biến dữ liệu giá thành khuyến nghị hành động.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Mã đang chọn" value={selectedStock?.symbol ?? "Chưa chọn"} />
            <HeroMetric label="Đang theo dõi" value={`${account.openPositions} mã`} />
            <HeroMetric label="Nhật ký" value={`${historyEvents.length} sự kiện`} />
          </div>
        </div>

        <aside className="border-t border-border bg-ink px-6 py-6 text-white lg:border-l lg:border-t-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-white/55">Việc nên làm tiếp</p>
          <h2 className="mt-2 text-xl font-bold leading-snug">{nextStep}</h2>
          <div className="mt-5 grid gap-3">
            <FocusRow index="1" title="Chọn mã" text={selectedStock ? `${selectedStock.symbol} · ${selectedStock.name}` : "Chưa có mã nào được chọn."} />
            <FocusRow index="2" title="Đặt mốc" text={selectedPosition?.stopLoss ? `Cảnh báo: ${formatNumber(selectedPosition.stopLoss)}` : "Chưa có mốc cảnh báo."} />
            <FocusRow index="3" title="Hậu kiểm" text={historyEvents[0]?.title ?? "Chưa có ghi chú mới."} />
          </div>
        </aside>
      </section>

      <AccountSummaryCards
        account={account}
        onCustomizeAccount={onCustomizeAccount}
        onOpenClosedPositions={() => setDetailModal("closedPositions")}
        onOpenPositions={() => setDetailModal("openPositions")}
      />

      {selectedStock ? <SelectedStockBrief quote={selectedStock} position={selectedPosition} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <SimulationMarketBoard quotes={quotes} selectedSymbol={selectedStock?.symbol} onSelect={onSelectStock} />
        <SimulationOrderTicket
          availableCash={account.cash}
          hasPosition={hasSelectedPosition}
          selectedStock={selectedStock}
          onSaveDraft={onSaveDraft}
          onSubmit={onCreateOrder}
        />
      </div>

      <SimulationHistoryTimeline events={historyEvents} />

      {detailModal === "openPositions" ? (
        <SimulationDetailModal title="Theo dõi giả lập đang mở" onClose={() => setDetailModal(null)}>
          <OpenPositionsTable
            positions={openPositions}
            onAddNote={onAddNote}
            onClose={onClosePosition}
            onReviewScenario={onReviewScenario}
            onUpdateStopLoss={onUpdateStopLoss}
            onUpdateTarget={onUpdateTarget}
          />
        </SimulationDetailModal>
      ) : null}

      {detailModal === "closedPositions" ? (
        <SimulationDetailModal title="Tình huống đã đóng" onClose={() => setDetailModal(null)}>
          <ClosedPositionsTable positions={closedPositions} onAddLesson={onAddClosedLesson} />
        </SimulationDetailModal>
      ) : null}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">{label}</p>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function FocusRow({ index, text, title }: { index: string; text: string; title: string }) {
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[4px] border border-white/15 bg-white/5 px-3 py-3">
      <span className="grid size-8 place-items-center rounded-[3px] bg-accent text-xs font-bold text-ink">{index}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/65">{text}</p>
      </div>
    </div>
  );
}

function SelectedStockBrief({ position, quote }: { position?: SimulatedPosition; quote: SimulatedStockQuote }) {
  return (
    <Card>
      <CardBody className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">{quote.symbol}</Chip>
            <Chip variant={position ? "success" : "neutral"}>{position ? "Đang có theo dõi" : "Chưa mở theo dõi"}</Chip>
          </div>
          <h2 className="mt-3 text-xl font-bold text-ink">{quote.name}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Giá hiện tại {formatNumber(quote.price)}, biến động phiên gần nhất{" "}
            <span className={toneFromSignedValue(quote.changePercent)}>{formatPercent(quote.changePercent)}</span>. Thanh khoản {quote.liquidityLabel.toLowerCase()}.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[420px]">
          <MiniMetric label="GTGD" value={formatCompactCurrency(quote.tradingValue)} />
          <MiniMetric label="MA20" value={quote.ma20Status} />
          <MiniMetric label="Vol/TB20" value={`${quote.volumeVsAvg20.toFixed(1).replace(".", ",")}x`} />
        </div>
      </CardBody>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function SimulationDetailModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 py-6">
      <div className="max-h-[88vh] w-full max-w-[1180px] overflow-y-auto rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-soft bg-surface px-4 py-3">
          <div>
            <h3 className="font-brand text-lg font-bold text-ink">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">Đây là dữ liệu mô phỏng, không phải lịch sử giao dịch thật.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
