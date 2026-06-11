import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  CurrentSimulationData,
  ReflectionState,
  SimulationPhaseId,
  SimulationPhaseStatus,
  SimulationPositionState,
  SimulationPvtInterpretation,
  SimulationThesisFormState,
} from "../types";
import { SimulationPhaseCard } from "./SimulationPhaseCard";
import { SimulationPositionBuilder } from "./SimulationPositionBuilder";
import { SimulationPvtSnapshot } from "./SimulationPvtSnapshot";
import { SimulationReflectionBox } from "./SimulationReflectionBox";
import { SimulationThesisForm } from "./SimulationThesisForm";

type CurrentSimulationWorkspaceProps = {
  data: CurrentSimulationData;
  activePhase: SimulationPhaseId;
  thesis: SimulationThesisFormState;
  position: SimulationPositionState;
  pvtInterpretation: SimulationPvtInterpretation;
  reflection: ReflectionState;
  canCreatePosition: boolean;
  allowWarningCreate: boolean;
  missingConditions: string[];
  onPhaseChange: (phase: SimulationPhaseId) => void;
  onThesisChange: (value: SimulationThesisFormState) => void;
  onPositionChange: (value: SimulationPositionState) => void;
  onPvtChange: (value: SimulationPvtInterpretation) => void;
  onReflectionChange: (value: ReflectionState) => void;
};

const phases: Array<{
  id: SimulationPhaseId;
  title: string;
  goal: string;
}> = [
  { id: "prepare", title: "Pha 1: Chuẩn bị dữ liệu", goal: "Kiểm tra dữ liệu nền trước khi viết thesis." },
  { id: "thesis", title: "Pha 2: Viết thesis mô phỏng", goal: "Xác định điều đang kiểm chứng." },
  { id: "position", title: "Pha 3: Tạo vị thế giả lập", goal: "Tạo vị thế theo dõi sau khi đủ điều kiện." },
  { id: "tracking", title: "Pha 4: Theo dõi thesis", goal: "Đọc dữ liệu mới, PVT và rủi ro." },
  { id: "review", title: "Pha 5: Hậu kiểm và ghi nhật ký", goal: "Rút bài học từ quy trình." },
];

export function CurrentSimulationWorkspace({
  data,
  activePhase,
  thesis,
  position,
  pvtInterpretation,
  reflection,
  canCreatePosition,
  allowWarningCreate,
  missingConditions,
  onPhaseChange,
  onThesisChange,
  onPositionChange,
  onPvtChange,
  onReflectionChange,
}: CurrentSimulationWorkspaceProps) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="5 pha mô phỏng hiện tại"
          description="Các bước nhỏ vẫn được giữ trong từng pha, nhưng chỉ một pha được mở để tránh quá tải."
          chip={<Chip variant="accent">Thesis trước vị thế</Chip>}
        />
        <CardBody>
          <div className="grid gap-3 xl:grid-cols-2">
            {phases.map((phase) => (
              <SimulationPhaseCard
                key={phase.id}
                id={phase.id}
                title={phase.title}
                goal={phase.goal}
                status={getPhaseStatus(phase.id, thesis, position, reflection, missingConditions)}
                nextAction={getPhaseNextAction(phase.id)}
                isActive={activePhase === phase.id}
                onOpen={onPhaseChange}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={phases.find((phase) => phase.id === activePhase)?.title ?? "Pha đang làm"} />
        <CardBody className="space-y-5">
          {activePhase === "prepare" ? <Precheck data={data} /> : null}
          {activePhase === "thesis" ? <SimulationThesisForm value={thesis} onChange={onThesisChange} /> : null}
          {activePhase === "position" ? (
            <div className="space-y-4">
              <PreSimulationConditions missingConditions={missingConditions} />
              <SimulationPositionBuilder
                value={position}
                canCreate={canCreatePosition}
                allowWarningCreate={allowWarningCreate}
                onChange={onPositionChange}
              />
            </div>
          ) : null}
          {activePhase === "tracking" ? (
            <div className="space-y-5">
              {position.created ? <SimulationDashboard thesis={thesis} data={data} pvtInterpretation={pvtInterpretation} /> : (
                <p className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
                  Chưa tạo vị thế giả lập. Bạn vẫn có thể xem PVT, nhưng dashboard theo dõi đầy đủ sẽ xuất hiện sau khi tạo mô phỏng.
                </p>
              )}
              <SimulationPvtSnapshot data={data.pvt} interpretation={pvtInterpretation} onChange={onPvtChange} />
            </div>
          ) : null}
          {activePhase === "review" ? <SimulationReflectionBox value={reflection} onChange={onReflectionChange} /> : null}
        </CardBody>
      </Card>
    </div>
  );
}

function getPhaseStatus(
  phase: SimulationPhaseId,
  thesis: SimulationThesisFormState,
  position: SimulationPositionState,
  reflection: ReflectionState,
  missingConditions: string[]
): SimulationPhaseStatus {
  if (phase === "prepare") return missingConditions.includes("Đã qua Checklist tối thiểu hoặc có cảnh báo rõ ràng") ? "Cần bổ sung" : "Tạm đủ";
  if (phase === "thesis") return thesis.mainThesis ? (missingConditions.length > 0 ? "Đang làm" : "Tạm đủ") : "Cần bổ sung";
  if (phase === "position") return position.created ? "Tạm đủ" : "Chưa làm";
  if (phase === "tracking") return position.created ? "Đang làm" : "Chưa làm";
  return reflection.completed ? "Tạm đủ" : "Chưa làm";
}

function getPhaseNextAction(phase: SimulationPhaseId) {
  const actions: Record<SimulationPhaseId, string> = {
    prepare: "Xem điều kiện còn thiếu từ Checklist, Rủi ro, PVT và Định giá.",
    thesis: "Viết rõ dữ liệu xác nhận, dữ liệu phủ định và mốc xem lại.",
    position: "Chỉ tạo vị thế giả lập sau khi thesis đủ điều kiện.",
    tracking: "Đọc PVT và dữ liệu mới để xem thesis còn đứng vững không.",
    review: "Ghi nhật ký sau mỗi lần có dữ liệu mới hoặc đến mốc xem lại.",
  };

  return actions[phase];
}

function Precheck({ data }: { data: CurrentSimulationData }) {
  return (
    <div className="grid gap-3">
      {data.precheck.map((item) => (
        <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-subtle">Nguồn: {item.sourceModule}</p>
            </div>
            <Chip variant={item.status === "Đã có" ? "success" : item.status === "Cần bổ sung" ? "warning" : "neutral"}>
              {item.status}
            </Chip>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{item.note}</p>
        </div>
      ))}
    </div>
  );
}

function PreSimulationConditions({ missingConditions }: { missingConditions: string[] }) {
  const conditions = [
    "Đã chọn cổ phiếu",
    "Đã có thesis mô phỏng",
    "Đã nêu dữ liệu xác nhận thesis",
    "Đã nêu dữ liệu phủ định thesis",
    "Đã kiểm tra rủi ro chính",
    "Đã đặt mốc xem lại",
    "Đã qua Checklist tối thiểu hoặc có cảnh báo rõ ràng",
  ];

  return (
    <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
      <h3 className="text-base font-bold text-ink">Điều kiện trước khi tạo mô phỏng</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {conditions.map((condition) => {
          const missing = missingConditions.includes(condition);
          return (
            <p key={condition} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs font-semibold text-muted">
              {missing ? "Cần bổ sung: " : "Đã có: "}{condition}
            </p>
          );
        })}
      </div>
    </section>
  );
}

function SimulationDashboard({
  thesis,
  data,
  pvtInterpretation,
}: {
  thesis: SimulationThesisFormState;
  data: CurrentSimulationData;
  pvtInterpretation: SimulationPvtInterpretation;
}) {
  const cards = [
    ["Trạng thái thesis", data.stock.thesisStatus],
    ["Dữ liệu mới cần kiểm tra", thesis.disconfirmingData || "Chưa ghi dữ liệu phủ định."],
    ["Rủi ro mới phát sinh", thesis.mainRisk || "Chưa ghi rủi ro chính."],
    ["PVT gần đây", pvtInterpretation],
    ["Mốc xem lại", thesis.reviewDate || "Chưa đặt mốc."],
    ["Nhật ký gần nhất", "Chưa có nhật ký mới trong phiên này."],
    ["Lãi/lỗ giả lập", "Theo dõi nhỏ, không phải trọng tâm."],
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold text-ink">Dashboard theo dõi mô phỏng</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{label}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary">Quay lại PVT</Button>
        <Button size="sm" variant="secondary">Quay lại Rủi ro</Button>
        <Button size="sm" variant="ghost">Quay lại Định giá</Button>
      </div>
    </section>
  );
}
