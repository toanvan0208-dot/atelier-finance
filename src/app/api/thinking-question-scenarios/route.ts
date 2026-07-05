import { apiDataReadError, apiError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/database/client";

const parseLimit = (url: URL): number => {
  const raw = url.searchParams.get("limit");
  if (!raw) return 50;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 200) : 50;
};

const parseJsonArray = (value: string): unknown[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const GET = async (request: Request): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const ticker = url.searchParams.get("ticker")?.trim().toUpperCase();
    const moduleContext = url.searchParams.get("moduleContext")?.trim();
    const questionType = url.searchParams.get("questionType")?.trim();
    const evidenceStatus = url.searchParams.get("evidenceStatus")?.trim();
    const limit = parseLimit(url);

    if (ticker && !/^[A-Z0-9]{2,10}$/.test(ticker)) {
      return apiError("INVALID_TICKER", "Ticker is invalid.", { status: 400 });
    }

    const scenarios = await prisma.thinkingQuestionScenario.findMany({
      where: {
        ...(ticker ? { ticker } : {}),
        ...(moduleContext ? { moduleContext } : {}),
        ...(questionType ? { questionType } : {}),
        ...(evidenceStatus ? { evidenceStatus } : {}),
        needsReview: true,
        productionApproved: false,
      },
      orderBy: [{ ticker: "asc" }, { scenarioId: "asc" }],
      take: limit,
    });

    const data = scenarios.map((scenario) => ({
      ...scenario,
      evidenceFields: parseJsonArray(scenario.evidenceFields),
      options: parseJsonArray(scenario.options),
      sourceModules: parseJsonArray(scenario.sourceModules),
    }));

    return apiSuccess(data, {
      meta: {
        count: data.length,
        fallback: false,
        filters: {
          evidenceStatus: evidenceStatus ?? null,
          moduleContext: moduleContext ?? null,
          questionType: questionType ?? null,
          ticker: ticker ?? null,
        },
        guardrail: {
          needsReview: true,
          productionApproved: false,
          noInvestmentAdvice: true,
        },
        source: "thinking_question_scenario_db",
      },
    });
  } catch (error) {
    return apiDataReadError(error);
  }
};
