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

Until rigorous integrations are completed for the remaining frontend indicators, UI and Assistant read-paths explicitly reject fabrication of data, treating them gracefully as "Dự kiến hỗ trợ" or "Chưa có dữ liệu hệ thống". All indicators also have a stale-data policy applied to ensure out-of-date metrics are clearly flagged.
