# Data Source Registry

Date: 2026-06-17

Phase: 26B - Data Documentation Alignment

This document defines the data-source groups Atelier Finance needs before Phase 26C creates the Real Data Source Contract. It is a planning and governance document only. It does not claim that the main repo is already connected to live or licensed real data.

Current baseline:

- The main repo is the source of truth.
- The product currently uses sample/static/module data in many places.
- DataQualityBanner, AI/RAG guardrails, financial-logic rules, and local persistence must remain protected.
- Missing data must remain `null`, `not_available`, `insufficient_data`, or `not_applicable`; it must not be replaced by `0`.
- Any future source must be checked for license, Terms of Service, caching/redistribution rights, and public/product use.

## 1. Source Status Values

| Status | Meaning |
| --- | --- |
| `sample` | Local sample/demo data exists in the main repo and must be labeled as sample. |
| `static` | Static curated content exists, usually for education, product copy, or prototype flows. |
| `not_connected` | The main repo has no real source connection yet. |
| `planned` | Needed for productization, but implementation belongs to later phases. |

## 2. Data Source Groups

| Data group | Main modules | Key fields | Source requirement | asOf / period requirement | Required level | License/ToS risk | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Market price / OHLCV | Overview, Price Volume Time, Valuation, Risk, Watchlist, Simulation, Screening | `ticker`, `tradingDate`, `openPrice`, `highPrice`, `lowPrice`, `closePrice`, `adjustedClosePrice`, `volume`, `tradingValue`, `marketCap` | Prefer official exchange, licensed market-data vendor, or explicitly allowed provider. Source must identify original owner and provider. | Daily/session date required. `asOf` must be the latest available trading date, not "realtime" unless realtime rights exist. | `required` for PVT, market valuation ratios, liquidity risk, simulation marks | High. Market data often has exchange ownership, vendor contracts, cache limits, and redistribution restrictions. | `sample/static/not_connected` |
| Financial statements | Overview, Financials, Valuation, Risk, Business, Screening, Watchlist, Checklist | `ticker`, `fiscalYear`, `fiscalQuarter`, `periodType`, `revenue`, `grossProfit`, `operatingProfit`, `netIncome`, `netIncomeToParent`, `eps`, `totalAssets`, `totalLiabilities`, `equity`, `operatingCashFlow`, `investingCashFlow`, `financingCashFlow`, `inventory`, `accountsReceivable`, `totalDebt` | Prefer official company disclosures, exchange filings, licensed financial-data vendors, or source files with verified usage rights. | Fiscal period and report date required. Published date and collected date recommended. TTM must state construction method. | `required` for Financials, Valuation readiness, financial risk | Medium to high. Raw filings may be public, but normalized databases and redistributing downloaded files may be restricted. | `sample/static/not_connected` |
| Valuation inputs | Valuation, Overview, Risk, Watchlist, AI Assistant | `closePrice`, `eps`, `bvps`, `sharesOutstanding`, `equity`, `netIncome`, `freeCashFlow`, `discountRate`, `terminalGrowthRate`, `peerMultiples`, `historicalMultiples`, `industryMultiples`, `assumptions` | Must be derived from verified financial/market data or explicitly labeled user assumptions. No fake fair value or target price. | Valuation date and input periods required. Assumptions need timestamp and owner/source. | `required` for any real valuation output; otherwise blocked as `not_ready` | High. Peer/historical multiples and target/fair value outputs can be misleading without source rights and readiness rules. | `sample/static/planned` |
| Macro data | Macro, Industry, Risk, Screening, Business, AI Assistant | `indicatorCode`, `indicatorName`, `country`, `period`, `periodType`, `value`, `unit`, `source`, `asOf` | Prefer official statistics/central bank/public institutions or licensed macro provider. | Monthly, quarterly, yearly, or daily period must be explicit. `asOf` and release date recommended. | `recommended` for market/industry context; not always required for single-company analysis | Medium. Official data may be public but terms and attribution still need review; third-party reposted data can add restrictions. | `static/not_connected/planned` |
| Industry data | Industry, Screening, Business, Valuation, Risk, Watchlist | `industryCode`, `industryName`, `sector`, `peerTickers`, `industryMetrics`, `industryCycle`, `industryRisks`, `industryMultiples` | Prefer official classification, licensed provider, exchange classification, or clearly curated internal taxonomy. | Classification version and last reviewed date required. Numeric industry metrics need period/asOf. | `recommended`; `required` for industry comparisons and peer multiples | Medium. Vendor classifications and aggregate industry metrics may be licensed. Internal taxonomy is lower risk but must be labeled. | `static/planned` |
| Company profile / business data | Business, Overview, Screening, Risk, Watchlist, Checklist, AI Assistant | `ticker`, `companyName`, `exchange`, `companyType`, `industry`, `businessDescription`, `revenueSegments`, `products`, `customers`, `geography`, `management`, `website` | Prefer official company website, annual report, exchange filing, or curated internal notes with source references. | Profile `asOf` and source date required. Segment data must include fiscal period. | `required` for Business module and financial-sector caveats | Medium. Public company descriptions are lower risk, but annual-report extracts and vendor summaries need attribution/usage review. | `static/sample/planned` |
| Risk / transparency data | Risk, Financials, Valuation, Checklist, Watchlist, AI Assistant | `financialRiskScore`, `debtRiskScore`, `earningsQualityRiskScore`, `valuationRiskScore`, `liquidityRiskScore`, `dataQualityRiskScore`, `disclosureRisk`, `warningNotes`, `missingFields` | Must be deterministic outputs from verified inputs or explicitly documented qualitative checks. Source inputs must be traceable. | Assessment date and input period required. Stale risk status must be flagged. | `required` for Risk module; `recommended` for overview/watchlist | Medium. Derived scores are internal, but input data and qualitative allegations need source discipline. | `sample/static/planned` |

## 3. Module-Level Source Needs

| Module | Minimum source needs before real-data mode |
| --- | --- |
| Overview | Company identity, latest price if shown, latest financial snapshot, data quality summary, source and `asOf`. |
| Macro | Macro source registry, period and release date for each indicator, stale rules. |
| Industry | Industry taxonomy version, representative peers, industry metrics with period/source if numeric. |
| Screening | Candidate criteria sources, company/industry/financial/price fields with explicit missing fields. |
| Business | Company profile and business model sources; no unsourced claims about products, customers, governance, or strategy. |
| Financials | Statement source, fiscal period, unit normalization, missing fields, company type. |
| Valuation | Price, EPS/BVPS/cash-flow inputs, readiness, assumptions, confidence, blocked methods. |
| Risk | Risk input sources, missing fields, stale markers, and no "safe/bad stock" conclusion. |
| Price Volume Time | OHLCV source, trading date, adjusted/unadjusted distinction, liquidity source. |
| Checklist | Evidence state, missing evidence, user-provided assumptions, module source status. |
| Watchlist | Stored user notes plus latest source status for linked stock data. |
| Simulation | Historical/session price source, portfolio inputs, assumptions, and clear sample/real mode distinction. |

## 4. Record-Level Source And Time Metadata

Phase 26C must treat source and time metadata as record-level data, not only dataset-level notes. Different records in the same API response may come from different periods and sources.

| Record type | Required record-level metadata | Frequency / period rule | Stale rule to define in Phase 26C |
| --- | --- | --- | --- |
| Market price row | `sourceId`, `sourceName`, `tradingDate`, `asOf`, `collectedAt`, `isAdjusted`, `currency`, `unit` | Usually daily/session. Intraday/realtime cannot be claimed without explicit rights. | Based on latest trading day and market calendar. |
| Financial statement row | `sourceId`, `sourceName`, `fiscalYear`, `fiscalQuarter`, `periodType`, `reportDate`, `publishedDate`, `asOf`, `collectedAt`, `currency`, `unit` | Quarterly, annual, or TTM. TTM must list source periods. | Based on reporting calendar and latest available filing. |
| Macro indicator row | `sourceId`, `sourceName`, `indicatorCode`, `country`, `period`, `periodType`, `releaseDate`, `asOf`, `collectedAt`, `unit` | Daily, monthly, quarterly, or yearly depending on indicator. | Based on expected release cadence per indicator. |
| Industry classification row | `sourceId`, `sourceName`, `classificationVersion`, `industryCode`, `asOf`, `reviewedAt` | Manual/versioned or provider-defined. | Based on taxonomy review date. |
| Industry metric row | `sourceId`, `sourceName`, `metricCode`, `peerSetId`, `period`, `periodType`, `asOf`, `collectedAt`, `unit` | Usually quarter, year, or trailing period. | Based on metric source cadence. |
| Company profile row | `sourceId`, `sourceName`, `profileVersion`, `asOf`, `reviewedAt` | Manual/versioned, updated after filings or company changes. | Based on review date and major event flags. |
| Derived metric row | `inputRecordIds`, `calculationVersion`, `asOf`, `period`, `periodType`, `dataQualityStatus`, `missingFields`, `warningCodes` | Must inherit the strictest input period/source caveat. | Stale if any required input is stale. |

Recommended wrapper for future normalized records:

```ts
type DataRecordMeta = {
  recordId: string;
  sourceId: string;
  sourceName: string;
  sourceUrl?: string | null;
  sourceType: "official" | "exchange" | "licensed_vendor" | "company_disclosure" | "curated_internal" | "user_input" | "unknown";
  asOf: string;
  collectedAt?: string | null;
  period?: string | null;
  periodType?: "session" | "day" | "month" | "quarter" | "year" | "ttm" | "manual" | "unknown";
  fiscalYear?: number | null;
  fiscalQuarter?: number | null;
  reportDate?: string | null;
  publishedDate?: string | null;
  releaseDate?: string | null;
  currency?: "VND" | "USD" | string | null;
  unit?: string | null;
  dataQualityStatus: "good" | "usable_with_caution" | "partial" | "missing" | "stale" | "mock";
  isMockData: boolean;
  missingFields: string[];
  warningCodes: string[];
};
```

## 5. Source Metadata Required In Phase 26C

Every real-data source candidate should be represented with:

```ts
type SourceRegistryEntry = {
  sourceId: string;
  sourceName: string;
  sourceType: "official" | "exchange" | "licensed_vendor" | "company_disclosure" | "curated_internal" | "user_input" | "unknown";
  dataGroups: string[];
  sourceUrl: string | null;
  allowedUse: "unknown" | "internal_demo" | "academic" | "public_product" | "commercial";
  redistributionAllowed: boolean | "unknown";
  cachingAllowed: boolean | "unknown";
  updateFrequency: "session" | "daily" | "monthly" | "quarterly" | "yearly" | "manual" | "unknown";
  licenseStatus: "not_checked" | "needs_review" | "approved" | "rejected";
  tosStatus: "not_checked" | "needs_review" | "approved" | "rejected";
  riskLevel: "low" | "medium" | "high" | "blocked";
  notes: string;
};
```

## 6. Do Not Claim Real Data Until

- Source name and URL are recorded.
- Legal/ToS status is reviewed.
- Record-level `asOf`, period, collection time, and unit are present.
- Missing fields are listed.
- Stale data is flagged.
- Sample/mock data is not mixed with real data without labels.
- API/UI responses expose source and data quality.
- Tests cover missing data, invalid denominators, EPS <= 0, equity <= 0, duplicate periods, and stale data.
