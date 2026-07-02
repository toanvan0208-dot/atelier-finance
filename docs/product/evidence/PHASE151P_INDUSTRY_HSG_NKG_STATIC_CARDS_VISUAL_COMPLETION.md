# Phase 151P - Industry HSG/NKG Static Cards Visual Completion

## Goal

Render HSG and NKG cards next to the existing HPG card in the Industry module "Ro co phieu dau vao tu nganh" area, while preserving the semantic boundary:

- HPG remains the reviewed industry lane ticker.
- HSG/NKG are `screening_candidate` peer/input cards only.
- HSG/NKG do not unlock full analysis.

## Scope

- UI/copy only.
- No new box or section.
- Reused the existing Industry company card grid/container.
- Added HSG/NKG static cards beside HPG only for `steel_materials`.
- No DB write.
- No schema change.
- No provider fetch.
- No Assistant change.
- No API behavior change.

## Files Changed

- `src/features/industry/components/IndustryCompassSections.tsx`
- `src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `docs/product/evidence/PHASE151P_INDUSTRY_HSG_NKG_STATIC_CARDS_VISUAL_COMPLETION.md`

## UI Behavior

The existing "Ro co phieu dau vao tu nganh" grid now renders:

- HPG: reviewed industry lane ticker from the existing Industry data.
- HSG: static `screening_candidate` card.
- NKG: static `screening_candidate` card.

HSG/NKG cards include:

- ticker
- company name
- `screening_candidate`
- `research_only`
- `needsReview`
- copy saying they are only for Screening data checks
- copy saying they do not open deep analysis
- CTA to Screening only

TVN is not rendered.

## Boundary Confirmation

- HPG remains the reviewed STEEL_MATERIALS lane ticker.
- HSG/NKG are not treated as HPG-equivalent reviewed lane tickers.
- HSG/NKG remain `screening_candidate` only.
- HSG/NKG full analysis enabled: false.
- HSG/NKG are not valuation/risk benchmarks.
- No ranking/scoring was added.
- No IndustryMetric was added.
- No forbidden advice wording was introduced.

## Validation

Passed:

```bash
npx eslint src/features/industry/components/IndustryCompassSections.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts
npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts
npm run typecheck
```

Test coverage confirms:

- HPG appears.
- HSG appears.
- NKG appears.
- TVN does not appear.
- HSG/NKG include `screening_candidate`.
- HSG/NKG include "chua mo phan tich sau".
- Screening CTA is present.
- No buy/sell/hold, target price, fair value, upside/downside, ranking/scoring, score, or attractive/buyable wording appears in the rendered card grid.
- No Business/Financials/Valuation/Risk CTA appears for HSG/NKG.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- Assistant change: no.
- API behavior change: no.
- ScreeningCandidate data changed: no.
- TVN shown: no.
- HSG/NKG full analysis enabled: no.
- IndustryMetric created: no.
- benchmark created: no.
- ranking/scoring created: no.
- forbidden advice wording: no.

## Next Recommended Phase

Phase 151Q - Screening filter UX refinement or Supabase migration only when ready.
