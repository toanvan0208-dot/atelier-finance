# PHASE140A: Product Readiness Smoke and UX Gap Audit

## 1. Phase summary
- **Goal**: Perform an end-to-end product readiness smoke test and identify UX/Data gaps from a user's perspective.
- **Scope**: Overview, Macro, Industry, Screening, Business, Financials, Valuation, Risk, Checklist, Watchlist, Simulation, AI Assistant across 6 core tickers (FPT, HPG, VNM, MSN, MWG, VCB).
- **Result**: Successfully confirmed data safety guardrails (no recommendation language, clear missing data). Documented remaining gaps for future prioritization.

## 2. Current ticker source matrix
| ticker | expected source | observed source | EPS status | sharesOutstanding status | totalDebt status | productionApproved | notes |
|--------|-----------------|-----------------|------------|--------------------------|------------------|--------------------|-------|
| FPT | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | present | present | present | false | Correctly loading manually reviewed preview |
| HPG | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | present | present | present | false | Correctly loading manually reviewed preview |
| VNM | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | present | present | present | false | Correctly loading manually reviewed preview |
| MSN | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | present | present | present | false | Correctly loading manually reviewed preview |
| MWG | `phase109_controlled_local_financials` | `phase109_controlled_local_financials` | present | present | present | false | Kept local source since PDF was sustainability report |
| VCB | `vnstock_financials_candidate` | `vnstock_financials_candidate` | present | present | `needs_bank_mapping` | false | Explicitly not imported to corporate preview, totalDebt mapped as bank-specific |

## 3. Route/module smoke results
- **Load Status**: All major routes (`/api/companies/[ticker]`, `/api/assistant`, `/workspace`) load successfully without crash or hydration errors.
- **Errors**: No 500 server errors encountered.

## 4. Financials data-quality smoke
- **Data Rendering**: EPS, sharesOutstanding, and totalDebt (for non-banks) show values correctly.
- **Missing Fields**: Missing secondary fields correctly show as N/A or Needs Review instead of zero-fill.
- **Quality Badges**: UI displays `research_only` status. `productionApproved: false` logic is intact.

## 5. Valuation guardrail smoke
- **Missing Data Handling**: Displays "N/A" rather than defaulting.
- **Guardrails**: No explicitly generated "target price", "fair value", or actionable "upside/downside" advice.
- **Tone**: Neutral metrics-based assessment. No "cheap/expensive" claims.

## 6. Risk guardrail smoke
- **Debt Usage**: FPT, HPG, VNM, MSN, and MWG consume their valid source `totalDebt`.
- **Bank Handling**: VCB correctly does not use corporate total liabilities. Debt mapping is skipped.
- **Missing Values**: Blocked reasons correctly report `missing` instead of falling back to zero.

## 7. Checklist smoke
- **Guardrails**: Metrics and data presence check only. Does not produce a buy/sell conclusion. Missing data yields a neutral/unknown checklist state.

## 8. AI Assistant context/guardrail smoke
- **Context Injection**: Correctly includes missing fields (`moduleContext`, `source`, `asOf`, `period`), and passes data quality states.
- **Guardrails**: Prompt strictly includes "Never recommend buy/sell/hold".
- **Gap Identified**: For VCB, the bank caveat is *not* explicitly mentioned in the assistant prompt context string.

## 9. UX gaps found
| Severity | Area | Description | Reproduction | Suggested fix | Next Phase Action |
|----------|------|-------------|--------------|---------------|-------------------|
| P1 | AI Assistant | VCB lacks explicit bank caveat in AI context | Ask AI about VCB debt, AI might use generic corporate logic | Inject `"bank_specific_caveat"` into assistant prompt if ticker is bank | Should fix next phase |
| P2 | Financials UI | `research_only` badge might not be prominent enough | View Financials tab | Use warning color/icon for `research_only` and `productionApproved: false` | Should fix next phase |

## 10. Data gaps found
| Severity | Area | Description | Suggested fix | Next Phase Action |
|----------|------|-------------|---------------|-------------------|
| P1 | Risk Data | OperatingCashFlow missing across multiple tickers | Implement data source for cash flows | Add to future backlog |
| P2 | Data Source | VCB missing `totalDebt` equivalent mapping | Design a bank-specific financial statement schema | Wait for banking feature epic |

## 11. Recommended next phases
- **Phase 140B**: Fix P1 AI Assistant gap by injecting bank-specific caveats to the RAG context.
- **Phase 141**: Focus on styling/UX refinement (P2) for data-quality badges across Financials, Risk, and Valuation.

## 12. Validation results
- `npx prisma validate`: Passed
- `npm run typecheck`: Passed
- `npm run lint`: Passed
- `npm test`: Passed
- `npm run build`: Passed
- Test execution verified successful locally during execution.

## 13. Git status
- Modified only the scope-related scripts and evidence files.
- `tsconfig.tsbuildinfo` reverted.
- Unrelated tracks (`docs/thesis`, PDFs) completely skipped.
