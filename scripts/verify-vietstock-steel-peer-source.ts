const SOURCE_URL = "https://finance.vietstock.vn/nganh/34/san-xuat-thep";
const SEARCHED_TICKERS = ["HPG", "HSG", "NKG", "TVN"] as const;
const PEER_TICKERS = ["HSG", "NKG", "TVN"] as const;
const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const RETRIEVED_AT = "2026-07-01";

type SearchedTicker = (typeof SEARCHED_TICKERS)[number];
type PeerTicker = (typeof PEER_TICKERS)[number];

type TickerVerification = {
  ticker: SearchedTicker;
  foundInHtml: boolean;
  foundInApiResponse: boolean;
  foundInSavedEvidence: boolean;
  evidenceType: "provider_taxonomy" | "industry_research" | "unavailable";
  sourceUrl: string;
  retrievedAt: string;
  evidenceSnippet: string | null;
  reviewNote: string | null;
  recommendedPeerRole: "direct_peer" | "adjacent_peer" | "watch_only" | "ambiguous" | "blocked";
  eligibleForPeerPackage: boolean;
  blocker: string | null;
};

type FetchResult = {
  sourceReadable: boolean;
  httpStatus: number | null;
  contentType: string | null;
  bodyText: string;
  blocker: string | null;
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<FetchResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "AtelierFinanceSourceVerifier/150O (+read-only source verification)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const bodyText = await response.text();
    const contentType = response.headers.get("content-type");

    return {
      sourceReadable: response.ok && bodyText.trim().length > 0,
      httpStatus: response.status,
      contentType,
      bodyText,
      blocker: response.ok ? null : `HTTP_${response.status}`,
    };
  } catch (error) {
    return {
      sourceReadable: false,
      httpStatus: null,
      contentType: null,
      bodyText: "",
      blocker: error instanceof Error ? error.message : "FETCH_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const findTicker = (text: string, ticker: SearchedTicker): boolean => {
  const escapedTicker = ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${escapedTicker}([^A-Z0-9]|$)`, "i").test(text);
};

const buildSnippet = (text: string, ticker: SearchedTicker): string | null => {
  const upperText = text.toUpperCase();
  const index = upperText.indexOf(ticker);
  if (index < 0) return null;

  const start = Math.max(0, index - 120);
  const end = Math.min(text.length, index + ticker.length + 120);
  return text.slice(start, end).trim();
};

const roleForPeer = (ticker: SearchedTicker, foundInHtml: boolean): TickerVerification["recommendedPeerRole"] => {
  if (ticker === "HPG") return foundInHtml ? "watch_only" : "blocked";
  return foundInHtml ? "direct_peer" : "blocked";
};

async function main() {
  const fetchResult = await fetchWithTimeout(SOURCE_URL, 20_000);
  const visibleText = stripHtml(fetchResult.bodyText);
  const searchableText = `${fetchResult.bodyText}\n${visibleText}`;
  const routeEvidencePresent =
    fetchResult.bodyText.includes("/nganh/34/san-xuat-thep") ||
    fetchResult.bodyText.includes("nganh/34/san-xuat-thep") ||
    fetchResult.bodyText.toLowerCase().includes("san-xuat-thep");

  const tickerResults: Record<SearchedTicker, TickerVerification> = Object.fromEntries(
    SEARCHED_TICKERS.map((ticker) => {
      const foundInHtml = fetchResult.sourceReadable && findTicker(searchableText, ticker);
      const isPeerTicker = PEER_TICKERS.includes(ticker as PeerTicker);
      const eligibleForPeerPackage = Boolean(foundInHtml && routeEvidencePresent && isPeerTicker);
      const blocker = eligibleForPeerPackage
        ? null
        : !fetchResult.sourceReadable
          ? "SOURCE_NOT_READABLE"
          : !routeEvidencePresent
            ? "INDUSTRY_ROUTE_EVIDENCE_NOT_FOUND"
            : !foundInHtml
              ? "TICKER_NOT_FOUND_IN_SOURCE_HTML"
              : ticker === "HPG"
                ? "ANCHOR_TICKER_NOT_PEER_PACKAGE"
                : "NOT_ELIGIBLE";

      return [
        ticker,
        {
          ticker,
          foundInHtml,
          foundInApiResponse: false,
          foundInSavedEvidence: false,
          evidenceType: eligibleForPeerPackage || (ticker === "HPG" && foundInHtml) ? "provider_taxonomy" : "unavailable",
          sourceUrl: SOURCE_URL,
          retrievedAt: RETRIEVED_AT,
          evidenceSnippet: foundInHtml ? buildSnippet(visibleText || fetchResult.bodyText, ticker) : null,
          reviewNote: foundInHtml
            ? `${ticker} appears in the readable Vietstock steel industry page response at ${SOURCE_URL}. Use reviewNote only; exact quote is not marked safe because the page text/encoding may be unstable.`
            : null,
          recommendedPeerRole: roleForPeer(ticker, foundInHtml),
          eligibleForPeerPackage,
          blocker,
        },
      ];
    }),
  ) as Record<SearchedTicker, TickerVerification>;

  const eligiblePeerTickers = PEER_TICKERS.filter((ticker) => tickerResults[ticker].eligibleForPeerPackage);
  const blockedPeerTickers = PEER_TICKERS.filter((ticker) => !tickerResults[ticker].eligibleForPeerPackage);
  const blockerReasons = [...new Set(blockedPeerTickers.map((ticker) => tickerResults[ticker].blocker).filter(Boolean))].sort();
  const extractedQuoteSafe = false;
  const useReviewNoteOnly = fetchResult.sourceReadable && eligiblePeerTickers.length > 0;
  const readyFor150O = fetchResult.sourceReadable && eligiblePeerTickers.length > 0;

  const result = {
    phase: "150O_PRECHECK",
    sourceUrl: SOURCE_URL,
    targetIndustryCode: TARGET_INDUSTRY_CODE,
    sourceReadable: fetchResult.sourceReadable,
    httpStatus: fetchResult.httpStatus,
    contentType: fetchResult.contentType,
    routeEvidencePresent,
    searchedTickers: [...SEARCHED_TICKERS],
    hpgFound: tickerResults.HPG.foundInHtml,
    hsgFound: tickerResults.HSG.foundInHtml,
    nkgFound: tickerResults.NKG.foundInHtml,
    tvnFound: tickerResults.TVN.foundInHtml,
    foundByTicker: tickerResults,
    eligiblePeerTickers,
    blockedPeerTickers,
    blockerReasons,
    extractedQuoteSafe,
    useReviewNoteOnly,
    readyFor150O,
    dbWriteAttempted: false,
    providerFetchAttempted: true,
    csvImportAttempted: false,
    industryMetricCreated: false,
    valuationRiskBenchmarkInvented: false,
    fakePeerGroupsCreated: false,
    peerInferenceUsed: false,
    productionApprovedTrueCount: 0,
    blocker: fetchResult.blocker,
  };

  const smokePassed =
    result.phase === "150O_PRECHECK" &&
    result.providerFetchAttempted &&
    !result.dbWriteAttempted &&
    !result.csvImportAttempted &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.fakePeerGroupsCreated &&
    !result.peerInferenceUsed &&
    result.productionApprovedTrueCount === 0 &&
    !result.extractedQuoteSafe;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

export {};
