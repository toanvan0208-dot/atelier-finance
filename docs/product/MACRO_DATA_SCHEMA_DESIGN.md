# Macro Data Schema Design Proposal

**Status**: implemented  
**Migration State**: staged (Phase 147B)  
**Review Status**: approved for staging

## Context
Atelier Finance requires real, verifiable macroeconomic data to support beginner-friendly analysis. The current `MacroContext` schema is text-based and primarily intended for serving pre-compiled context to the Assistant. A structured timeseries model was introduced in Phase 147B to store quantitative macroeconomic indicators (e.g., CPI, GDP) with verifiable provenance.

## Implemented Schema (Prisma)

### 1. MacroIndicator
A master registry of supported macroeconomic indicators.
(See `prisma/schema.prisma` for exact implementation).

### 2. MacroObservation
The actual timeseries data point for a given indicator.
(See `prisma/schema.prisma` for exact implementation).

### 3. MacroObservationProvenance
Metadata regarding the source and fetch details for a specific observation.
(See `prisma/schema.prisma` for exact implementation).

## Field Definitions & Guardrails

- `dataMode`: Dictates the usage context. Must be `candidate_macro_data` or `research_only` until fully verified.
- `productionApproved`: Must explicitly be flipped to `true` by a human administrator. Default is `false`.
- `needsReview`: Automatically flagged `true` upon ingestion.
- `warningCodes`: Allows programmatic insertion of warnings like `UNVERIFIED_SOURCE` if fetched from a non-SLA candidate provider.
- `sourceLabel` & `providerType`: Crucial for the Assistant to correctly cite the data origin to the user.

## Migration Strategy
The schema has been implemented locally and synchronized via `prisma db push` in Staging (Phase 147B) to bypass legacy migration drift. Candidate macro data has been populated via confirm-write scripting (Phase 147C). Full production database migrations must be carefully reconciled before deployment to the official app environment.
