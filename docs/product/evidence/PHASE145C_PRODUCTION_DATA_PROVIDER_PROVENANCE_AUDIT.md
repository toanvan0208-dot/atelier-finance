# Phase 145C — Production Data Provider/Provenance Hardening Audit

## Overview
This phase audits the production readiness of all data domains within the system, focusing on data provenance, provider pipelines, and criteria required for `productionApproved=true`. No production data was imported or promoted in this phase.

- **Starting commit**: `8f9a9c5`
- **Scope**: Entire system data provider pipelines, seed scripts, and module data loaders.

## Current Source Inventory & Data Domain Readiness

| Data Domain | Current `sourceLabel` | `dataMode` | `productionApproved` | Current Source Type | Used By Modules | Production Gap |
| --- | --- | --- | --- | --- | --- | --- |
| **Company** | `staging_company_business_profile_research_seed` | `research_only` | `false` | Manual research seed | Overview, Business | Needs official registry / verified data pipeline |
| **Business profile** | `staging_company_business_profile_research_seed` | `research_only` | `false` | Manual research seed | Business | Needs verifiable narrative provider |
| **FinancialStatement** | `phase109_controlled_financials_research_seed` / `vnstock_financials_candidate` | `research_only` | `false` | Candidate provider / research seed | Financials, Valuation, Risk | Requires official filing provider, unit validation, no missing-to-zero |
| **FinancialStatementUnitMetadata**| `phase109_controlled_financials_research_seed` | `research_only` | `false` | Derived | Financials, Assistant | Needs audit trail and explicit boundary validation |
| **MarketPrice** | `vnstock_research_candidate` | `research_only` | `false` | Candidate provider (VNStock) | PVT, Valuation | Needs reliable/licensed data feed provider with SLA |
| **Technical/PVT** | `vnstock_research_candidate` | `research_only` | `false` | Candidate provider (VNStock) | PVT, Screening | Same as MarketPrice |
| **MacroContext** | `future_db_backed` | `research_only` | `false` | Fallback / Synthetic | Business | Missing actual macro DB provider pipeline |
| **IndustryContext** | `future_db_backed` | `research_only` | `false` | Fallback / Synthetic | Business | Missing actual industry DB provider pipeline |
| **Valuation inputs** | Inherited from Financials & MarketPrice | `research_only` | `false` | Derived | Valuation | Blocked by underlying data readiness |
| **Risk inputs** | Inherited from Financials & MarketPrice | `research_only` | `false` | Derived | Risk | Blocked by underlying data readiness |
| **Assistant context** | `static_editorial_content` | `sample` | `false` | Hardcoded / Context RAG | Assistant | Needs vector DB / RAG integration for real data |

## Production Approval Criteria

To transition any data domain to `productionApproved=true`, the following strict criteria must be met:
1. **Provider Reliability**: Source is from an accepted, licensed, or officially reviewed document/API with SLA.
2. **Unit Validation**: Unit metadata is fully validated (e.g., VND, percent).
3. **No Fallback/Zero-fill**: No missing fields filled as `0`. Missing data must explicitly be `null`/`N/A`.
4. **Strict Definitions**: e.g., No `totalLiabilities` used as `totalDebt`.
5. **Ticker/Bank Mapping**: Ticker-specific and bank-specific mapping schemas are correctly applied. (VCB/banks currently unsupported).
6. **Audit Trail**: Source timestamp (`asOfDate`), source owner, and collection method are recorded.
7. **Rollback Plan**: Clear ability to roll back the data snapshot if regressions occur.
8. **Reproducibility**: Import scripts must be idempotent and reproducible.
9. **Smoke Tests**: DB read-path smoke tests pass against staging database.
10. **Guardrails Preserved**: System copy and AI prompts preserve limitations (no recommendations, predictions).

## Provider Pipeline Audit

1. **VNStock Candidate (Technical/PVT/MarketPrice)**
   - **Can be automated?** Yes, via Python scripts.
   - **Can be verified?** Difficult. Relies on undocumented APIs.
   - **Can support production?** Marginally, for non-critical price data if accepted as `licensed_vendor` equivalent, but risky for official financials.
   - **Fields safe**: Open, High, Low, Close, Volume.
   - **Fields not safe**: Financial statement metrics (often missing or mislabeled).

2. **Annual Report PDF (Reviewed-Preview)**
   - **Can be automated?** Partially (OCR/Extraction), but requires manual review.
   - **Can be verified?** Highly verifiable (direct from source).
   - **Can support production?** Yes, but not scalable without significant operational effort.
   - **Fields safe**: All standard financial fields once verified.
   - **Fields not safe**: None, provided manual QA passes.

3. **Manual Staging Seed / Local Research Seed**
   - **Can be automated?** No, purely hardcoded.
   - **Can support production?** Absolutely not. Must be replaced.

## Data Risks & Limitations
- **VCB/Banks**: Financial statement structure for banks is entirely different from non-financial companies. Treating bank liabilities as standard debt will cause catastrophic logic errors in valuation/risk. Banks remain unsupported.
- **Fallback Risks**: Allowing `allowFallback` to trigger static mock data in production hides pipeline failures. It must be gated out.
- **Missing-to-Zero**: Treating missing trailing 12-month data as 0 completely corrupts PE, ROE, and growth metrics.

## Recommended Next Phase

**Option B/F — Harden MarketPrice / Technical provider first (Phase 145D)**
*Why:* Market Price / Technical data (via VNStock or similar) is tabular, uniform, and less subjective than financial statements. It has no complex bank-vs-non-bank structural issues. Hardening this pipeline establishes the first real `productionApproved=true` pipeline, validating the PostgreSQL read-path and setting the standard for the more complex FinancialStatement pipeline that follows.

## Technical Execution Summary
- **DB write**: No
- **Data seed/import**: No
- **Schema migration**: No
- **Rollback**: No
- **Production deploy/import**: No
- **Live LLM call**: No

## readyForNextPhase
Yes.
