# Phase 158G - Industry Layer 4 Vietnamese UI Display

## Goal

Render the source-backed Industry Layer 4 context in Vietnamese for end users while keeping the database context rows unchanged.

## Scope

- UI-only display change.
- No schema change.
- No DB write.
- No provider fetch.
- No new PDF/raw source import.
- No IndustryMetric write or introduction.
- No benchmark, ranking, scoring, stock attractiveness score, buy/sell/hold recommendation, target price, fair value, upside, or downside.
- Existing source/provenance labels remain visible.

## What Changed

- `src/features/industry/components/IndustryPage.tsx`
  - Added a PDF-backed Vietnamese display layer for:
    - `STEEL_MATERIALS`
    - `RETAIL`
    - `CONSUMER_STAPLES_DAIRY`
  - The display layer activates only when `IndustryContext.sourceLabel` starts with `Phase 158D PDF Layer 4 - ` and the selected industry has reviewed Vietnamese display copy.
  - Non-PDF-backed contexts still render their source text as-is.
  - Source labels, data mode, review flags, and provenance remain from the runtime payload.

- `src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
  - Added coverage that verifies PDF-backed Layer 4 context renders Vietnamese display copy while preserving source metadata.

## Behavior

The database remains the source of truth for whether Layer 4 context exists and whether it is source-backed. The UI now uses a safer presentation layer:

- DB/source text: unchanged.
- User-facing copy: Vietnamese for reviewed PDF-backed Layer 4 rows.
- Provenance/source label: still shown from the original context payload.
- Missing values: still remain missing/N/A rather than filled with fake numbers.

## Validation

Commands passed:

- `npx eslint src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts --reporter verbose`
- `npm run typecheck`
- `npx tsx scripts/smoke-industry-pdf-layer4-read-path.ts`

Browser verification passed for:

- Steel / `STEEL_MATERIALS`
- Retail / `RETAIL`
- Dairy and consumer staples / `CONSUMER_STAPLES_DAIRY`

Browser assertions confirmed:

- Vietnamese display chip is visible.
- Vietnamese Layer 4 overview and revenue model copy is visible.
- Phase 158D PDF source label remains visible.
- Previous English overview text is not shown for the reviewed PDF-backed rows.
- No buy/sell/hold, target price, fair value, upside/downside, or stock attractiveness wording was introduced.

## Safety Confirmation

- DB writes: no.
- Schema change: no.
- Provider fetch: no.
- PDF/raw source import: no.
- IndustryMetric introduced: no.
- Benchmark/ranking/scoring introduced: no.
- Buy/sell/hold introduced: no.
- Target price/fair value/upside/downside introduced: no.
- Stock attractiveness introduced: no.
- Fake/mock/fallback-as-real introduced: no.
- `productionApprovedTrueCount`: remains `0` per smoke read-path validation.

## Current Layer Interpretation

The module already has source-backed Layer 4 context rows for the three target industries from Phase 158E. Phase 158G does not create new Layer 4 data. It only makes the reviewed Layer 4 context easier for Vietnamese users to read in the Industry UI.

## Recommended Next Phase

Phase 158H - Assistant Industry Layer 4 Context Verification.

Reason: the Industry UI now presents the PDF-backed context safely in Vietnamese, but the Assistant path should be checked separately to confirm it uses the same safe Layer 4 boundaries and does not turn context into recommendation, valuation, ranking, or trading language.
