import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { LearningLesson, LearningProfile, LessonStatus } from "../types";

type LearningProgressCardProps = {
  lessons: LearningLesson[];
  profile: LearningProfile;
  completedLessonIds: Set<string>;
  reviewLessonIds: Set<string>;
  quizCount: number;
  miniCaseCount: number;
  improvedModules: string[];
  getStatus: (lesson: LearningLesson) => LessonStatus;
};

export function LearningProgressCard({
  lessons,
  profile,
  completedLessonIds,
  reviewLessonIds,
  quizCount,
  miniCaseCount,
  improvedModules,
}: LearningProgressCardProps) {
  const completed = new Set([
    ...lessons.filter((lesson) => lesson.status === "Đã học").map((lesson) => lesson.id),
    ...completedLessonIds,
  ]);

  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader
          title="Learning Coach Summary"
          description="Tiến độ gọn, không phải bảng điểm."
          chip={<Chip variant="accent">{profile.level}</Chip>}
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Bài đã học" value={`${completed.size}`} />
            <Metric label="Quiz đã làm" value={`${quizCount}`} />
            <Metric label="Mini case" value={`${miniCaseCount}`} />
            <Metric label="Cần ôn" value={`${reviewLessonIds.size}`} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Chủ đề còn yếu</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.weakTopics.slice(0, 5).map((topic) => <Chip key={topic}>{topic}</Chip>)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Module đã sẵn sàng hơn</p>
            <div className="mt-2 grid gap-2">
              {(improvedModules.length > 0 ? improvedModules : ["Chưa có module mới trong phiên này"]).map((moduleName) => (
                <p key={moduleName} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
                  {moduleName}
                </p>
              ))}
            </div>
          </div>
          <p className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
            {profile.personalNote}
          </p>
        </CardBody>
      </Card>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-semibold text-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
