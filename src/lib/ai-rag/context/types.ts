export type AssistantContextPacketDataQuality = {
  dataMode?: string;
  status?: string;
  productionApproved?: boolean;
  sourceName?: string | null;
  sourceLabel?: string | null;
  asOf?: string | null;
  period?: string | null;
  warnings?: string[];
};

export type AssistantContextPacket = {
  ticker: string | null;
  activeModule: string;
  moduleContext: Record<string, unknown> | null;
  dataQuality: AssistantContextPacketDataQuality;
  missingFields: string[];
  allowedNumericValues: number[];
  visibleFacts: string[];
  constraints: string[];
};

export type AssistantContextPacketInput = Partial<AssistantContextPacket> & {
  activeModule: string;
};

export type AssistantApiPayload = {
  question: string;
  activeModule: string;
  ticker: string | null;
  contextPacket: AssistantContextPacket;
};
