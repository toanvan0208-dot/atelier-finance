# Controlled Unit Metadata Write Trial

## 1. Phase 69 Summary

Phase 69 runs a controlled local write trial for Financials unit metadata persistence.

The trial used synthetic explicit-unit data only. No real BCTC data was imported. No reset or seed step was used. No production approval was granted. No new metric, UI, target price, fair value range, recommendation, or Risk scoring was added.

## 2. Files Audited

- `prisma/schema.prisma`
- `prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql`
- `package.json`
- `prisma.config.ts`
- `scripts/financial-statements-write-trial.ts`
- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- Phase 68 persistence tests and docs

## 3. Files Changed

Docs:

- `docs/product/CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`
- cross-reference updates in Financials, Valuation, productization, and source-evidence docs.

Code:

- none

Tests:

- no new test file was required; Phase 68 tests already cover write/read-back/runtime/Valuation behavior. Phase 69 adds controlled local evidence using those paths.

Schema/migration:

- none changed in Phase 69

## 4. Migration Application

Pre-flight result:

- Phase 68 migration SQL is additive sidecar-only.
- No destructive statement was present.
- No reset or seed was required.
- Repo-root `dev.db` existed and was not staged.

Attempted command on existing local DB:

```text
DATABASE_URL=file:./dev.db npx prisma migrate deploy
```

Result:

- Prisma returned `P3005` because the existing local DB schema is not empty and is not baselined in Prisma migrations.
- No reset was run.
- No seed was run.
- The repo-root DB file was not committed.

Controlled fallback used for the trial:

```text
DATABASE_URL=file:<temp>/atelier-phase69-unit-trial.db npx prisma db execute --file prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql
DATABASE_URL=file:<temp>/atelier-phase69-unit-trial.db npx prisma db execute --file prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql
```

Result:

- both SQL scripts executed successfully on a temporary SQLite DB outside the repo.
- the temp DB was removed during cleanup.
- no migration file was created or changed in Phase 69.

## 5. Synthetic Write Trial Input

The temporary CSV used one synthetic row:

- ticker: `UT69A`
- fiscalYear: `2099`
- periodType: `annual`
- sourceLabel: `phase69_synthetic_unit_metadata_trial`
- dataMode: `research_only`
- productionApproved: false

Explicit unit fields:

- `revenue_unit=million_vnd`
- `net_income_unit=million_vnd`
- `operating_cash_flow_unit=million_vnd`
- `total_assets_unit=million_vnd`
- `equity_unit=million_vnd`
- `total_debt_unit=million_vnd`
- `current_assets_unit=million_vnd`
- `current_liabilities_unit=million_vnd`
- `eps_unit=vnd_per_share`
- `shares_outstanding_unit=shares`

No raw CSV file was committed. The temporary CSV was removed after the trial.

## 6. Sidecar Persistence Result

Write command:

```text
DATABASE_URL=file:<temp>/atelier-phase69-unit-trial.db npm run --silent financials:write-trial -- --file <temp-csv> --source-label phase69_synthetic_unit_metadata_trial --data-mode research_only --confirm-local-research-only --confirm-no-production-source --confirm-reviewed-dry-run --confirm-no-production-database
```

Summary:

- dryRunStatus: `completed`
- dryRunAcceptedCount: `1`
- dryRunRejectedCount: `0`
- dryRunSkippedCount: `0`
- writeStatus: `write_completed`
- writeExecuted: `true`
- insertedCount: `1`
- updatedCount: `0`
- skippedExistingCount: `0`
- productionApproved: `false`
- databaseMode: `local_sqlite_dev`

Persisted sidecar rows:

- `currentAssets`: `million_vnd`, `explicit`
- `currentLiabilities`: `million_vnd`, `explicit`
- `eps`: `vnd_per_share`, `explicit`
- `equity`: `million_vnd`, `explicit`
- `netIncome`: `million_vnd`, `explicit`
- `operatingCashFlow`: `million_vnd`, `explicit`
- `revenue`: `million_vnd`, `explicit`
- `sharesOutstanding`: `shares`, `explicit`
- `totalAssets`: `million_vnd`, `explicit`
- `totalDebt`: `million_vnd`, `explicit`

All sidecar rows had:

- `sourceLabel=phase69_synthetic_unit_metadata_trial`
- `dataMode=research_only`
- `productionApproved=false`

Unique/upsert behavior:

- Phase 68 tests cover `financialStatementId + field` sidecar upsert behavior.
- This trial inserted one statement and one sidecar row per explicit Financials field.

Invalid/missing behavior:

- Phase 68 tests cover invalid persisted metadata failing closed.
- Missing metadata remains compatible and reads through `unknown_unit` or `missing`.

## 7. Read-back And Runtime Sidecar Result

Read-back through `getFinancialStatementSeries` returned:

- seriesStatus: `available`
- records: `1`
- `revenue`: `explicit`, `million_vnd`
- `equity`: `explicit`, `million_vnd`
- `eps`: `explicit`, `vnd_per_share`
- `sharesOutstanding`: `explicit`, `shares`
- productionApproved: `false`

Runtime through `loadFinancialsRuntimeData` returned:

- runtimeStatus: `db_backed`
- runtime unit sidecar included explicit metadata for the same fields.
- source remained `research_only`.
- productionApproved remained `false`.

Old-row behavior:

- Phase 68 tests continue to verify rows without sidecar metadata read as `unknown_unit` or `missing`.

No zero-fill:

- Missing values remain `null` through existing write/read tests.

## 8. Valuation Handoff Result

Controlled Valuation integration received explicit Financials units from runtime:

- revenue normalizationStatus: `ready`
- equity normalizationStatus: `ready`
- eps normalizationStatus: `ready`
- sharesOutstanding normalizationStatus: `ready`
- marketPrice source: `persisted_bridge`
- market input ownership remains separate

Metric status in the controlled check:

- marketCap: `ready`
- P/E: `ready`
- BVPS: `ready`
- P/B: `ready`
- EV: `blocked`
- DCF: `blocked`

Source-claim guards:

- productionApproved: `false`
- canClaimValuationDbBacked: `false`

## 9. Cleanup Result

- Temporary CSV removed.
- Temporary SQLite DB removed.
- Generated Prisma client restored before commit.
- `tsconfig.tsbuildinfo` restored before commit if changed.
- No raw JSON output was written to the repo.
- No screenshots were created.
- No repo DB file was staged or committed.

## 10. Browser Verification

Browser verification was not run.

Reason: Phase 69 used controlled write/read-back/runtime service checks and did not change visible UI behavior.

## 11. Tests Added Or Reused

No new test file was required in Phase 69.

Reused validation coverage from Phase 68:

- sidecar schema/migration safety
- explicit sidecar write persistence
- read-back unit metadata
- old rows without sidecar metadata
- invalid sidecar metadata fail-closed behavior
- runtime sidecar handoff
- controlled Valuation handoff
- forbidden wording tests

## 12. Non-goals

- no reset or seed
- no destructive migration
- no real BCTC import
- no approved source integration
- no Excel or PDF parser
- no public upload API
- no external API call
- no new metric
- no target price
- no fair value range
- no recommendation or trading signal
- no Risk scoring
- no production source approval

## 13. Limitations

- The successful trial used a temporary SQLite DB outside the repo because the existing local `dev.db` is not baselined for Prisma migrations.
- The trial is synthetic/local only.
- Unit metadata persistence does not make any source production-approved.
- Existing historical rows may still lack unit metadata.
- Market input metadata remains separate from Financials metadata.

## 14. Next Recommended Phase

Recommended next phase: Phase 70 - Market/PVT Unit Metadata Contract.

Maximum scope:

- define market input unit metadata ownership for `marketPrice` and `marketCap`;
- keep market/PVT metadata separate from Financials unit metadata;
- preserve `productionApproved:false`;
- do not add EV, DCF, fair value range, target price, recommendation, or Risk scoring.

## 15. Phase 70 Follow-up

Phase 70 adds `MARKET_PVT_UNIT_METADATA_CONTRACT.md`. Market input metadata is now documented as a separate Market/PVT-owned contract: `marketPrice` and `marketCap` do not belong to Financials, and Valuation can only use them when their units are explicit and accepted.

The Phase 69 Financials sidecar write trial remains unchanged. Phase 70 adds helper/types/tests/docs only; it does not write DB rows, add a schema migration, import real market data, or change visible UI behavior.

## 16. Phase 71 Follow-up

Phase 71 adds `VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`. The browser verification uses a synthetic/local explicit-unit scenario instead of another DB write trial, confirming that Financials unit metadata plus Market/PVT unit metadata can render ready controlled Valuation metrics without changing source approval.

No new sidecar rows, DB files, generated output, real BCTC, or real market data are created by Phase 71.

## 17. Phase 72 Follow-up

Phase 72 adds `MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`. It mirrors the Financials unit-metadata safety pattern for Market/PVT runtime payloads, but it does not write market metadata to DB or add a schema migration.

## 18. Phase 73 Follow-up

Phase 73 adds `CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`. Unlike the Phase 69 Financials sidecar DB write trial, Market/PVT metadata uses a read-through/runtime fixture trial because `MarketPrice` has no unit metadata sidecar storage yet. No market metadata DB write is performed.

## 19. Phase 74 Follow-up

Phase 74 adds `MARKET_PVT_METADATA_PERSISTENCE_DESIGN.md`. It recommends a future Market/PVT sidecar table analogous to the Financials sidecar pattern, but does not implement a market metadata migration or write trial.
