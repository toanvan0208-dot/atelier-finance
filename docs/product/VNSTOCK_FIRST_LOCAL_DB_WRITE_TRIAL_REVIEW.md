# Vnstock First Local DB Write Trial Review

Phase: 31Q - First Local DB Write Trial + DB Verification

## 1. Purpose

This document records the first local DB write using a real CSV file that the user exported from Vnstock outside the repo.

This is local academic/research verification only. It is not production data integration, does not add a public data path, and does not approve any production source.

## 2. Input

| Field | Value |
| --- | --- |
| Ticker | `FPT` |
| Date range | `2025-01-01` to `2025-01-31` |
| File path | `D:\fpt-market-prices.csv` |
| File location | Outside repo |
| CSV committed | `false` |
| Command mode | `local_research` |
| Write | `true` |

The real CSV rows are not copied into this document.

## 3. Command Result

An initial command attempt failed before DB persistence because `DATABASE_URL` was not present in the process environment. DB inspection immediately after that failure showed `0` FPT `research_only` rows in the requested range and `0` FPT `research_only` rows outside the range, so no duplicate write risk was created.

The successful write command was then run with local SQLite `DATABASE_URL=file:./dev.db` scoped to the command process:

```powershell
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file "D:\fpt-market-prices.csv" --format csv --write
```

Result:

| Field | Value |
| --- | --- |
| `status` | `import_completed` |
| `dryRun` | `false` |
| `normalizedCount` | `17` |
| `insertedCount` | `17` |
| `updatedCount` | `0` |
| `skippedCount` | `0` |
| `rejectedCount` | `0` |
| `productionApproved` | `false` |
| `errors` | `[]` |

Warnings summary:

- Local academic/research boundary warning remained.
- FPT rows from `2024-12-23` to `2024-12-31` were skipped because they were outside the requested date range.
- Vnstock remains an academic/local research connector candidate only.
- Original data rights may belong to upstream providers.

## 4. DB Verification Result

Aggregate DB verification found:

| Check | Result |
| --- | --- |
| FPT `research_only` rows in requested range | `17` |
| Min imported trading date | `2025-01-02` |
| Max imported trading date | `2025-01-24` |
| Rows with `sourceLabel = vnstock` | `17` |
| Rows with `dataMode = research_only` | `17` |
| Rows with `sourceType = unknown` | `17` |
| FPT `research_only` rows outside requested range | `0` |
| Unexpected `research_only` tickers | `0` |
| Rows with any numeric field stored as `0` | `0` |
| MarketPrice recommendation/rating/target/signal columns | none |

DataSource verification for `vnstock`:

| Field | Value |
| --- | --- |
| `sourceType` | `unknown` |
| `usageStatus` | `research_only` |
| `licenseStatus` | `needs_review` |
| `tosStatus` | `needs_review` |
| `accessMethod` | `unknown` |
| rights flags | `unknown` |

`productionApproved` is not directly represented as a `MarketPrice` column in the current schema. It is enforced at the import command/source metadata layer, and the command result preserved `productionApproved:false`.

## 5. Repo Hygiene Result

- `D:\fpt-market-prices.csv` stayed outside the repo.
- No real CSV/JSON export appeared in `git status`.
- No DB file appeared in `git status`.
- No generated Prisma output appeared in `git status`.
- No `tsconfig.tsbuildinfo` change appeared after the write.
- No staged files were present after the write.
- A local DB backup was copied outside the repo before write: `D:\atelier-finance-db-backups\dev-before-phase-31q-20260619-234806.db`.

## 6. Review Conclusion

The first local DB write trial passed.

The manual export/import pipeline can persist reviewed FPT market price data into the local DB for academic/research verification. This remains local academic/research use only, is not production-approved, does not add a real fetcher, and does not add a public trigger.

## 7. Non-Goals

Phase 31Q did not:

- Add a real fetcher.
- Call Vnstock from the app.
- Add UI, API, cron, scheduler, or app-start import behavior.
- Approve any production source.
- Commit a real CSV file.
- Commit a DB file.
- Import all-market data.
- Import financial statements or fundamentals.
- Add recommendation or signal logic.

## 8. Phase 31R Market Price DB Read Path Verification

Phase 31R verifies the DB read path after the first local write. The verification is recorded in `docs/product/MARKET_PRICE_DB_READ_PATH_VERIFICATION.md`.

Summary:

- A read service can query FPT `research_only` market price rows from the local DB.
- The service filters by ticker, date range, `sourceLabel`, and `dataMode`.
- The service preserves `null` values and keeps `productionApproved:false` at the output layer.
- Optional local DB verification read `17` FPT rows for the reviewed range without writing DB data.
