# Phase 159L - Industry Future Metric Guide Button

## Goal

Add a small UI guide for the metrics users may want to find manually later, without treating those planned metrics as DB data.

## Scope

- UI-only change in the Industry page.
- No new IndustryMetric rows.
- No source extraction.
- No DB write.
- No schema change.
- No provider fetch.

## What Changed

- Added a compact `Chi so nen tu tim them` note in the Layer 5 area.
- Added a small `Xem ghi chu` button.
- The planned metric checklist is hidden by default.
- When opened, it shows industry-specific manual reading guidance for:
  - Steel and materials.
  - Retail.
  - Dairy / consumer staples.

## Important Boundary

The checklist is not displayed as system data. It is explicitly labeled as user guidance:

```text
Day la checklist doc so lieu cho nguoi dung, chua phai metric trong DB.
```

## Guardrails

- No benchmark, ranking, or scoring.
- No buy/sell/hold language.
- No target price, fair value, upside, or downside.
- No stock attractiveness language.
- No fake metric values.
- No taxonomy or qualitative context used as numeric data.

## Validation

- `npx eslint src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts`

Both passed.

