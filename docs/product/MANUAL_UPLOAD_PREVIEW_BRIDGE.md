# Manual Upload Preview Bridge

Date: 2026-06-18

Phase: 28C - Manual Upload Preview Bridge

This document describes the library-level preview bridge for manual uploads. It does not add upload UI, backend endpoints, a database, API calls, or production runtime integration.

## Pipeline

Manual upload rows or simple CSV text flow through:

1. `normalizeManualUpload(...)`
2. `buildManualUploadValidationReport(...)`
3. canonical financial, market, and valuation records
4. `bridgeFinancialsContract(...)` and `bridgeValuationContract(...)`
5. preview result with report, readiness, metadata, and diagnostics

The bridge never sends parsed data directly to UI modules. It preserves source, asOf, period, missing fields, stale flags, and warnings from the data contract.

## Record Selection

- `targetTicker + targetPeriod`: select matching row; duplicate matches add a warning.
- `targetTicker` only: select latest by `asOf` only when the latest row is unambiguous.
- no target: select only when there is exactly one valid record.
- multiple valid records without target: return `needs_review`/`not_ready` diagnostics and available records for user choice.

## Preview Scope

Financials preview maps canonical financial data through the existing data-contract module bridge. It does not replace missing values with zero and does not calculate ratios when denominators are missing or zero.

Valuation preview maps close price, EPS, BVPS, shares outstanding, and financial statement context through the existing bridge. It does not create fair value or target price.

## Safety

Manual upload preview is for development and thesis/local verification. It is not a production-approved data source and must not bypass source evidence policy.

The preview output uses readiness language only: ready, needs review, not ready, insufficient data, unknown, and failed. It must not contain buy/sell/hold wording.

