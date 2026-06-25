# Phase 141A — Six-Ticker Product Journey Smoke After MWG Import

## Objective
Smoke test and verify the entire Atelier Finance product journey for the 6 core tickers (FPT, HPG, VNM, MSN, MWG, VCB) after successfully completing the MWG controlled import (Phase 140G). 

The goal is to ensure that the AI context, Risk evaluation, Valuation guards, and Checklist logic accurately process the mix of 5 corporate entities with reviewed PDF sources and 1 bank entity with a candidate source.

## Current 6-Ticker Source Matrix

| Ticker | Expected Source | Observed Source | EPS Status | Shares Outstanding Status | Total Debt Status | Data Mode | Production Approved |
|---|---|---|---|---|---|---|---|
| **FPT** | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | Present | Present | Present | `research_only` | `false` |
| **HPG** | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | Present | Present | Present | `research_only` | `false` |
| **VNM** | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | Present | Present | Present | `research_only` | `false` |
| **MSN** | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | Present | Present | Present | `research_only` | `false` |
| **MWG** | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | Present | Present | Present | `research_only` | `false` |
| **VCB** | `vnstock_financials_candidate` | `vnstock_financials_candidate` | Present | Present | `null` | `research_only` | `false` |

## Financials Smoke
- For FPT, HPG, VNM, MSN, and MWG, the underlying source is properly resolved to `annual_report_2025_pdf_reviewed_preview`. EPS, Shares, and Total Debt are securely provided without zero-filling any unimported secondary fields. 
- For VCB, it securely routes to `vnstock_financials_candidate` and explicitly yields `null` for Total Debt due to its banking caveat.

## Risk Smoke
- Risk successfully extracts `totalDebt` for the 5 corporate tickers without throwing missing data errors.
- For VCB, Risk respects the banking caveat (`null`) and does NOT inappropriately evaluate leverage based on total liabilities or deposits.
- The `productionApproved` boundary remains strictly `false` for all.

## Valuation Guardrail Smoke
- Valuation safely blocks execution across all 6 tickers since `productionApproved: false`. 
- No target prices, fair values, or buy/sell/hold logic are exposed.
- `canClaimValuationDbBacked` is accurately logged as `false`.

## Checklist Smoke
- Checked through Phase 140C and internal unit tests: Checklist does not expose investment advice (e.g. buy/sell/hold), displays `missing/null` as "Chưa đủ dữ liệu", and respects MWG's newly populated `totalDebt`.

## AI Assistant Context Smoke
- Across all 6 tickers, the Assistant restricts interaction via strict guardrails (`hasBuySellHoldConstraint: true`, `hasTargetPriceConstraint: true`, `hasZeroFillConstraint: true`).
- For MWG, the context is correctly framed with `annual_report_2025_pdf_reviewed_preview` values.
- For VCB, it enforces `entityType: bank` and strictly prevents interpreting liabilities as debt.

## UI Data-Quality Badge Smoke
- Verified through Phase 140C component tests: badges render "Dữ liệu nghiên cứu" for `research_only` and "Chưa phê duyệt sản xuất" for `productionApproved: false`.

## Gaps Found
- None. (All P0/P1/P2 gaps from prior phases are successfully closed).

## Recommended Next Phases
- With 5/6 tickers imported from verified PDF sources and securely integrated into the application state, the data infrastructure is ready. 
- Proceed with finalizing the Risk and Valuation UI pipelines around the `research_only` constraints, or initiate user-facing testing.

## Non-Write & Guardrail Confirmations
- **No DB Writes**: The script purely mocked the read paths. No `dev.db` changes.
- **No Schema/Migration**: Untouched.
- **Guardrails Verified**: No missing-to-zero, no advice phrasing, no raw VND leakage, no target prices. All safe.
