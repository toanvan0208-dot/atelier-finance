# Phase 138E VNStock financials candidate preview

## Scope
- Tickers: FPT, MWG, VNM, HPG, VCB, MSN
- Fiscal year: 2025
- Data mode: research_only
- Production approved: false

## Implementation mode
- Existing VNStock financials adapter found?: no
- Preview executed?: no
- DB write executed?: no

## Candidate field coverage
Table:
ticker | revenue | netIncome | operatingCashFlow | totalAssets | totalEquity | totalLiabilities | totalDebt | eps | sharesOutstanding
---|---|---|---|---|---|---|---|---|---
FPT | missing | missing | missing | missing | missing | missing | missing | missing | missing
MWG | missing | missing | missing | missing | missing | missing | missing | missing | missing
VNM | missing | missing | missing | missing | missing | missing | missing | missing | missing
HPG | missing | missing | missing | missing | missing | missing | missing | missing | missing
VCB | missing | missing | missing | missing | missing | missing | missing | missing | missing
MSN | missing | missing | missing | missing | missing | missing | missing | missing | missing

Use statuses:
- available_candidate
- missing
- needs_review
- unit_uncertain
- not_applicable

## Unit/mapping risks
- The repository currently supports VNStock market/PVT prices only.
- There is no existing capability to fetch or map financial statements (income statement, balance sheet, cashflow, ratios) from VNStock.
- We must build a robust provider connector if we decide to source financials from VNStock, as financial datasets typically require careful unit alignment and strict field mapping.

## VCB banking caveat
- VCB is a bank; if a VNStock financials crawler is built in the future, it must handle VCB's specific banking fields (e.g. interest income vs revenue, customer deposits vs total debt). Standard industrial operating cashflow mappings may not apply.

## Reproducibility
- Command used: N/A (Adapter not present)
- Input tickers: FPT, MWG, VNM, HPG, VCB, MSN
- Output location if any: N/A

## Required next action
- A separate, dedicated Phase should be scheduled for Codex to implement the `vnstock-financials-connector` using the proper Python integration layer (similar to `vnstock-research-connector.ts`). It must include rigorous unit tests for mapping standard fields and handling the VCB banking caveat before any data is previewed or imported.
