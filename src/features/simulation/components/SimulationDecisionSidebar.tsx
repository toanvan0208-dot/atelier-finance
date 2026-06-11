import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  SimulationModeId,
  SimulationPositionState,
  SimulationStatus,
  SimulationThesisFormState,
  ThesisHealth,
} from "../types";
import { getPositionNumbers } from "./SimulationPositionBuilder";

type SimulationDecisionSidebarProps = {
  mode: SimulationModeId;
  status: SimulationStatus;
  thesisHealth: ThesisHealth;
  thesis: SimulationThesisFormState;
  missingConditions: string[];
  position: SimulationPositionState;
  currentPrice: number;
  nextAction: string;
};

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function SimulationDecisionSidebar({
  status,
  thesisHealth,
  thesis,
  missingConditions,
  position,
  currentPrice,
  nextAction,
}: SimulationDecisionSidebarProps) {
  const numbers = getPositionNumbers(position, currentPrice);

  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader
          title="Trạng thái mô phỏng"
          description="Sidebar này ưu tiên thesis, dữ liệu và rủi ro trước lãi/lỗ."
          chip={<Chip variant={position.created ? "accent" : "warning"}>{status}</Chip>}
        />
        <CardBody className="space-y-4">
          <SummaryBlock label="Trạng thái thesis" value={thesisHealth} strong />
          <SummaryBlock label="Thesis hiện tại" value={thesis.mainThesis || "Chưa có thesis mô phỏng."} />
          <SummaryBlock label="Dữ liệu xác nhận thesis" value={thesis.confirmingData || "Chưa ghi dữ liệu xác nhận."} />
          <SummaryBlock label="Dữ liệu phủ định thesis" value={thesis.disconfirmingData || "Chưa ghi dữ liệu phủ định."} warning />
          <SummaryBlock label="Rủi ro lớn nhất" value={thesis.mainRisk || "Chưa ghi rủi ro chính."} warning />
          <SummaryBlock label="Mốc xem lại" value={thesis.reviewDate || "Chưa đặt mốc xem lại."} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Điều kiện còn thiếu</p>
            <div className="mt-2 grid gap-2">
              {missingConditions.length > 0 ? (
                missingConditions.map((item) => (
                  <p key={item} className="rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
                    {item}
                  </p>
                ))
              ) : (
                <p className="rounded-[3px] border border-[#7CCFAF] bg-[#DDF7EC] px-3 py-2 text-xs font-semibold leading-5 text-[#0F6B50]">
                  Các điều kiện tối thiểu đã đủ để tạo mô phỏng.
                </p>
              )}
            </div>
          </div>
          {position.created ? (
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">Vị thế giả lập</p>
              <div className="mt-2 grid gap-2 text-xs leading-5 text-muted">
                <p>Số cổ phiếu: {numbers.shareQuantity}</p>
                <p>Giá trị vị thế: {formatVnd(numbers.actualPositionValue)}</p>
                <p>Lãi/lỗ giả lập: {formatVnd(numbers.simulatedPnL)}</p>
              </div>
            </div>
          ) : null}
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">Bước tiếp theo</p>
            <p className="mt-1 text-sm leading-6 text-muted">{nextAction}</p>
            <div className="mt-3 grid gap-2">
              <Button>Tiếp tục phần đang làm</Button>
              <Button variant="secondary">Quay lại Checklist</Button>
              <Button variant="ghost">Mở Nhật ký</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </aside>
  );
}

function SummaryBlock({
  label,
  value,
  strong = false,
  warning = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={warning ? "rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2" : undefined}>
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{label}</p>
      <p className={strong ? "mt-1 text-sm font-bold leading-6 text-ink" : "mt-1 text-sm leading-6 text-muted"}>
        {value}
      </p>
    </div>
  );
}
