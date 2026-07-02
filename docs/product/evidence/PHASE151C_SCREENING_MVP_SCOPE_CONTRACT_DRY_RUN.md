# Phase 151C — Screening MVP Scope Contract Dry Run

## Goal
Define a safe Screening MVP scope and eligibility contract before adding HSG/NKG screening data.
This phase must not write DB, must not fetch providers, must not add source packages, and must not change runtime behavior unless needed for a pure contract/audit script.

## Scope
- Define Screening MVP contract in dry-run script.
- Assert TVN is entirely excluded from Screening MVP.
- Verify guardrails (no DB write, no provider fetch, no valuation benchmark).

## Screening MVP Contract

### Coverage Level Definitions
- **`full_analysis`**: Can be used to continue into Business / Financials / Valuation / Risk / AI if current product read-path supports it.
- **`screening_candidate`**: Can appear in Screening results and be filtered by sơ bộ metrics, but cannot continue into deep analysis unless later upgraded.
- **`missing_safe`**: Cannot be inferred into a reviewed industry/peer/coverage category.

### Core Metrics List
- P/E
- P/B
- total debt / debt-to-equity
- CFO
- liquidity
- data quality

### Boundary Table

| Ticker | Role / Category | Notes |
|---|---|---|
| **HPG** | reviewed industry | potential `full_analysis` if existing read-path supports |
| **MWG** | reviewed industry | potential `full_analysis` if existing read-path supports |
| **VNM** | reviewed industry | potential `full_analysis` if existing read-path supports |
| **HSG** | future steel direct peer screening candidate | `screening_candidate` only, not written yet |
| **NKG** | future steel direct peer screening candidate | `screening_candidate` only, not written yet |
| **TVN** | excluded from Screening MVP | excluded entirely |
| **FPT** | `missing_safe` | no reviewed industry inference from Screening contract |
| **VCB** | `missing_safe` | no reviewed industry inference from Screening contract |
| **MSN** | `missing_safe` | no reviewed industry inference from Screening contract |

### Explicit Notes
- No DB write.
- No provider fetch.
- No schema change.
- No HSG/NKG data added yet.
- No TVN screening data planned.
- No IndustryMetric.
- No valuation/risk benchmark.
- No stock ranking.
- No stock attractiveness scoring.
- No `productionApproved=true`.

## Next Recommended Phase
Phase 151D — HSG/NKG steel direct peer screening metric source package dry-run.
