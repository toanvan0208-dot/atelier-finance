import { DataMode, ReadinessStatus } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

type SimulationProfilePayload = {
  cash?: unknown;
  notes?: unknown;
  riskBudgetPercent?: unknown;
  totalCapital?: unknown;
};

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readNonNegativeNumber = (value: unknown): number | undefined => {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
};

const decimalToNumber = (value: { toNumber: () => number } | number | null | undefined): number | null => {
  if (typeof value === "number") return value;
  return value ? value.toNumber() : null;
};

const mapProfile = (profile: {
  cash: { toNumber: () => number } | null;
  notes: string | null;
  riskBudgetPercent: { toNumber: () => number } | null;
  totalCapital: { toNumber: () => number } | null;
  updatedAt: Date;
}) => ({
  cash: decimalToNumber(profile.cash),
  notes: profile.notes,
  riskBudgetPercent: decimalToNumber(profile.riskBudgetPercent),
  totalCapital: decimalToNumber(profile.totalCapital),
  updatedAt: profile.updatedAt.toISOString(),
});

export const GET = async (): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const profile = await prisma.simulationProfile.findUnique({
      where: { userId: user.id },
    });

    return apiSuccess(profile ? mapProfile(profile) : null, {
      meta: {
        fallback: false,
        source: "simulation_profile_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};

export const PATCH = async (request: Request): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("UNAUTHENTICATED", "Login is required.", { status: 401 });

    const body = await request.json().catch(() => null) as SimulationProfilePayload | null;
    if (!body) return apiError("INVALID_JSON", "Request body must be JSON.", { status: 400 });

    const totalCapital = readNonNegativeNumber(body.totalCapital);
    const cash = readNonNegativeNumber(body.cash);
    const riskBudgetPercent = readNonNegativeNumber(body.riskBudgetPercent);

    const profile = await prisma.simulationProfile.upsert({
      where: { userId: user.id },
      create: {
        cash: cash ?? null,
        dataMode: DataMode.user_input,
        notes: readText(body.notes) ?? null,
        readiness: ReadinessStatus.needs_review,
        riskBudgetPercent: riskBudgetPercent ?? null,
        totalCapital: totalCapital ?? null,
        userId: user.id,
      },
      update: {
        ...(cash !== undefined ? { cash } : {}),
        ...(readText(body.notes) !== undefined ? { notes: readText(body.notes) } : {}),
        ...(riskBudgetPercent !== undefined ? { riskBudgetPercent } : {}),
        ...(totalCapital !== undefined ? { totalCapital } : {}),
        dataMode: DataMode.user_input,
        readiness: ReadinessStatus.needs_review,
      },
    });

    return apiSuccess(mapProfile(profile), {
      meta: {
        fallback: false,
        source: "simulation_profile_user_db",
        userScoped: true,
      },
    });
  } catch {
    return apiInternalError();
  }
};
