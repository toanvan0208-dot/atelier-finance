# Vnstock Offline Fetcher Contract

Phase: 31K - Offline Fetcher Contract With Sample Fixture

## 1. Purpose

This document defines the offline contract for Vnstock-style market prices/PVT records before any real Vnstock fetcher is integrated.

The contract is for testing and local academic research validation only. It is not a real fetcher, does not call Vnstock, does not call network, and does not approve any production source.

## 2. Current Status

- The local import command exists through `import:market-prices:vnstock:local`.
- The connector and persistence boundaries exist.
- Phase 31I smoke tests verified fail-closed command behavior.
- The real fetcher is not configured.
- Phase 31J found Vnstock is Python-first and recommended an offline contract or manual bridge before any real integration.
- Phase 31K defines this offline contract and fake/sample fixture for mapping validation.

## 3. Raw Fetcher Output Contract

A future fetcher must return the minimum raw record shape below:

```ts
type OfflineVnstockMarketPriceRawRecord = {
  ticker: string;
  date: string;
  open: number | string | null;
  high: number | string | null;
  low: number | string | null;
  close: number | string | null;
  volume: number | string | null;
  tradingValue?: number | string | null;
  source?: string;
  provider?: string;
  rawSymbol?: string;
};
```

The contract must not include:

- `recommendation`
- `rating`
- `targetPrice`
- `buySignal`
- `sellSignal`
- `holdSignal`
- `advice`

## 4. Normalized Output Expectations

After normalization:

- `ticker` is trimmed and uppercased.
- `date` remains a valid date-compatible string.
- `open`, `high`, `low`, `close`, `volume`, and `tradingValue` are `number | null`.
- `sourceProvider` is `vnstock`.
- `sourceType` is `third_party_tool`.
- `usageScope` is `academic_non_commercial`.
- `productionApproved` is `false`.
- `retrievedAt` is populated by the command/runtime.
- Warnings are collected for rejected or partially normalized records.

Rules:

- Missing numeric values become `null`.
- Empty string values become `null`.
- Invalid numbers become `null` plus a warning.
- Invalid ticker is rejected with a warning.
- Invalid date is rejected with a warning.
- Do not use `0` as a replacement for missing values.
- Do not calculate `tradingValue` when close or volume is missing unless a later reviewed helper explicitly adds that behavior and remains fail-safe.
- Do not infer investment meaning.

## 5. Fixture Cases

The offline fixture covers:

- Valid OHLCV record.
- String numeric values.
- Missing numeric fields.
- Invalid numeric field.
- Invalid ticker.
- Invalid date.
- Optional missing `tradingValue`.
- Extra unknown field ignored safely.
- No recommendation, rating, target price, or buy/sell/hold signal fields.

Fixture location:

- `src/lib/data-sources/__fixtures__/vnstock-market-price-raw.fixture.ts`

## 6. Safety Requirements

- Fixture data is fake/sample data only.
- No raw real market data is included.
- No local DB file should be committed.
- No network call is made.
- No Python or Vnstock dependency is added.
- No public API, UI, cron job, scheduler, or app-start import is added.
- Fixture contract tests do not require `--write`.
- `productionApproved:false` remains mandatory.

## 7. Future Real Fetcher Acceptance Criteria

A future real fetcher can be considered only if it:

- Matches this contract.
- Has tests for all fixture cases.
- Is disabled by default.
- Requires env safety flags and local import acknowledgement.
- Defaults to dry-run.
- Does not import the whole market by default.
- Does not add intraday/live behavior in the first implementation.
- Enforces source metadata.
- Never sets production approval to true.
- Does not commit raw data.

## 8. Phase 31L Manual Export/Import Bridge

The same raw contract applies to manual CSV/JSON file imports added in Phase 31L. Manual exports are user-provided local research files, not app-fetched data. CSV uses the columns `ticker,date,open,high,low,close,volume,tradingValue`; JSON uses an array of objects with the same fields. Extra fields are ignored safely, and recommendation/rating/target/action fields remain out of scope.

## 9. Phase 31M Local Dry-Run Verification

Phase 31M verified the manual file import path against this contract using fake sample CSV data only. The dry-run covered valid rows, missing numeric values, invalid numeric values, wrong ticker filtering, and invalid date rejection without a real fetcher, network call, or DB write.

## 10. Phase 31N First Real Manual Export Trial

The first user-provided real CSV/JSON dry-run must conform to this contract before any future write phase is considered. Real exports remain outside committed source and are treated as user-provided local research data.

## 11. Phase 31O First Real CSV Dry-Run Review

The first real user-provided CSV dry-run conformed to this contract enough to normalize `17` FPT rows with `0` rejected rows. This is still local academic/research validation only and does not approve any production source.
