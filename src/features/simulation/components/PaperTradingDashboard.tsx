import { useState } from "react";
import type { ReactNode } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  ClosedSimulatedPosition,
  SimulatedAccountSummary,
  SimulatedPosition,
  SimulatedStockQuote,
} from "../types";
import { ClosedPositionsTable } from "./ClosedPositionsTable";
import { OpenPositionsTable } from "./OpenPositionsTable";
import { SimulatedAccountSummary as AccountSummaryCards } from "./SimulatedAccountSummary";
import { SimulationMarketBoard } from "./SimulationMarketBoard";
import { SimulationOrderTicket } from "./SimulationOrderTicket";

type PaperTradingDashboardProps = {
  account: SimulatedAccountSummary;
  quotes: SimulatedStockQuote[];
  selectedStock?: SimulatedStockQuote;
  openPositions: SimulatedPosition[];
  closedPositions: ClosedSimulatedPosition[];
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
  const hasSelectedPosition = Boolean(openPositions.find((position) => position.symbol === selectedStock?.symbol));
  const sessionStatuses = [
    "Đang theo dõi",
    openPositions.length > 0 ? "Có vị thế giả lập" : "Chưa có vị thế",
    "Có lệnh cần xem lại",
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Mô phỏng hiện tại"
          description="Luyện tạo lệnh, quản lý vị thế và rút kinh nghiệm bằng tài khoản giả lập."
          chip={<Chip variant="warning">Đây là mô phỏng, không phải giao dịch thật.</Chip>}
        />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {sessionStatuses.map((status) => <Chip key={status} variant="neutral">{status}</Chip>)}
          </div>
          <p className="text-xs leading-5 text-muted">Dữ liệu mock cập nhật gần nhất: {account.updatedAt}</p>
        </CardBody>
      </Card>

      <AccountSummaryCards
        account={account}
        onCustomizeAccount={onCustomizeAccount}
        onOpenClosedPositions={() => setDetailModal("closedPositions")}
        onOpenPositions={() => setDetailModal("openPositions")}
      />

      <SimulationMarketBoard quotes={quotes} selectedSymbol={selectedStock?.symbol} onSelect={onSelectStock} />

      <SimulationOrderTicket
        availableCash={account.cash}
        hasPosition={hasSelectedPosition}
        selectedStock={selectedStock}
        onSaveDraft={onSaveDraft}
        onSubmit={onCreateOrder}
      />

      {detailModal === "openPositions" ? (
        <SimulationDetailModal title="Vị thế giả lập đang mở" onClose={() => setDetailModal(null)}>
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
        <SimulationDetailModal title="Lệnh đã đóng" onClose={() => setDetailModal(null)}>
          <ClosedPositionsTable positions={closedPositions} onAddLesson={onAddClosedLesson} />
        </SimulationDetailModal>
      ) : null}
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
