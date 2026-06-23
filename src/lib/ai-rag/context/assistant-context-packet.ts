import type {
  AssistantApiPayload,
  AssistantContextPacket,
  AssistantContextPacketDataQuality,
  AssistantContextPacketInput,
} from "./types";

const MAX_LIST_ITEMS = 100;
const MAX_NUMERIC_VALUES = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asOptionalString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_LIST_ITEMS);
};

const asNumericList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))),
  ).slice(0, MAX_NUMERIC_VALUES);
};

const normalizeDataQuality = (value: unknown): AssistantContextPacketDataQuality => {
  if (!isRecord(value)) return {};

  return {
    dataMode: asOptionalString(value.dataMode) ?? undefined,
    status: asOptionalString(value.status) ?? undefined,
    productionApproved:
      typeof value.productionApproved === "boolean" ? value.productionApproved : undefined,
    sourceName: asOptionalString(value.sourceName),
    sourceLabel: asOptionalString(value.sourceLabel),
    asOf: asOptionalString(value.asOf),
    period: asOptionalString(value.period),
    missingFields: asStringList(value.missingFields),
    warnings: asStringList(value.warnings),
  };
};

export const createAssistantContextPacket = (
  input: AssistantContextPacketInput,
): AssistantContextPacket => ({
  ticker: asOptionalString(input.ticker)?.toUpperCase() ?? null,
  activeModule: asOptionalString(input.activeModule) ?? "overview",
  moduleContext: isRecord(input.moduleContext) ? input.moduleContext : null,
  dataQuality: normalizeDataQuality(input.dataQuality),
  missingFields: asStringList(input.missingFields),
  allowedNumericValues: asNumericList(input.allowedNumericValues),
  visibleFacts: asStringList(input.visibleFacts),
  constraints: asStringList(input.constraints),
});

export const parseAssistantContextPacket = (value: unknown): AssistantContextPacket | null => {
  if (!isRecord(value) || !asOptionalString(value.activeModule)) return null;

  return createAssistantContextPacket(value as AssistantContextPacketInput);
};

export const collectAllowedNumericValues = (value: unknown): number[] => {
  const values = new Set<number>();
  const seen = new Set<object>();

  const visit = (current: unknown): void => {
    if (values.size >= MAX_NUMERIC_VALUES || current === null || current === undefined) return;

    if (typeof current === "number") {
      if (Number.isFinite(current)) values.add(current);
      return;
    }

    if (typeof current === "string") {
      for (const token of current.match(/\b\d[\d.,]*\b/g) ?? []) {
        const parsed = Number(token.replace(/,/g, ""));
        if (Number.isFinite(parsed)) values.add(parsed);
      }
      return;
    }

    if (typeof current !== "object" || seen.has(current)) return;
    seen.add(current);

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    Object.values(current).forEach(visit);
  };

  visit(value);
  return Array.from(values).slice(0, MAX_NUMERIC_VALUES);
};

export const buildAssistantApiPayload = (
  question: string,
  contextPacket: AssistantContextPacket,
): AssistantApiPayload => ({
  question: question.trim(),
  activeModule: contextPacket.activeModule,
  ticker: contextPacket.ticker,
  contextPacket,
});
