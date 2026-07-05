import { DataMode, PaperTradeAction, PaperTradeStatus, ReadinessStatus } from "@/generated/prisma/enums";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type PaperTradePayload = {
  action?: unknown;
  entryPrice?: unknown;
  quantity?: unknown;
  reflection?: unknown;
  status?: unknown;
  thesisSnapshot?: unknown;
  ticker?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readPositiveNumber = (value: unknown): number | undefined => {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
};

const dateLabel = (value: Date | null | undefined): string =>
  value ? new Intl.DateTimeFormat("vi-VN").format(value) : new Intl.DateTimeFormat("vi-VN").format(new Date());

const decimalToNumber = (value: { toNumber: () => number } | number | null | undefined): number | null => {
  if (typeof value === "number") return value;
  return value ? value.toNumber() : null;
};

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

const syncWatchlistFromPaperTrade = async ({
  company,
  status,
  thesisSnapshot,
  ticker,
  userId,
}: {
  company: NonNullable<Awaited<ReturnType<typeof findCompanyByTicker>>>;
  status: PaperTradeStatus;
  thesisSnapshot: string | null;
  ticker: string;
  userId: string;
}) => {
  const existing = await prisma.watchlist.findFirst({
    where: {
      companyId: company.id,
      userId,
    },
    select: { id: true, notes: true, thesisSummary: true },
  });
  const watchlistStatus = status === PaperTradeStatus.planned ? "Sẵn sàng mô phỏng" : "Đang mô phỏng";
  const data = {
    dataMode: DataMode.user_input,
    notes: existing?.notes ?? thesisSnapshot ?? "Tự động thêm từ mô phỏng giả lập.",
    priority: "high",
    readiness: ReadinessStatus.needs_review,
    status: watchlistStatus,
    thesisSummary: existing?.thesisSummary ?? thesisSnapshot ?? null,
  };

  if (existing) {
    await prisma.watchlist.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.watchlist.create({
    data: {
      ...data,
      companyId: company.id,
      ticker,
      userId,
    },
  });
};

const loadLatestPrice = async (ticker: string): Promise<number | null> => {
  const price = await prisma.marketPrice.findFirst({
    where: { ticker, closePrice: { not: null } },
    orderBy: { tradingDate: "desc" },
    select: { closePrice: true },
  });

  return decimalToNumber(price?.closePrice);
};

type PaperTradeRecord = {
  closedAt: Date | null;
  company?: { companyName?: string | null } | null;
  createdAt: Date;
  entryPrice: { toNumber: () => number } | null;
  exitPrice: { toNumber: () => number } | null;
  id: string;
  openedAt: Date | null;
  quantity: { toNumber: () => number } | null;
  reflection: string | null;
  status: PaperTradeStatus;
  thesisSnapshot: string | null;
  ticker: string;
  updatedAt: Date;
};

async function mapPaperTrade(trade: PaperTradeRecord) {
  const latestPrice = await loadLatestPrice(trade.ticker);
  const entryPrice = decimalToNumber(trade.entryPrice) ?? latestPrice ?? 0;
  const exitPrice = decimalToNumber(trade.exitPrice);
  const quantity = decimalToNumber(trade.quantity) ?? 0;
  const currentPrice = latestPrice ?? exitPrice ?? entryPrice;
  const marketValue = currentPrice * quantity;
  const unrealizedPnL = (currentPrice - entryPrice) * quantity;
  const unrealizedPnLPercent = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const companyName = trade.company?.companyName ?? trade.ticker;

  if (trade.status === PaperTradeStatus.closed) {
    const closePrice = exitPrice ?? currentPrice;
    const realizedPnL = (closePrice - entryPrice) * quantity;

    return {
      closedPosition: {
        closePrice,
        closeReason: trade.thesisSnapshot ?? "Closed simulation note",
        closedAt: dateLabel(trade.closedAt ?? trade.updatedAt),
        id: trade.id,
        lesson: trade.reflection ?? "",
        name: companyName,
        openPrice: entryPrice,
        openedAt: dateLabel(trade.openedAt ?? trade.createdAt),
        quantity,
        realizedPnL,
        realizedPnLPercent: entryPrice > 0 ? ((closePrice - entryPrice) / entryPrice) * 100 : 0,
        symbol: trade.ticker,
      },
      openPosition: null,
    };
  }

  return {
    closedPosition: null,
    openPosition: {
      averagePrice: entryPrice,
      currentPrice,
      id: trade.id,
      marketValue,
      name: companyName,
      openReason: trade.thesisSnapshot ?? "",
      openedAt: dateLabel(trade.openedAt ?? trade.createdAt),
      quantity,
      status: unrealizedPnLPercent > 0 ? "profit" : unrealizedPnLPercent < 0 ? "loss" : "normal",
      symbol: trade.ticker,
      unrealizedPnL,
      unrealizedPnLPercent,
      weight: 0,
    },
  };
}

export const GET = async (): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const trades = await prisma.paperTrade.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }],
      include: { company: true },
    });
    const mapped = await Promise.all(trades.map(mapPaperTrade));

    return apiSuccess({
      closedPositions: mapped.flatMap((item) => (item.closedPosition ? [item.closedPosition] : [])),
      openPositions: mapped.flatMap((item) => (item.openPosition ? [item.openPosition] : [])),
    }, {
      meta: {
        count: trades.length,
        fallback: false,
        source: "paper_trade_user_db",
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

    const body = await request.json().catch(() => null) as PaperTradePayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const ticker = readText(body.ticker)?.toUpperCase();
    const quantity = readPositiveNumber(body.quantity);
    const entryPrice = readPositiveNumber(body.entryPrice);
    if (!ticker || !quantity || !entryPrice) {
      return apiError("INVALID_PAPER_TRADE", "Ticker, quantity and entry price are required.", { status: 400 });
    }

    const company = await findCompanyByTicker(ticker);
    if (!company) {
      return apiError("COMPANY_NOT_FOUND", "Company was not found.", {
        status: 404,
        reason: "Paper trades must point to an existing company.",
      });
    }

    const status = readText(body.status) === PaperTradeStatus.planned ? PaperTradeStatus.planned : PaperTradeStatus.open;
    const action = readText(body.action) === PaperTradeAction.observe_position
      ? PaperTradeAction.observe_position
      : PaperTradeAction.open_position;
    const thesisSnapshot = readText(body.thesisSnapshot) ?? null;

    const trade = await prisma.paperTrade.create({
      data: {
        action,
        companyId: company.id,
        entryPrice,
        openedAt: new Date(),
        quantity,
        readiness: ReadinessStatus.needs_review,
        reflection: readText(body.reflection) ?? null,
        sourceMode: DataMode.user_input,
        status,
        thesisSnapshot,
        ticker,
        userId: user.id,
      },
      include: { company: true },
    });
    await syncWatchlistFromPaperTrade({ company, status, thesisSnapshot, ticker, userId: user.id });
    const mapped = await mapPaperTrade(trade);

    return apiSuccess(mapped, {
      status: 201,
      meta: {
        fallback: false,
        source: "paper_trade_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
