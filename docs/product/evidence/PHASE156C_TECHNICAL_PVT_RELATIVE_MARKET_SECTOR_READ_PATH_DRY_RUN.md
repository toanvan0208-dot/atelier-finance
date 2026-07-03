# Phase 156C — Technical/PVT Relative Market And Sector Read-Path Dry Run

## Goal
Dry-run the Technical/PVT relative market and sector read-path. Compute neutral comparison metrics between stock price time-series and market/sector index time-series (VNINDEX, VN30, VNMAT, VNCONS).

## Scope
- Read-path logic dry-run only. No UI changes.
- Ensure strict adherence to neutral language. Do not introduce any ranking, scoring, or trading signals.
- Confirm alignment of dates between disparate time series to ensure valid comparison points.

## Input DB Prerequisites
- MarketIndexObservation model exists and is populated with `VNINDEX`, `VN30`, `VNMAT`, and `VNCONS` metrics (1,699 rows each, running from Sep 2019 to Jul 2026).
- MarketPrice model exists and is populated with `HPG`, `VNM`, and `MWG` stock data.
- DataSource `"VNStock market and sector index time-series"` is verified and active.

## Market/Sector Mapping
- **HPG** -> VNMAT (Materials sector proxy)
- **VNM** -> VNCONS (Broad consumer sector proxy)
- **MWG** -> VNCONS (Broad consumer sector proxy, explicitly not an exact retail benchmark)
- **HPG/VNM/MWG** -> VNINDEX and VN30 (Broad market comparison)

## Date Alignment Method
Since the trading dates between individual stocks and indices might diverge due to local listing schedules, an `align(source, reference)` strategy was implemented. It matches the reference's `tradingDate` strictly against the source's `tradingDate`. If dates don't match, `null` is injected to prevent silent mismatch calculation errors. Date mismatch was indeed detected (`dateMismatchDetected: true`), emphasizing the absolute necessity of this approach.

## Formula Definitions
- **Simple Percentage Return:** `(latestClose / closeNPeriodsAgo - 1) * 100`
- **Relative Difference:** `stockReturn - indexReturn`.

## Computed Metrics Summary
- **Computability:** Yes, for all 3 tickers, the 5d, 20d, and 60d relative metrics to VNINDEX, VN30, and Sector proxies were successfully computed.
- **Insufficient Data Fields:** None (0).
- **Aligned Observation Count:** 
  - HPG: VNINDEX (1,700), Sector (1,699)
  - VNM: VNINDEX (1,700), Sector (1,699)
  - MWG: VNINDEX (1,700), Sector (1,699)

## Note on Product Language 
This relative difference approach is structurally designed for comparison ("so sánh với thị trường chung", "khác biệt so với chỉ số tham chiếu"). 
**This is NOT a ranking, scoring, or investment recommendation.** The code and results strictly forbid terminology such as "mạnh hơn", "yếu hơn", "mua", "bán", "benchmark ranking", or "upside".

## Guardrail Confirmations
- **DB Writes:** No
- **Schema Change:** No
- **Provider Fetch Attempted:** No
- **Forbidden trading/advice wording introduced:** No
- **Benchmark/ranking/scoring introduced:** No
- **Trading signals introduced:** No
- **Mock/fake/fallback-as-real detected:** No
- **productionApprovedTrueCount:** 0

## Recommended Next Phase
Phase 156D — Technical/PVT Relative Market And Sector UI Cards
