import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { LearningLesson, LearningMistake, MistakeSelfCheck } from "../types";

type MistakeRepairCenterProps = {
  mistakes: LearningMistake[];
  lessons: LearningLesson[];
  mistakeChoices: Record<string, MistakeSelfCheck>;
  onMistakeChoice: (mistakeId: string, choice: MistakeSelfCheck) => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenModule: (moduleName: string) => void;
};

const choices: MistakeSelfCheck[] = ["Tôi đã mắc lỗi này", "Tôi chưa chắc", "Tôi muốn luyện thêm"];

export function MistakeRepairCenter({
  mistakes,
  lessons,
  mistakeChoices,
  onMistakeChoice,
  onSelectLesson,
  onOpenModule,
}: MistakeRepairCenterProps) {
  return (
    <Card>
      <CardHeader
        title="Trung tâm sửa lỗi đầu tư"
        description="Chọn lỗi bạn đang gặp. Coach sẽ gợi ý bài học và module cần quay lại."
        chip={<Chip variant="warning">Sửa lỗi tư duy</Chip>}
      />
      <CardBody className="space-y-4">
        {mistakes.map((mistake) => {
          const relatedLessons = mistake.relatedLessonIds
            .map((id) => lessons.find((lesson) => lesson.id === id))
            .filter((lesson): lesson is LearningLesson => Boolean(lesson));
          const primaryLesson = relatedLessons[0];
          const primaryModule = primaryLesson?.relatedModules[0] ?? "Checklist";

          return (
            <article key={mistake.id} className="rounded-[4px] border border-border bg-surface px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{mistake.title}</h3>
                    <Chip variant={mistake.severity === "high" ? "danger" : mistake.severity === "medium" ? "warning" : "neutral"}>
                      {mistake.severity}
                    </Chip>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted"><strong className="text-ink">Dấu hiệu:</strong> {mistake.signal}</p>
                  <p className="mt-1 text-sm leading-6 text-muted"><strong className="text-ink">Vì sao nguy hiểm:</strong> {mistake.danger}</p>
                  <p className="mt-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                    Mini case: {mistake.miniCase}
                  </p>
                </div>
                <div className="min-w-[220px] rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
                  <p className="text-xs font-bold text-ink">Bài giúp sửa lỗi</p>
                  <p className="mt-1 text-sm font-bold leading-5 text-ink">{primaryLesson?.title ?? "Chưa có bài gợi ý"}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">Module bị ảnh hưởng: {primaryModule}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <Button
                    key={choice}
                    size="sm"
                    variant={mistakeChoices[mistake.id] === choice ? "primary" : "secondary"}
                    onClick={() => onMistakeChoice(mistake.id, choice)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {primaryLesson ? <Button size="sm" onClick={() => onSelectLesson(primaryLesson.id)}>Học bài sửa lỗi</Button> : null}
                <Button size="sm" variant="secondary" onClick={() => onOpenModule(primaryModule)}>Quay lại module liên quan</Button>
              </div>
            </article>
          );
        })}
      </CardBody>
    </Card>
  );
}
