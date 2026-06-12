import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ThinkingQuestion, ThinkingQuestionCount } from "../types";

type QuestionRunnerProps = {
  question: ThinkingQuestion;
  selectedAnswer: string | null;
  questionCount: ThinkingQuestionCount;
  currentIndex: number;
  totalAvailable: number;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function QuestionRunner({
  currentIndex,
  onAnswer,
  onNext,
  onPrevious,
  question,
  questionCount,
  selectedAnswer,
  totalAvailable,
}: QuestionRunnerProps) {
  const answered = Boolean(selectedAnswer);
  const correct = selectedAnswer === question.correctAnswer;

  return (
    <Card>
      <CardHeader
        title="Câu hỏi hiện tại"
        description={`Đang mô phỏng ${questionCount} câu, hiển thị từng câu để tránh quá tải.`}
        chip={<Chip variant="neutral">{currentIndex + 1}/{Math.max(totalAvailable, 1)}</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip variant="accent">{question.competency}</Chip>
          <Chip variant="neutral">{question.difficulty}</Chip>
          <Chip variant="neutral">{question.type}</Chip>
        </div>

        <p className="text-lg font-bold leading-7 text-ink">{question.prompt}</p>

        <div className="grid gap-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;

            return (
              <button
                key={option}
                className={[
                  "rounded-[4px] border px-4 py-3 text-left text-sm font-semibold leading-5 transition",
                  isSelected ? "border-border bg-accent-soft" : "border-border-soft bg-surface-soft hover:border-border",
                ].join(" ")}
                type="button"
                onClick={() => onAnswer(option)}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant={correct ? "success" : "warning"}>{correct ? "Đúng hướng" : "Cần xem lại"}</Chip>
              <p className="text-sm font-bold text-ink">Đáp án chuẩn: {question.correctAnswer}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{question.explanation}</p>
            <p className="mt-2 text-xs leading-5 text-subtle">
              Lỗi thường gặp: {question.commonMistake}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {question.relatedPaths.map((path) => (
              <Chip key={`${path.moduleKey}-${path.label}`} size="sm" variant="neutral">
                {path.label}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onPrevious} disabled={currentIndex === 0}>
              Câu trước
            </Button>
            <Button variant="secondary" onClick={onNext} disabled={totalAvailable <= 1}>
              Câu tiếp
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
