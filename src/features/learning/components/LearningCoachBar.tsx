import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { LearningLesson, LessonStatus } from "../types";

type LearningCoachBarProps = {
  lesson: LearningLesson;
  status: LessonStatus;
  reason: string;
  onStartLesson: (lessonId: string) => void;
  onShowReason: () => void;
  onOpenModule: (moduleName: string) => void;
};

export function LearningCoachBar({
  lesson,
  status,
  reason,
  onStartLesson,
  onShowReason,
  onOpenModule,
}: LearningCoachBarProps) {
  const primaryModule = lesson.relatedModules[0] ?? "Checklist";

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">AI Learning Coach</Chip>
          <Chip>{status}</Chip>
          <span className="text-xs font-semibold text-muted">
            Học đúng bài, sửa đúng lỗi, quay lại đúng module.
          </span>
          <AnalysisNotePopover
            contextTitle="Ghi chú cấp module Học tập"
            moduleId="learning-module"
            moduleName="Học tập"
            noteType="lesson"
            triggerLabel="Ghi chú phân tích"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              Hôm nay nên học
            </p>
            <h1 className="mt-2 font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
              {lesson.title}
            </h1>
            <p className="mt-2 max-w-[820px] text-sm leading-7 text-muted">{reason}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              Học xong làm gì?
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink">{lesson.outcome}</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Áp dụng vào: {lesson.relatedModules.slice(0, 3).join(", ")}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Vì sao gợi ý?" value={lesson.whySuggested} />
          <Info label="Giúp tránh lỗi" value={lesson.problemSolved} />
          <Info label="Nếu bỏ qua" value={lesson.commonMistake} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onStartLesson(lesson.id)}>Học bài này</Button>
          <Button variant="secondary" onClick={onShowReason}>Xem lý do gợi ý</Button>
          <Button variant="ghost" onClick={() => onOpenModule(primaryModule)}>Quay lại module liên quan</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="text-[11px] font-semibold text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
    </div>
  );
}
