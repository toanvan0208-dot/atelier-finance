"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { BusinessMiniCheckData } from "../types";

type BusinessMiniCheckProps = {
  answers: Record<number, number>;
  data: BusinessMiniCheckData;
  isComplete: boolean;
  onAnswer: (questionIndex: number, optionIndex: number) => void;
};

export function BusinessMiniCheck({
  answers,
  data,
  isComplete,
  onAnswer,
}: BusinessMiniCheckProps) {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const question = data.questions[activeQuestion];
  const selectedAnswer = answers[activeQuestion];
  const isAnswered = typeof selectedAnswer === "number";
  const isCorrect = selectedAnswer === question.correctIndex;
  const isLastQuestion = activeQuestion === data.questions.length - 1;
  const canGoNext = isAnswered && !isLastQuestion;
  const hasWrongAnswer = data.questions.some((item, index) => {
    const answer = answers[index];
    return typeof answer === "number" && answer !== item.correctIndex;
  });

  function handleOptionChange(optionIndex: number) {
    onAnswer(activeQuestion, optionIndex);
  }

  return (
    <Card>
      <CardHeader
        description={data.description}
        icon="?"
        title={data.title}
      />
      <CardBody className="space-y-4">
        <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                Câu hỏi bắt buộc
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-ink">
                {question.question}
              </p>
            </div>
            {isAnswered ? (
              <Chip size="sm" variant={isCorrect ? "success" : "warning"}>
                {isCorrect ? "Đúng" : "Cần xem lại"}
              </Chip>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {question.options.map((option, optionIndex) => (
              <label
                key={option}
                className={[
                  "flex cursor-pointer gap-2 rounded-[4px] border px-3 py-2 text-xs leading-5 transition",
                  selectedAnswer === optionIndex
                    ? "border-border bg-accent-soft text-ink"
                    : "border-border-soft bg-surface text-muted hover:border-border",
                ].join(" ")}
              >
                <input
                  className="mt-1"
                  type="radio"
                  name={`business-mini-check-${activeQuestion}`}
                  checked={selectedAnswer === optionIndex}
                  onChange={() => handleOptionChange(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              disabled={activeQuestion === 0}
              size="sm"
              variant="secondary"
              onClick={() => setActiveQuestion((current) => Math.max(0, current - 1))}
            >
              Quay lại câu trước
            </Button>
            <Button
              disabled={!canGoNext}
              size="sm"
              variant="primary"
              onClick={() =>
                setActiveQuestion((current) =>
                  Math.min(data.questions.length - 1, current + 1)
                )
              }
            >
              Câu tiếp theo
            </Button>
          </div>
        </div>

        {isComplete ? (
          <p className="rounded-[4px] border border-success bg-success/10 px-3 py-2 text-xs font-bold leading-5 text-ink">
            {data.successMessage}
          </p>
        ) : hasWrongAnswer ? (
          <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-bold leading-5 text-ink">
            {data.failureMessage}
          </p>
        ) : isLastQuestion && isAnswered ? (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
            Bạn đã trả lời hết câu hỏi. Nếu chưa đủ điều kiện, hãy quay lại câu bị sai để chỉnh lại.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
