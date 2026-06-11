import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import type { ReactNode } from "react";
import type { LearningLesson, LessonStatus } from "../types";

type LessonWorkspaceProps = {
  lesson: LearningLesson;
  status: LessonStatus;
  quizAnswer?: string;
  miniCaseAnswer?: string;
  onQuizAnswer: (lessonId: string, answer: string) => void;
  onMiniCaseAnswer: (lessonId: string, answer: string) => void;
  onMarkUnderstood: (lessonId: string) => void;
  onNeedReview: (lessonId: string) => void;
  onOpenModule: (moduleName: string) => void;
};

export function LessonWorkspace({
  lesson,
  status,
  quizAnswer,
  miniCaseAnswer,
  onQuizAnswer,
  onMiniCaseAnswer,
  onMarkUnderstood,
  onNeedReview,
  onOpenModule,
}: LessonWorkspaceProps) {
  const quizOptions = lesson.quiz.options ?? [
    lesson.quiz.answer,
    "Chỉ cần nhìn giá gần đây.",
    "Chỉ cần xem một chỉ số đơn lẻ.",
  ];
  const isQuizCorrect = quizAnswer === lesson.quiz.answer;
  const hasMiniCase = Boolean(miniCaseAnswer?.trim());
  const canComplete = isQuizCorrect && hasMiniCase;

  return (
    <Card>
      <CardHeader
        title="Lesson Workspace"
        description="Học theo từng bước ngắn, làm quiz và áp dụng ngay vào module liên quan."
        chip={<Chip variant={status === "Đã học" ? "success" : status === "Cần ôn lại" ? "warning" : "accent"}>{status}</Chip>}
        action={
          <AnalysisNotePopover
            contextTitle={lesson.title}
            moduleId={`learning-${lesson.id}`}
            moduleName="Học tập"
            noteType="lesson"
            triggerLabel="Ghi chú bài học"
          />
        }
      />
      <CardBody className="space-y-5">
        <Step title="1. Vì sao bạn cần học bài này?">
          <InfoGrid
            items={[
              ["Lý do gợi ý", lesson.whySuggested],
              ["Lỗi giúp tránh", lesson.problemSolved],
              ["Module liên quan", lesson.relatedModules.slice(0, 3).join(", ")],
            ]}
          />
        </Step>

        <Step title="2. Hiểu nhanh trong 1 phút">
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-7 text-muted">
            {lesson.simpleExplanation}
          </p>
        </Step>

        <Step title="3. Ví dụ thực tế">
          <div className="grid gap-3 md:grid-cols-3">
            <Info label="Tình huống" value={lesson.realExample} />
            <Info label="Cách hiểu dễ sai" value={lesson.commonMistake} warning />
            <Info label="Cách hiểu đúng" value={lesson.concept} />
          </div>
        </Step>

        <Step title="4. Lỗi dễ mắc">
          <p className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-3 text-sm font-semibold leading-6 text-[#765416]">
            {lesson.commonMistake}. Lỗi này nguy hiểm vì nó làm bạn bỏ qua dữ liệu kiểm chứng và điểm phủ định thesis.
          </p>
        </Step>

        <Step title="5. Dữ liệu cần kiểm tra">
          <div className="flex flex-wrap gap-2">
            {lesson.dataToCheck.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </div>
        </Step>

        <Step title="6. Quiz kiểm tra hiểu">
          <p className="text-sm font-bold text-ink">{lesson.quiz.question}</p>
          <div className="mt-3 grid gap-2">
            {quizOptions.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={quizAnswer === option ? "primary" : "secondary"}
                onClick={() => onQuizAnswer(lesson.id, option)}
              >
                {option}
              </Button>
            ))}
          </div>
          {quizAnswer ? (
            <p className={`mt-3 rounded-[4px] border px-3 py-2 text-xs font-semibold leading-5 ${
              isQuizCorrect ? "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]" : "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]"
            }`}>
              {isQuizCorrect ? "Đúng. " : "Chưa đúng. "}
              {lesson.quiz.explanation ?? lesson.quiz.answer}
            </p>
          ) : null}
        </Step>

        <Step title="7. Mini case">
          <p className="text-sm font-bold leading-6 text-ink">{lesson.miniCase?.prompt ?? lesson.realExample}</p>
          <textarea
            className="mt-3 min-h-[96px] w-full resize-y rounded-[4px] border-[1.5px] border-border-soft bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-border"
            value={miniCaseAnswer ?? ""}
            placeholder="Viết cách xử lý của bạn bằng 2-3 câu."
            onChange={(event) => onMiniCaseAnswer(lesson.id, event.target.value)}
          />
          {hasMiniCase ? (
            <p className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
              Gợi ý phản hồi: {lesson.miniCase?.goodAnswer ?? lesson.outcome}
            </p>
          ) : null}
        </Step>

        <ApplyToModuleCard lesson={lesson} onOpenModule={onOpenModule} />

        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          <Button disabled={!canComplete} onClick={() => onMarkUnderstood(lesson.id)}>Đánh dấu đã hiểu</Button>
          <Button variant="secondary" onClick={() => onNeedReview(lesson.id)}>Tôi chưa chắc</Button>
          <Button variant="ghost" onClick={() => onOpenModule(lesson.relatedModules[0] ?? "Checklist")}>Quay lại module liên quan</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(([label, value]) => <Info key={label} label={label} value={value} />)}
    </div>
  );
}

function Info({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={warning ? "rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-3" : "rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"}>
      <p className="text-[11px] font-semibold text-subtle">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
    </div>
  );
}

function ApplyToModuleCard({ lesson, onOpenModule }: { lesson: LearningLesson; onOpenModule: (moduleName: string) => void }) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
      <h3 className="text-base font-bold text-ink">8. Áp dụng ngay ở đâu?</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {lesson.relatedModules.slice(0, 3).map((moduleName) => (
          <div key={moduleName} className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-sm font-bold text-ink">{moduleName}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Việc cần làm: kiểm tra {lesson.dataToCheck.slice(0, 3).join(", ")} trước khi kết luận.
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-muted">
              Câu hỏi: dữ liệu này xác nhận hay phủ định thesis?
            </p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => onOpenModule(moduleName)}>
                Mở module
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
