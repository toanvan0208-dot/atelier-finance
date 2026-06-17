# Data Dictionary Mapping

Date: 2026-06-17

Phase: 26B - Data Documentation Alignment

This document maps canonical data fields to the current Atelier Finance modules. It prepares Phase 26C but does not create a backend schema, adapter, API, or real-data connection.

Core rules:

- Missing data must be represented as `null`, `not_available`, `insufficient_data`, or `not_applicable`.
- Missing data must never be represented as `0`, `"0"`, `false`, or `"none"`.
- Do not divide by `0`.
- If EPS <= 0, P/E must not be interpreted as cheap/expensive in the normal way.
- If equity <= 0, ROE, P/B, and BVPS must not be interpreted normally.
- Banks, securities companies, and insurers must not receive mechanical Current Ratio or Debt-to-Equity interpretation.
- Price Volume Time is market observation, not a trading signal.
- Risk score, checklist state, screening output, and watchlist state are not recommendations.

## 1. Module Keys

| Module | Module key |
| --- | --- |
| Overview | `overview` |
| Macro | `macro` |
| Industry | `industry` |
| Screening | `screening` |
| Business | `business` |
| Financials | `financials` |
| Valuation | `valuation` |
| Risk | `risk` |
| Price Volume Time | `technical` |
| Checklist | `checklist` |
| Watchlist | `watchlist` |
| Simulation | `simulation` |

## 2. Canonical Field Mapping

### 2.1 Canonical Naming Rules

Use these names in Phase 26C contracts and adapter outputs. Aliases from external sources may be mapped in adapters, but should not leak into the normalized contract.

| Concept | Canonical field | Common aliases to map, not expose | Notes |
| --- | --- | --- | --- |
| Revenue | `revenue` | `sales`, `netRevenue`, `doanh_thu_thuan` | For banks/securities/insurance, define the source line explicitly before using this field. |
| Net income | `netIncome` | `netProfit`, `profitAfterTax`, `lnst`, `net_profit` | `netIncome` is the canonical normalized field. Existing docs/code may still use `netProfit`; Phase 26C should provide a compatibility alias only if needed. |
| Parent-company net income | `netIncomeToParent` | `netProfitParent`, `lnst_parent` | Prefer for EPS where available. |
| Operating cash flow | `operatingCashFlow` | `cfo`, `cashFlowFromOperations` | Can be negative; never replace missing with `0`. |
| Total assets | `totalAssets` | `assets`, `tong_tai_san` | Period-end field unless average assets is explicitly provided. |
| Equity | `equity` | `totalEquity`, `bookValue`, `shareholdersEquity` | `equity` is canonical. If equity <= 0, ROE/P/B/BVPS normal interpretation is blocked. |
| EPS | `eps` | `epsBasic`, `basicEPS` | EPS <= 0 blocks normal P/E interpretation. |
| BVPS | `bvps` | `bookValuePerShare` | Invalid for normal P/B interpretation when equity <= 0. |
| Close price | `closePrice` | `lastPrice`, `gia_dong_cua_vnd` | Must have `tradingDate` and record-level `asOf`. |
| Market cap | `marketCap` | `marketCapitalization` | Derive only from valid price and shares. |
| Volume | `volume` | `tradingVolume`, `khoi_luong_giao_dich_co_phieu` | `0` can be a real no-trade value only when source confirms; otherwise missing remains `null`. |
| Trading value | `tradingValue` | `turnover`, `matchedValue` | Preferred liquidity input. |

### 2.2 Field Table

| Canonical field | Description | Type | Unit | Nullable | Missing semantics | Modules | Financial notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ticker` | Listed security ticker. | `string` | none | no | `not_available` blocks stock-specific analysis. | all stock modules | Must be normalized uppercase and mapped to exchange. |
| `companyName` | Company legal/common name. | `string` | none | yes | `null` means show ticker only and lower AI confidence. | overview, business, financials, valuation, risk, checklist, watchlist, simulation | Do not invent from ticker if unavailable. |
| `exchange` | Trading venue. | `string` | none | yes | `null` means exchange-specific rules are unknown. | overview, screening, business, technical, valuation | Needed for trading calendar and market-data interpretation. |
| `industry` | Industry name or code. | `string` | none | yes | `not_available` limits peer comparison and industry caveats. | overview, macro, industry, screening, business, financials, valuation, risk, watchlist | Required before using industry multiples. |
| `companyType` | Company classification. | enum | none | yes | `unknown` means use conservative generic rules. | business, financials, valuation, risk, AI Assistant | Values: `non_financial`, `bank`, `securities`, `insurance`, `real_estate`, `other`, `unknown`. |
| `sourceName` | Human-readable data source. | `string` | none | yes | Missing source creates `SOURCE_MISSING` warning. | all modules | Required for real-data mode. |
| `sourceUrl` | URL or source reference. | `string` | URL | yes | Missing URL may be allowed only for licensed/internal sources with source ID. | all modules | Do not expose private URLs/secrets. |
| `asOf` | Date/time the value is valid as of. | `ISO date` or `datetime` | date | yes | Missing `asOf` lowers confidence and may mark stale. | all modules | Distinct from `collectedAt`. |
| `collectedAt` | Date/time data was collected/imported. | `datetime` | date-time | yes | Missing collection timestamp lowers data quality. | all modules | Not a substitute for financial period. |
| `periodType` | Period kind for data. | enum | none | yes | `unknown` blocks period-specific analysis. | macro, financials, valuation, risk, AI Assistant | Examples: `session`, `day`, `month`, `quarter`, `year`, `ttm`. |
| `fiscalYear` | Fiscal year for statements. | `number` | year | yes | Missing fiscal year blocks financial period comparison. | financials, valuation, risk, screening, watchlist | Required for financial statements. |
| `fiscalQuarter` | Fiscal quarter. | `number` | quarter | yes | `null` is valid for annual data. | financials, valuation, risk | Must be 1-4 when present. |
| `tradingDate` | Date of market price/volume row. | `ISO date` | date | yes | Missing date blocks PVT/session interpretation. | technical, valuation, risk, simulation, watchlist | Must follow trading calendar. |
| `openPrice` | Opening price. | `number` | VND/share | yes | `null` means candle is incomplete. | technical, simulation | Do not set to 0 when missing. |
| `highPrice` | Session high. | `number` | VND/share | yes | `null` means high/low validation unavailable. | technical, simulation | Must be >= `lowPrice` when both exist. |
| `lowPrice` | Session low. | `number` | VND/share | yes | `null` means high/low validation unavailable. | technical, simulation | Must be <= `highPrice` when both exist. |
| `closePrice` | Closing/current reference price. | `number` | VND/share | yes | `null` blocks market valuation ratios. | overview, technical, valuation, risk, simulation, watchlist | Must be positive for valuation ratios. |
| `adjustedClosePrice` | Price adjusted for corporate actions. | `number` | VND/share | yes | `null` means long-history price comparison has lower confidence. | technical, valuation, simulation | Clarify adjusted vs unadjusted. |
| `volume` | Shares traded. | `number` | shares | yes | `null` blocks volume/liquidity metrics. | technical, risk, simulation | `0` may be real only for no-trade sessions, never as missing fallback. |
| `tradingValue` | Value traded. | `number` | VND | yes | `null` lowers liquidity confidence. | technical, risk, screening, simulation | Prefer for liquidity over raw volume. |
| `avgVolume20d` | 20-session average volume. | `number` | shares | yes | `not_available` lowers PVT confidence. | technical, risk | Must state calculation window. |
| `avgTradingValue20d` | 20-session average trading value. | `number` | VND | yes | `not_available` blocks stronger liquidity classification. | technical, risk, screening | Used by current data-quality tests. |
| `marketCap` | Market capitalization. | `number` | VND | yes | `null` blocks some valuation and screening metrics. | overview, screening, valuation, risk | Can be derived only when price and shares are both valid. |
| `sharesOutstanding` | Number of shares. | `number` | shares | yes | `null` blocks derived EPS/BVPS/market cap when not directly supplied. | financials, valuation | Must be period-aligned. |
| `revenue` | Revenue or operating income depending on company type. | `number` | VND | yes | `null` blocks revenue growth and margin calculations. | overview, financials, screening, valuation, risk | For banks, label revenue concept carefully. |
| `grossProfit` | Gross profit. | `number` | VND | yes | `null` blocks gross margin. | financials, screening, risk | Not always applicable to banks. |
| `operatingProfit` | Operating profit. | `number` | VND | yes | `null` blocks operating margin and coverage checks. | financials, risk, valuation | Ensure consistent accounting line. |
| `netIncome` | Net income after tax. | `number` | VND | yes | `null` blocks ROE, ROA, EPS derivation, earnings quality checks. | overview, financials, valuation, risk, screening | Negative can be valid and must be interpreted carefully. |
| `netIncomeToParent` | Profit attributable to parent/common shareholders. | `number` | VND | yes | `null` blocks higher-quality EPS derivation. | financials, valuation | Prefer for EPS where available. |
| `eps` | Earnings per share. | `number` | VND/share | yes | `null` blocks P/E. | overview, financials, valuation, risk, AI Assistant | EPS <= 0 makes P/E `not_applicable` for normal cheap/expensive interpretation. |
| `epsDiluted` | Diluted EPS. | `number` | VND/share | yes | `null` means only basic EPS may be used. | valuation, financials | Use when dilution matters. |
| `totalAssets` | Total assets. | `number` | VND | yes | `null` blocks ROA and balance sheet checks. | financials, risk, overview | Must align with period end. |
| `totalLiabilities` | Total liabilities. | `number` | VND | yes | `null` blocks leverage checks. | financials, risk | Must reconcile with assets/equity if available. |
| `equity` | Total equity/book value. | `number` | VND | yes | `null` blocks ROE, BVPS, P/B. | financials, valuation, risk, overview | Equity <= 0 means ROE/P/B/BVPS cannot be interpreted normally. |
| `bvps` | Book value per share. | `number` | VND/share | yes | `null` blocks direct P/B if not derivable. | valuation, financials | Invalid when equity <= 0. |
| `shortTermDebt` | Short-term debt. | `number` | VND | yes | `null` lowers debt-risk confidence. | financials, risk | Not mechanical for banks/securities/insurance. |
| `longTermDebt` | Long-term debt. | `number` | VND | yes | `null` lowers debt-risk confidence. | financials, risk | Combine with short-term debt only when definitions match. |
| `totalDebt` | Interest-bearing debt. | `number` | VND | yes | `null` may be derived only from valid debt fields. | financials, risk, valuation | Do not equate all liabilities with debt unless documented. |
| `cashAndEquivalents` | Cash and equivalents. | `number` | VND | yes | `null` blocks net debt/cash-to-debt. | financials, risk, valuation | Must not be assumed from current assets. |
| `inventory` | Inventory. | `number` | VND | yes | `null` limits working-capital and earnings-quality analysis. | financials, risk, business | Important for retail/manufacturing/real estate. |
| `accountsReceivable` | Trade receivables. | `number` | VND | yes | `null` limits working-capital and cash conversion analysis. | financials, risk | Required to explain profit-to-cash gaps. |
| `currentAssets` | Current assets. | `number` | VND | yes | `null` blocks Current Ratio. | financials, risk | Current Ratio not mechanical for financial-sector firms. |
| `currentLiabilities` | Current liabilities. | `number` | VND | yes | `null` or <= 0 blocks Current Ratio. | financials, risk | Do not divide by 0. |
| `operatingCashFlow` | Cash flow from operations. | `number` | VND | yes | `null` blocks CFO/Net Profit and earnings quality. | financials, valuation, risk | Negative CFO can be real; do not force positive or 0. |
| `investingCashFlow` | Cash flow from investing. | `number` | VND | yes | `null` limits cash-flow bridge. | financials, risk | Negative can be normal. |
| `financingCashFlow` | Cash flow from financing. | `number` | VND | yes | `null` limits capital-structure analysis. | financials, risk | Negative can be normal. |
| `capitalExpenditure` | Capital expenditure. | `number` | VND | yes | `null` blocks free-cash-flow calculation. | financials, valuation, risk | Sign convention must be documented. |
| `freeCashFlow` | Free cash flow. | `number` | VND | yes | `null` blocks DCF/FCF metrics. | valuation, financials, risk | Can be negative; must not be overwritten. |
| `revenueGrowth` | Revenue growth rate. | `number` | ratio | yes | `null` when prior revenue missing/<=0 or period mismatch. | overview, financials, screening, risk | Do not divide by 0 or interpret one period alone. |
| `netIncomeGrowth` | Net income growth rate. | `number` | ratio | yes | `null` when prior value missing or denominator invalid. | financials, screening, risk, valuation | Negative prior profit needs caveat. |
| `grossMargin` | Gross profit / revenue. | `number` | ratio | yes | `null` when revenue missing/<=0 or gross profit unavailable. | financials, screening, risk | Not universal across sectors. |
| `netMargin` | Net profit / revenue. | `number` | ratio | yes | `null` when revenue missing/<=0. | financials, screening, risk | One-metric conclusions forbidden. |
| `roe` | Net income / equity. | `number` | ratio | yes | `not_applicable` if equity <= 0. | overview, financials, valuation, risk | High ROE with thin/negative equity can be misleading. |
| `roa` | Net income / assets. | `number` | ratio | yes | `null` when assets missing/<=0. | financials, risk | Prefer average assets if available. |
| `debtToEquity` | Debt / equity. | `number` | ratio | yes | `not_applicable` if equity <= 0 or company type is financial sector. | financials, risk | Do not apply mechanically to banks/securities/insurance. |
| `currentRatio` | Current assets / current liabilities. | `number` | ratio | yes | `not_applicable` when denominator <=0 or financial-sector caveat applies. | financials, risk | Not a bank-quality metric. |
| `cfoToNetIncome` | Operating cash flow / net income. | `number` | ratio | yes | `null` when CFO or net income missing/denominator invalid. | financials, risk, valuation | Helps earnings-quality reading; not a standalone conclusion. |
| `peRatio` | Price / EPS. | `number` | x | yes | `not_applicable` when EPS <= 0; `null` when price/EPS missing. | overview, valuation, risk, screening | Low P/E is not automatically cheap. |
| `pbRatio` | Price / BVPS. | `number` | x | yes | `not_applicable` when BVPS/equity <= 0. | overview, valuation, risk, screening | Must read with ROE and asset quality. |
| `psRatio` | Market cap / revenue. | `number` | x | yes | `null` when market cap or revenue missing/invalid. | valuation, screening | Can mislead if margins are weak. |
| `evEbitda` | Enterprise value / EBITDA. | `number` | x | yes | `null` when EV or EBITDA missing/invalid. | valuation | Not suitable for all sectors. |
| `fairValueLow` | Lower estimate of valuation range. | `number` | VND/share | yes | `null` unless method is ready and confidence is not unknown. | valuation, overview, watchlist | Must not be generated from insufficient data. |
| `fairValueBase` | Base estimate of valuation range. | `number` | VND/share | yes | `null` unless method is ready and confidence is not unknown. | valuation, overview, watchlist | Not a target price. |
| `fairValueHigh` | Upper estimate of valuation range. | `number` | VND/share | yes | `null` unless method is ready and confidence is not unknown. | valuation, overview, watchlist | Scenario, not prediction. |
| `valuationConfidence` | Confidence in valuation output. | enum | none | yes | `unknown` when inputs/methods are insufficient. | valuation, overview, risk, watchlist | Must drive warnings. |
| `valuationStatus` | Summary valuation state. | enum | none | yes | `not_ready` when required inputs missing. | overview, valuation, risk, watchlist | Must not become a recommendation. |
| `valuationAssumptions` | User/system assumptions for valuation. | object | mixed | yes | `null` means no assumption-based method should run. | valuation, AI Assistant | User assumptions must be labeled `user_input`. |
| `macroIndicatorCode` | Macro indicator key. | `string` | none | yes | `not_available` blocks macro row. | macro, industry, risk | Examples: GDP, CPI, interest rate, FX, PMI. |
| `macroValue` | Macro indicator value. | `number` | varies | yes | `null` means explain missing. | macro, industry, risk | Must include unit and period. |
| `macroPeriod` | Macro reporting period. | `string` | date/period | yes | Missing period blocks time interpretation. | macro | Duplicate period must be flagged. |
| `industryMetricValue` | Numeric industry/peer metric. | `number` | varies | yes | `null` lowers comparison confidence. | industry, screening, valuation, risk | Must include peer set and source. |
| `businessDescription` | Business model description. | `string` | none | yes | `null` means AI cannot make business claims. | business, overview, risk, checklist | Prefer official sources or curated notes. |
| `revenueSegments` | Revenue/business segments. | array/object | VND or % | yes | `not_available` limits business analysis. | business, financials, risk | Segment period required. |
| `riskScore` | Overall or component risk score. | `number` | 0-100 | yes | `null` when required inputs missing. | risk, overview, watchlist | Risk score is not a final safe/bad conclusion. |
| `riskLevel` | Risk level. | enum | none | yes | `unknown` when score/data insufficient. | risk, overview, watchlist | Must include drivers and missing fields. |
| `warningCodes` | Data/logic warning codes. | `string[]` | none | no | Empty array means no known warning, not no risk. | all modules | Examples: `MISSING_DATA`, `STALE_DATA`, `EPS_NEGATIVE`. |
| `missingFields` | Fields missing for current module. | `string[]` | none | no | Empty array allowed only after checks run. | all modules | Must be surfaced to UI/AI when relevant. |
| `isMockData` | Whether data is sample/mock. | `boolean` | none | no | `true` forces sample-data disclosure. | all modules | Current main repo uses this concept in AI/RAG/data quality. |
| `dataQualityStatus` | Overall data quality state. | enum | none | no | `missing`, `partial`, `stale`, `mock`, `usable_with_caution`, `good`. | all modules | Drives DataQualityBanner and AI warnings. |
| `checklistEvidenceStatus` | Evidence status for checklist item. | enum | none | yes | `insufficient_data` means item cannot pass as evidence-backed. | checklist, watchlist, risk | Checklist is process discipline, not recommendation. |
| `watchlistNote` | User note for tracked idea. | `string` | none | yes | User-provided text must be labeled as user input. | watchlist, checklist, simulation | Not a data source unless marked. |
| `simulationPrice` | Price used for simulation event. | `number` | VND/share | yes | `null` blocks PnL calculation. | simulation | Must be clearly historical/sample/current mode. |
| `simulationAction` | Simulated action selected by user. | enum | none | yes | `null` means observe/no action. | simulation | App may record user action; system must not recommend it. |

## 3. Module Mapping Summary

| Module | Primary canonical fields |
| --- | --- |
| Overview | `ticker`, `companyName`, `industry`, `companyType`, `closePrice`, `revenue`, `netIncome`, `equity`, `valuationStatus`, `riskLevel`, `dataQualityStatus`, `sourceName`, `asOf`, `missingFields` |
| Macro | `macroIndicatorCode`, `macroValue`, `macroPeriod`, `periodType`, `sourceName`, `asOf`, `dataQualityStatus` |
| Industry | `industry`, `industryMetricValue`, `macroIndicatorCode`, `peerTickers`, `sourceName`, `asOf`, `missingFields` |
| Screening | `ticker`, `companyName`, `industry`, `companyType`, `marketCap`, `tradingValue`, `revenueGrowth`, `roe`, `riskLevel`, `dataQualityStatus` |
| Business | `companyName`, `companyType`, `industry`, `businessDescription`, `revenueSegments`, `sourceName`, `asOf` |
| Financials | `revenue`, `grossProfit`, `operatingProfit`, `netIncome`, `totalAssets`, `totalLiabilities`, `equity`, `operatingCashFlow`, `inventory`, `accountsReceivable`, `dataQualityStatus` |
| Valuation | `closePrice`, `eps`, `bvps`, `peRatio`, `pbRatio`, `psRatio`, `freeCashFlow`, `valuationConfidence`, `valuationStatus`, `fairValueLow`, `fairValueBase`, `fairValueHigh`, `missingFields` |
| Risk | `riskScore`, `riskLevel`, `debtToEquity`, `cfoToNetIncome`, `peRatio`, `pbRatio`, `liquidityRiskScore`, `dataQualityStatus`, `warningCodes` |
| Price Volume Time | `tradingDate`, `openPrice`, `highPrice`, `lowPrice`, `closePrice`, `adjustedClosePrice`, `volume`, `tradingValue`, `avgTradingValue20d` |
| Checklist | `ticker`, `companyName`, `checklistEvidenceStatus`, `missingFields`, `warningCodes`, `dataQualityStatus`, `watchlistNote` |
| Watchlist | `ticker`, `companyName`, `watchlistNote`, `valuationStatus`, `riskLevel`, `lastReviewedAt`, `dataQualityStatus`, `missingFields` |
| Simulation | `ticker`, `companyName`, `simulationPrice`, `simulationAction`, `tradingDate`, `closePrice`, `volume`, `valuationStatus`, `riskLevel`, `dataQualityStatus` |

## 4. Mapping From External Audit Concepts

| External concept from Phase 26A | Canonical field |
| --- | --- |
| `ma_co_phieu` | `ticker` |
| `ten_doanh_nghiep` | `companyName` |
| `ma_nganh`, `ten_nganh` | `industry`, `industryCode` |
| `san_giao_dich` | `exchange` |
| `ngay` | `tradingDate` |
| `gia_mo_cua_vnd` | `openPrice` |
| `gia_cao_nhat_vnd` | `highPrice` |
| `gia_thap_nhat_vnd` | `lowPrice` |
| `gia_dong_cua_vnd` | `closePrice` |
| `gia_dong_cua_dieu_chinh_vnd` | `adjustedClosePrice` |
| `khoi_luong_giao_dich_co_phieu` | `volume` |
| `chi_so` | `macroIndicatorCode` |
| `ky` | `periodType` |
| `thoi_gian` | `macroPeriod` |
| `gia_tri` | `macroValue` |
| `don_vi_tinh` | `unit` |
| `nguon_du_lieu` | `sourceName` or `sourceUrl` |
| `ngay_thu_thap` | `collectedAt` |

This mapping is conceptual only. No external data is imported in Phase 26B.

## 5. Module Readiness And Required Fields

Field-level nullable status is not enough. Each module also needs a readiness gate. If a required field is missing, the module must enter `insufficient_data` for the affected calculation/view instead of filling fake values.

| Module | Required to render real-data module | Optional/recommended | If required fields are missing |
| --- | --- | --- | --- |
| Overview | `ticker`, `companyName`, `companyType`, `dataQualityStatus`, at least one sourced snapshot group | `closePrice`, `revenue`, `netIncome`, `riskLevel`, `valuationStatus` | Render shell with `insufficient_data`; do not show real-data summary claims. |
| Macro | `macroIndicatorCode`, `macroValue`, `macroPeriod`, `periodType`, record-level source/asOf | `releaseDate`, prior period, source confidence | Mark indicator `insufficient_data`; do not infer missing macro context. |
| Industry | `industry`, taxonomy/version source, record-level `asOf` | `peerTickers`, industry metrics, industry multiples | Industry comparison is `insufficient_data`; business can still show company-level facts. |
| Screening | `ticker`, `companyType`, criteria definitions, `dataQualityStatus` | `marketCap`, `tradingValue`, growth, profitability, risk fields | Exclude missing criteria from score or mark result `insufficient_data`; do not rank as if complete. |
| Business | `companyName`, `companyType`, `businessDescription`, source/asOf | `revenueSegments`, products/customers/geography | Business claims are `insufficient_data`; AI must not invent model/segments. |
| Financials | `ticker`, `fiscalYear`, `periodType`, source/asOf, at least one statement block | `revenue`, `netIncome`, `equity`, `operatingCashFlow`, working-capital fields | Missing statement block becomes `insufficient_data`; affected metrics return `null`. |
| Valuation | `closePrice`, `asOf`, `companyType`, valuation method inputs, readiness/confidence | `industryMultiples`, `historicalMultiples`, user assumptions | Method status `not_ready`; fair value fields remain `null`. |
| Risk | `companyType`, data-quality summary, source/asOf for input groups | financial, valuation, liquidity, transparency components | Component score `null`; overall risk `unknown` or `insufficient_data`. |
| Price Volume Time | `ticker`, `tradingDate`, `closePrice`, `volume`, source/asOf | `openPrice`, `highPrice`, `lowPrice`, `tradingValue`, averages | PVT view is `insufficient_data`; no liquidity/price observation claim. |
| Checklist | checklist items, evidence status, `missingFields` | linked module summaries | Item cannot pass evidence-backed state; mark `insufficient_data`. |
| Watchlist | user item ID, `ticker` or user-entered idea, user note source | latest linked data status | Show user note only; linked data summary `insufficient_data`. |
| Simulation | simulation mode, user action/input, price source for PnL calculations | volume/liquidity/risk context | Do not compute PnL or price-based outcomes without valid price record. |

## 6. Record-Level Metadata Requirements By Data Type

| Data type | Required record-level metadata | Why it matters |
| --- | --- | --- |
| Price/OHLCV | `recordId`, `sourceId`, `sourceName`, `tradingDate`, `asOf`, `collectedAt`, `currency`, `unit`, `isAdjusted` | PVT, valuation, and simulation use different dates and adjusted/unadjusted meanings. |
| Financial statement | `recordId`, `sourceId`, `sourceName`, `fiscalYear`, `fiscalQuarter`, `periodType`, `reportDate`, `publishedDate`, `asOf`, `collectedAt`, `currency`, `unit` | Financials, valuation, and risk must not mix periods silently. |
| Macro | `recordId`, `sourceId`, `sourceName`, `indicatorCode`, `country`, `macroPeriod`, `periodType`, `releaseDate`, `asOf`, `collectedAt`, `unit` | Macro data may be monthly, quarterly, yearly, or daily. |
| Industry taxonomy | `recordId`, `sourceId`, `sourceName`, `industryCode`, `classificationVersion`, `asOf`, `reviewedAt` | Industry mapping can change and affects sector caveats. |
| Industry metric | `recordId`, `sourceId`, `sourceName`, `metricCode`, `peerSetId`, `period`, `periodType`, `asOf`, `unit` | Peer/multiple comparisons need a defined universe and period. |
| Derived metric | `recordId`, `inputRecordIds`, `calculationVersion`, `asOf`, `period`, `periodType`, `dataQualityStatus`, `missingFields`, `warningCodes` | Derived metrics inherit input weaknesses and must be reproducible. |

## 7. Company-Type Interpretation Matrix

| Company type | Allowed normal metrics | Metrics requiring caveat or block | Notes |
| --- | --- | --- | --- |
| `non_financial` | Revenue growth, margins, ROE, ROA, debt metrics, Current Ratio, CFO/Net Income, P/E, P/B, P/S when inputs valid | None by type, but denominator and data-quality rules still apply | Use sector-specific caveats for retail, steel, real estate, technology, etc. |
| `real_estate` | Revenue, net income, equity, debt, inventory/project data, P/B with caveats | CFO interpretation may be cycle/project dependent; Current Ratio can mislead | Inventory and customer advances need special reading. |
| `bank` | P/B, ROE, asset quality, NIM, NPL, LLR, CAR if available | Current Ratio, Debt-to-Equity, generic CFO interpretation, EV/EBITDA | Do not read liabilities/deposits like manufacturing debt. |
| `securities` | P/B, ROE, brokerage/market-cycle context, capital adequacy if available | Current Ratio, generic Debt-to-Equity, generic CFO interpretation | Earnings are sensitive to market cycle and proprietary investment gains/losses. |
| `insurance` | P/B, ROE, investment income, reserve quality if available | Current Ratio, generic Debt-to-Equity, generic CFO interpretation | Need insurance reserves and investment portfolio context. |
| `unknown` | Basic identity and source/data-quality display only | All ratio conclusions requiring company-type context | Ask for/derive company type before normal interpretation. |
