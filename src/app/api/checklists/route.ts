import { ReadinessStatus } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type ChecklistResultPayload = {
  answer?: unknown;
  evidenceSnapshot?: unknown;
  itemCode?: unknown;
  missingFields?: unknown;
  scenarioId?: unknown;
  status?: unknown;
  warningCodes?: unknown;
};

type ChecklistPayload = {
  contextSnapshot?: unknown;
  results?: unknown;
  status?: unknown;
  summary?: unknown;
  ticker?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readStringArrayJson = (value: unknown): string => {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0));
};

const readRecordJson = (value: unknown): string => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "{}";
  return JSON.stringify(value);
};

const readResults = (value: unknown): ChecklistResultPayload[] =>
  Array.isArray(value)
    ? value.filter((item): item is ChecklistResultPayload => typeof item === "object" && item !== null)
    : [];

const findCompanyByTicker = async (ticker: string) =>
  prisma.company.findFirst({
    where: { ticker },
    orderBy: { updatedAt: "desc" },
    select: { id: true, ticker: true },
  });

export const GET = async (): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const checklists = await prisma.userChecklist.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        company: {
          select: {
            companyName: true,
            exchange: true,
            ticker: true,
          },
        },
        results: {
          include: {
            checklistItem: true,
          },
          orderBy: {
            checklistItem: {
              displayOrder: "asc",
            },
          },
        },
      },
    });

    return apiSuccess(checklists, {
      meta: {
        count: checklists.length,
        fallback: false,
        source: "user_checklist_db",
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

    const body = (await request.json().catch(() => null)) as ChecklistPayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const ticker = readText(body.ticker)?.toUpperCase();
    const company = ticker ? await findCompanyByTicker(ticker) : null;
    const results = readResults(body.results);

    const itemCodes = results
      .map((result) => readText(result.itemCode))
      .filter((itemCode): itemCode is string => Boolean(itemCode));
    const scenarioIds = results
      .map((result) => readText(result.scenarioId))
      .filter((scenarioId): scenarioId is string => Boolean(scenarioId));

    const checklistItems =
      itemCodes.length > 0
        ? await prisma.checklistItem.findMany({
            where: { itemCode: { in: itemCodes }, isActive: true },
          })
        : [];
    const itemByCode = new Map(checklistItems.map((item) => [item.itemCode, item]));
    const scenarios =
      scenarioIds.length > 0
        ? await prisma.thinkingQuestionScenario.findMany({
            where: {
              scenarioId: { in: scenarioIds },
              needsReview: true,
              productionApproved: false,
            },
          })
        : [];
    const scenarioById = new Map(scenarios.map((scenario) => [scenario.scenarioId, scenario]));

    const checklist = await prisma.userChecklist.create({
      data: {
        companyId: company?.id ?? null,
        contextSnapshot: readRecordJson(body.contextSnapshot),
        readiness: ReadinessStatus.needs_review,
        status: readText(body.status) ?? "draft",
        summary: readText(body.summary) ?? null,
        ticker: ticker ?? company?.ticker ?? null,
        userId: user.id,
        results: {
          create: results.flatMap((result) => {
            const itemCode = readText(result.itemCode);
            const scenarioId = readText(result.scenarioId);
            const item = itemCode ? itemByCode.get(itemCode) : null;
            const scenario = scenarioId ? scenarioById.get(scenarioId) : null;
            if (!item && !scenario) return [];

            return {
              answer: readText(result.answer) ?? null,
              ...(item ? { checklistItemId: item.id } : {}),
              evidenceSnapshot: readRecordJson(result.evidenceSnapshot),
              missingFields: readStringArrayJson(result.missingFields),
              status: readText(result.status) ?? "unanswered",
              ...(scenario ? { thinkingQuestionScenarioId: scenario.id } : {}),
              warningCodes: readStringArrayJson(result.warningCodes),
            };
          }),
        },
      },
      include: {
        results: {
          include: {
            checklistItem: true,
          },
        },
      },
    });

    return apiSuccess(checklist, {
      status: 201,
      meta: {
        fallback: false,
        ignoredResultCount: results.length - checklist.results.length,
        source: "user_checklist_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
