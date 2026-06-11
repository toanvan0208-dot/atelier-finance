"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { simulationExperienceData } from "../data/simulation.data";
import type {
  ReflectionState,
  ScenarioThesisResult,
  SimulationModeId,
  SimulationPhaseId,
  SimulationPositionState,
  SimulationPvtInterpretation,
  SimulationStatus,
  SimulationThesisFormState,
  ThesisHealth,
} from "../types";
import { CurrentSimulationWorkspace } from "./CurrentSimulationWorkspace";
import { HistoricalCaseWorkspace } from "./HistoricalCaseWorkspace";
import { ScenarioStressTestWorkspace } from "./ScenarioStressTestWorkspace";
import { SimulationControlBar } from "./SimulationControlBar";
import { SimulationDecisionSidebar } from "./SimulationDecisionSidebar";
import { SimulationModeChooser } from "./SimulationModeChooser";

const initialThesis: SimulationThesisFormState = {
  mainThesis: "",
  whyFollow: "",
  confirmingData: "",
  disconfirmingData: "",
  mainRisk: "",
  weakenCondition: "",
  reviewDate: "",
  moduleToRecheck: "",
};

const initialReflection: ReflectionState = {
  initialThought: "",
  supportingData: "",
  weakeningData: "",
  emotionCheck: "",
  processLesson: "",
  nextCheck: "",
  completed: false,
};

export function SimulationPage() {
  const data = simulationExperienceData;
  const [activeMode, setActiveMode] = useState<SimulationModeId>("current");
  const [activePhase, setActivePhase] = useState<SimulationPhaseId>("thesis");
  const [thesis, setThesis] = useState<SimulationThesisFormState>(() => ({
    ...initialThesis,
    mainThesis: data.current.dashboard.thesisPanel[1]?.value ?? "",
    whyFollow: data.current.dashboard.thesisPanel[0]?.value ?? "",
    confirmingData: data.current.dashboard.thesisPanel[3]?.value ?? "",
    disconfirmingData: "",
    mainRisk: data.current.dashboard.thesisPanel[2]?.value ?? "",
    reviewDate: data.current.dashboard.thesisPanel[5]?.value ?? "",
    moduleToRecheck: "Rủi ro, PVT, Định giá",
  }));
  const [position, setPosition] = useState<SimulationPositionState>({
    capital: data.current.defaultCapital,
    weight: data.current.defaultWeight,
    referencePrice: data.current.stock.startPrice,
    created: false,
  });
  const [pvtInterpretation, setPvtInterpretation] = useState<SimulationPvtInterpretation>("Biến động chưa ảnh hưởng thesis");
  const [reflection, setReflection] = useState<ReflectionState>(initialReflection);
  const [scenarioGroupId, setScenarioGroupId] = useState(data.scenario.groups[0]?.id ?? "revenue");
  const [scenarioImpact, setScenarioImpact] = useState(data.scenario.impactLevels[1]?.label ?? "Vừa");
  const [scenarioResult, setScenarioResult] = useState<ScenarioThesisResult>("Thesis yếu đi nhưng chưa gãy");
  const [scenarioLesson, setScenarioLesson] = useState("");
  const [historicalCaseId, setHistoricalCaseId] = useState(data.history.cases[0]?.id ?? "steel-cycle");
  const [historicalDecision, setHistoricalDecision] = useState("");
  const [historicalReason, setHistoricalReason] = useState("");
  const [historicalReflection, setHistoricalReflection] = useState("");
  const [replayUnlocked, setReplayUnlocked] = useState(false);

  const missingConditions = useMemo(() => getMissingConditions(thesis), [thesis]);
  const thesisHealth = useMemo(() => getThesisHealth(thesis, pvtInterpretation), [thesis, pvtInterpretation]);
  const simulationStatus = useMemo(
    () => getSimulationStatus({ missingConditions, positionCreated: position.created, reflectionCompleted: reflection.completed, thesisHealth }),
    [missingConditions, position.created, reflection.completed, thesisHealth]
  );
  const nextAction = getNextAction(simulationStatus, activeMode, activePhase);
  const canCreatePosition = missingConditions.length === 0;
  const allowWarningCreate = Boolean(thesis.mainThesis && thesis.confirmingData && thesis.mainRisk && thesis.reviewDate);

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <SimulationControlBar
        ticker={data.current.stock.ticker}
        companyName={data.current.stock.companyName}
        industry={data.current.stock.industry}
        mode={activeMode}
        status={simulationStatus}
        currentStep={getCurrentStep(activeMode, activePhase)}
        missingReason={missingConditions.length > 0 ? missingConditions.join(", ") : "không còn điều kiện tối thiểu bị thiếu"}
        nextAction={nextAction}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <SimulationModeChooser modes={data.modes} activeMode={activeMode} onSelect={setActiveMode} />

          {activeMode === "current" ? (
            <CurrentSimulationWorkspace
              data={data.current}
              activePhase={activePhase}
              thesis={thesis}
              position={position}
              pvtInterpretation={pvtInterpretation}
              reflection={reflection}
              canCreatePosition={canCreatePosition}
              allowWarningCreate={allowWarningCreate}
              missingConditions={missingConditions}
              onPhaseChange={setActivePhase}
              onThesisChange={setThesis}
              onPositionChange={setPosition}
              onPvtChange={setPvtInterpretation}
              onReflectionChange={setReflection}
            />
          ) : null}

          {activeMode === "scenario" ? (
            <ScenarioStressTestWorkspace
              data={data.scenario}
              selectedGroupId={scenarioGroupId}
              selectedImpact={scenarioImpact}
              thesisResult={scenarioResult}
              lesson={scenarioLesson}
              onGroupChange={setScenarioGroupId}
              onImpactChange={setScenarioImpact}
              onThesisResultChange={setScenarioResult}
              onLessonChange={setScenarioLesson}
            />
          ) : null}

          {activeMode === "history" ? (
            <HistoricalCaseWorkspace
              data={data.history}
              selectedCaseId={historicalCaseId}
              decision={historicalDecision}
              reason={historicalReason}
              reflection={historicalReflection}
              replayUnlocked={replayUnlocked}
              onCaseChange={(id) => {
                setHistoricalCaseId(id);
                setReplayUnlocked(false);
              }}
              onDecisionChange={setHistoricalDecision}
              onReasonChange={setHistoricalReason}
              onReflectionChange={setHistoricalReflection}
              onUnlockReplay={() => setReplayUnlocked(true)}
            />
          ) : null}

          <Card>
            <CardHeader title={data.disclaimer.title} chip={<Chip variant="warning">Guardrail</Chip>} />
            <CardBody>
              <p className="text-sm leading-7 text-muted">{data.disclaimer.content}</p>
            </CardBody>
          </Card>
        </main>

        <SimulationDecisionSidebar
          mode={activeMode}
          status={simulationStatus}
          thesisHealth={thesisHealth}
          thesis={thesis}
          missingConditions={missingConditions}
          position={position}
          currentPrice={data.current.stock.currentPrice}
          nextAction={nextAction}
        />
      </div>
    </div>
  );
}

function getMissingConditions(thesis: SimulationThesisFormState) {
  const missing: string[] = [];
  if (!thesis.mainThesis.trim()) missing.push("Đã có thesis mô phỏng");
  if (!thesis.confirmingData.trim()) missing.push("Đã nêu dữ liệu xác nhận thesis");
  if (!thesis.disconfirmingData.trim()) missing.push("Đã nêu dữ liệu phủ định thesis");
  if (!thesis.mainRisk.trim()) missing.push("Đã kiểm tra rủi ro chính");
  if (!thesis.reviewDate.trim()) missing.push("Đã đặt mốc xem lại");
  if (!thesis.moduleToRecheck.trim()) missing.push("Đã qua Checklist tối thiểu hoặc có cảnh báo rõ ràng");
  return missing;
}

function getThesisHealth(
  thesis: SimulationThesisFormState,
  pvtInterpretation: SimulationPvtInterpretation
): ThesisHealth {
  if (!thesis.mainThesis.trim()) return "Chưa có thesis";
  if (pvtInterpretation === "Biến động làm thesis yếu đi") return "Yếu đi";
  if (pvtInterpretation === "Cần kiểm tra thêm ở PVT" || pvtInterpretation === "Cần kiểm tra thêm ở Tin tức/Rủi ro") {
    return "Cần cập nhật sau dữ liệu mới";
  }
  if (!thesis.disconfirmingData.trim() || !thesis.mainRisk.trim()) return "Cần kiểm tra thêm";
  return "Đang đứng vững";
}

function getSimulationStatus({
  missingConditions,
  positionCreated,
  reflectionCompleted,
  thesisHealth,
}: {
  missingConditions: string[];
  positionCreated: boolean;
  reflectionCompleted: boolean;
  thesisHealth: ThesisHealth;
}): SimulationStatus {
  if (reflectionCompleted) return "Đã hậu kiểm";
  if (positionCreated && thesisHealth === "Cần cập nhật sau dữ liệu mới") return "Cần cập nhật mô phỏng";
  if (positionCreated) return "Đang theo dõi thesis";
  if (missingConditions.includes("Đã có thesis mô phỏng")) return "Chưa đủ điều kiện tạo mô phỏng";
  if (missingConditions.length > 0) return "Có thể mô phỏng với cảnh báo";
  return "Sẵn sàng tạo mô phỏng";
}

function getNextAction(status: SimulationStatus, mode: SimulationModeId, phase: SimulationPhaseId) {
  if (mode === "scenario") return "Chọn kịch bản, mức độ tác động và trả lời thesis còn đứng vững không.";
  if (mode === "history") return "Ghi quyết định giả lập trước khi mở dữ liệu tương lai.";
  if (status === "Chưa đủ điều kiện tạo mô phỏng") return "Hoàn thiện thesis mô phỏng trước.";
  if (status === "Có thể mô phỏng với cảnh báo") return "Bổ sung dữ liệu phủ định, rủi ro hoặc mốc xem lại.";
  if (status === "Sẵn sàng tạo mô phỏng") return "Tạo vị thế giả lập nhỏ để theo dõi thesis.";
  if (status === "Đang theo dõi thesis" && phase !== "review") return "Đọc dữ liệu mới và ghi nhật ký theo mốc xem lại.";
  if (status === "Cần cập nhật mô phỏng") return "Quay lại PVT, Rủi ro hoặc Tin tức để kiểm tra dữ liệu mới.";
  return "Hoàn thành reflection và rút bài học quy trình.";
}

function getCurrentStep(mode: SimulationModeId, phase: SimulationPhaseId) {
  if (mode === "scenario") return "Stress-test thesis";
  if (mode === "history") return "Historical Case Lab";
  const labels: Record<SimulationPhaseId, string> = {
    prepare: "Chuẩn bị dữ liệu",
    thesis: "Viết thesis",
    position: "Tạo vị thế giả lập",
    tracking: "Theo dõi thesis",
    review: "Hậu kiểm",
  };
  return labels[phase];
}
