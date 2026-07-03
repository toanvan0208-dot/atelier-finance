# Phase 156A — Market Index And Sector Index CSV Dry Run

## Goal
Dry-run validate market and sector index time-series data from CSV files to support Technical/PVT market/sector comparison.

## Scope
- Read and validate 3 local CSV files outside the repo.
- Check data integrity, format, and content against validation rules without making any DB writes or schema changes.
- Ensure strict compliance with guardrails by detecting any forbidden wording.
- Recommend the best storage structure for the data.

## Source CSV Files Note
The following external CSV files were read and processed successfully:
- `D:\market_indexes_vnindex_vn30_from_2020.csv`
- `D:\market_index_vnmat_from_2020.csv`
- `D:\market_index_vncons_from_2020.csv`
These files are kept completely outside the repository and have not been committed, in accordance with the git rules.

## Validation Results

### Rows by Symbol
- **VNINDEX**: 1,699 rows
- **VN30**: 1,699 rows
- **VNMAT**: 1,699 rows
- **VNCONS**: 1,699 rows
- **Total Valid Rows**: 6,796

### Date Range by Symbol
- **VNINDEX**: 2019-09-13 to 2026-07-03
- **VN30**: 2019-09-13 to 2026-07-03
- **VNMAT**: 2019-09-12 to 2026-07-03
- **VNCONS**: 2019-09-12 to 2026-07-03

### Unit & Duplicate Validation
- **Duplicate Symbol-Date Rows**: 0
- **Unit Validation Passed**: Yes (Units were verified to align with `index_points` and `shares`).
- **Zero-Fill Detected**: False
- **Stock Tickers (HPG/VNM/MWG) Detected**: 0
- **TVN/HSG/NKG Detected**: 0
- **Unsupported Symbols**: 0

### Guardrail Checks
- **Trading/Advice wording (buy/sell/hold, etc.)**: None detected.
- **Target Price / Fair Value**: None detected.
- **Benchmark / Ranking / Scoring**: None detected.
- **productionApprovedTrueCount**: 0
- **Data Mode**: All rows appropriately marked as `research_only`.
- **Needs Review**: All rows correctly flagged as `needsReview = True`.

## Storage Recommendation
**Recommendation: Create new model `MarketIndexObservation`**

Creating a separate model rather than overloading `MarketPrice` is strongly recommended for the following reasons:
1. **Clear Context Separation**: Market and sector indices are aggregate metrics representing broader economic trends rather than individual company valuations. Keeping them separate avoids polluting company-specific logic.
2. **Distinct Units**: Indices use `index_points` while stock prices use fiat currency (`vnd`). Storing them separately prevents unit mixing and schema complications.
3. **Dedicated Metadata**: A separate model supports indexing-specific metadata (e.g. `indexName`) more cleanly.

### Intended Future Mapping
- **HPG** -> VNMAT (Sector proxy)
- **VNM** -> VNCONS (Sector proxy)
- **MWG** -> VNCONS (Broad consumer proxy, rather than an exact retail benchmark)
- **HPG/VNM/MWG** -> VNINDEX/VN30 (Broad market comparison)

## Strict Rule Confirmations
- DB writes: **No**
- Schema change: **No**
- Provider fetch: **No**

## Recommended Next Phase
Phase 156B — MarketIndexObservation Schema And Confirm-Write
