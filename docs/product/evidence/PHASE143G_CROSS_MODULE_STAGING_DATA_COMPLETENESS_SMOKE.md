# Phase 143G — Cross-module staging data completeness smoke

## Result
Cross-module staging data completeness check successfully verified all required foundational models for the approved staging tickers.

Coverage matrix generated:
```text
Ticker | Company | Business | Financials | MarketPrice | Macro | Industry | Valuation | Risk   | AssistantContext | Status
----------------------------------------------------------------------------------------------------------------------------------
FPT    | OK      | OK       | OK         | OK          | OK    | OK       | not_implemented | not_implemented | not_implemented  | PASS
HPG    | OK      | OK       | OK         | OK          | OK    | OK       | not_implemented | not_implemented | not_implemented  | PASS
VNM    | OK      | OK       | OK         | OK          | OK    | OK       | not_implemented | not_implemented | not_implemented  | PASS
MSN    | OK      | OK       | OK         | OK          | OK    | OK       | not_implemented | not_implemented | not_implemented  | PASS
MWG    | OK      | OK       | OK         | OK          | OK    | OK       | not_implemented | not_implemented | not_implemented  | PASS
VCB    | excluded | excluded | excluded   | excluded    | OK    | null     | not_implemented | not_implemented | not_implemented  | excluded behavior verified
```

## Key Findings
- **Company**: All 5 approved tickers have matching DB records (`dataMode="research_only"`). VCB is correctly missing/excluded.
- **Business Profile**: All 5 have a `staging_company_business_profile_research_seed` profile. No buy/sell/recommendation language. VCB correctly absent.
- **Financials**: `annual_report_2025_pdf_reviewed_preview` is available for all 5 with correct explicit status for unit metadata. VCB excluded.
- **Market Price**: All 5 have successfully seeded rows under `vnstock_research_candidate`. 
- **Macro**: Global macro context seeded and available.
- **Industry**: Industry contexts loaded for each valid ticker.

## Actions Taken
- Created and successfully executed `scripts/smoke-staging-cross-module-data-completeness.ts`.
- Validated individual read-paths: Company, Business, Financials, MarketPrice, Macro, and Industry.
- Confirmed VCB rejection holds cross-module.

Staging data is complete and ready for the next phase (Valuation schema).
