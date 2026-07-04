# Phase 159K - Industry Metric Reading Note UI

## Goal

Rework the existing IndustryMetric UI so the small set of current metrics is presented as a reading note for users, not as a large metric dashboard.

## Scope

- UI-only change in the Industry page.
- Reuse existing IndustryMetric rows already read by the runtime payload.
- Add practical, guarded interpretation copy for the current metric codes.
- Keep all metrics research-only, needs-review, and not production-approved.

## What Changed

- Renamed the Layer 5 panel to `Ghi chu cach doc so lieu nganh`.
- Kept the raw metric value visible, but made it smaller and contextual.
- Added per-metric reading guidance:
  - `So nay noi gi`
  - `Can soi tiep`
  - `Can doc than trong`
- Converted the display from a metric grid into compact note rows.

## Guardrails

- No DB write.
- No schema change.
- No provider fetch.
- No new metric import.
- No Assistant prompt change.
- No benchmark, ranking, or scoring.
- No buy/sell/hold recommendation.
- No target price, fair value, upside, or downside.
- No stock attractiveness language.
- Missing metric values remain missing.

## Current Behavior

For steel and retail metrics that already exist in DB, the UI now explains how the user should read the number in relation to business analysis.

Example pattern:

```text
Metric value
-> What this number says
-> What to check next in the company
-> When to read carefully
```

For industries without eligible metrics, the UI keeps the safe missing state and does not substitute taxonomy or qualitative context as numeric data.

## Validation

- `npx eslint src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts`

Both passed.

## Recommended Next Phase

Phase 159L - Browser verification for the Industry metric reading note UI.

