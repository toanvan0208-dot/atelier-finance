import { MACRO_SOURCE_URL_CANDIDATES } from "./macro-source-url-candidates";

export type SbvSourceInspectionResult = {
  indicatorCode: "USD_VND" | "INTERBANK_RATE_OVERNIGHT";
  sourceUrl: string;
  fetchAttempted: boolean;
  fetchSucceeded: boolean;
  contentType?: string;
  htmlLength?: number;
  tableLikeMarkupDetected: boolean;
  scriptReferencesDetected: string[];
  formActionsDetected: string[];
  possibleEndpointCandidates: string[];
  requiresJavascriptRendering: boolean;
  numericValuesExtracted: 0;
  parserStrategyRecommendation:
    | "retry_html_parser_with_selectors"
    | "investigate_endpoint_candidate"
    | "manual_review_only"
    | "alternate_source_needed"
    | "blocked";
  blockedReasons: string[];
  notes: string[];
};

export async function inspectSbvSource(indicatorCode: "USD_VND" | "INTERBANK_RATE_OVERNIGHT"): Promise<SbvSourceInspectionResult> {
  const candidate = MACRO_SOURCE_URL_CANDIDATES.find(c => c.indicatorCode === indicatorCode);
  
  const result: SbvSourceInspectionResult = {
    indicatorCode,
    sourceUrl: candidate?.sourceUrl || "",
    fetchAttempted: false,
    fetchSucceeded: false,
    tableLikeMarkupDetected: false,
    scriptReferencesDetected: [],
    formActionsDetected: [],
    possibleEndpointCandidates: [],
    requiresJavascriptRendering: false,
    numericValuesExtracted: 0,
    parserStrategyRecommendation: "blocked",
    blockedReasons: [],
    notes: []
  };

  if (!candidate || !candidate.sourceUrl) {
    result.blockedReasons.push("MISSING_SOURCE_URL");
    return result;
  }

  result.fetchAttempted = true;
  
  let html = "";
  try {
    const res = await fetch(candidate.sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    result.contentType = res.headers.get("content-type") || undefined;
    html = await res.text();
    result.fetchSucceeded = true;
    result.htmlLength = html.length;
  } catch (err) {
    result.blockedReasons.push("SOURCE_UNREACHABLE");
    return result;
  }

  // Inspect HTML Structure
  const lowerHtml = html.toLowerCase();
  
  result.tableLikeMarkupDetected = lowerHtml.includes("<table") || lowerHtml.includes("grid");
  
  // Look for jsf, adf, webcenter patterns
  if (lowerHtml.includes("javax.faces") || lowerHtml.includes("adf.ctrl") || lowerHtml.includes("webcenter")) {
    result.requiresJavascriptRendering = true;
    result.notes.push("Detected JSF/ADF/WebCenter pattern which heavily relies on JS rendering and form posts.");
  }
  
  if (html.includes("<script")) {
    // Just count or pick some src
    const scriptMatches = html.match(/<script.*?src=["'](.*?)["']/gi);
    if (scriptMatches) {
      result.scriptReferencesDetected = scriptMatches.slice(0, 5); // Take up to 5
    } else {
      result.scriptReferencesDetected.push("Inline scripts detected");
    }
  }

  const formMatches = html.match(/<form.*?action=["'](.*?)["']/gi);
  if (formMatches) {
    result.formActionsDetected = formMatches;
  }

  // Determine recommendation
  if (result.requiresJavascriptRendering) {
    result.parserStrategyRecommendation = "alternate_source_needed";
    result.blockedReasons.push("JS_RENDERED_CONTENT");
    result.blockedReasons.push("NO_STABLE_ENDPOINT_FOUND");
    result.notes.push("SBV uses complex Oracle WebCenter/ADF/JSF which makes pure HTML parsing unreliable without a real browser.");
  } else {
    // If not heavily JS rendered, maybe we can retry
    if (result.tableLikeMarkupDetected) {
       result.parserStrategyRecommendation = "retry_html_parser_with_selectors";
       result.notes.push("HTML table found without heavy JSF wrappers. Could attempt better parser.");
    } else {
       result.parserStrategyRecommendation = "blocked";
       result.blockedReasons.push("HTML_STRUCTURE_UNSTABLE");
    }
  }

  return result;
}
