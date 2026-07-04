# Phase 158F - Industry PDF Layer 4 UI Browser Verification

## Goal

Verify in the browser that the Industry UI displays the PDF-backed Layer 4 context for all three reviewed industries after the Phase 158E DB write.

## Scope

- UI/browser verification.
- Read-path verification.
- Small UI read-path fix allowed if the browser check finds a mismatch.
- No DB write.
- No schema change.
- No provider fetch.
- No source PDF commit.
- No raw PDF text commit.
- No `IndustryMetric`.
- No benchmark, ranking, scoring, recommendation, target price, fair value, upside, or downside.

## Flow Under Test

`http://localhost:3000/workspace?module=industry` -> open Industry module -> switch between Steel, Retail, and Dairy/Consumer Staples -> verify each selected industry shows PDF-backed Layer 4 context with provenance.

## Finding And Fix

### Finding

Steel and Retail showed PDF-backed Layer 4 context correctly.

Dairy/Consumer Staples initially failed on the UI:

- selected UI industry: `Sữa / hàng tiêu dùng thiết yếu`
- UI state: mapping/context missing
- observed copy: `Chua co mapping DB phu hop cho nganh nay`

Root cause:

- UI industry key was `dairy_consumer_staples`
- read-path map only had `consumer_staples_dairy`
- therefore the UI did not map the selected Dairy/Consumer Staples card to `CONSUMER_STAPLES_DAIRY`

### Fix

Updated:

- `src/features/industry/components/IndustryPage.tsx`

Added:

- `dairy_consumer_staples -> CONSUMER_STAPLES_DAIRY`

## Browser Verification Result

Browser target:

- `http://localhost:3000/workspace?module=industry`

Browser checks:

- page identity: passed
- not blank: passed
- framework overlay: not present
- console warn/error count: `0`
- screenshot captured: yes
- interaction proof: passed

## Industry Checks

### STEEL_MATERIALS

- selected UI industry: `Thep / vat lieu xay dung`
- source visible: `Phase 158D PDF Layer 4 - Local PDF - Bao cao thi truong thep Quy I 2026`
- overview visible: `global and domestic steel supply`
- provenance visible: yes
- no-metric warning visible: yes
- forbidden advice detected: no
- target price / fair value / upside / downside detected: no
- benchmark / ranking / scoring detected: no

### RETAIL

- selected UI industry: `Bán lẻ`
- source visible: `Phase 158D PDF Layer 4 - Local PDF - Nganh ban le`
- overview visible: `consumer spending`
- provenance visible: yes
- no-metric warning visible: yes
- forbidden advice detected: no
- target price / fair value / upside / downside detected: no
- benchmark / ranking / scoring detected: no

### CONSUMER_STAPLES_DAIRY

- selected UI industry: `Sữa / hàng tiêu dùng thiết yếu`
- source visible: `Phase 158D PDF Layer 4 - Local PDF - Bao cao nganh hang tieu dung trien vong 2026`
- overview visible: `household income`
- provenance visible: yes
- no-metric warning visible: yes
- forbidden advice detected: no
- target price / fair value / upside / downside detected: no
- benchmark / ranking / scoring detected: no

## Validation

- `npx tsx scripts/smoke-industry-pdf-layer4-read-path.ts` - passed
- `npx eslint src/features/industry/components/IndustryPage.tsx` - passed
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts --reporter verbose` - passed
- `npm run typecheck` - passed
- Browser UI check for all three industries - passed

## Current Conclusion

The Industry UI now displays the PDF-backed Layer 4 context for all three reviewed industries:

- `STEEL_MATERIALS`
- `RETAIL`
- `CONSUMER_STAPLES_DAIRY`

The system still remains Layer 4. No Layer 5 metric/comparison has been introduced.

## Recommended Next Phase

Phase 158G - Industry Layer 4 Vietnamese Copy Polish.

This should improve the readability of the PDF-backed Layer 4 text on the UI, especially because the stored context is currently English while the product UI is mostly Vietnamese.

## Safety Confirmation

- DB writes: no
- Schema change: no
- Provider fetch: no
- Source PDFs committed: no
- Raw PDF text committed: no
- IndustryMetric introduced: no
- Benchmark/ranking/scoring introduced: no
- Buy/sell/hold introduced: no
- Target price/fair value/upside/downside introduced: no
- Stock attractiveness introduced: no
- Fake/mock/fallback-as-real introduced: no
