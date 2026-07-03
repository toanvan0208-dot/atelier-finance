# Phase 158A - Industry Layer 4 UI Context Detail Expansion

## Goal

Show the existing source-backed Layer 4 qualitative industry context in the Industry UI.

This phase does not create new industry data. It only expands the read path so users can see the Layer 4 fields already stored in `IndustryContext`.

## Scope

- UI read-path only.
- No DB writes.
- No schema change.
- No provider fetch.
- No new import.
- No `IndustryMetric` write or introduction.
- No benchmark, ranking, scoring, stock attractiveness score, buy/sell/hold, target price, fair value, upside, or downside.
- Missing values remain `N/A`.

## What Changed

- `src/features/industry/components/IndustryPage.tsx`
  - Added a Layer 4 panel that reads `IndustryContextRuntimePayload.context`.
  - Shows source-backed qualitative fields:
    - industry overview
    - how the industry makes money
    - key drivers
    - industry risks
    - macro sensitivity
    - next checks
    - common misread / what not to conclude
    - source label, source URL, provenance row count, and as-of date
  - Keeps explicit guardrail copy that Layer 4 is qualitative context only and is not a metric, benchmark, ranking, or recommendation.
  - Keeps missing Layer 4 state as `N/A` and does not use static guidance as reviewed context.

- `src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
  - Added a runtime payload test proving source-backed Layer 4 qualitative context renders in the UI.
  - Keeps the missing-context test to ensure the UI does not promote missing data as real context.

## UI Behavior

When a selected industry has source-backed Layer 4 context, the UI now shows a "Ho so nganh co nguon" section with:

- provenance status
- research-only / needs-review status
- production approval status
- source label and source URL
- qualitative explanation fields
- explicit warning that there are no industry metrics, benchmark, ranking, or scoring in this layer

When no eligible context exists, the UI shows that Layer 4 is missing and leaves the value as `N/A`.

## Validation

- `npx eslint src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts` - passed
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts --reporter verbose` - passed, 4 tests
- `npm run typecheck` - passed
- Browser check on `http://localhost:3000/workspace?module=industry` - passed
  - `hasLayer4Title=true`
  - `hasProvenance=true`
  - `hasHowMakesMoney=true`
  - `hasDrivers=true`
  - `hasRisks=true`
  - `hasMacro=true`
  - `hasNextChecks=true`
  - `hasNoMetricsWarning=true`
  - `hasNoFrameworkOverlay=true`
  - console warn/error count: `0`

Screenshot capture was attempted in the in-app browser but timed out at the browser capture step. The DOM and console validation above completed successfully.

## Safety Confirmation

- DB writes: no
- Schema change: no
- Provider fetch: no
- IndustryMetric introduced: no
- Benchmark/ranking/scoring introduced: no
- Buy/sell/hold introduced: no
- Target price/fair value/upside/downside introduced: no
- Stock attractiveness introduced: no
- Fake/mock/fallback-as-real introduced: no
- Static guidance promoted as reviewed context: no

## Current Layer Conclusion

The Industry module remains at Layer 4 because source-backed qualitative context already exists in DB and is now visible in the product read path.

Layer 5 is still not implemented. Numeric industry metrics and comparisons remain out of scope.

## Recommended Next Phase

Phase 158B - Industry Source Review Expansion Dry Run.

This next phase should review and prepare additional source-backed qualitative context from industry reports, still without rankings, investment scores, or valuation conclusions.
