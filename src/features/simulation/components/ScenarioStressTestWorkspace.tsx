import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { AnalysisNote } from "@/types/analysis-note";
import type { ScenarioModeData, ScenarioThesisResult } from "../types";

type ScenarioStressTestWorkspaceProps = {
  data: ScenarioModeData;
  selectedGroupId: string;
  selectedImpact: string;
  thesisResult: ScenarioThesisResult;
  lesson: string;
  onGroupChange: (id: string) => void;
  onImpactChange: (value: string) => void;
  onThesisResultChange: (value: ScenarioThesisResult) => void;
  onLessonChange: (value: string) => void;
};

const thesisResults: ScenarioThesisResult[] = [
  "Thesis vẫn đứng vững",
  "Thesis yếu đi nhưng chưa gãy",
  "Thesis bị phủ định một phần",
  "Cần quay lại module liên quan",
];

const moduleByGroup: Record<string, string> = {
  revenue: "BCTC",
  margin: "BCTC / Định giá",
  cashflow: "BCTC / Rủi ro",
  valuation: "Định giá",
  macro: "Vĩ mô / Ngành",
  behavior: "Nhật ký / PVT",
};

const impactChains: Record<string, string[]> = {
  revenue: ["Nhu cầu yếu đi", "Doanh thu giảm", "Đòn bẩy chi phí tăng", "Lợi nhuận giảm", "Thesis phục hồi cần kiểm tra lại"],
  margin: ["Giá vốn hoặc chi phí tăng", "Biên lợi nhuận giảm", "Lợi nhuận không đi cùng doanh thu", "Định giá cần cập nhật"],
  cashflow: ["Phải thu hoặc tồn kho tăng", "CFO yếu đi", "Chất lượng lợi nhuận giảm", "Rủi ro thesis tăng"],
  valuation: ["Giá tăng hoặc lợi nhuận giảm", "Biên an toàn thu hẹp", "Giả định định giá nhạy hơn", "Cần quay lại định giá"],
  macro: ["Bối cảnh vĩ mô/ngành xấu đi", "Sức mua hoặc chi phí bị ảnh hưởng", "Dữ liệu xác nhận yếu hơn", "Cần kiểm tra ngành"],
  behavior: ["Giá biến động mạnh", "Cảm xúc tăng", "Quy trình dễ bị bỏ qua", "Cần ghi nhật ký và kiểm tra PVT"],
};

export function ScenarioStressTestWorkspace({
  data,
  selectedGroupId,
  selectedImpact,
  thesisResult,
  lesson,
  onGroupChange,
  onImpactChange,
  onThesisResultChange,
  onLessonChange,
}: ScenarioStressTestWorkspaceProps) {
  const selectedGroup = data.groups.find((group) => group.id === selectedGroupId) ?? data.groups[0];
  const selectedLevel = data.impactLevels.find((level) => level.label === selectedImpact) ?? data.impactLevels[0];
  const chain = impactChains[selectedGroup.id] ?? data.transmissionExample;

  return (
    <Card>
      <CardHeader
        title="Workflow kiểm tra kịch bản"
        description="Chọn rủi ro, mức độ tác động, rồi trả lời thesis còn đứng vững không."
        chip={<Chip variant="accent">5 bước</Chip>}
      />
      <CardBody className="space-y-5">
        <section>
          <StepTitle step={1} title="Chọn nhóm kịch bản" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.groups.map((group) => (
              <button
                key={group.id}
                className={`rounded-[4px] border px-3 py-3 text-left transition ${
                  selectedGroup.id === group.id ? "border-border bg-accent-soft shadow-soft" : "border-border-soft bg-surface-soft hover:border-border"
                }`}
                type="button"
                onClick={() => onGroupChange(group.id)}
              >
                <p className="text-sm font-bold text-ink">{group.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{group.examples.slice(0, 2).join(" · ")}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <StepTitle step={2} title="Chọn mức độ tác động" />
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {data.impactLevels.map((level) => (
              <button
                key={level.label}
                className={`rounded-[4px] border px-3 py-3 text-left transition ${
                  selectedImpact === level.label ? "border-border bg-accent-soft shadow-soft" : "border-border-soft bg-surface-soft hover:border-border"
                }`}
                type="button"
                onClick={() => onImpactChange(level.label)}
              >
                <p className="text-sm font-bold text-ink">{level.label}</p>
                <p className="mt-1 text-xs font-semibold text-subtle">{level.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{level.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <StepTitle step={3} title="Xem kênh tác động" />
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {chain.map((step, index) => (
              <div key={step} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <p className="font-mono text-[11px] font-bold text-accent">{index + 1}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-ink">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <StepTitle step={4} title="Thesis còn đứng vững không?" />
          <div className="mt-3 flex flex-wrap gap-2">
            {thesisResults.map((result) => (
              <Button key={result} size="sm" variant={thesisResult === result ? "primary" : "secondary"} onClick={() => onThesisResultChange(result)}>
                {result}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
          <StepTitle step={5} title="Kết quả kiểm tra kịch bản" />
          <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
            <p><strong className="text-ink">Kịch bản:</strong> {selectedGroup.title}</p>
            <p><strong className="text-ink">Mức độ:</strong> {selectedLevel.label} - {selectedLevel.value}</p>
            <p><strong className="text-ink">Điểm bị ảnh hưởng:</strong> {chain[chain.length - 1]}</p>
            <p><strong className="text-ink">Trạng thái thesis:</strong> {thesisResult}</p>
            <p><strong className="text-ink">Module nên quay lại:</strong> {moduleByGroup[selectedGroup.id] ?? "Checklist"}</p>
          </div>
          <label className="mt-3 grid gap-2">
            <span className="text-xs font-bold text-ink">Bài học rút ra</span>
            <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted">
                {lesson.trim() ? lesson : "Chưa có bài học cá nhân cho kịch bản này."}
              </p>
              <AnalysisNotePopover
                contextTitle={`Stress-test: ${selectedGroup.title}`}
                initialNote={lesson.trim() ? createScenarioNote(selectedGroup.id, selectedGroup.title, lesson) : undefined}
                moduleId={`simulation-scenario-${selectedGroup.id}`}
                moduleName="Mô phỏng"
                noteType="lesson"
                onSave={(note) => onLessonChange(note.content)}
                stockSymbol="PNJ"
                triggerLabel={lesson.trim() ? "Xem bài học" : "Ghi bài học"}
              />
            </div>
          </label>
        </section>
      </CardBody>
    </Card>
  );
}

function createScenarioNote(groupId: string, title: string, content: string): AnalysisNote {
  const now = new Date().toISOString();

  return {
    id: `simulation-scenario-${groupId}`,
    moduleId: `simulation-scenario-${groupId}`,
    moduleName: "Mô phỏng",
    type: "lesson",
    title,
    content,
    createdAt: now,
    updatedAt: now,
    stockSymbol: "PNJ",
  };
}

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-[3px] border border-border bg-accent-soft text-[11px] font-bold text-accent">
        {step}
      </span>
      <h3 className="text-base font-bold text-ink">{title}</h3>
    </div>
  );
}
