import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { LearningLesson, LessonStatus } from "../types";
import { LessonWorkspace } from "./LessonWorkspace";

type TodayLearningViewProps = {
  mainLesson: LearningLesson;
  activeLesson: LearningLesson;
  secondaryLessons: LearningLesson[];
  getStatus: (lesson: LearningLesson) => LessonStatus;
  quizAnswer?: string;
  miniCaseAnswer?: string;
  onSelectLesson: (lessonId: string) => void;
  onQuizAnswer: (lessonId: string, answer: string) => void;
  onMiniCaseAnswer: (lessonId: string, answer: string) => void;
  onMarkUnderstood: (lessonId: string) => void;
  onNeedReview: (lessonId: string) => void;
  onOpenModule: (moduleName: string) => void;
};

export function TodayLearningView({
  mainLesson,
  activeLesson,
  secondaryLessons,
  getStatus,
  quizAnswer,
  miniCaseAnswer,
  onSelectLesson,
  onQuizAnswer,
  onMiniCaseAnswer,
  onMarkUnderstood,
  onNeedReview,
  onOpenModule,
}: TodayLearningViewProps) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Hôm nay học gì?"
          description="Một bài chính được ưu tiên. Các bài phụ chỉ để học thêm nếu bạn còn thời gian."
          chip={<Chip variant="accent">Ưu tiên 1 bài</Chip>}
        />
        <CardBody className="space-y-4">
          <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="accent">{getStatus(mainLesson)}</Chip>
              <Chip>{mainLesson.duration}</Chip>
              <Chip>{mainLesson.relatedModules.slice(0, 2).join(", ")}</Chip>
            </div>
            <h2 className="mt-3 text-xl font-bold text-ink">{mainLesson.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{mainLesson.whySuggested}</p>
            <p className="mt-2 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs font-semibold leading-5 text-muted">
              Nếu bỏ qua: {mainLesson.commonMistake}
            </p>
            <div className="mt-4">
              <Button onClick={() => onSelectLesson(mainLesson.id)}>Bắt đầu học</Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-subtle">Bài phụ nếu muốn học thêm</p>
            <div className="grid gap-3 md:grid-cols-3">
              {secondaryLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border"
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <p className="text-sm font-bold text-ink">{lesson.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{lesson.problemSolved}</p>
                  <p className="mt-2 text-[11px] font-semibold text-subtle">{lesson.duration} · {getStatus(lesson)}</p>
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <LessonWorkspace
        lesson={activeLesson}
        status={getStatus(activeLesson)}
        quizAnswer={quizAnswer}
        miniCaseAnswer={miniCaseAnswer}
        onQuizAnswer={onQuizAnswer}
        onMiniCaseAnswer={onMiniCaseAnswer}
        onMarkUnderstood={onMarkUnderstood}
        onNeedReview={onNeedReview}
        onOpenModule={onOpenModule}
      />
    </div>
  );
}
