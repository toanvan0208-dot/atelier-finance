import { DataMode, ReadinessStatus } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type SimulationScenarioPayload = {
  condition?: unknown;
  impactOnPosition?: unknown;
  paperTradeId?: unknown;
  relatedModules?: unknown;
  scenarioType?: unknown;
  signalsToWatch?: unknown;
  suggestedSimulationResponse?: unknown;
  ticker?: unknown;
  title?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
};

const parseJsonArray = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return readTextArray(parsed);
  } catch {
    return [];
  }
};

const findCompanyByTicker = async (ticker: string | undefined) => {
  if (!ticker) return null;
  return prisma.company.findFirst({
    where: { ticker },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
};

const mapScenario = (scenario: {
  condition: string | null;
  id: string;
  impactOnPosition: string | null;
  relatedModules: string;
  scenarioType: string;
  signalsToWatch: string;
  suggestedSimulationResponse: string | null;
  ticker: string | null;
  title: string;
}) => ({
  condition: scenario.condition ?? "",
  id: scenario.id,
  impactOnPosition: scenario.impactOnPosition ?? "",
  relatedModules: parseJsonArray(scenario.relatedModules),
  signalsToWatch: parseJsonArray(scenario.signalsToWatch),
  suggestedSimulationResponse: scenario.suggestedSimulationResponse ?? "",
  symbol: scenario.ticker ?? "",
  title: scenario.title,
  type: scenario.scenarioType,
});

export const GET = async (request: Request): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase();
    const scenarios = await prisma.simulationScenario.findMany({
      where: {
        userId: user.id,
        status: "active",
        ...(ticker ? { ticker } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(scenarios.map(mapScenario), {
      meta: {
        count: scenarios.length,
        fallback: false,
        source: "simulation_scenario_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const body = await request.json().catch(() => null) as SimulationScenarioPayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const title = readText(body.title);
    if (!title) return apiError("INVALID_SCENARIO", "Scenario title is required.", { status: 400 });

    const ticker = readText(body.ticker)?.toUpperCase();
    const company = await findCompanyByTicker(ticker);
    const requestedPaperTradeId = readText(body.paperTradeId);
    const paperTrade = requestedPaperTradeId
      ? await prisma.paperTrade.findFirst({
        where: { id: requestedPaperTradeId, userId: user.id },
        select: { id: true },
      })
      : null;
    const scenario = await prisma.simulationScenario.create({
      data: {
        companyId: company?.id ?? null,
        condition: readText(body.condition) ?? null,
        dataMode: DataMode.user_input,
        impactOnPosition: readText(body.impactOnPosition) ?? null,
        paperTradeId: paperTrade?.id ?? null,
        readiness: ReadinessStatus.needs_review,
        relatedModules: JSON.stringify(readTextArray(body.relatedModules)),
        scenarioType: readText(body.scenarioType) ?? "base",
        signalsToWatch: JSON.stringify(readTextArray(body.signalsToWatch)),
        suggestedSimulationResponse: readText(body.suggestedSimulationResponse) ?? null,
        ticker: ticker ?? null,
        title,
        userId: user.id,
      },
    });

    return apiSuccess(mapScenario(scenario), {
      status: 201,
      meta: {
        fallback: false,
        source: "simulation_scenario_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
