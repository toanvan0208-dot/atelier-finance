import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Card, CardBody, Chip } from "@/components/ui";
import type { SimulationModeId, SimulationStatus } from "../types";

const modeLabels: Record<SimulationModeId, string> = {
  current: "Mô phỏng hiện tại",
  scenario: "Stress-test kịch bản",
  history: "Case lịch sử",
};

type SimulationControlBarProps = {
  ticker: string;
  companyName: string;
  industry: string;
  mode: SimulationModeId;
  status: SimulationStatus;
  currentStep: string;
  missingReason: string;
  nextAction: string;
};

export function SimulationControlBar({
  ticker,
  companyName,
  industry,
  mode,
  status,
  currentStep,
  missingReason,
  nextAction,
}: SimulationControlBarProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">Simulation Lab</Chip>
          <Chip>Mock data</Chip>
          <span className="text-xs font-semibold text-muted">
            {ticker} · {companyName} · {industry}
          </span>
          <AnalysisNotePopover
            contextTitle="Ghi chú cấp module Mô phỏng"
            moduleId="simulation-module"
            moduleName="Mô phỏng"
            noteType="personal"
            stockSymbol={ticker}
            triggerLabel="Ghi chú phân tích"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {modeLabels[mode]} · {currentStep}
            </p>
            <h1 className="mt-2 font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
              {status}
            </h1>
            <p className="mt-2 max-w-[820px] text-sm leading-7 text-muted">
              Phòng tập này dùng để kiểm tra thesis, dữ liệu, rủi ro, kịch bản và nhật ký hậu kiểm. Lãi/lỗ giả lập chỉ là dữ liệu theo dõi, không phải trung tâm của mô phỏng.
            </p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              Bước tiếp theo
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink">{nextAction}</p>
            <p className="mt-2 text-xs leading-5 text-muted">Còn thiếu: {missingReason}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
