import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  AILearningCoachData,
  ContextualLearningHintData,
  ErrorReviewItem,
  LearningCategory,
  LearningDashboardData,
  LearningLesson,
  LearningProfile,
  PracticeItem,
} from "../types";

function statusTone(status: string) {
  if (status === "AI gợi ý") return "bg-accent-soft text-accent border-border";
  if (status === "Cần ôn lại") return "bg-warning/15 text-ink border-warning/40";
  if (status === "Đã học" || status === "Tạm ổn" || status === "Đã hiểu khá tốt") {
    return "bg-accent-green/10 text-accent-green border-accent-green/30";
  }
  return "bg-surface-soft text-muted border-border-soft";
}

export function LearningDashboard({ data }: { data: LearningDashboardData }) {
  const cards = [
    {
      title: "Bài học nên học hôm nay",
      value: data.recommendedToday,
      detail: data.currentContext,
      accent: true,
    },
    { title: "Chủ đề còn yếu", value: data.weakTopics.join(", "), detail: "AI sẽ ưu tiên quiz và mini case liên quan." },
    { title: "Lỗi sai gần đây", value: data.recentMistake, detail: "Gợi ý học lại từ lỗi, không phán xét." },
    { title: "Cần học trước khi tiếp tục", value: data.moduleBeforeContinue, detail: "Học để quay lại module phân tích tốt hơn." },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
        <Chip variant="accent">AI Learning Coach</Chip>
        <h1 className="mt-3 font-brand text-2xl font-bold leading-tight text-ink">
          Học tập cá nhân
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Học đúng kiến thức cần dùng trong quá trình phân tích cổ phiếu. AI gợi ý bài học
          dựa trên module bạn đang dùng, câu trả lời, lỗi sai trong mô phỏng và phần còn yếu.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title} className={card.accent ? "bg-accent-soft/40" : undefined}>
            <CardBody className="space-y-2">
              <p className="text-xs font-bold text-subtle">{card.title}</p>
              <p className="text-sm font-bold leading-6 text-ink">{card.value}</p>
              <p className="text-xs leading-5 text-muted">{card.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Tiến độ học theo nhóm" description="Chỉ hiển thị phần cần dùng trong các module phân tích chính." />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.progress.map((item) => (
              <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-ink">{item.label}</p>
                  <p className="font-mono text-sm font-bold text-accent">{item.value}</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function LearningPathSidebar({
  activeCategory,
  categories,
  onSelect,
}: {
  activeCategory: string;
  categories: LearningCategory[];
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader title="Lộ trình theo module" description="Chọn nhóm để lọc bài học liên quan." icon="LP" />
      <CardBody className="space-y-2">
        <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-2">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                className={cn(
                  "min-w-[180px] rounded-[4px] border px-3 py-2 text-left transition lg:min-w-0 lg:w-full",
                  isActive
                    ? "border-border bg-accent-soft shadow-hard-sm"
                    : "border-border-soft bg-surface-soft hover:border-border"
                )}
                onClick={() => onSelect(category.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{category.title}</p>
                  <span className={cn("rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold", statusTone(category.status))}>
                    {category.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  Đã học {category.learnedCount} · Còn yếu {category.weakCount}
                </p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function LearningLessonCard({
  isSelected,
  lesson,
  onOpen,
}: {
  isSelected: boolean;
  lesson: LearningLesson;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className={isSelected ? "bg-accent-soft/30" : undefined}>
      <CardHeader
        action={<span className={cn("rounded-[3px] border px-2 py-1 text-[11px] font-bold", statusTone(lesson.status))}>{lesson.status}</span>}
        description={`${lesson.duration} · ${lesson.level} · ${lesson.relatedModules.join(", ")}`}
        icon={lesson.title.slice(0, 2)}
        title={lesson.title}
      />
      <CardBody className="space-y-3">
        <div>
          <p className="text-xs font-bold text-ink">Vấn đề bài học giải quyết</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{lesson.problemSolved}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lesson.relatedModules.map((moduleName) => (
            <Chip key={moduleName} size="sm" variant="neutral">
              {moduleName}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => onOpen(lesson.id)}>
            Học bài này
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onOpen(lesson.id)}>
            Làm quiz nhanh
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function LessonDetailView({ lesson }: { lesson: LearningLesson }) {
  const blocks = [
    ["Dùng trong module nào?", lesson.linkedModules.join(", ")],
    ["Mục tiêu bài học", lesson.goal],
    ["Nói dễ hiểu", lesson.plainExplanation],
    ["Ví dụ thực tế", lesson.realExample],
    ["Dễ hiểu sai ở đâu?", lesson.commonMistake],
    ["Kết quả cần đạt", lesson.outcome],
  ];

  return (
    <Card>
      <CardHeader
        chip={<span className={cn("rounded-[3px] border px-2 py-1 text-[11px] font-bold", statusTone(lesson.status))}>{lesson.status}</span>}
        description={`${lesson.duration} · ${lesson.level}`}
        icon="BÀ"
        title={lesson.title}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {blocks.map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">{label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-ink">Dữ liệu cần xem</p>
          <div className="flex flex-wrap gap-1.5">
            {lesson.dataToCheck.map((item) => (
              <Chip key={item} size="sm" variant="neutral">
                {item}
              </Chip>
            ))}
          </div>
        </div>
        <QuizCard
          title="Quiz nhanh"
          prompt={lesson.quiz.question}
          goodAnswer={lesson.quiz.answer}
          feedback="Sau quiz, hãy quay lại module liên quan để kiểm tra dữ liệu thay vì kết luận ngay."
        />
        {lesson.miniCase ? (
          <MiniCaseCard
            title="Mini case"
            prompt={lesson.miniCase.prompt}
            goodAnswer={lesson.miniCase.goodAnswer}
            feedback="Câu trả lời tốt cần nêu dữ liệu cần kiểm chứng tiếp."
          />
        ) : null}
      </CardBody>
    </Card>
  );
}

export function AILearningCoachPanel({ data }: { data: AILearningCoachData }) {
  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader title="AI Learning Coach" description="Trợ giảng gợi ý học đúng lúc, không học thay bạn." icon="AI" />
      <CardBody className="space-y-4">
        {[
          ["Bạn đang học để dùng ở đâu?", data.learningFor],
          ["Vì sao AI gợi ý bài này?", data.reason],
          ["Câu hỏi trước khi học", data.preQuestion],
          ["Gợi ý sau khi học", data.afterLesson],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">{label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{value}</p>
          </div>
        ))}
        <div className="grid gap-2">
          {data.actions.map((action, index) => (
            <Button key={action} size="sm" variant={index === 0 ? "primary" : "secondary"}>
              {action}
            </Button>
          ))}
        </div>
        <p className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
          Đây là giả thuyết học tập cần kiểm tra, không phải khuyến nghị đầu tư.
        </p>
      </CardBody>
    </Card>
  );
}

export function ContextualLearningHint({ data }: { data: ContextualLearningHintData }) {
  return (
    <Card className="bg-accent-soft/25">
      <CardBody className="space-y-3">
        <Chip variant="accent">{data.relatedModule}</Chip>
        <div>
          <p className="text-sm font-bold text-ink">{data.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.reason}</p>
        </div>
        <p className="text-xs font-bold text-ink">
          Bài gợi ý: {data.lessonTitle} · {data.duration}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Học nhanh</Button>
          <Button size="sm" variant="secondary">Để sau</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function ErrorBasedReviewSection({ items }: { items: ErrorReviewItem[] }) {
  return (
    <Card>
      <CardHeader title="Học từ lỗi sai gần đây" description="Gợi ý bài học từ quiz, checklist, mô phỏng và case study." icon="ER" />
      <CardBody className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-sm font-bold text-ink">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.example}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.suggestedLessons.map((lesson) => (
                <Chip key={lesson} size="sm" variant="neutral">
                  {lesson}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function QuizCard({
  feedback,
  goodAnswer,
  prompt,
  title,
}: {
  title: string;
  prompt: string;
  goodAnswer: string;
  feedback: string;
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
      <Chip variant="neutral">Quiz</Chip>
      <p className="mt-2 text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{prompt}</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-accent">Xem đáp án tốt</summary>
        <p className="mt-2 text-xs leading-5 text-muted">{goodAnswer}</p>
        <p className="mt-2 text-xs leading-5 text-muted">{feedback}</p>
      </details>
    </div>
  );
}

export function MiniCaseCard(props: { title: string; prompt: string; goodAnswer: string; feedback: string }) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3">
      <Chip variant="accent">Mini case</Chip>
      <p className="mt-2 text-sm font-bold text-ink">{props.title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{props.prompt}</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-accent">Gợi ý câu trả lời tốt</summary>
        <p className="mt-2 text-xs leading-5 text-muted">{props.goodAnswer}</p>
        <p className="mt-2 text-xs leading-5 text-muted">{props.feedback}</p>
      </details>
    </div>
  );
}

export function PracticeSection({ items }: { items: PracticeItem[] }) {
  return (
    <Card>
      <CardHeader title="Luyện tập nhanh" description="Quiz ngắn và mini case để kiểm tra hiểu thật, không học thuộc." icon="QZ" />
      <CardBody className="grid gap-3 lg:grid-cols-3">
        {items.map((item) =>
          item.type === "Mini case" ? (
            <MiniCaseCard key={item.title} title={item.title} prompt={item.prompt} goodAnswer={item.goodAnswer} feedback={item.feedback} />
          ) : (
            <QuizCard key={item.title} title={item.title} prompt={item.prompt} goodAnswer={item.goodAnswer} feedback={item.feedback} />
          )
        )}
      </CardBody>
    </Card>
  );
}

export function KnowledgeMap({ categories, onSelect }: { categories: LearningCategory[]; onSelect: (id: string) => void }) {
  return (
    <Card>
      <CardHeader title="Bản đồ kiến thức đầu tư" description="Đi từ hiểu bản thân đến hậu kiểm, mỗi node nối với module phân tích." icon="KM" />
      <CardBody>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={category.id}
              type="button"
              className="min-w-[190px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left hover:border-border"
              onClick={() => onSelect(category.id)}
            >
              <p className="text-[11px] font-bold text-subtle">Bước {index + 1}</p>
              <p className="mt-1 text-sm font-bold text-ink">{category.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Đã học {category.learnedCount} · Còn yếu {category.weakCount}
              </p>
              <span className={cn("mt-2 inline-flex rounded-[3px] border px-2 py-1 text-[11px] font-bold", statusTone(category.status))}>
                {category.status}
              </span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function LearningProfileSummary({ profile }: { profile: LearningProfile }) {
  return (
    <Card>
      <CardHeader title="Hồ sơ học tập đầu tư" description="Output tóm tắt để biết mình nên học gì trước khi dùng module tiếp theo." icon="PF" />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Cấp độ hiện tại", profile.level],
            ["Quiz đã hoàn thành", profile.completedQuiz],
            ["Mini case đã làm", profile.completedMiniCase],
            ["Ghi chú cá nhân", profile.personalNote],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">{label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
            </div>
          ))}
        </div>
        <ModuleReadinessCard readiness={profile.readiness} />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Chủ đề đã học", profile.learnedTopics],
            ["Chủ đề còn yếu", profile.weakTopics],
            ["Bài nên học tiếp", profile.nextLessons],
          ].map(([label, values]) => (
            <div key={label as string}>
              <p className="mb-2 text-xs font-bold text-ink">{label as string}</p>
              <div className="flex flex-wrap gap-1.5">
                {(values as string[]).map((item) => (
                  <Chip key={item} size="sm" variant="neutral">{item}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function ModuleReadinessCard({ readiness }: { readiness: LearningProfile["readiness"] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {readiness.map((item) => (
        <div key={item.moduleName} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-ink">{item.moduleName}</p>
            <span className={cn("rounded-[3px] border px-2 py-1 text-[11px] font-bold", statusTone(item.status))}>{item.status}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}

export function RecommendedLessonQueue({ lessons }: { lessons: LearningLesson[] }) {
  return (
    <Card>
      <CardHeader title="Bài được AI gợi ý" description="Ưu tiên học vì liên quan lỗi sai hoặc module đang dùng." icon="RQ" />
      <CardBody className="space-y-2">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-[4px] border border-border-soft bg-accent-soft/25 px-3 py-2">
            <p className="text-xs font-bold text-ink">{lesson.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">{lesson.problemSolved}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
