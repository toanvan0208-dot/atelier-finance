import { DataMode, ReadinessStatus } from "@/generated/prisma/enums";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type WatchlistPayload = {
  notes?: unknown;
  priority?: unknown;
  status?: unknown;
  thesisSummary?: unknown;
  ticker?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const findCompanyByTicker = async (ticker: string) =>
  prisma.company.findFirst({
    where: { ticker },
    orderBy: { updatedAt: "desc" },
    select: {
      companyName: true,
      exchange: true,
      id: true,
      industryName: true,
      ticker: true,
    },
  });

export const GET = async (): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const items = await prisma.watchlist.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        company: {
          select: {
            companyName: true,
            exchange: true,
            industryName: true,
            ticker: true,
          },
        },
      },
    });

    return apiSuccess(items, {
      meta: {
        count: items.length,
        fallback: false,
        source: "watchlist_user_db",
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

    const body = await request.json().catch(() => null) as WatchlistPayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const ticker = readText(body.ticker)?.toUpperCase();
    if (!ticker) return apiError("INVALID_TICKER", "Ticker is required.", { status: 400 });

    const company = await findCompanyByTicker(ticker);
    if (!company) {
      return apiError("COMPANY_NOT_FOUND", "Company was not found.", {
        status: 404,
        reason: "Watchlist items must point to an existing company.",
      });
    }

    const existing = await prisma.watchlist.findFirst({
      where: {
        companyId: company.id,
        userId: user.id,
      },
      select: { id: true },
    });

    const data = {
      dataMode: DataMode.user_input,
      notes: readText(body.notes) ?? null,
      priority: readText(body.priority) ?? null,
      readiness: ReadinessStatus.needs_review,
      status: readText(body.status) ?? "watching",
      thesisSummary: readText(body.thesisSummary) ?? null,
    };

    const item = existing
      ? await prisma.watchlist.update({
        where: { id: existing.id },
        data,
        include: { company: true },
      })
      : await prisma.watchlist.create({
        data: {
          ...data,
          companyId: company.id,
          ticker,
          userId: user.id,
        },
        include: { company: true },
      });

    return apiSuccess(item, {
      status: existing ? 200 : 201,
      meta: {
        fallback: false,
        source: "watchlist_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
