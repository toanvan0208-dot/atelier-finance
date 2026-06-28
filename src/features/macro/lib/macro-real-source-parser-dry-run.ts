import { MACRO_PARSER_STRATEGY_REGISTRY } from "./macro-parser-strategy-registry";
import crypto from 'crypto';

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

async function parseUsdVnd(html: string): Promise<{ value?: string; date?: string; warningCodes: string[] }> {
  const warningCodes: string[] = [];
  let value: string | undefined;
  let date: string | undefined;

  // Very naive regex parser for SBV TyGia.jspx
  // Look for something like <span>24,000</span> or similar near USD
  const dateMatch = html.match(/Ngày.*?(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    const d = dateMatch[1].split('/');
    date = `${d[2]}-${d[1]}-${d[0]}`;
  } else {
    warningCodes.push("MISSING_OBSERVATION_DATE");
  }

  // Find USD row
  // SBV often uses: <td>USD</td>...<td>24000</td>
  // This is extremely brittle, if it fails, it returns undefined
  const usdRegex = /USD.*?(\d{2,3}[\.,]\d{3})/i;
  const match = html.match(usdRegex);
  if (match) {
    value = match[1].replace(/[\.,]/g, '');
  } else {
    warningCodes.push("USD_ROW_NOT_FOUND");
    warningCodes.push("HTML_STRUCTURE_UNSTABLE");
  }

  return { value, date, warningCodes };
}

async function parseInterbankRate(html: string): Promise<{ value?: string; date?: string; warningCodes: string[] }> {
  const warningCodes: string[] = [];
  let value: string | undefined;
  let date: string | undefined;

  const dateMatch = html.match(/Ngày.*?(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    const d = dateMatch[1].split('/');
    date = `${d[2]}-${d[1]}-${d[0]}`;
  } else {
    warningCodes.push("MISSING_OBSERVATION_DATE");
  }

  // Look for Qua đêm or Overnight
  const overnightRegex = /(?:Qua đêm|Overnight).*?(\d+[\.,]\d+)/i;
  const match = html.match(overnightRegex);
  if (match) {
    value = match[1].replace(',', '.');
  } else {
    warningCodes.push("OVERNIGHT_ROW_NOT_FOUND");
    warningCodes.push("HTML_STRUCTURE_UNSTABLE");
  }

  return { value, date, warningCodes };
}

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

  result.providerFetchAttempted = true;
  
  let html = "";
  try {
    const res = await fetch(strategy.sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!res.ok) {
      throw new Error("Fetch failed");
    }
    html = await res.text();
    result.providerFetchSucceeded = true;
  } catch (err) {
    result.previewBlocked = true;
    result.previewBlockedReasons.push("SOURCE_UNREACHABLE");
    return result;
  }

  let parseOutput;
  let unit = "";
  
  if (target === "USD_VND") {
    parseOutput = await parseUsdVnd(html);
    unit = "VND";
  } else if (target === "INTERBANK_RATE_OVERNIGHT") {
    parseOutput = await parseInterbankRate(html);
    unit = "percent";
  }

  if (!parseOutput || !parseOutput.value) {
    result.previewBlocked = true;
    result.previewBlockedReasons.push("PARSER_EXTRACTION_FAILED");
    if (parseOutput && parseOutput.warningCodes) {
      result.previewBlockedReasons.push(...parseOutput.warningCodes);
    }
    return result;
  }

  result.parserSucceeded = true;
  
  const payloadChecksum = crypto.createHash('sha256').update(html).digest('hex');
  const now = new Date().toISOString();
  const obsDate = parseOutput.date || now.split('T')[0];

  result.candidateObservation = {
    indicatorCode: target,
    region: "VN",
    observationDate: obsDate,
    value: parseOutput.value,
    unit,
    frequency: "daily",
    sourceLabel: strategy.sourceName || "Unknown",
    dataMode: "candidate_macro_data",
    productionApproved: false,
    needsReview: true
  };

  result.candidateProvenance = {
    indicatorCode: target,
    region: "VN",
    observationDate: obsDate,
    sourceLabel: strategy.sourceName || "Unknown",
    providerType: "html_table_candidate",
    dataMode: "candidate_macro_data",
    productionApproved: false,
    needsReview: true,
    sourceUrl: strategy.sourceUrl,
    retrievedAt: now,
    payloadChecksum,
    rawPayloadSnippet: html.substring(0, 500),
    warningCodes: parseOutput.warningCodes
  };

  return result;
}
