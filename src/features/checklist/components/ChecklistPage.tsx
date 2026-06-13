"use client";

import { useMemo, useState } from "react";
import { checkThinkingData } from "../data/checkThinking.data";
import type {
  CheckThinkingMode,
  ThinkingModuleId,
  ThinkingQuestionCount,
} from "../types";
import { CheckModeTabs } from "./CheckModeTabs";
import { CheckNextActions } from "./CheckNextActions";
import { CheckSetupPanel } from "./CheckSetupPanel";
import { CheckThinkingHero } from "./CheckThinkingHero";
import { ChecklistLogicPanel } from "./ChecklistLogicPanel";
import { FomoCheckPanel } from "./FomoCheckPanel";
import { MissingEvidencePanel } from "./MissingEvidencePanel";
import { ModuleCheckCardGrid } from "./ModuleCheckCardGrid";
import { ModuleReadinessMap } from "./ModuleReadinessMap";
import { QuestionRunner } from "./QuestionRunner";
import { StockReadinessResult } from "./StockReadinessResult";
import { StockSelector } from "./StockSelector";
import { ThinkingScorePanel } from "./ThinkingScorePanel";

type ChecklistPageProps = {
  onNavigate: (key: string) => void;
};

export function ChecklistPage({ onNavigate }: ChecklistPageProps) {
  const [activeMode, setActiveMode] = useState<CheckThinkingMode>("understanding");
  const [selectedModuleId, setSelectedModuleId] = useState<ThinkingModuleId>("business");
  const [selectedCount, setSelectedCount] = useState<ThinkingQuestionCount>(5);
  const [questionIndexByModule, setQuestionIndexByModule] = useState<
    Partial<Record<ThinkingModuleId, number>>
  >({});
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});
  const [selectedTicker, setSelectedTicker] = useState("MWG");

  const selectedQuestions = useMemo(
    () => checkThinkingData.questionBank[selectedModuleId] ?? [],
    [selectedModuleId]
  );
  const currentQuestionIndex = Math.min(
    questionIndexByModule[selectedModuleId] ?? 0,
    Math.max(selectedQuestions.length - 1, 0)
  );
  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const selectedStock =
    checkThinkingData.stockReadinessByTicker.find((stock) => stock.ticker === selectedTicker) ??
    checkThinkingData.stockReadinessByTicker[0];

  function handleSelectModule(moduleId: ThinkingModuleId) {
    setSelectedModuleId(moduleId);
  }

  function handleQuestionStep(direction: 1 | -1) {
    if (selectedQuestions.length <= 1) return;

    setQuestionIndexByModule((current) => {
      const currentIndex = current[selectedModuleId] ?? 0;
      const nextIndex =
        (currentIndex + direction + selectedQuestions.length) % selectedQuestions.length;

      return {
        ...current,
        [selectedModuleId]: nextIndex,
      };
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <CheckThinkingHero
        activeMode={activeMode}
        hero={checkThinkingData.hero}
        onModeChange={setActiveMode}
      />

      <CheckModeTabs activeMode={activeMode} onModeChange={setActiveMode} />

      {activeMode === "understanding" ? (
        <div className="space-y-5">
          <ModuleCheckCardGrid
            modules={checkThinkingData.modules}
            selectedModuleId={selectedModuleId}
            onSelectModule={handleSelectModule}
          />
          <CheckSetupPanel
            options={checkThinkingData.questionCountOptions}
            selectedCount={selectedCount}
            onSelectCount={setSelectedCount}
          />
          {currentQuestion ? (
            <QuestionRunner
              currentIndex={currentQuestionIndex}
              question={currentQuestion}
              questionCount={selectedCount}
              selectedAnswer={answersByQuestion[currentQuestion.id] ?? null}
              totalAvailable={selectedQuestions.length}
              onAnswer={(answer) =>
                setAnswersByQuestion((current) => ({
                  ...current,
                  [currentQuestion.id]: answer,
                }))
              }
              onNext={() => handleQuestionStep(1)}
              onPrevious={() => handleQuestionStep(-1)}
            />
          ) : null}
          <ThinkingScorePanel score={checkThinkingData.thinkingScore} />
          <CheckNextActions onNavigate={onNavigate} />
        </div>
      ) : null}

      {activeMode === "stock" && selectedStock ? (
        <div className="space-y-5">
          <StockSelector
            selectedTicker={selectedTicker}
            stocks={checkThinkingData.stockReadinessByTicker}
            onSelectTicker={setSelectedTicker}
          />
          <ModuleReadinessMap modules={selectedStock.moduleReadiness} onNavigate={onNavigate} />
          <ChecklistLogicPanel
            groups={selectedStock.logicChecklistGroups ?? []}
            onNavigate={onNavigate}
          />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <MissingEvidencePanel
              questions={selectedStock.missingEvidenceQuestions}
              onNavigate={onNavigate}
            />
            <FomoCheckPanel checks={selectedStock.fomoChecks} />
          </div>
          <StockReadinessResult
            result={selectedStock.finalReadiness}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </div>
  );
}
