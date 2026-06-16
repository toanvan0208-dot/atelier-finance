import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  CurrentSimulationData,
  ReflectionState,
  ScenarioThesisResult,
  SimulationPositionState,
  SimulationPvtInterpretation,
  SimulationStatus,
  SimulationThesisFormState,
  ThesisHealth,
} from "../types";
import { SimulationPositionBuilder } from "./SimulationPositionBuilder";
import { SimulationPvtSnapshot } from "./SimulationPvtSnapshot";
import { SimulationReflectionBox } from "./SimulationReflectionBox";
import { SimulationThesisForm } from "./SimulationThesisForm";

type CurrentSimulationWorkspaceProps = {
  data: CurrentSimulationData;
  thesis: SimulationThesisFormState;
  position: SimulationPositionState;
  pvtInterpretation: SimulationPvtInterpretation;
  reflection: ReflectionState;
  status: SimulationStatus;
  thesisHealth: ThesisHealth;
  nextAction: string;
  canCreatePosition: boolean;
  allowWarningCreate: boolean;
  missingConditions: string[];
  onThesisChange: (value: SimulationThesisFormState) => void;
  onPositionChange: (value: SimulationPositionState) => void;
  onPvtChange: (value: SimulationPvtInterpretation) => void;
  onReflectionChange: (value: ReflectionState) => void;
  onStressScenario: (scenarioId: string, result: ScenarioThesisResult) => void;
};

type WatchScenario = {
  id: string;
  title: string;
  event: string;
  signal: string;
  thesisImpact: ScenarioThesisResult;
  modules: string[];
};

const watchScenarios: WatchScenario[] = [
  {
    id: "revenue",
    title: "Kịch bản cơ sở",
    event: "Doanh thu phục hồi nhẹ, biên lợi nhuận ổn định.",
    signal: "Doanh thu quý tới, biên lợi nhuận gộp, CFO.",
    thesisImpact: "Thesis vẫn đứng vững",
    modules: ["BCTC", "Định giá"],
  },
  {
    id: "margin",
    title: "Kịch bản tích cực",
    event: "Sức mua cải thiện rõ hơn, chi phí đầu vào không tăng mạnh.",
    signal: "Doanh thu bán lẻ, biên gộp, dòng tiền hoạt động.",
    thesisImpact: "Thesis vẫn đứng vững",
    modules: ["BCTC", "PVT"],
  },
  {
    id: "cashflow",
    title: "Kịch bản tiêu cực",
    event: "Sức mua yếu, tồn kho tăng, biên lợi nhuận giảm.",
    signal: "Tồn kho, biên lợi nhuận, CFO, doanh thu bán lẻ.",
    thesisImpact: "Thesis yếu đi nhưng chưa gãy",
    modules: ["BCTC", "Rủi ro"],
  },
  {
    id: "behavior",
    title: "Kịch bản thesis break",
    event: "Dòng tiền xấu đi, lợi nhuận giảm, giá tăng nhưng volume không xác nhận.",
    signal: "CFO âm, margin giảm, PVT bất thường.",
    thesisImpact: "Cần quay lại module liên quan",
    modules: ["Checklist", "Rủi ro", "PVT"],
  },
];

export function CurrentSimulationWorkspace({
  data,
  thesis,
  position,
  pvtInterpretation,
  reflection,
  status,
  thesisHealth,
  nextAction,
  canCreatePosition,
  allowWarningCreate,
  missingConditions,
  onThesisChange,
  onPositionChange,
  onPvtChange,
  onReflectionChange,
  onStressScenario,
}: CurrentSimulationWorkspaceProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SimulationThesisCard
          thesis={thesis}
          onThesisChange={onThesisChange}
        />
        <SimulationStatusSummary
          status={status}
          thesisHealth={thesisHealth}
          missingConditions={missingConditions}
          nextAction={nextAction}
          moduleToRecheck={thesis.moduleToRecheck}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ScenarioWatchCards onStressScenario={onStressScenario} />
        <SimulationPositionCard
          position={position}
          thesisHealth={thesisHealth}
          canCreatePosition={canCreatePosition}
          allowWarningCreate={allowWarningCreate}
          onPositionChange={onPositionChange}
        />
      </div>

      <SimulationPvtInsight
        data={data}
        pvtInterpretation={pvtInterpretation}
        onPvtChange={onPvtChange}
      />

      <SimulationReviewTimeline
        data={data}
        thesis={thesis}
        reflection={reflection}
        onReflectionChange={onReflectionChange}
      />
    </div>
  );
}

function SimulationThesisCard({
  thesis,
  onThesisChange,
}: {
  thesis: SimulationThesisFormState;
  onThesisChange: (value: SimulationThesisFormState) => void;
}) {
  const hasThesis = Boolean(thesis.mainThesis.trim());

  return (
    <Card>
      <CardHeader
        title="Thesis mô phỏng"
        description="Khối quan trọng nhất: bạn đang theo dõi luận điểm nào và điều gì có thể làm luận điểm yếu đi."
        chip={<Chip variant={hasThesis ? "accent" : "warning"}>{hasThesis ? "Đã có thesis" : "Chưa có thesis"}</Chip>}
      />
      <CardBody className="space-y-4">
        {!hasThesis ? (
          <div className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-4 py-4">
            <p className="text-sm font-bold text-[#765416]">
              Bạn chưa có thesis mô phỏng. Hãy viết luận điểm trước khi tạo vị thế giả lập.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <ThesisField label="Luận điểm chính" value={thesis.mainThesis} wide />
            <ThesisField label="Dữ liệu đang xác nhận" value={thesis.confirmingData} />
            <ThesisField label="Dữ liệu có thể phủ định" value={thesis.disconfirmingData || "Chưa ghi dữ liệu phủ định."} warning />
            <ThesisField label="Rủi ro lớn nhất" value={thesis.mainRisk || "Chưa ghi rủi ro chính."} warning />
            <ThesisField label="Điều kiện khiến thesis yếu đi" value={thesis.weakenCondition || "Chưa đặt điều kiện yếu đi."} />
            <ThesisField label="Mốc xem lại" value={thesis.reviewDate || "Chưa đặt mốc xem lại."} />
          </div>
        )}
        <details className="rounded-[4px] border border-border-soft bg-surface-soft">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
            {hasThesis ? "Chỉnh sửa thesis" : "Viết thesis mô phỏng"}
          </summary>
          <div className="border-t border-border-soft px-4 py-4">
            <SimulationThesisForm value={thesis} onChange={onThesisChange} />
          </div>
        </details>
      </CardBody>
    </Card>
  );
}

function ThesisField({
  label,
  value,
  wide = false,
  warning = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={`${wide ? "md:col-span-2" : ""} rounded-[4px] border ${warning ? "border-[#D6B15C] bg-[#FFF6D8]" : "border-border-soft bg-surface-soft"} px-3 py-3`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-ink">{value}</p>
    </div>
  );
}

function SimulationStatusSummary({
  status,
  thesisHealth,
  missingConditions,
  nextAction,
  moduleToRecheck,
}: {
  status: SimulationStatus;
  thesisHealth: ThesisHealth;
  missingConditions: string[];
  nextAction: string;
  moduleToRecheck: string;
}) {
  return (
    <Card>
      <CardHeader title="Tóm tắt trạng thái" chip={<Chip variant="accent">{status}</Chip>} />
      <CardBody className="space-y-4">
        <ThesisField label="Trạng thái thesis" value={thesisHealth} />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Điều kiện còn thiếu</p>
          <div className="mt-2 grid gap-2">
            {missingConditions.length > 0 ? missingConditions.map((item) => (
              <p key={item} className="rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
                {item}
              </p>
            )) : (
              <p className="rounded-[3px] border border-[#7CCFAF] bg-[#DDF7EC] px-3 py-2 text-xs font-semibold leading-5 text-[#0F6B50]">
                Đủ điều kiện tối thiểu để theo dõi mô phỏng.
              </p>
            )}
          </div>
        </div>
        <ThesisField label="Module nên quay lại" value={moduleToRecheck || "Checklist, Rủi ro, PVT"} />
        <ThesisField label="Bước tiếp theo" value={nextAction} />
        <ThesisField label="Mức độ sẵn sàng mô phỏng" value={missingConditions.length === 0 ? "Sẵn sàng tạo mô phỏng" : "Có thể mô phỏng với cảnh báo"} />
      </CardBody>
    </Card>
  );
}

function ScenarioWatchCards({
  onStressScenario,
}: {
  onStressScenario: (scenarioId: string, result: ScenarioThesisResult) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Kịch bản cần theo dõi"
        description="Nhìn trước tình huống có thể xác nhận, làm yếu hoặc buộc kiểm tra lại thesis."
        chip={<Chip variant="accent">Rút gọn</Chip>}
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2">
          {watchScenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-ink">{scenario.title}</h3>
                <Chip>{scenario.thesisImpact}</Chip>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted"><strong className="text-ink">Điều có thể xảy ra:</strong> {scenario.event}</p>
              <p className="mt-2 text-sm leading-6 text-muted"><strong className="text-ink">Tín hiệu:</strong> {scenario.signal}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-subtle">Module: {scenario.modules.join(", ")}</p>
              <div className="mt-4">
                <Button size="sm" variant="secondary" onClick={() => onStressScenario(scenario.id, scenario.thesisImpact)}>
                  Stress-test sâu kịch bản này
                </Button>
              </div>
            </article>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function SimulationPvtInsight({
  data,
  pvtInterpretation,
  onPvtChange,
}: {
  data: CurrentSimulationData;
  pvtInterpretation: SimulationPvtInterpretation;
  onPvtChange: (value: SimulationPvtInterpretation) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="PVT & dữ liệu mới"
        description="Biến động gần đây đang xác nhận hay phủ định thesis?"
        chip={<Chip variant="accent">{pvtInterpretation}</Chip>}
      />
      <CardBody>
        <SimulationPvtSnapshot data={data.pvt} interpretation={pvtInterpretation} onChange={onPvtChange} />
      </CardBody>
    </Card>
  );
}

function SimulationPositionCard({
  position,
  thesisHealth,
  canCreatePosition,
  allowWarningCreate,
  onPositionChange,
}: {
  position: SimulationPositionState;
  thesisHealth: ThesisHealth;
  canCreatePosition: boolean;
  allowWarningCreate: boolean;
  onPositionChange: (value: SimulationPositionState) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Vị thế giả lập"
        description="Theo dõi vị thế để luyện thesis. Lãi/lỗ chỉ là dữ liệu phụ."
        chip={<Chip>{thesisHealth}</Chip>}
      />
      <CardBody>
        <SimulationPositionBuilder
          value={position}
          canCreate={canCreatePosition}
          allowWarningCreate={allowWarningCreate}
          onChange={onPositionChange}
        />
      </CardBody>
    </Card>
  );
}

function SimulationReviewTimeline({
  data,
  thesis,
  reflection,
  onReflectionChange,
}: {
  data: CurrentSimulationData;
  thesis: SimulationThesisFormState;
  reflection: ReflectionState;
  onReflectionChange: (value: ReflectionState) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Timeline xem lại & Nhật ký"
        description="Mỗi mốc xem lại phải trả lời thesis còn đứng vững không."
        chip={<Chip variant="accent">Hậu kiểm</Chip>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <TimelineItem label="Ngày tạo mô phỏng" value={data.stock.startDate} />
          <TimelineItem label="Mốc xem lại tiếp theo" value={thesis.reviewDate || "Sau BCTC quý tiếp theo"} />
          <TimelineItem label="Module cần quay lại" value={thesis.moduleToRecheck || "Checklist, Rủi ro, PVT"} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.journalPrompts.map((prompt) => (
            <div key={prompt.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-sm font-bold text-ink">{prompt.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{prompt.prompt}</p>
            </div>
          ))}
        </div>
        <SimulationReflectionBox value={reflection} onChange={onReflectionChange} />
      </CardBody>
    </Card>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
    </div>
  );
}
