"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { UnderstandingCheckData } from "../types";

type UnderstandingCheckProps = {
  data: UnderstandingCheckData;
};

export function UnderstandingCheck({ data }: UnderstandingCheckProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  return (
    <Card>
      <CardHeader description={data.description} icon={data.icon} title={data.title} />
      <CardBody className="space-y-4">
        {data.questions.map((question, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isAnswered = typeof selectedAnswer === "number";
          const isCorrect = selectedAnswer === question.correctIndex;

          return (
            <div
              key={question.question}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-6 text-ink">
                  {questionIndex + 1}. {question.question}
                </p>
                {isAnswered ? (
                  <Chip size="sm" variant={isCorrect ? "success" : "warning"}>
                    {isCorrect ? "Hiểu đúng" : "Cần chỉnh lại"}
                  </Chip>
                ) : null}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className="flex cursor-pointer gap-2 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted hover:border-border"
                  >
                    <input
                      className="mt-1"
                      type="radio"
                      name={`screening-check-${questionIndex}`}
                      checked={selectedAnswer === optionIndex}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [questionIndex]: optionIndex,
                        }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {isAnswered ? (
                <p className="mt-3 text-xs leading-5 text-muted">
                  {isCorrect
                    ? question.feedback
                    : "Đây chỉ là cổ phiếu ứng viên để phân tích sâu hơn. Hãy kiểm tra doanh nghiệp, tài chính, định giá và rủi ro trước khi đi tiếp."}
                </p>
              ) : null}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
