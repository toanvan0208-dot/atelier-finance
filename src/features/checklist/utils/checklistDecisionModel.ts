import type {
  ChecklistModeId,
  StockChecklistAnswer,
  StockChecklistQuestion,
  StockChecklistResult,
} from "../types";

type DecisionInput = {
  ticker: string;
  mode: ChecklistModeId;
  questions: StockChecklistQuestion[];
  answers: StockChecklistAnswer[];
  completedRequiredModules: number;
  totalRequiredModules: number;
  fullModeUnlocked: boolean;
};

const shortTextQuestionIds = new Set([
  "thesis-one-sentence",
  "macro-channel-main",
  "business-money-source",
  "cashflow-profit-confirm",
  "valuation-assumption",
  "thesis-break-risk",
  "disconfirming-data",
  "fomo-reason",
]);

export function calculateChecklistResult({
  answers,
  completedRequiredModules,
  fullModeUnlocked,
  mode,
  questions,
  ticker,
  totalRequiredModules,
}: DecisionInput): StockChecklistResult {
  const answerById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const activeAnswers = questions.map((question) => answerById.get(question.id));
  const answeredQuestions = activeAnswers.filter(
    (answer) => answer && answer.status !== "unknown"
  ).length;
  const missingCriticalCount = questions.filter((question) => {
    const answer = answerById.get(question.id);
    return question.required && (!answer || answer.status === "missing" || answer.status === "unknown");
  }).length;
  const unsureCount = activeAnswers.filter((answer) => answer?.status === "unsure").length;
  const fomoAnswer = answerById.get("fomo-reason");
  const fomoWarning =
    fomoAnswer?.status === "unsure" ||
    fomoAnswer?.status === "missing" ||
    Boolean(fomoAnswer?.textAnswer?.toLowerCase().includes("fomo"));
  const missingWrittenCore = questions.some((question) => {
    if (!shortTextQuestionIds.has(question.id)) return false;
    const answer = answerById.get(question.id);
    return !answer?.textAnswer?.trim();
  });

  if (missingCriticalCount > 0) {
    return {
      ticker,
      mode,
      readiness: "missing_critical_data",
      completedRequiredModules,
      totalRequiredModules,
      totalQuestions: questions.length,
      answeredQuestions,
      missingCriticalCount,
      unsureCount,
      fomoWarning,
      nextAction: "Bổ sung dữ liệu còn thiếu và quay lại module liên quan trước khi kết luận.",
      modulesToRevisit: getModulesToRevisit(questions, answers),
    };
  }

  if (fomoWarning) {
    return {
      ticker,
      mode,
      readiness: "fomo_warning",
      completedRequiredModules,
      totalRequiredModules,
      totalQuestions: questions.length,
      answeredQuestions,
      missingCriticalCount,
      unsureCount,
      fomoWarning,
      nextAction: "Ghi lại lý do và kiểm tra lại PVT trước khi nghĩ tới mô phỏng.",
      modulesToRevisit: ["technical"],
    };
  }

  if (missingWrittenCore) {
    return {
      ticker,
      mode,
      readiness: "unclear_thesis",
      completedRequiredModules,
      totalRequiredModules,
      totalQuestions: questions.length,
      answeredQuestions,
      missingCriticalCount,
      unsureCount,
      fomoWarning,
      nextAction: "Viết rõ thesis, dữ liệu xác nhận/phủ định và điều kiện làm thesis sai.",
      modulesToRevisit: ["business", "valuation", "risk"],
    };
  }

  if (unsureCount >= 5) {
    return {
      ticker,
      mode,
      readiness: "need_more_analysis",
      completedRequiredModules,
      totalRequiredModules,
      totalQuestions: questions.length,
      answeredQuestions,
      missingCriticalCount,
      unsureCount,
      fomoWarning,
      nextAction: "Quay lại các module có nhiều câu chưa chắc để giảm vùng mù dữ liệu.",
      modulesToRevisit: getModulesToRevisit(questions, answers),
    };
  }

  if (mode === "full_before_simulation" && fullModeUnlocked) {
    return {
      ticker,
      mode,
      readiness: "ready_for_simulation",
      completedRequiredModules,
      totalRequiredModules,
      totalQuestions: questions.length,
      answeredQuestions,
      missingCriticalCount,
      unsureCount,
      fomoWarning,
      nextAction: "Có thể chuyển sang mô phỏng sau khi lưu kết quả kiểm tra và đặt mốc xem lại thesis.",
      modulesToRevisit: [],
    };
  }

  return {
    ticker,
    mode,
    readiness: "prepare_simulation_with_warning",
    completedRequiredModules,
    totalRequiredModules,
    totalQuestions: questions.length,
    answeredQuestions,
    missingCriticalCount,
    unsureCount,
    fomoWarning,
    nextAction: "Lưu kết quả kiểm tra, tiếp tục theo dõi hoặc làm kiểm tra đầy đủ trước mô phỏng.",
    modulesToRevisit: [],
  };
}

function getModulesToRevisit(
  questions: StockChecklistQuestion[],
  answers: StockChecklistAnswer[]
) {
  const answerById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const modules = questions
    .filter((question) => {
      const answer = answerById.get(question.id);
      return !answer || answer.status === "missing" || answer.status === "unsure";
    })
    .map((question) => question.relatedModule)
    .filter((module): module is Exclude<typeof module, "watchlist"> => module !== "watchlist");

  return Array.from(new Set(modules)).slice(0, 4);
}
