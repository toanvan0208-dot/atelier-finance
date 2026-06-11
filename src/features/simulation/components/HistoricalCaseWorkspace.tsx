import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { AnalysisNote } from "@/types/analysis-note";
import type { HistoricalCaseData } from "../types";

type HistoricalCaseWorkspaceProps = {
  data: HistoricalCaseData;
  selectedCaseId: string;
  decision: string;
  reason: string;
  reflection: string;
  replayUnlocked: boolean;
  onCaseChange: (id: string) => void;
  onDecisionChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onReflectionChange: (value: string) => void;
  onUnlockReplay: () => void;
};

export function HistoricalCaseWorkspace({
  data,
  selectedCaseId,
  decision,
  reason,
  reflection,
  replayUnlocked,
  onCaseChange,
  onDecisionChange,
  onReasonChange,
  onReflectionChange,
  onUnlockReplay,
}: HistoricalCaseWorkspaceProps) {
  const selectedCase = data.cases.find((item) => item.id === selectedCaseId) ?? data.cases[0];

  return (
    <Card>
      <CardHeader
        title="Historical Case Lab"
        description="Luyện quyết định với dữ liệu bị khóa tại một thời điểm quá khứ."
        chip={<Chip variant="warning">Dữ liệu tương lai đang bị khóa</Chip>}
      />
      <CardBody className="space-y-5">
        <section>
          <h3 className="text-base font-bold text-ink">Case Library</h3>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            {data.cases.map((item) => (
              <button
                key={item.id}
                className={`rounded-[4px] border px-4 py-4 text-left transition ${
                  selectedCase.id === item.id ? "border-border bg-accent-soft shadow-soft" : "border-border-soft bg-surface-soft hover:border-border"
                }`}
                type="button"
                onClick={() => onCaseChange(item.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-ink">{item.caseName}</h4>
                  <Chip size="sm">{item.difficulty}</Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{item.tickerOrGroup} · {item.startPoint}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{item.skill}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[4px] border-[1.5px] border-border bg-accent-soft/50 px-4 py-4">
          <h3 className="text-base font-bold text-ink">Time-Locked Workspace</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Case: {selectedCase.caseName}. Bạn đang đứng tại ngày {data.lockedWorkspace.asOfDate}.
          </p>
          <p className="mt-3 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs font-bold leading-5 text-muted">
            {data.lockedWorkspace.warning}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.lockedWorkspace.tabs.map((tab) => (
              <div key={tab.label} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-semibold text-subtle">{tab.label}</p>
                <p className="mt-1 text-sm font-bold text-ink">{tab.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-ink">Decision Panel</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Ghi quyết định giả lập và lý do. Câu hỏi chính là: quy trình lúc đó có hợp lý không?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.decisionOptions.map((option) => (
              <Button key={option} size="sm" variant={decision === option ? "primary" : "secondary"} onClick={() => onDecisionChange(option)}>
                {option}
              </Button>
            ))}
          </div>
          <label className="mt-3 grid gap-2">
            <span className="text-xs font-bold text-ink">Lý do và thesis tại thời điểm bị khóa</span>
            <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted">
                {reason.trim() ? reason : `Chưa ghi lý do. Gợi ý: ${data.requiredFields.slice(0, 3).join(" · ")}`}
              </p>
              <AnalysisNotePopover
                contextTitle={`Case lịch sử - ${selectedCase.caseName}`}
                initialNote={reason.trim() ? createHistoryNote(selectedCase.id, "personal", selectedCase.caseName, reason) : undefined}
                moduleId={`simulation-history-decision-${selectedCase.id}`}
                moduleName="Mô phỏng"
                noteType="personal"
                onSave={(note) => onReasonChange(note.content)}
                stockSymbol={selectedCase.tickerOrGroup}
                triggerLabel={reason.trim() ? "Xem lý do" : "Ghi lý do"}
              />
            </div>
          </label>
          <div className="mt-3">
            <Button disabled={!decision || !reason.trim()} onClick={onUnlockReplay}>
              Mở Replay Timeline
            </Button>
          </div>
        </section>

        <section className={replayUnlocked ? "" : "opacity-60"}>
          <h3 className="text-base font-bold text-ink">Replay Timeline</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Chỉ mở sau khi đã ghi quyết định giả lập. Không phán xét đúng/sai quá sớm.
          </p>
          <div className="mt-3 grid gap-3">
            {data.replayTimeline.map((item) => (
              <div key={item.milestone} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <h4 className="text-sm font-bold text-ink">{item.milestone}</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(replayUnlocked ? item.newData : ["Dữ liệu tương lai đang bị khóa"]).map((entry) => (
                    <p key={entry} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                      {entry}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-muted">{item.reflectionQuestion}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-ink">Reflection Box</h3>
          <div className="mt-3 flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted">
              {reflection.trim() ? reflection : "Chưa có bài học cá nhân cho case này."}
            </p>
            <AnalysisNotePopover
              contextTitle={`Bài học case - ${selectedCase.caseName}`}
              initialNote={reflection.trim() ? createHistoryNote(`${selectedCase.id}-reflection`, "lesson", selectedCase.caseName, reflection) : undefined}
              moduleId={`simulation-history-reflection-${selectedCase.id}`}
              moduleName="Mô phỏng"
              noteType="lesson"
              onSave={(note) => onReflectionChange(note.content)}
              stockSymbol={selectedCase.tickerOrGroup}
              triggerLabel={reflection.trim() ? "Xem bài học" : "Ghi bài học"}
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.postReviewTypes.map((item) => (
              <p key={`${item.label}-${item.value}`} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                {item.label}: {item.value}
              </p>
            ))}
          </div>
        </section>
      </CardBody>
    </Card>
  );
}

function createHistoryNote(
  id: string,
  type: "personal" | "lesson",
  title: string,
  content: string
): AnalysisNote {
  const now = new Date().toISOString();

  return {
    id: `simulation-history-${id}`,
    moduleId: `simulation-history-${id}`,
    moduleName: "Mô phỏng",
    type,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}
