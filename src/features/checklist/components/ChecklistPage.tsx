"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, EmptyState, LoadingState } from "@/components/ui";
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
const dynamicTickerOptions = ["HPG", "MWG", "VNM"];

const defaultChecklistState: ChecklistPersistentState = {
  activeMode: "understanding",
  selectedModuleId: "business",
  selectedCount: 5,
  questionIndexByModule: {},
  answersByQuestion: {},
  selectedTicker: "MWG",
};

type DynamicThinkingOption = {
  key: string;
  label: string;
};

type DynamicThinkingScenario = {
  correctAnswer: string;
  dataQualityStatus: string;
  difficulty: string;
  evidenceFields: string[];
  evidenceStatus: string;
  explanation: string;
  guardrailNote: string;
  id: string;
  missingDataBehavior: string;
  moduleContext: string;
  options: DynamicThinkingOption[];
  questionText: string;
  questionType: string;
  scenarioId: string;
  ticker: string;
};

type DynamicScenarioState =
  | { status: "idle"; scenarios: DynamicThinkingScenario[] }
  | { status: "loading"; scenarios: DynamicThinkingScenario[] }
  | { status: "ready"; scenarios: DynamicThinkingScenario[] }
  | { status: "empty"; scenarios: DynamicThinkingScenario[] }
  | { status: "error"; message: string; scenarios: DynamicThinkingScenario[] };

type ChecklistSaveState =
  | { status: "idle"; message: string | null }
  | { status: "saving"; message: string | null }
  | { status: "saved"; message: string }
  | { status: "error"; message: string };

const ensureDynamicStocks = (data: CheckThinkingData) => {
  const stocks = [...data.stockReadinessByTicker];
  const byTicker = new Set(stocks.map((stock) => stock.ticker));
  for (const ticker of dynamicTickerOptions) {
    if (byTicker.has(ticker)) continue;
    stocks.push({
      ticker,
      companyName: `${ticker} - dữ liệu câu hỏi động`,
      industry: "Theo bộ ThinkingReview",
      currentThesis:
        "Bộ câu hỏi động lấy từ database, dùng để kiểm tra quy trình đọc dữ liệu candidate. Không phải kết luận đầu tư.",
      moduleReadiness: [],
      missingEvidenceQuestions: [],
      fomoChecks: [],
      finalReadiness: {
        status: "not_enough_data",
        label: "Cần rà soát",
        tone: "neutral",
        summary: "Dữ liệu câu hỏi động đang ở trạng thái needsReview và productionApproved=false.",
        reasons: ["Nguồn là reviewed candidate, chưa phê duyệt production."],
        nextActions: [],
      },
    });
  }
  return stocks;
};

const isDynamicScenarioResponse = (value: unknown): value is { data: DynamicThinkingScenario[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { data?: unknown }).data);

export function ChecklistPage({ initialChecklistData, onNavigate }: ChecklistPageProps) {
  const activeCheckData = initialChecklistData ?? checkThinkingData;
  const stockOptions = useMemo(() => ensureDynamicStocks(activeCheckData), [activeCheckData]);

  const [persistedState, setPersistedState] = useLocalStorageState(
    checklistStorageKey,
    defaultChecklistState
  );
  const [dynamicScenarioState, setDynamicScenarioState] = useState<DynamicScenarioState>({
    status: "idle",
    scenarios: [],
  });
  const [saveState, setSaveState] = useState<ChecklistSaveState>({
    status: "idle",
    message: null,
  });
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
    stockOptions.find((stock) => stock.ticker === selectedTicker) ??
    stockOptions[0];
  const dynamicScenarios = dynamicScenarioState.scenarios;
  const answeredDynamicCount = dynamicScenarios.filter(
    (scenario) => Boolean(answersByQuestion[scenario.scenarioId])
  ).length;

  useEffect(() => {
    let cancelled = false;

    async function loadDynamicScenarios() {
      setDynamicScenarioState((current) => ({ status: "loading", scenarios: current.scenarios }));

      try {
        const response = await fetch(
          `/api/thinking-question-scenarios?ticker=${encodeURIComponent(selectedTicker)}&limit=50`
        );
        const body = (await response.json().catch(() => null)) as unknown;
        if (cancelled) return;

        if (!response.ok || !isDynamicScenarioResponse(body)) {
          setDynamicScenarioState({
            status: "error",
            message: "Không đọc được câu hỏi động từ database.",
            scenarios: [],
          });
          return;
        }

        setDynamicScenarioState({
          status: body.data.length > 0 ? "ready" : "empty",
          scenarios: body.data,
        });
      } catch {
        if (!cancelled) {
          setDynamicScenarioState({
            status: "error",
            message: "Không đọc được câu hỏi động từ database.",
            scenarios: [],
          });
        }
      }
    }

    if (activeMode === "stock") {
      void loadDynamicScenarios();
    }

    return () => {
      cancelled = true;
    };
  }, [activeMode, selectedTicker]);

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

  async function handleSaveDynamicChecklist() {
    const answeredScenarios = dynamicScenarios.filter((scenario) => answersByQuestion[scenario.scenarioId]);
    if (answeredScenarios.length === 0) {
      setSaveState({ status: "error", message: "Chưa có câu trả lời nào để lưu." });
      return;
    }

    setSaveState({ status: "saving", message: null });

    const response = await fetch("/api/checklists", {
      body: JSON.stringify({
        contextSnapshot: {
          answeredCount: answeredScenarios.length,
          source: "thinking_question_scenario_db",
          ticker: selectedTicker,
          totalScenarioCount: dynamicScenarios.length,
        },
        results: answeredScenarios.map((scenario) => ({
          answer: answersByQuestion[scenario.scenarioId],
          evidenceSnapshot: {
            correctAnswer: scenario.correctAnswer,
            dataQualityStatus: scenario.dataQualityStatus,
            evidenceFields: scenario.evidenceFields,
            evidenceStatus: scenario.evidenceStatus,
            guardrailNote: scenario.guardrailNote,
          },
          missingFields:
            scenario.evidenceStatus === "missing_sensitive_candidate" ? scenario.evidenceFields : [],
          scenarioId: scenario.scenarioId,
          status:
            answersByQuestion[scenario.scenarioId] === scenario.correctAnswer
              ? "answered_correct"
              : "answered_needs_review",
          warningCodes: ["DYNAMIC_THINKING_CANDIDATE", "PRODUCTION_APPROVED_FALSE"],
        })),
        status: answeredScenarios.length === dynamicScenarios.length ? "completed" : "draft",
        summary: `Đã trả lời ${answeredScenarios.length}/${dynamicScenarios.length} câu hỏi động cho ${selectedTicker}.`,
        ticker: selectedTicker,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (response.status === 401) {
      setSaveState({
        status: "error",
        message: "Cần đăng nhập để lưu checklist vào database. Câu trả lời vẫn đang lưu local trên trình duyệt.",
      });
      return;
    }

    if (!response.ok) {
      setSaveState({
        status: "error",
        message: "Chưa lưu được checklist vào database.",
      });
      return;
    }

    setSaveState({
      status: "saved",
      message: `Đã lưu ${answeredScenarios.length} câu trả lời vào database.`,
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
            stocks={stockOptions}
            onSelectTicker={(ticker) => setPersistedState((current) => ({ ...current, selectedTicker: ticker }))}
          />
          <DynamicThinkingScenarioPanel
            answeredCount={answeredDynamicCount}
            answersByQuestion={answersByQuestion}
            onAnswer={(scenarioId, answer) =>
              setPersistedState((current) => ({
                ...current,
                answersByQuestion: {
                  ...current.answersByQuestion,
                  [scenarioId]: answer,
                },
              }))
            }
            onSave={handleSaveDynamicChecklist}
            saveState={saveState}
            state={dynamicScenarioState}
            ticker={selectedTicker}
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

function DynamicThinkingScenarioPanel({
  answeredCount,
  answersByQuestion,
  onAnswer,
  onSave,
  saveState,
  state,
  ticker,
}: {
  answeredCount: number;
  answersByQuestion: Record<string, string>;
  onAnswer: (scenarioId: string, answer: string) => void;
  onSave: () => void;
  saveState: ChecklistSaveState;
  state: DynamicScenarioState;
  ticker: string;
}) {
  if (state.status === "loading") {
    return (
      <LoadingState
        title="Đang đọc câu hỏi động"
        description={`Hệ thống đang lấy câu hỏi checklist từ database cho ${ticker}.`}
      />
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        title="Chưa đọc được câu hỏi động"
        description={state.message}
      />
    );
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="Chưa có câu hỏi động cho mã này"
        description="Checklist vẫn giữ các phần kiểm tra static bên dưới làm fallback."
      />
    );
  }

  if (state.scenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Câu hỏi động từ database"
        description="Các câu hỏi này được sinh từ bộ ThinkingReview và luôn giữ needsReview=true, productionApproved=false."
        chip={<Chip variant="warning">{answeredCount}/{state.scenarios.length} đã trả lời</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3">
          {state.scenarios.map((scenario) => {
            const selectedAnswer = answersByQuestion[scenario.scenarioId] ?? null;
            const answered = Boolean(selectedAnswer);
            const correct = selectedAnswer === scenario.correctAnswer;

            return (
              <div
                key={scenario.scenarioId}
                className="rounded-[6px] border border-border-soft bg-surface-soft p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Chip size="sm" variant="neutral">{scenario.scenarioId}</Chip>
                  <Chip size="sm" variant="accent">{scenario.moduleContext}</Chip>
                  <Chip size="sm" variant="neutral">{scenario.difficulty}</Chip>
                  <Chip size="sm" variant="warning">{scenario.evidenceStatus}</Chip>
                </div>
                <p className="mt-3 text-base font-bold leading-7 text-ink">{scenario.questionText}</p>
                <div className="mt-3 grid gap-2">
                  {scenario.options.map((option) => {
                    const isSelected = selectedAnswer === option.key;
                    return (
                      <button
                        key={`${scenario.scenarioId}-${option.key}`}
                        className={[
                          "rounded-[4px] border px-4 py-3 text-left text-sm font-semibold leading-5 transition",
                          isSelected
                            ? "border-border bg-accent-soft"
                            : "border-border-soft bg-surface hover:border-border",
                        ].join(" ")}
                        type="button"
                        onClick={() => onAnswer(scenario.scenarioId, option.key)}
                      >
                        <span className="font-black">{option.key})</span> {option.label}
                      </button>
                    );
                  })}
                </div>
                {answered ? (
                  <div className="mt-3 rounded-[4px] border border-border-soft bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip variant={correct ? "success" : "warning"}>
                        {correct ? "Đúng hướng" : "Cần xem lại"}
                      </Chip>
                      <p className="text-sm font-bold text-ink">Đáp án chuẩn: {scenario.correctAnswer}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{scenario.explanation}</p>
                    <p className="mt-2 text-xs leading-5 text-subtle">
                      Guardrail: {scenario.guardrailNote}. Missing data: {scenario.missingDataBehavior}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-subtle">
            Dữ liệu câu hỏi là candidate, dùng để kiểm tra tư duy và không tạo kết luận đầu tư.
          </p>
          <Button
            disabled={answeredCount === 0 || saveState.status === "saving"}
            isLoading={saveState.status === "saving"}
            variant="secondary"
            onClick={onSave}
          >
            Lưu checklist
          </Button>
        </div>
        {saveState.message ? (
          <p className={[
            "rounded-[4px] border px-3 py-2 text-sm font-semibold",
            saveState.status === "saved"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
          >
            {saveState.message}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
