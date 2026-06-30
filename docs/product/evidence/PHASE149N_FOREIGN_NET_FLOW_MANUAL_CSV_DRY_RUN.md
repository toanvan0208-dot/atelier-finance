# Phase 149N: FOREIGN_NET_FLOW Manual CSV Dry-Run

## Objective
Dry-run the parsing of the manually aggregated `FOREIGN_NET_FLOW` CSV data for the Vietnam equity market (HOSE). Ensure validation rules are strictly enforced and properly distinguish exact article URLs from generic publisher homepages that need further review.

## Source Description
- **Indicator**: FOREIGN_NET_FLOW
- **Market**: HOSE
- **Source Files**: `data/manual-review/macro/foreign-net-flow/vietnam-foreign-net-flow-manual.csv`
- **Data Mode**: manual_aggregated_foreign_net_flow_candidate

## Validation Rules Enforced
- `indicatorCode` is inherently mapped to FOREIGN_NET_FLOW
- `period_type` must be monthly
- `unit` must be billion_vnd
- `value_type` must be net_value
- `market` must be HOSE (or ALL_MARKET)
- Zero-fills are strictly forbidden for missing data.
- Quotes, notes, and sources must not be empty.
- Candidate state is preserved (`productionApproved=false`, `needsReview=true`).

## Results
- `dbWriteAttempted`: false
- `candidateRowsGenerated`: 12
- `blockedRows`: 0
- `readyForConfirmWrite`: true
- `productionApprovedTrueCount`: 0
- `needsReviewCount`: 12
- `periodRange`: 2024-01 to 2024-12
- `duplicatePeriodCount`: 0
- `positiveNetBuyingRows`: 1
- `negativeNetSellingRows`: 11
- `exactArticleUrlCount`: 4
- `genericSourceUrlCount`: 8
- `needsSourceReviewCount`: 8

## Caveat Summary
- Needs Review: True
- Production Approved: False
- Source Type: manual_aggregated_foreign_net_flow_candidate
- Some rows use generic publisher homepage/stat page URLs and require exact article URL review.

## Validation 
- Prisma validate, generate, migrate status: pass
- Typecheck: pass
- Build: pass
- Targeted lint: pass

## Recommended Next Phase
- Phase 149O: FOREIGN_NET_FLOW manual candidate confirm-write.
