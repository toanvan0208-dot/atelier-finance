# Phase 158B - Industry Layer 4 PDF Source Review Dry Run

## Goal

Check whether the three local industry PDF reports can be used as source material for richer Layer 4 qualitative industry context.

This phase is dry-run only. It reads local PDF files and reports whether they are usable for manual review. It does not write any DB data.

## Input PDFs

- `D:\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf`
  - mapped industry: `STEEL_MATERIALS`
  - mapped ticker lane: `HPG`
- `D:\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf`
  - mapped industry: `CONSUMER_STAPLES_DAIRY`
  - mapped ticker lane: `VNM`
- `D:\nganh_ban_le.pdf`
  - mapped industry: `RETAIL`
  - mapped ticker lane: `MWG`

The PDF source files are not committed.

## Scope

- Local PDF read only.
- DB read only.
- No DB write.
- No schema change.
- No provider fetch.
- No source file import.
- No raw PDF text committed.
- No `IndustryMetric` introduced.
- No benchmark, ranking, scoring, stock attractiveness score, buy/sell/hold, target price, fair value, upside, or downside.

## Script

Created:

- `scripts/dry-run-industry-layer4-pdf-source-review.ts`

The script:

- verifies that each PDF exists
- extracts page text through the bundled Python runtime and `pypdf`
- checks page count and text character count
- checks whether expected industry terms are present
- records evidence page numbers
- maps each PDF to the reviewed industry lane
- marks all candidates as `research_only`, `needsReview=true`, `productionApproved=false`
- confirms it would not create or update `IndustryContext`
- confirms it would not create or update `IndustryContextProvenance`
- checks guardrail terms before allowing manual review

## Dry Run Result

Command:

`npx tsx scripts/dry-run-industry-layer4-pdf-source-review.ts`

Result:

- `phase=158B`
- `mode=dry_run_only`
- `targetPdfCount=3`
- `allPdfReadable=true`
- `allExpectedSignalsFound=true`
- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `sourceFilesCommitted=false`
- `rawPdfTextCommitted=false`
- `wouldWriteIndustryContextRows=0`
- `wouldWriteIndustryContextProvenanceRows=0`
- `industryContextRowsBefore=3`
- `industryContextProvenanceRowsBefore=3`
- `productionApprovedTrueCount=0`
- `forbiddenAdviceDetected=false`
- `benchmarkRankingScoringDetected=false`
- `buySellHoldDetected=false`
- `targetPriceFairValueUpsideDownsideDetected=false`
- `stockAttractivenessDetected=false`
- `industryMetricIntroduced=false`
- `layer5MetricComparisonIntroduced=false`
- `readyForManualReview=true`
- `dryRunPassed=true`

## Source Readability

### STEEL_MATERIALS

- file exists: yes
- page count: `29`
- extracted text characters: `43941`
- expected terms found: `thép`, `sản xuất`, `tiêu thụ`, `giá`, `nguyên liệu`
- evidence pages: `1, 2, 3, 4, 5, 6, 7, 8`
- useful for: steel production, consumption, price movement, raw-material pressure, domestic demand, exports, inventory, and margin-pressure context
- limitation: ticker-specific content must stay excluded from automated conclusions

### CONSUMER_STAPLES_DAIRY

- file exists: yes
- page count: `30`
- extracted text characters: `54795`
- expected terms found: `tiêu dùng`, `thu nhập`, `hộ gia đình`, `sức mua`, `bán lẻ`
- evidence pages: `1, 2, 3, 4, 5, 6, 7, 8`
- useful for: household income, purchasing power, consumer confidence, channel change, and broad consumer-staples demand context
- limitation: the report is broad consumer-sector context, not dairy-only context

### RETAIL

- file exists: yes
- page count: `20`
- extracted text characters: `30639`
- expected terms found: `bán lẻ`, `doanh thu`, `sức mua`, `thương mại điện tử`, `chuỗi`
- evidence pages: `2, 3, 4, 5, 6, 7, 8, 9`
- useful for: retail sales, purchasing power, modern retail chains, rural expansion, e-commerce channel change, inventory, costs, and consumer confidence
- limitation: stock-specific discussion sections must stay excluded from automated Layer 4 context

## Current Conclusion

The three PDFs are useful for improving Layer 4 qualitative context, but this phase intentionally stops before creating revised `IndustryContext` rows.

The right next step is manual review and source-package drafting: convert the useful PDF-backed points into concise Layer 4 fields, keep source references, and keep all missing or unsupported claims as `N/A` or `needsReview`.

## Recommended Next Phase

Phase 158C - Industry PDF Layer 4 Source Package Manual Review.

This phase should prepare reviewed candidate context packages from the PDFs for the three industries. It should still be dry-run first, with no DB write until a later confirm-write phase.

## Validation

- `npx eslint scripts/dry-run-industry-layer4-pdf-source-review.ts` - passed
- `npx tsx scripts/dry-run-industry-layer4-pdf-source-review.ts` - passed
- `npx prisma validate` - passed
- `npx prisma generate` - passed
- `npm run typecheck` - passed

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
- `productionApprovedTrueCount=0`
