# Phase 149O: Remaining Vietnam Macro Manual CSV Dry-Run

## Objective
Dry-run the parsing of the remaining manually aggregated CSVs for Vietnam macro candidates (`PMI_MANUFACTURING`, `POLICY_RATE`, `MARKET_TRADING_VALUE`). Validate that no zero-fills exist, schemas are adhered to, and source caveats are correctly logged without modifying the database.

## Commands Run
- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`
- Renamed `data/manual-review/macro/market-trading-value/hose_average_daily_trading_value_2025_2026.csv` to `vietnam-market-trading-value-manual.csv`
- `npx tsx scripts/dry-run-vietnam-macro-remaining-manual-csv.ts`
- Validation (`prisma validate`, `prisma generate`, `prisma migrate status`, `typecheck`, `build`, `lint`)

## Files Changed
- `scripts/dry-run-vietnam-macro-remaining-manual-csv.ts` (NEW)
- `docs/product/evidence/PHASE149O_REMAINING_VIETNAM_MACRO_MANUAL_CSV_DRY_RUN.md` (NEW)

## Input Files Checked
- `data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual.csv`
- `data/manual-review/macro/policy-rate/vietnam-policy-rate-manual.csv`
- `data/manual-review/macro/market-trading-value/vietnam-market-trading-value-manual.csv`

## Execution Results
- **DB Read Attempted**: False
- **DB Write Attempted**: False
- **Total Candidate Rows Generated**: 71
- **Production Approved True Count**: 0
- **Needs Review Count**: 71
- **No Zero Fill Detected**: True
- **No Placeholder As Real**: True

### Per-Indicator Summary

#### 1. PMI_MANUFACTURING
- **Candidate Rows Generated**: 29
- **Period Range**: 2024-01 to 2026-05
- **Ready for Confirm-Write**: True

#### 2. POLICY_RATE
- **Candidate Rows Generated**: 30
- **Period Range**: 2024-01 to 2026-06
- **Ready for Confirm-Write**: True
- **Caveat**: All 30 rows are monthly carry-forward snapshots of the refinancing rate. Generic sources found: 24.

#### 3. MARKET_TRADING_VALUE
- **Candidate Rows Generated**: 12
- **Period Range**: 2025-06 to 2026-05
- **Ready for Confirm-Write**: True
- **Caveat**: Average daily trading value per session (not total monthly). All 12 rows utilize generic URLs that require exact article URL review.

### Status Lists
- **Ready for Confirm Write List**: PMI_MANUFACTURING, POLICY_RATE, MARKET_TRADING_VALUE
- **Blocked List**: (None)

## Known Caveats
- `PMI_MANUFACTURING` is derived from a manual/secondary-source candidate.
- `POLICY_RATE` is a monthly carry-forward snapshot of the refinancing rate.
- `MARKET_TRADING_VALUE` represents average daily trading value per session, not total monthly trading value.

## Validation Results
- `prisma validate`: pass
- `prisma generate`: pass
- `prisma migrate status`: pass
- `typecheck`: pass
- `build`: pass
- `lint`: Targeted script passes cleanly. Global lint remains dirty due to old/out-of-scope debt.

## Next Recommended Phase
Phase 149P: Confirm-write FOREIGN_NET_FLOW, PMI_MANUFACTURING, POLICY_RATE, and MARKET_TRADING_VALUE into the database staging candidate zone.
