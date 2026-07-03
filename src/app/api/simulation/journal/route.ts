import { DataMode, ReadinessStatus } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type SimulationJournalPayload = {
  content?: unknown;
  eventType?: unknown;
  metadata?: unknown;
  paperTradeId?: unknown;
  ticker?: unknown;
  title?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const safeMetadata = (value: unknown): string => {
  if (!value || typeof value !== "object") return "{}";
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
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

const mapJournal = (entry: {
  content: string | null;
  createdAt: Date;
  eventType: string;
  id: string;
  ticker: string | null;
  title: string;
}) => ({
  description: entry.content ?? "",
  id: entry.id,
  symbol: entry.ticker ?? undefined,
  timestamp: new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(entry.createdAt),
  title: entry.title,
  type: entry.eventType,
});

export const GET = async (): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const entries = await prisma.simulationJournal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return apiSuccess(entries.map(mapJournal), {
      meta: {
        count: entries.length,
        fallback: false,
        source: "simulation_journal_user_db",
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

    const body = await request.json().catch(() => null) as SimulationJournalPayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const title = readText(body.title);
    const eventType = readText(body.eventType);
    if (!title || !eventType) {
      return apiError("INVALID_JOURNAL_ENTRY", "Journal title and event type are required.", { status: 400 });
    }

    const ticker = readText(body.ticker)?.toUpperCase();
    const company = await findCompanyByTicker(ticker);
    const requestedPaperTradeId = readText(body.paperTradeId);
    const paperTrade = requestedPaperTradeId
      ? await prisma.paperTrade.findFirst({
        where: { id: requestedPaperTradeId, userId: user.id },
        select: { id: true },
      })
      : null;
    const entry = await prisma.simulationJournal.create({
      data: {
        companyId: company?.id ?? null,
        content: readText(body.content) ?? null,
        dataMode: DataMode.user_input,
        eventType,
        metadata: safeMetadata(body.metadata),
        paperTradeId: paperTrade?.id ?? null,
        readiness: ReadinessStatus.needs_review,
        ticker: ticker ?? null,
        title,
        userId: user.id,
      },
    });

    return apiSuccess(mapJournal(entry), {
      status: 201,
      meta: {
        fallback: false,
        source: "simulation_journal_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
