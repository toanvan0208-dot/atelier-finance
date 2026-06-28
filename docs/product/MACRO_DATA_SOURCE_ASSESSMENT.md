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
**World Bank API** is the most viable, machine-readable source for an immediate, fail-closed ingestion preview (Phase 147A). It provides clear JSON responses for Vietnam's GDP and CPI without requiring authentication or scraping.

While SBV and GSO are more timely and relevant for domestic investors, they are currently classified as `not ready for automated ingestion` and require a `manual review required` strategy for Phase 147B or beyond.
