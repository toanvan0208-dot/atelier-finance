"use client";

import { useEffect } from "react";
import { Button, Card, CardBody, CardHeader, Chip, DataTable, SectionHeader, StepAccordion } from "@/components/ui";
import type { DataTableColumn, StepAccordionItem } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  LearningLesson,
  LearningMistake,
  LearningProfile,
  LearningStage,
  ModuleReadiness,
} from "../types";

function statusVariant(status: string): "neutral" | "accent" | "success" | "warning" | "danger" {
  if (status === "AI gợi ý") return "accent";
  if (status === "Đã học" || status === "Tạm ổn" || status === "Sẵn sàng dùng") return "success";
  if (status === "Cần ôn lại" || status === "Cần ôn" || status === "Cần học thêm trước") return "warning";
  if (status === "Chưa nên dùng một mình") return "danger";
  return "neutral";
}

function getLesson(lessons: LearningLesson[], id: string) {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}

export function LearningHeader({
  description,
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <Chip variant="accent">{eyebrow}</Chip>
      <h1 className="mt-3 font-brand text-2xl font-bold leading-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
    </section>
  );
}

export function LearningTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "today", label: "Học hôm nay" },
    { id: "roadmap", label: "Học từ A-Z" },
    { id: "mistakes", label: "Ôn lỗi sai" },
    { id: "profile", label: "Hồ sơ năng lực" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto rounded-[4px] border border-border-soft bg-surface-soft p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "min-h-9 shrink-0 rounded-[3px] px-3 text-xs font-bold transition",
            activeTab === tab.id
              ? "border-[1.5px] border-border bg-accent-soft text-ink shadow-hard-sm"
              : "border border-transparent text-muted hover:bg-surface hover:text-ink"
          )}
          type="button"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TodayCoachCard({
  lesson,
  onStartLesson,
}: {
  lesson: LearningLesson;
  onStartLesson: (lessonId: string) => void;
}) {
  return (
    <Card className="bg-accent-soft/45">
      <CardHeader
        chip={<Chip variant="accent">{lesson.status}</Chip>}
        description="Trả lời câu hỏi: hôm nay nên học gì để không phân tích sai?"
        icon="AI"
        title="Hôm nay nên học"
      />
      <CardBody className="space-y-5">
        <div>
          <h2 className="font-brand text-xl font-bold leading-tight text-ink">
            {lesson.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {lesson.problemSolved}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Vì sao hệ thống gợi ý bài này", lesson.whySuggested],
            ["Bài này giúp bạn tránh", lesson.problemSolved],
            ["Dùng trong module", lesson.relatedModules.join(", ")],
            ["Kết quả sau khi học", lesson.outcome],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[4px] border border-border-soft bg-surface/80 px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          <Button onClick={() => onStartLesson(lesson.id)}>Học bài này</Button>
          <Button variant="secondary">Làm quiz 3 phút</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function MiniLearningStageStrip({
  activeStageId,
  stages,
}: {
  activeStageId?: string;
  stages: LearningStage[];
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-6">
      {stages.map((stage, index) => (
        <button
          key={stage.id}
          className={cn(
            "rounded-[4px] border px-3 py-3 text-left",
            activeStageId === stage.id
              ? "border-border bg-accent-soft shadow-hard-sm"
              : "border-border-soft bg-surface"
          )}
          disabled
          type="button"
        >
          <p className="text-[11px] font-bold text-subtle">Chặng {index + 1}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-ink">{stage.title}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-accent">
              {stage.progress.completed}/{stage.progress.total}
            </span>
            <Chip size="sm" variant={statusVariant(stage.status)}>
              {stage.status}
            </Chip>
          </div>
        </button>
      ))}
    </div>
  );
}

export function CurrentLearningPositionCard({
  lesson,
  onViewRoadmap,
  stages,
}: {
  lesson: LearningLesson;
  stages: LearningStage[];
  onViewRoadmap: () => void;
}) {
  const currentStage =
    stages.find((stage) => stage.id === lesson.stageId) ?? stages[0];
  const currentStageIndex = stages.findIndex(
    (stage) => stage.id === currentStage.id
  );

  return (
    <Card>
      <CardHeader
        action={
          <Button size="sm" variant="secondary" onClick={onViewRoadmap}>
            Xem toàn bộ lộ trình A-Z
          </Button>
        }
        description="Phần này chỉ giúp bạn biết bài hôm nay nằm ở đâu trong hành trình học, không phải điều hướng chính."
        icon="P"
        title="Vị trí của bài học hôm nay"
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              Chặng hiện tại
            </p>
            <h3 className="mt-1 font-brand text-lg font-bold text-ink">
              {currentStage.title}
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-ink">
              {lesson.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Bài này thuộc chặng {currentStage.title} vì nó giúp bạn tránh{" "}
              {lesson.problemSolved.toLowerCase()}.
            </p>
          </div>

          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              Tiến độ trong chặng
            </p>
            <p className="mt-1 font-mono text-2xl font-bold leading-none text-accent">
              {currentStage.progress.completed}/{currentStage.progress.total} bài
            </p>
            <Chip className="mt-3" size="sm" variant={statusVariant(currentStage.status)}>
              {currentStage.status}
            </Chip>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-6">
          {stages.map((stage, index) => {
            const isCurrent = stage.id === currentStage.id;

            return (
              <div
                key={stage.id}
                className={cn(
                  "rounded-[4px] border px-3 py-3",
                  isCurrent
                    ? "border-border bg-accent-soft shadow-hard-sm"
                    : "border-border-soft bg-surface-soft opacity-55"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <p className="text-[11px] font-bold text-subtle">
                  Chặng {index + 1}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-ink">
                  {stage.title}
                </p>
                {isCurrent ? (
                  <p className="mt-2 text-[11px] font-bold text-accent">
                    Đang ở đây
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-xs leading-5 text-subtle">
          Bạn đang ở chặng {currentStageIndex + 1} trong 6 chặng học đầu tư.
        </p>
      </CardBody>
    </Card>
  );
}

export function ActiveLessonPanel({ lesson }: { lesson: LearningLesson }) {
  const items: StepAccordionItem[] = [
    {
      key: "concept",
      order: 1,
      title: "Khái niệm này là gì?",
      status: "Đang học",
      content: <p className="text-sm leading-6 text-muted">{lesson.concept}</p>,
      defaultOpen: true,
    },
    {
      key: "simple",
      order: 2,
      title: "Nói dễ hiểu",
      status: "Đang học",
      content: <p className="text-sm leading-6 text-muted">{lesson.simpleExplanation}</p>,
      defaultOpen: true,
    },
    {
      key: "module",
      order: 3,
      title: "Dùng trong module nào?",
      status: "Có thể mở",
      content: (
        <div>
          <p className="text-sm leading-6 text-muted">{lesson.usedInModule}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lesson.relatedModules.map((moduleName) => (
              <Chip key={moduleName} size="sm" variant="neutral">
                {moduleName}
              </Chip>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "example",
      order: 4,
      title: "Ví dụ thực tế",
      status: "Có thể mở",
      content: <p className="text-sm leading-6 text-muted">{lesson.realExample}</p>,
    },
    {
      key: "mistake",
      order: 5,
      title: "Dễ hiểu sai ở đâu?",
      status: "Cần chú ý",
      content: <p className="text-sm leading-6 text-muted">{lesson.commonMistake}</p>,
    },
    {
      key: "data",
      order: 6,
      title: "Dữ liệu cần xem",
      status: "Có thể mở",
      content: (
        <div className="flex flex-wrap gap-1.5">
          {lesson.dataToCheck.map((item) => (
            <Chip key={item} size="sm" variant="neutral">
              {item}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "quiz",
      order: 7,
      title: "Kiểm tra hiểu chưa",
      status: "Quiz",
      content: <PracticePrompt title="Quiz nhanh" prompt={lesson.quiz.question} answer={lesson.quiz.answer} />,
    },
    ...(lesson.miniCase
      ? [
          {
            key: "case",
            order: 8,
            title: "Mini case",
            status: "Tình huống",
            content: (
              <PracticePrompt
                title="Mini case"
                prompt={lesson.miniCase.prompt}
                answer={lesson.miniCase.goodAnswer}
              />
            ),
          } satisfies StepAccordionItem,
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader
        chip={<Chip variant={statusVariant(lesson.status)}>{lesson.status}</Chip>}
        description={`${lesson.duration} · ${lesson.level}`}
        icon="B"
        title={lesson.title}
      />
      <CardBody className="space-y-4">
        <StepAccordion
          description="Đi theo từng bước, không cần đọc tất cả cùng lúc."
          items={items}
          title="Luồng học bài này"
        />
        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          <Button>Đánh dấu đã hiểu</Button>
          <Button variant="secondary">Học bài tiếp theo</Button>
          <Button variant="ghost">Quay lại module liên quan</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function RelatedLessonsCompact({
  lessons,
  onOpenDrawer,
  onSelectLesson,
}: {
  lessons: LearningLesson[];
  onSelectLesson: (lessonId: string) => void;
  onOpenDrawer: () => void;
}) {
  return (
    <Card>
      <CardHeader
        action={
          <Button size="sm" variant="secondary" onClick={onOpenDrawer}>
            Xem thêm gợi ý AI
          </Button>
        }
        description="Chỉ hiện một vài bài liên quan để không cạnh tranh với bài chính."
        icon="R"
        title="Bài liên quan"
      />
      <CardBody className="grid gap-3 md:grid-cols-3">
        {lessons.slice(0, 3).map((lesson) => (
          <button
            key={lesson.id}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left hover:border-border"
            type="button"
            onClick={() => onSelectLesson(lesson.id)}
          >
            <Chip size="sm" variant={statusVariant(lesson.status)}>
              {lesson.status}
            </Chip>
            <p className="mt-2 text-sm font-bold leading-5 text-ink">{lesson.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
              {lesson.problemSolved}
            </p>
          </button>
        ))}
      </CardBody>
    </Card>
  );
}

export function PracticePrompt({
  answer,
  prompt,
  title,
}: {
  title: string;
  prompt: string;
  answer: string;
}) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{prompt}</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-accent">
          Xem đáp án tốt
        </summary>
        <p className="mt-2 text-xs leading-5 text-muted">{answer}</p>
      </details>
    </div>
  );
}

export function OnePracticeBlock({ lesson }: { lesson: LearningLesson }) {
  return (
    <Card>
      <CardHeader
        description="Một câu hỏi nhỏ để kiểm tra bạn còn nhầm điểm chính không."
        icon="Q"
        title="Kiểm tra nhanh"
      />
      <CardBody>
        <PracticePrompt
          answer={lesson.quiz.answer}
          prompt={lesson.quiz.question}
          title={`Bạn có còn nhầm: ${lesson.problemSolved.toLowerCase()}?`}
        />
      </CardBody>
    </Card>
  );
}

export function RoadmapView({
  activeStageId,
  lessons,
  onSelectLesson,
  stages,
}: {
  activeStageId?: string;
  stages: LearningStage[];
  lessons: LearningLesson[];
  onSelectLesson: (lessonId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        description="Lộ trình này dành cho người mới bắt đầu. Bạn không cần học hết mọi thứ trước khi dùng hệ thống, nhưng nên đi theo thứ tự để tránh hiểu sai bản chất đầu tư."
        icon="AZ"
        title="Học từ A-Z"
      />
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const stageLessons = stage.lessonIds.map((id) => getLesson(lessons, id));

          return (
            <Card
              key={stage.id}
              className={activeStageId === stage.id ? "bg-accent-soft/25" : undefined}
            >
              <CardHeader
                chip={<Chip variant={statusVariant(stage.status)}>{stage.status}</Chip>}
                description={stage.description}
                icon={index + 1}
                title={stage.title}
              />
              <CardBody className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <p className="text-xs font-bold text-ink">Module liên quan</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {stage.relatedModules.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                    <p className="text-[11px] font-bold text-subtle">Tiến độ</p>
                    <p className="font-mono text-lg font-bold text-accent">
                      {stage.progress.completed}/{stage.progress.total}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {stageLessons.slice(0, 5).map((lesson) => (
                    <button
                      key={lesson.id}
                      className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-left hover:border-border"
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                    >
                      <p className="text-sm font-bold text-ink">{lesson.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {lesson.duration} · {lesson.problemSolved}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
                  <Button size="sm" onClick={() => onSelectLesson(stageLessons[0].id)}>
                    Học tiếp chặng này
                  </Button>
                  <Button size="sm" variant="secondary">
                    Làm quiz chặng này
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function MistakeReviewView({
  lessons,
  mistakes,
  onSelectLesson,
}: {
  mistakes: LearningMistake[];
  lessons: LearningLesson[];
  onSelectLesson: (lessonId: string) => void;
}) {
  const [firstMistake, ...otherMistakes] = mistakes;
  const primaryLessons = firstMistake.relatedLessonIds.map((id) => getLesson(lessons, id));

  return (
    <section className="space-y-5">
      <SectionHeader
        description="Biến lỗi phân tích thành bài học sửa sai. Mặc định chỉ mở lỗi cần sửa trước."
        icon="ER"
        title="Ôn lỗi sai"
      />

      <Card className="bg-warning/10">
        <CardHeader
          chip={<Chip variant="warning">Ưu tiên sửa</Chip>}
          description={firstMistake.signal}
          icon="!"
          title={`Lỗi cần sửa trước: ${firstMistake.title}`}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-ink">Vì sao nguy hiểm</p>
              <p className="mt-1 text-sm leading-6 text-muted">{firstMistake.danger}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Mini case</p>
              <p className="mt-1 text-sm leading-6 text-muted">{firstMistake.miniCase}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {primaryLessons.map((lesson, index) => (
              <Button
                key={lesson.id}
                size="sm"
                variant={index === 0 ? "primary" : "secondary"}
                onClick={() => onSelectLesson(lesson.id)}
              >
                {index === 0 ? "Ôn lỗi này" : "Làm mini case"}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {otherMistakes.map((mistake) => {
          const relatedLessons = mistake.relatedLessonIds.map((id) => getLesson(lessons, id));

          return (
            <details
              key={mistake.id}
              className="rounded-[4px] border border-border-soft bg-surface"
            >
              <summary className="cursor-pointer px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink">{mistake.title}</span>
                  <Chip size="sm" variant={mistake.severity === "high" ? "warning" : "neutral"}>
                    {mistake.severity === "high" ? "Nghiêm trọng" : "Cần chú ý"}
                  </Chip>
                </div>
              </summary>
              <div className="space-y-3 border-t border-border-soft px-4 py-4">
                <p className="text-sm leading-6 text-muted">
                  <span className="font-bold text-ink">Dấu hiệu: </span>
                  {mistake.signal}
                </p>
                <p className="text-sm leading-6 text-muted">
                  <span className="font-bold text-ink">Tác hại: </span>
                  {mistake.danger}
                </p>
                <div className="flex flex-wrap gap-2">
                  {relatedLessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      size="sm"
                      variant="secondary"
                      onClick={() => onSelectLesson(lesson.id)}
                    >
                      Học lại: {lesson.title}
                    </Button>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function ProfileView({
  lessons,
  profile,
  stages,
}: {
  profile: LearningProfile;
  stages: LearningStage[];
  lessons: LearningLesson[];
}) {
  return (
    <section className="space-y-5">
      <SectionHeader
        description="Cho biết bạn đã học gì, còn yếu gì và sẵn sàng dùng module nào."
        icon="PF"
        title="Hồ sơ năng lực"
      />

      <Card>
        <CardHeader description={profile.personalNote} icon="C" title="Tóm tắt năng lực" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Cấp độ hiện tại", profile.level],
              ["Bài đã học", profile.completedLessons],
              ["Quiz đã làm", profile.completedQuiz],
              ["Mini case", profile.completedMiniCase],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <p className="text-xs font-bold text-subtle">{label}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TopicList title="Đã nắm được" items={profile.learnedTopics} />
            <TopicList title="Còn yếu nhất" items={profile.weakTopics} tone="warning" />
          </div>
        </CardBody>
      </Card>

      <ModuleReadinessGrid lessons={lessons} readiness={profile.readiness} />
      <KnowledgeMapCompact stages={stages} lessons={lessons} />
    </section>
  );
}

function TopicList({
  items,
  title,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "warning";
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-ink">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Chip key={item} size="sm" variant={tone}>
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function ModuleReadinessGrid({
  lessons,
  readiness,
}: {
  readiness: ModuleReadiness[];
  lessons: LearningLesson[];
}) {
  const columns: Array<DataTableColumn<ModuleReadiness>> = [
    {
      key: "module",
      header: "Module",
      cell: (row) => <span className="font-bold text-ink">{row.moduleName}</span>,
    },
    {
      key: "status",
      header: "Readiness",
      cell: (row) => <Chip variant={statusVariant(row.status)}>{row.status}</Chip>,
    },
    {
      key: "reason",
      header: "Vì sao",
      cell: (row) => row.reason,
    },
    {
      key: "lesson",
      header: "Bài nên học tiếp",
      cell: (row) => getLesson(lessons, row.recommendedLessonId).title,
    },
  ];

  return (
    <Card>
      <CardHeader
        description="Không phải module nào cũng nên dùng một mình ngay. Trạng thái này giúp bạn biết nên học gì trước."
        icon="MR"
        title="Sẵn sàng dùng module nào?"
      />
      <CardBody>
        <DataTable
          caption="Readiness theo module"
          columns={columns}
          getRowKey={(row) => row.moduleName}
          rows={readiness}
        />
      </CardBody>
    </Card>
  );
}

function KnowledgeMapCompact({
  lessons,
  stages,
}: {
  stages: LearningStage[];
  lessons: LearningLesson[];
}) {
  return (
    <Card>
      <CardHeader
        description="Bản đồ kiến thức rút gọn theo 6 chặng năng lực."
        icon="KM"
        title="Bản đồ kiến thức"
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => {
            const nextLesson = getLesson(lessons, stage.lessonIds[0]);
            return (
              <div
                key={stage.id}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{stage.title}</p>
                  <Chip size="sm" variant={statusVariant(stage.status)}>
                    {stage.status}
                  </Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Đã học {stage.progress.completed} · Còn yếu{" "}
                  {Math.max(stage.progress.total - stage.progress.completed, 0)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Bài tiếp theo: <span className="font-bold text-ink">{nextLesson.title}</span>
                </p>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function AIRecommendationDrawer({
  lessons,
  onClose,
  onSelectLesson,
  open,
}: {
  open: boolean;
  lessons: LearningLesson[];
  onSelectLesson: (lessonId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Đóng danh sách gợi ý AI"
        className="absolute inset-0 bg-ink/30"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-modal="true"
        className="absolute bottom-0 right-0 top-auto flex max-h-[88dvh] w-full flex-col rounded-t-[4px] border-[1.5px] border-border bg-surface shadow-hard-lg md:top-0 md:max-h-none md:w-[420px] md:rounded-none md:border-y-0 md:border-r-0"
        role="dialog"
      >
        <header className="border-b border-border-soft bg-surface-soft px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                AI gợi ý
              </p>
              <h2 className="mt-1 font-brand text-lg font-bold text-ink">
                Bài nên học tiếp
              </h2>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className="w-full rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left hover:border-border"
              type="button"
              onClick={() => {
                onSelectLesson(lesson.id);
                onClose();
              }}
            >
              <Chip size="sm" variant={statusVariant(lesson.status)}>
                {lesson.status}
              </Chip>
              <p className="mt-2 text-sm font-bold text-ink">{lesson.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{lesson.whySuggested}</p>
              <p className="mt-2 text-[11px] font-bold text-subtle">
                Module: {lesson.relatedModules.join(", ")}
              </p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
