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
