import { PaperTradeStatus } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type PaperTradePatchPayload = {
  exitPrice?: unknown;
  quantity?: unknown;
  reflection?: unknown;
  status?: unknown;
  thesisSnapshot?: unknown;
};

type PaperTradeRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readPositiveNumber = (value: unknown): number | undefined => {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
};

const resolveId = async (context: PaperTradeRouteContext): Promise<string> => {
  const params = await context.params;
  return params.id;
};

export const PATCH = async (
  request: Request,
  context: PaperTradeRouteContext,
): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const id = await resolveId(context);
    if (!id) return apiError("INVALID_PAPER_TRADE_ID", "Paper trade id is required.", { status: 400 });

    const body = await request.json().catch(() => null) as PaperTradePatchPayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const existing = await prisma.paperTrade.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return apiError("PAPER_TRADE_NOT_FOUND", "Paper trade was not found.", { status: 404 });

    const nextStatus = readText(body.status);
    const closing = nextStatus === PaperTradeStatus.closed;
    const trade = await prisma.paperTrade.update({
      where: { id },
      data: {
        ...(readPositiveNumber(body.exitPrice) ? { exitPrice: readPositiveNumber(body.exitPrice) } : {}),
        ...(readPositiveNumber(body.quantity) ? { quantity: readPositiveNumber(body.quantity) } : {}),
        ...(readText(body.reflection) !== undefined ? { reflection: readText(body.reflection) } : {}),
        ...(readText(body.thesisSnapshot) !== undefined ? { thesisSnapshot: readText(body.thesisSnapshot) } : {}),
        ...(closing ? { closedAt: new Date(), status: PaperTradeStatus.closed } : {}),
      },
    });

    return apiSuccess(trade, {
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
