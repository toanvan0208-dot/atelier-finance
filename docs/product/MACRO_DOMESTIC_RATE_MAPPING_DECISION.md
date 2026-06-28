# Macro Domestic Rate Semantic Mapping Decision

## Context
The Macro frontend has a predefined, locked card labeled **"Lãi suất trong nước"** (domestic-rate).
Previously, this card was mapped directly to the backend indicator `INTERBANK_RATE_OVERNIGHT`.

## Issue
The label "Lãi suất trong nước" is a broad term that can represent various interest rates, including:
- Lãi suất liên ngân hàng qua đêm (Interbank rate overnight)
- Lãi suất điều hành (Policy rate)
- Lợi suất trái phiếu chính phủ (Gov bond yield)
- Lãi suất huy động (Deposit rate)
- Lãi suất cho vay (Lending rate)

`INTERBANK_RATE_OVERNIGHT` is very specific and its source (SBV HTML) is currently blocked due to instability.

## Candidates & Semantic Fit
1. **POLICY_RATE**
   - **Fit**: Strong. Represents the central bank's monetary policy stance which sets the tone for "lãi suất trong nước".
   - **Source**: SBV (HTML/PDF parsing required, candidate source).
2. **INTERBANK_RATE_OVERNIGHT**
   - **Fit**: Medium/Weak for a general audience. Too specific.
   - **Source**: Blocked.
3. **GOV_BOND_YIELD_10Y**
   - **Fit**: Medium. Represents long term capital cost, not retail/corporate rates.
   - **Source**: HNX (Difficult to extract).
4. **DEPOSIT_RATE** / **LENDING_RATE**
   - **Fit**: Medium. Highly relevant to retail investors.
   - **Source**: Unsupported. No standardized free aggregation source.

## Decision (Phase 148J)
**Recommendation**: `replace_current_mapping` -> **`POLICY_RATE`**

After product review, `POLICY_RATE` was selected as the representative indicator for the "Lãi suất trong nước" frontend card because it best reflects the central bank's monetary policy stance, fitting the broad macroeconomic scope of the dashboard.
`INTERBANK_RATE_OVERNIGHT` was retired from the frontend mapping but remains in the universe as a candidate/historical indicator.

The runtime mapping in `load-macro-runtime-data.ts` has been updated to use `POLICY_RATE` via the semantic mapping registry (`DOMESTIC_RATE_FRONTEND_INDICATOR_CODE`).
`POLICY_RATE` remains not DB-backed (`dbBacked=false`, `productionApproved=false`) and requires source assessment/verification before observations can be ingested. No data was extracted, no fake data was created, and no database writes were attempted.
