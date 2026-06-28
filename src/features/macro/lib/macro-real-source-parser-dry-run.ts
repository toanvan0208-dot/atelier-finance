import { MACRO_PARSER_STRATEGY_REGISTRY } from "./macro-parser-strategy-registry";

export type MacroParserDryRunTarget = "USD_VND" | "INTERBANK_RATE_OVERNIGHT";

export type MacroParserDryRunResult = {
  indicatorCode: MacroParserDryRunTarget;
  sourceLabel: string;
  sourceUrl?: string;
  providerFetchAttempted: boolean;
  providerFetchSucceeded: boolean;
  parserSucceeded: boolean;
  previewBlocked: boolean;
  previewBlockedReasons: string[];
  candidateObservation?: {
    indicatorCode: string;
    region: string;
    observationDate: string;
    value: string;
    unit: string;
    frequency: string;
    sourceLabel: string;
    dataMode: "candidate_macro_data";
    productionApproved: false;
    needsReview: true;
  };
  candidateProvenance?: {
    indicatorCode: string;
    region: string;
    observationDate?: string;
    sourceLabel: string;
    providerType: string;
    dataMode: "candidate_macro_data";
    productionApproved: false;
    needsReview: true;
    sourceUrl?: string;
    retrievedAt: string;
    payloadChecksum?: string;
    rawPayloadSnippet?: string;
    warningCodes: string[];
  };
};

export async function runMacroParserDryRun(target: MacroParserDryRunTarget): Promise<MacroParserDryRunResult> {
  const strategy = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === target);
  
  if (!strategy) {
    return {
      indicatorCode: target,
      sourceLabel: "Unknown",
      providerFetchAttempted: false,
      providerFetchSucceeded: false,
      parserSucceeded: false,
      previewBlocked: true,
      previewBlockedReasons: ["STRATEGY_NOT_FOUND"]
    };
  }

  const result: MacroParserDryRunResult = {
    indicatorCode: target,
    sourceLabel: strategy.sourceName || "Unknown",
    sourceUrl: strategy.sourceUrl,
    providerFetchAttempted: false,
    providerFetchSucceeded: false,
    parserSucceeded: false,
    previewBlocked: false,
    previewBlockedReasons: []
  };

  if (!strategy.sourceUrl) {
    result.previewBlocked = true;
    result.previewBlockedReasons.push("MISSING_SOURCE_URL");
    return result;
  }

  // If we had a source URL, we would attempt to fetch here, but we don't have one.
  // We must fail closed if sourceUrl is present but parsing is not implemented.
  result.providerFetchAttempted = true;
  result.previewBlocked = true;
  result.previewBlockedReasons.push("PARSER_NOT_IMPLEMENTED_YET");
  
  return result;
}
