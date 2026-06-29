# Macro Data Source Assessment

This document evaluates potential sources for real macroeconomic data integration. The goal is to identify a verifiable, machine-readable source for key indicators like CPI, GDP Growth, and Interest Rates without relying on fake or static data.

## 1. World Bank API (WDI)
- **sourceName**: World Bank Open Data
- **sourceType**: Global Official API
- **indicatorSupported**: GDP Growth (annual %), Inflation/CPI (annual %)
- **accessMethod**: Public REST API (e.g., `http://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.KD.ZG?format=json`)
- **license/usage**: Open Data, free for commercial and non-commercial use with attribution.
- **updateFrequency**: Annually (sometimes quarterly depending on indicator, but often lagged).
- **machineReadable**: true
- **productionSuitability**: candidate
- **knownGaps**: 
  - The data often has a significant lag (e.g., 2024 data might only be finalized in mid-2025). 
  - Not suitable for high-frequency or real-time trading analysis, but acceptable for beginner-friendly annual educational context.
  - Recommended as the **primary candidate for Phase 147A ingestion preview**.

## 2. State Bank of Vietnam (SBV)
- **sourceName**: State Bank of Vietnam
- **sourceType**: National Official Central Bank
- **indicatorSupported**: Policy Interest Rates, Exchange Rates, Credit Growth
- **accessMethod**: Web portal (HTML).
- **license/usage**: Official national data; usage terms are generally open for public consumption but lacking formal developer SLA.
- **updateFrequency**: Daily (for exchange rates) or sporadic (for policy decisions).
- **machineReadable**: unknown / false (No official documented REST API available; typically requires HTML scraping or undocumented endpoint reverse-engineering).
- **productionSuitability**: needs_review
- **knownGaps**: 
  - Lack of a documented, stable API makes automated ingestion brittle.
  - Requires manual review and custom scrapers. 
  - Not ready for automated ingestion in Phase 147A.

## 3. General Statistics Office of Vietnam (GSO)
- **sourceName**: General Statistics Office of Vietnam
- **sourceType**: National Official Statistics Bureau
- **indicatorSupported**: Monthly CPI, Quarterly GDP, PMI, Retail Sales
- **accessMethod**: Web portal / PX-Web interface.
- **license/usage**: Public national data.
- **updateFrequency**: Monthly / Quarterly (very timely for the domestic market).
- **machineReadable**: unknown (PX-Web has an API but requires manual exploration and token/session management in some configurations).
- **productionSuitability**: needs_review
- **knownGaps**: 
  - Documentation is sparse.
  - Unclear if the API is stable or rate-limited for automated servers.
  - Not ready for automated ingestion in Phase 147A.

## 4. International Monetary Fund (IMF)
- **sourceName**: IMF Data
- **sourceType**: Global Official API
- **indicatorSupported**: FX Rates, Balance of Payments, Reserves
- **accessMethod**: JSON REST API
- **license/usage**: Open data.
- **updateFrequency**: Monthly/Quarterly.
- **machineReadable**: true
- **productionSuitability**: needs_review
- **knownGaps**: 
  - API query structure is highly complex (SDMX format).
  - Overkill for simple CPI/GDP metrics if World Bank is easier.

## Conclusion & Next Steps
**World Bank API** was verified in Phase 147A/C as a viable candidate for `db_backed` integration of CPI_YOY and GDP_GROWTH.

Phase 148B established the **Frontend-Locked Policy**: Only indicators currently represented in the Macro UI (`inCurrentFrontend=true`) are eligible for provider expansion, automated ingestion, and source assessment.
Indicators not present in the frontend (e.g. `VNINDEX_CLOSE`, `VN30_CLOSE`) have been blocked from fetch attempts to prevent hallucination and wasted ingestion efforts.

Phase 148C audited and classified the source verification status of all 14 `inCurrentFrontend=true` indicators:
- **Machine Readable API (ready for parser design)**: CPI_YOY, GDP_GROWTH.
- **Machine Readable API (needs implementation/key/market source)**: FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE, MARKET_TRADING_VALUE, FOREIGN_NET_FLOW.
- **HTML/PDF Table (Needs Manual Review / Scraper)**: EXPORT_GROWTH, PUBLIC_INVESTMENT, INTERBANK_RATE_OVERNIGHT, CREDIT_GROWTH, USD_VND.
- **Blocked/Not Assessed**: PMI_MANUFACTURING, GLOBAL_FLOW.

Phase 148D formulated a **Parser Strategy** for the manual-review/unverified indicators:
- Prioritized domestic indicators: `USD_VND` and `INTERBANK_RATE_OVERNIGHT` are identified as `html_parser_feasible` (SBV HTML tables).
- Prioritized market indicators: `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW` are `api_ready` (Vnstock/market provider).
- These 4 are designated as `candidateFor148E` to undergo parser prototype development.
- `CREDIT_GROWTH` remains `manual_review_only` due to complex unstructured PDFs from SBV.

Phase 148E executed a real-source parser dry-run for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`. Because the specific source URLs are not yet formalized in the parser strategy, the system correctly failed-closed (`previewBlocked=true`, reason `MISSING_SOURCE_URL`) without inventing or hardcoding data. This validates the strict provenance guardrails.

Phase 148F performed real-source URL verification for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`. The specific URLs from the State Bank of Vietnam were verified as reachable. No numeric values were extracted or written to the DB. `USD_VND` and `INTERBANK_RATE_OVERNIGHT` are now marked as `readyForParserDryRunWithVerifiedUrls=true`.

Phase 148G performed a parser dry-run using the verified SBV URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`. The naive parser successfully failed-closed because of the unstable HTML structure of the SBV site. No fake data was generated, and no data was written to the DB. Both indicators remain unbacked by the DB until the parser is hardened.

Phase 148H inspected the HTML structure of the SBV URLs. The inspection confirmed the structure is highly unstable and heavily relies on JS-rendering (Oracle WebCenter/ADF/JSF patterns). `USD_VND` was switched to an alternate, machine-readable Vietcombank Exchange Rate XML API. `INTERBANK_RATE_OVERNIGHT` lacks a free stable API and is blocked for manual review. No numeric data was extracted or written to the DB.

Phase 148I audited the semantic mapping of the frontend card "Lãi suất trong nước". The current mapping is `INTERBANK_RATE_OVERNIGHT`, which is too specific for the broad frontend label. A semantic mapping registry was created, identifying `POLICY_RATE` as a stronger semantic fit, but a manual product review is required before changing the mapping. The system safely maintains the `INTERBANK_RATE_OVERNIGHT` mapping via the registry, avoiding any premature data observation creation.

Phase 148J finalized the product decision to select `POLICY_RATE` as the representative indicator for the frontend card "Lãi suất trong nước". The runtime mapping was updated and `INTERBANK_RATE_OVERNIGHT` was retired from the current frontend scope. `POLICY_RATE` remains not DB-backed, with no data extracted or written, awaiting source assessment.

Phase 148K verified the SBV policy rate URL (`https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lsdh`). Although the URL is reachable (HTTP 200), the content relies heavily on Liferay and Oracle ADF JS rendering, making it highly unstable for automated scraping. `POLICY_RATE` is now marked as `blocked` for automated parser dry-run and requires a manual extraction workflow, mirroring the constraint found in `INTERBANK_RATE_OVERNIGHT`. No numeric values were extracted or written to the DB.

Phase 148L formalized the manual review workflow for `POLICY_RATE`. Since no data could be extracted automatically, the indicator stays in a hardened `unavailable` state. UI copy explicitly states "Chưa có dữ liệu lãi suất điều hành đã kiểm duyệt" and the Assistant is explicitly instructed not to invent macro-to-industry impact for `POLICY_RATE` and not to offer investment advice.

Phase 148M assessed source readiness for `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW`. Both metrics are present in the frontend. However, they lack a formal, documented public URL endpoint, with implementations often relying on undocumented SDKs (e.g., vnstock). Therefore, both indicators are marked as `source_assessment_needed` with `missing_source_url`. They are currently blocked from automated parser dry-run. No data was extracted or written.

Phase 148N formalized the undocumented provider boundary for `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW`. Similar to `POLICY_RATE`, they are securely placed in an unavailable state with strict Assistant guardrails. The system dictates they must not be converted into trading signals (buy/sell/hold/fair value) and explicit copy ensures the user is informed of the missing official data: "Chưa có dữ liệu giao dịch khối ngoại đã kiểm duyệt" and "Chưa có dữ liệu thanh khoản đã kiểm duyệt."

- **Phase 148O/P**: API candidates require authentication (API key) for `FED_FUNDS_RATE`, `DXY` (DTWEXBGS), and `BRENT_OIL_PRICE`. DXY semantic proxy risk (DTWEXBGS != ICE DXY) has been resolved by renaming the UI label to "Sức mạnh USD" and keeping it manually gated. Automating these indicators is blocked until API keys are provided and/or semantic product decisions are finalized. However, FRED API requires an authentication key (`auth_required`), leaving the system unable to automatically fetch data in the current environment. Additionally, the candidate for DXY (`DTWEXBGS`) was identified as a semantic proxy (broad dollar index rather than ICE DXY), requiring manual review. As a result, all three indicators remain in `source_assessment_needed` and are explicitly blocked from automated parser dry-run. The Assistant guardrail was updated to prevent fabricating global macro data and signals.

Until rigorous integrations are completed for the remaining frontend indicators, UI and Assistant read-paths explicitly reject fabrication of data, treating them gracefully as "Dự kiến hỗ trợ" hoặc "Chưa có dữ liệu hệ thống" (or "Cần đánh giá nguồn"). All indicators also have a stale-data policy applied to ensure out-of-date metrics are clearly flagged.
