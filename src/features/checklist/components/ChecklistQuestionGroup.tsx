import { Chip } from "@/components/ui";
import type {
  ChecklistQuestionGroup as ChecklistQuestionGroupType,
  StockChecklistAnswer,
  StockChecklistAnswerStatus,
  StockChecklistQuestion,
} from "../types";

type ChecklistQuestionGroupProps = {
  group: ChecklistQuestionGroupType;
  questions: StockChecklistQuestion[];
  answers: StockChecklistAnswer[];
  onAnswerChange: (answer: StockChecklistAnswer) => void;
};

const answerOptions: Array<{ status: StockChecklistAnswerStatus; label: string }> = [
  { status: "available", label: "Đã hiểu / Đã có dữ liệu" },
  { status: "unsure", label: "Hiểu sơ bộ / Chưa chắc" },
  { status: "missing", label: "Chưa có dữ liệu" },
  { status: "unknown", label: "Không biết, cần học thêm" },
];

export function ChecklistQuestionGroup({
  answers,
  group,
  onAnswerChange,
  questions,
}: ChecklistQuestionGroupProps) {
  const answered = questions.filter((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    return answer && answer.status !== "unknown";
  }).length;

  return (
    <details className="rounded-[4px] border border-border bg-surface" open>
      <summary className="cursor-pointer list-none border-b border-border-soft bg-surface-soft/70 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">{group.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{group.goal}</p>
          </div>
          <Chip variant="neutral">{answered}/{questions.length} câu</Chip>
        </div>
      </summary>
      <div className="grid gap-3 px-4 py-4">
        {questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question.id) ?? {
            questionId: question.id,
            status: "unknown" as const,
          };

          return (
            <div key={question.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-bold text-subtle">Câu {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink">{question.questionText}</p>
                </div>
                <Chip size="sm" variant={question.coreQuestion ? "accent" : "neutral"}>
                  {question.coreQuestion ? "Câu lõi" : "Bổ sung"}
                </Chip>
              </div>

              {question.questionType === "short_text" ? (
                <textarea
                  className="mt-3 min-h-[86px] w-full rounded-[4px] border border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-accent"
                  placeholder="Viết ngắn bằng lời của bạn."
                  value={answer.textAnswer ?? ""}
                  onChange={(event) =>
                    onAnswerChange({
                      ...answer,
                      questionId: question.id,
                      status: event.target.value.trim() ? "available" : "unknown",
                      textAnswer: event.target.value,
                      relatedModule: question.relatedModule,
                    })
                  }
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(question.options ?? answerOptions.map((option) => option.label)).map((optionLabel) => (
                    <button
                      key={optionLabel}
                      type={question.questionType === "multiple_choice" ? "button" : "button"}
                      className={[
                        "rounded-[3px] border px-3 py-2 text-xs font-bold transition",
                        answer.selectedOptions?.includes(optionLabel)
                          ? "border-border bg-accent-soft text-ink"
                          : "border-border-soft bg-surface text-muted hover:border-border hover:text-ink",
                      ].join(" ")}
                      onClick={() => {
                        const selectedOptions =
                          question.questionType === "multiple_choice"
                            ? toggleOption(answer.selectedOptions ?? [], optionLabel)
                            : [optionLabel];

                        onAnswerChange({
                          ...answer,
                          questionId: question.id,
                          status: optionToStatus(optionLabel),
                          selectedOptions,
                          relatedModule: question.relatedModule,
                        });
                      }}
                    >
                      {optionLabel}
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[11px] font-semibold text-subtle">
                Module liên quan: {question.relatedModule}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function toggleOption(current: string[], option: string) {
  if (current.includes(option)) {
    return current.filter((item) => item !== option);
  }

  return [...current, option];
}

function optionToStatus(option: string): StockChecklistAnswerStatus {
  if (option.includes("Chưa có")) return "missing";
  if (option.includes("Không biết")) return "unknown";
  if (option.includes("Chưa chắc") || option.includes("Chưa rõ")) return "unsure";
  return "available";
}
