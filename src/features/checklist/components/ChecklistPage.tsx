"use client";

import { useMemo } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
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

import type { CheckThinkingData } from "../types";

type ChecklistPageProps = {
  initialChecklistData?: CheckThinkingData;
  onNavigate: (key: string) => void;
};

type ChecklistPersistentState = {
  activeMode: CheckThinkingMode;
  selectedModuleId: ThinkingModuleId;
  selectedCount: ThinkingQuestionCount;
  questionIndexByModule: Partial<Record<ThinkingModuleId, number>>;
  answersByQuestion: Record<string, string>;
  selectedTicker: string;
};

const checklistStorageKey = "atelier-finance.checklist.v1";

const defaultChecklistState: ChecklistPersistentState = {
  activeMode: "understanding",
  selectedModuleId: "business",
  selectedCount: 5,
  questionIndexByModule: {},
  answersByQuestion: {},
  selectedTicker: "MWG",
};

export function ChecklistPage({ initialChecklistData, onNavigate }: ChecklistPageProps) {
  const activeCheckData = initialChecklistData ?? checkThinkingData;

  const [persistedState, setPersistedState] = useLocalStorageState(
    checklistStorageKey,
    defaultChecklistState
  );
  const {
    activeMode,
    answersByQuestion,
    questionIndexByModule,
    selectedCount,
    selectedModuleId,
    selectedTicker,
  } = persistedState;

  const selectedQuestions = useMemo(
    () => activeCheckData.questionBank[selectedModuleId] ?? [],
    [selectedModuleId, activeCheckData]
  );
  const currentQuestionIndex = Math.min(
    questionIndexByModule[selectedModuleId] ?? 0,
    Math.max(selectedQuestions.length - 1, 0)
  );
  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const selectedStock =
    activeCheckData.stockReadinessByTicker.find((stock) => stock.ticker === selectedTicker) ??
    activeCheckData.stockReadinessByTicker[0];

  function handleSelectModule(moduleId: ThinkingModuleId) {
    setPersistedState((current) => ({ ...current, selectedModuleId: moduleId }));
  }

  function handleQuestionStep(direction: 1 | -1) {
    if (selectedQuestions.length <= 1) return;

    setPersistedState((current) => {
      const currentIndex = current.questionIndexByModule[selectedModuleId] ?? 0;
      const nextIndex =
        (currentIndex + direction + selectedQuestions.length) % selectedQuestions.length;

      return {
        ...current,
        questionIndexByModule: {
          ...current.questionIndexByModule,
          [selectedModuleId]: nextIndex,
        },
      };
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <CheckThinkingHero
        activeMode={activeMode}
        hero={activeCheckData.hero}
        onModeChange={(mode) => setPersistedState((current) => ({ ...current, activeMode: mode }))}
      />

      <CheckModeTabs
        activeMode={activeMode}
        onModeChange={(mode) => setPersistedState((current) => ({ ...current, activeMode: mode }))}
      />

      {activeMode === "understanding" ? (
        <div className="space-y-5">
          <ModuleCheckCardGrid
            modules={activeCheckData.modules}
            selectedModuleId={selectedModuleId}
            onSelectModule={handleSelectModule}
          />
          <CheckSetupPanel
            options={activeCheckData.questionCountOptions}
            selectedCount={selectedCount}
            onSelectCount={(count) => setPersistedState((current) => ({ ...current, selectedCount: count }))}
          />
          {currentQuestion ? (
            <QuestionRunner
              currentIndex={currentQuestionIndex}
              question={currentQuestion}
              questionCount={selectedCount}
              selectedAnswer={answersByQuestion[currentQuestion.id] ?? null}
              totalAvailable={selectedQuestions.length}
              onAnswer={(answer) =>
                setPersistedState((current) => ({
                  ...current,
                  answersByQuestion: {
                    ...current.answersByQuestion,
                    [currentQuestion.id]: answer,
                  },
                }))
              }
              onNext={() => handleQuestionStep(1)}
              onPrevious={() => handleQuestionStep(-1)}
            />
          ) : null}
          <ThinkingScorePanel score={activeCheckData.thinkingScore} />
          <CheckNextActions onNavigate={onNavigate} />
        </div>
      ) : null}

      {activeMode === "stock" && selectedStock ? (
        <div className="space-y-5">
          <StockSelector
            selectedTicker={selectedTicker}
            stocks={activeCheckData.stockReadinessByTicker}
            onSelectTicker={(ticker) => setPersistedState((current) => ({ ...current, selectedTicker: ticker }))}
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
