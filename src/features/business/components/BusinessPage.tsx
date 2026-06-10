"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { businessPageData } from "../data/business.data";
import { BusinessAnalysisGroups } from "./BusinessAnalysisGroups";
import { BusinessBctcBridge } from "./BusinessBctcBridge";
import { BusinessConclusion } from "./BusinessConclusion";
import { BusinessDisclaimer } from "./BusinessDisclaimer";
import { BusinessHeader } from "./BusinessHeader";
import { BusinessMiniCheck } from "./BusinessMiniCheck";
import { BusinessNextActions } from "./BusinessNextActions";
import { BusinessQuickSummary } from "./BusinessQuickSummary";

export function BusinessPage() {
  const data = businessPageData;
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const canGoToFinancials = useMemo(
    () =>
      data.miniCheck.questions.every(
        (question, index) => answers[index] === question.correctIndex
      ),
    [answers, data.miniCheck.questions]
  );

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
  }

  if (!data.header.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  function handleAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-7">
      <BusinessHeader
        canGoToFinancials={canGoToFinancials}
        data={data.header}
      />
      <BusinessQuickSummary data={data.quickSummary} />
      <BusinessAnalysisGroups groups={data.groups} />
      <BusinessConclusion data={data.conclusion} />
      <BusinessBctcBridge
        canGoToFinancials={canGoToFinancials}
        data={data.bctcBridge}
      />
      <BusinessMiniCheck
        answers={answers}
        data={data.miniCheck}
        isComplete={canGoToFinancials}
        onAnswer={handleAnswer}
      />
      <BusinessNextActions
        canGoToFinancials={canGoToFinancials}
        data={data.nextActions}
      />
      <BusinessDisclaimer data={data.disclaimer} />
    </div>
  );
}
