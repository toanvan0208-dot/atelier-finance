import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { LearningLesson, LearningStage, LessonStatus } from "../types";

type LearningRoadmapViewProps = {
  stages: LearningStage[];
  lessons: LearningLesson[];
  activeStageId: string;
  onStageChange: (stageId: string) => void;
  onSelectLesson: (lessonId: string) => void;
  getStatus: (lesson: LearningLesson) => LessonStatus;
};

export function LearningRoadmapView({
  stages,
  lessons,
  activeStageId,
  onStageChange,
  onSelectLesson,
  getStatus,
}: LearningRoadmapViewProps) {
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];
  const stageLessons = activeStage.lessonIds
    .map((id) => lessons.find((lesson) => lesson.id === id))
    .filter((lesson): lesson is LearningLesson => Boolean(lesson));

  return (
    <Card>
      <CardHeader
        title="Lộ trình nền tảng"
        description="Bạn không cần học hết lộ trình trước khi dùng hệ thống. Hãy học từng bài khi hệ thống gợi ý hoặc khi bạn gặp khó ở một module cụ thể."
        chip={<Chip variant="accent">Học khi cần</Chip>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 xl:grid-cols-2">
          {stages.map((stage) => {
            const nextLesson = stage.lessonIds.map((id) => lessons.find((lesson) => lesson.id === id)).find(Boolean);
            const isActive = stage.id === activeStage.id;
            return (
              <button
                key={stage.id}
                className={`rounded-[4px] border px-4 py-4 text-left transition ${
                  isActive ? "border-border bg-accent-soft shadow-soft" : "border-border-soft bg-surface-soft hover:border-border"
                }`}
                type="button"
                onClick={() => onStageChange(stage.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-ink">{stage.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{stage.description}</p>
                  </div>
                  <Chip>{stage.status}</Chip>
                </div>
                <p className="mt-3 text-xs font-semibold text-subtle">
                  {stage.progress.completed}/{stage.progress.total} bài · Bài nên học tiếp: {nextLesson?.title ?? "Chưa có"}
                </p>
              </button>
            );
          })}
        </div>

        <section className="rounded-[4px] border border-border bg-surface px-4 py-4">
          <h3 className="text-base font-bold text-ink">{activeStage.title}</h3>
          <div className="mt-3 grid gap-2">
            {stageLessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">{lesson.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {lesson.duration} · {lesson.relatedModules.slice(0, 3).join(", ")} · {getStatus(lesson)}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onSelectLesson(lesson.id)}>Học</Button>
              </div>
            ))}
          </div>
        </section>
      </CardBody>
    </Card>
  );
}
