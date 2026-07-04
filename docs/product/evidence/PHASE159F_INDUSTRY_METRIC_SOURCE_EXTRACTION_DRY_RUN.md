# Phase 159F - IndustryMetric Source Extraction Dry Run

## Goal

Read the three local industry PDFs and identify possible numeric industry metric source locations, without writing any metric data.

PDFs checked:

- `D:\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf`
- `D:\nganh_ban_le.pdf`
- `D:\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf`

## Scope

- No DB write.
- No schema change.
- No migration creation.
- No provider fetch.
- No raw source import.
- No `IndustryMetric` write.
- No `IndustryMetricProvenance` write.
- No UI change.
- No Assistant prompt change.
- No benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output.
- No fake metric value.

## Script

Created:

- `scripts/dry-run-industry-metric-source-extraction.ts`

The script uses local PDF text extraction to find candidate pages/snippets for planned Layer 5 metrics.

It intentionally keeps:

- `extractedValue = null`
- `productionApproved = false`
- `needsReview = true`

It also excludes pages that look like stock-view or valuation context. Layer 5 metrics should only use industry data evidence, not equity opinion pages.

## Candidate Metrics Checked

Steel:

- `STEEL_FINISHED_SALES_VOLUME`
- `STEEL_PRICE_REFERENCE`
- `STEEL_INPUT_COST_REFERENCE`

Retail:

- `RETAIL_SALES_INDEX`
- `RETAIL_GROSS_MARGIN`
- `RETAIL_INVENTORY_DAYS`

Consumer staples / dairy:

- `DAIRY_REVENUE_GROWTH`
- `DAIRY_GROSS_MARGIN`
- `DAIRY_INPUT_COST_REFERENCE`

## Result Meaning

This phase can find candidate numeric hints inside the PDFs, but those hints are not yet real database values.

Before any metric can be written, each candidate still needs review for:

- exact value
- unit
- period
- industry scope
- source permission
- whether the number is industry-level or company-only

## Guardrail Result

Expected script output:

- `phase=159F`
- `mode=industry_metric_source_extraction_dry_run`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `industryMetricProvenanceWriteAttempted=false`
- `candidateRowsWithExtractedValue=0`
- `candidateRowsProductionApproved=0`
- `excludedInvestmentContextPageHits` reported
- `readyForRealMetricImport=false`
- `auditPassed=true`

## Conclusion

Layer 5 schema exists, but Layer 5 data remains empty.

This phase only maps where useful PDF evidence may exist. It does not promote PDF numbers into product data.

## Recommended Next Phase

Phase 159G - Reviewed IndustryMetric Source Mapping.

That phase should manually review the candidate snippets and decide which exact values, units, periods, and source keys are eligible for a controlled DB write.
