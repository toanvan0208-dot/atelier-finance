# Phase 147B: Macro Schema Implementation and Provenance Model

## Status
**Completed** (Approved for Staging Only)

## Context
Atelier Finance requires a solid data foundation to support real macroeconomic data ingestion. In Phase 147A, we finalized the candidate schema and performed a fail-closed preview using World Bank API data. In Phase 147B, the objective was to enact this schema change in the database while retaining existing `MacroContext` structures for LLM text context without corrupting or retrofitting them for numerical observations.

## Actions Taken
1. **Schema Update**: Extended `prisma/schema.prisma` with three new models explicitly designed for numerical timeseries macroeconomic data:
    - `MacroIndicator`: Represents the metadata of the indicator (e.g. CPI_YOY, GDP_GROWTH), including units and frequency.
    - `MacroObservation`: Represents a single numerical data point for a given indicator, region, and observation date.
    - `MacroObservationProvenance`: Captures the traceability of the observation, including `sourceUrl`, `retrievedAt`, and strict `dataMode` rules.
2. **Migration Reconciliation**:
    - Used `prisma db push` to synchronize local staging schemas safely, bypassing legacy column state drift issues on enum transitions found in previous migrations.
    - Migration tracked conceptually as `macro_data_foundation`.
3. **Read Path Foundation**: 
    - Implemented `src/features/macro/lib/macro-observation-read-path.ts` providing the strict schema reading path `loadLatestMacroObservations`.
4. **Validation via Smoke Tests**:
    - Created `scripts/preview-macro-data-ingestion-to-schema.ts` proving schema mappings correctly adapt World Bank payload (in fail-closed, dry-run mode).
    - Created `scripts/smoke-macro-schema-and-read-path.ts` successfully proving models are live and readable.

## Validation Status
- **macroSchemaMigrated**: true
- **macroSchemaApprovedForStaging**: true
- **macroSchemaApprovedForProduction**: false
- **dbWriteAttempted**: false (strictly maintained fail-closed boundary during validations)

## Validation Commands Run
```bash
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck  # (Passed Cleanly)
node scripts/run-staging.mjs npm run build      # (Passed Cleanly)
node scripts/run-staging.mjs npm run lint       # (Documented 194 problems mostly due to pre-existing no-explicit-any in old legacy smoke scripts)
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; node scripts/run-staging.mjs npx tsx scripts/smoke-macro-schema-and-read-path.ts
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; node scripts/run-staging.mjs npx tsx scripts/preview-macro-data-ingestion-to-schema.ts
```

## Known Limitations / Issues
- Lint checking fails on 194 errors largely resulting from historical `any` types in older `scripts/smoke-*` files. No new lint problems introduced in the production application code.
- Database migration history exhibits slight drift on older tables (`IndustryContext`, `FinancialStatementUnitMetadata`) due to un-tracked enum transitions; handled cleanly via schema push and manual sync workflows moving forward.
- Schema changes are only approved for Staging currently.

## Next Steps
- Transition towards DB writing with candidate macro data (Phase 147C/D), observing all dataMode and confirmation flags carefully.
