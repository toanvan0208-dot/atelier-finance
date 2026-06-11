import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { LearningLesson, LearningProfile, ModuleReadiness, ModuleReadinessStatus } from "../types";

type LearningProfileViewProps = {
  profile: LearningProfile;
  lessons: LearningLesson[];
  improvedModules: string[];
  onSelectLesson: (lessonId: string) => void;
  onOpenModule: (moduleName: string) => void;
};

const statusVariant: Record<ModuleReadinessStatus, "success" | "accent" | "warning" | "neutral"> = {
  "Sẵn sàng dùng": "success",
  "Có thể dùng với hướng dẫn": "accent",
  "Cần học thêm trước": "warning",
  "Cần ôn lại": "neutral",
};

export function LearningProfileView({
  profile,
  lessons,
  improvedModules,
  onSelectLesson,
  onOpenModule,
}: LearningProfileViewProps) {
  return (
    <Card>
      <CardHeader
        title="Bản đồ năng lực theo module"
        description="Mỗi card cho biết bạn có thể dùng module ở mức nào và bài nào nên học tiếp."
        chip={<Chip variant="accent">{profile.level}</Chip>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <ProfileMetric label="Đã học" value={profile.completedLessons} />
          <ProfileMetric label="Quiz" value={profile.completedQuiz} />
          <ProfileMetric label="Mini case" value={profile.completedMiniCase} />
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {profile.readiness.map((item) => (
            <ModuleReadinessCard
              key={item.moduleName}
              item={item}
              lesson={lessons.find((lesson) => lesson.id === item.recommendedLessonId)}
              improved={improvedModules.includes(item.moduleName)}
              onSelectLesson={onSelectLesson}
              onOpenModule={onOpenModule}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-semibold text-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function ModuleReadinessCard({
  item,
  lesson,
  improved,
  onSelectLesson,
  onOpenModule,
}: {
  item: ModuleReadiness;
  lesson?: LearningLesson;
  improved: boolean;
  onSelectLesson: (lessonId: string) => void;
  onOpenModule: (moduleName: string) => void;
}) {
  const displayStatus = improved && item.status !== "Sẵn sàng dùng" ? "Có thể dùng với hướng dẫn" : item.status;

  return (
    <article className="rounded-[4px] border border-border bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">{item.moduleName}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{item.reason}</p>
        </div>
        <Chip variant={statusVariant[displayStatus]}>{displayStatus}</Chip>
      </div>
      <div className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
        <p className="text-[11px] font-semibold text-subtle">Bài nên học tiếp</p>
        <p className="mt-1 text-sm font-bold text-ink">{lesson?.title ?? "Chưa có bài gợi ý"}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {lesson ? <Button size="sm" onClick={() => onSelectLesson(lesson.id)}>Học ngay</Button> : null}
        <Button size="sm" variant="secondary" onClick={() => onOpenModule(item.moduleName)}>Mở module với hướng dẫn</Button>
      </div>
    </article>
  );
}
