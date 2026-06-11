"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import {
  checklistModes,
  checklistQuestionGroups,
  checklistQuestionTemplates,
  checklistTickerStates,
} from "../data/checklist.data";
import type {
  ChecklistModeId,
  ChecklistTickerState,
  StockChecklistAnswer,
  StockChecklistQuestion,
} from "../types";
import { calculateChecklistResult } from "../utils/checklistDecisionModel";
import {
  canUnlockFullSimulationChecklist,
  canUnlockStandardChecklist,
  getChecklistBlockingModules,
} from "../utils/moduleCompletionGate";
import { ChecklistLockedState } from "./ChecklistLockedState";
import { ChecklistModeSelector } from "./ChecklistModeSelector";
import { ChecklistModuleGate } from "./ChecklistModuleGate";
import { ChecklistProgressSidebar } from "./ChecklistProgressSidebar";
import { ChecklistQuestionGroup } from "./ChecklistQuestionGroup";
import { ChecklistResultPanel } from "./ChecklistResultPanel";

type ChecklistPageProps = {
  onNavigate: (key: string) => void;
};

export function ChecklistPage({ onNavigate }: ChecklistPageProps) {
  const [selectedTicker, setSelectedTicker] = useState(() => getInitialTicker());
  const [selectedMode, setSelectedMode] = useState<ChecklistModeId | null>(null);
  const [answersByTicker, setAnswersByTicker] = useState<Record<string, StockChecklistAnswer[]>>(
    () =>
      Object.fromEntries(
        checklistTickerStates.map((item) => [item.ticker, item.answers])
      )
  );
  const tickerState =
    checklistTickerStates.find((item) => item.ticker === selectedTicker) ??
    getFallbackTickerState();
  const answers = answersByTicker[selectedTicker] ?? tickerState.answers;

  const standardUnlocked = canUnlockStandardChecklist(tickerState.moduleCompletions);
  const fullModeUnlocked = canUnlockFullSimulationChecklist(tickerState.moduleCompletions);
  const blockingModules = getChecklistBlockingModules(tickerState.moduleCompletions);
  const selectedModeData = checklistModes.find((mode) => mode.id === selectedMode) ?? null;
  const activeQuestions = useMemo(
    () => (selectedMode ? getQuestionsForMode(selectedMode) : []),
    [selectedMode]
  );
  const result = useMemo(
    () =>
      calculateChecklistResult({
        ticker: tickerState.ticker,
        mode: selectedMode ?? "standard",
        questions: activeQuestions,
        answers,
        completedRequiredModules: tickerState.moduleCompletions.filter((module) => module.status === "completed").length,
        totalRequiredModules: tickerState.moduleCompletions.length,
        fullModeUnlocked,
      }),
    [activeQuestions, answers, fullModeUnlocked, selectedMode, tickerState]
  );

  function handleAnswerChange(nextAnswer: StockChecklistAnswer) {
    setAnswersByTicker((currentByTicker) => {
      const current = currentByTicker[selectedTicker] ?? tickerState.answers;
      const exists = current.some((answer) => answer.questionId === nextAnswer.questionId);
      const nextAnswers = exists
        ? current.map((answer) =>
            answer.questionId === nextAnswer.questionId ? nextAnswer : answer
          )
        : [...current, nextAnswer];

      return {
        ...currentByTicker,
        [selectedTicker]: nextAnswers,
      };
    });
  }

  function handleTickerChange(ticker: string) {
    setSelectedTicker(ticker);
    setSelectedMode(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <ChecklistHeader
        tickerState={tickerState}
        selectedTicker={selectedTicker}
        onTickerChange={handleTickerChange}
      />

      <ChecklistModuleGate modules={tickerState.moduleCompletions} onNavigate={onNavigate} />

      {!standardUnlocked ? (
        <ChecklistLockedState blockingModules={blockingModules} onNavigate={onNavigate} />
      ) : (
        <>
          <ChecklistModeSelector
            modes={checklistModes}
            selectedMode={selectedMode}
            fullModeUnlocked={fullModeUnlocked}
            onSelect={setSelectedMode}
          />

          {selectedModeData ? (
            <Card>
              <CardHeader
                icon="Q"
                title="Bài kiểm tra cổ phiếu"
                description={`Bài kiểm tra này gồm ${activeQuestions.length} câu: ${activeQuestions.filter((question) => question.coreQuestion).length} câu lõi, ${activeQuestions.filter((question) => !question.coreQuestion).length} câu bổ sung theo cổ phiếu/ngành/dữ liệu còn thiếu.`}
                chip={<Chip variant="accent">{selectedModeData.label}</Chip>}
              />
            </Card>
          ) : (
            <Card>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Đủ điều kiện kiểm tra</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Chọn một trong hai chế độ để bắt đầu bài kiểm tra cổ phiếu.
                  </p>
                </div>
                <Button onClick={() => setSelectedMode("standard")}>Bắt đầu kiểm tra cổ phiếu</Button>
              </CardBody>
            </Card>
          )}

          {selectedMode ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <main className="space-y-4">
                {checklistQuestionGroups.map((group) => {
                  const questions = activeQuestions.filter((question) => question.groupId === group.id);
                  if (questions.length === 0) return null;

                  return (
                    <ChecklistQuestionGroup
                      key={group.id}
                      group={group}
                      questions={questions}
                      answers={answers}
                      onAnswerChange={handleAnswerChange}
                    />
                  );
                })}
                <ChecklistResultPanel
                  mode={selectedMode}
                  result={result}
                  tickerState={tickerState}
                  onNavigate={onNavigate}
                  onSelectFullMode={() => setSelectedMode("full_before_simulation")}
                />
              </main>
              <ChecklistProgressSidebar result={result} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ChecklistHeader({
  onTickerChange,
  selectedTicker,
  tickerState,
}: {
  tickerState: ChecklistTickerState;
  selectedTicker: string;
  onTickerChange: (ticker: string) => void;
}) {
  const completedRequired = tickerState.moduleCompletions.filter(
    (module) => module.status === "completed"
  ).length;

  return (
    <Card>
      <CardHeader
        icon="KT"
        title="Kiểm tra cổ phiếu"
        description="Bài kiểm tra tổng hợp trước khi mô phỏng."
        chip={<Chip variant="neutral">Mock data theo ticker</Chip>}
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Mã cổ phiếu đang kiểm tra</p>
            <h1 className="mt-2 font-brand text-3xl font-bold leading-tight text-ink">
              {tickerState.ticker} · {tickerState.companyName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {tickerState.industry} · {tickerState.currentStatus} · {completedRequired}/{tickerState.moduleCompletions.length} module hoàn thành đầy đủ
            </p>
            <p className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
              Guardrail: kết quả không phải khuyến nghị mua/bán, không phải tín hiệu giao dịch và không cho đi thẳng sang mô phỏng khi thiếu phân tích.
            </p>
          </div>
          <label className="self-start">
            <span className="text-[11px] font-bold uppercase text-subtle">Chọn mã</span>
            <select
              className="mt-2 h-10 w-full rounded-[4px] border border-border bg-surface px-3 text-sm font-bold text-ink outline-none"
              value={selectedTicker}
              onChange={(event) => onTickerChange(event.target.value)}
            >
              {checklistTickerStates.map((item) => (
                <option key={item.ticker} value={item.ticker}>
                  {item.ticker}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardBody>
    </Card>
  );
}

function getInitialTicker(): string {
  const fallbackTicker = getFallbackTickerState().ticker;

  if (typeof window === "undefined") return fallbackTicker;

  const params = new URLSearchParams(window.location.search);
  const ticker = params.get("ticker")?.toUpperCase();
  return ticker && checklistTickerStates.some((item) => item.ticker === ticker)
    ? ticker
    : fallbackTicker;
}

function getFallbackTickerState(): ChecklistTickerState {
  const fallback = checklistTickerStates[0];
  if (!fallback) {
    throw new Error("Checklist requires at least one ticker state.");
  }

  return fallback;
}

function getQuestionsForMode(mode: ChecklistModeId): StockChecklistQuestion[] {
  const questionIds = checklistQuestionGroups.flatMap((group) =>
    mode === "standard" ? group.standardQuestionIds : group.fullQuestionIds
  );
  const questionMap = new Map(
    checklistQuestionTemplates.map((question) => [question.id, question])
  );

  return questionIds
    .map((id) => questionMap.get(id))
    .filter((question): question is StockChecklistQuestion => Boolean(question));
}
