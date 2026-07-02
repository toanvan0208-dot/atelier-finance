# Phase 151X - FPT HPG VNM Manual Company Identity CSV Dry Run

## Goal

Validate the manual reviewed Company identity CSV for:

- `FPT`
- `HPG`
- `VNM`

Then determine whether these three tickers are now ready for a later bounded Company metadata confirm-write.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No `MarketPrice` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- No issuer local seed as reviewed metadata.
- No inference for exchange, market, sector, or industry label.
- Missing data remains null/N/A/needs_review.
- `productionApproved=true` remains zero.
- MSN/MWG/VCB untouched.
- HSG/NKG untouched.
- TVN absent.
- Raw CSV not committed.

## Files Changed

- `scripts/dry-run-fpt-hpg-vnm-manual-company-identity-csv.ts`
- `docs/product/evidence/PHASE151X_FPT_HPG_VNM_MANUAL_COMPANY_IDENTITY_CSV_DRY_RUN.md`

## CSV Path Inspected

`data/manual-review/company-identity/fpt-hpg-vnm-company-identity-reviewed.csv`

Result: `csvFound=false`.

The raw CSV was not present in the workspace path during this dry-run. The script therefore failed closed and did not prepare eligible Company identity candidates.

## CSV Validation Result

```json
{
  "phase": "151X",
  "mode": "dry_run",
  "targetTickers": ["FPT", "HPG", "VNM"],
  "csvFound": false,
  "requiredColumnsPresent": false,
  "identityCandidatesPrepared": 3,
  "eligibleIdentityCandidates": 0,
  "blockedIdentityCandidates": 3,
  "readyForCompanyConfirmWriteByTicker": {
    "FPT": false,
    "HPG": false,
    "VNM": false
  },
  "tickersReadyForCompanyConfirmWrite": [],
  "tickersBlocked": ["FPT", "HPG", "VNM"],
  "manualCsvAccepted": false,
  "wouldAllowAllCoreCompanyConfirmWrite": false,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "uiChanged": false,
  "assistantChanged": false,
  "screeningCandidateWriteAttempted": false,
  "marketPriceWriteAttempted": false,
  "financialStatementWriteAttempted": false,
  "companyIndustryWriteAttempted": false,
  "productionApprovedTrueCount": 0,
  "msnMwgVcbUntouched": true,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "forbiddenAdviceDetected": false,
  "rawCsvCommitted": false,
  "smokePassed": true
}
```

## Identity Candidate Table

| Ticker | CSV row available | Eligible | Blocker |
| --- | --- | --- | --- |
| FPT | No | No | `csv_missing` |
| HPG | No | No | `csv_missing` |
| VNM | No | No | `csv_missing` |

## Missing Identity Fields

| Ticker | Missing fields |
| --- | --- |
| FPT | companyName, sourceType, sourceLabel, extractedQuote, reviewNote, exchange, industryLabel |
| HPG | companyName, sourceType, sourceLabel, extractedQuote, reviewNote, exchange, industryLabel |
| VNM | companyName, sourceType, sourceLabel, extractedQuote, reviewNote, exchange, industryLabel |

Missing fields remain null/N/A/needs_review. Nothing was inferred from issuer local seed, runtime copy, static UI copy, or test fixtures.

## Source Decision By Ticker

| Ticker | Source decision |
| --- | --- |
| FPT | Blocked: manual reviewed Company identity CSV was not found at the required path. |
| HPG | Blocked: manual reviewed Company identity CSV was not found at the required path. |
| VNM | Blocked: manual reviewed Company identity CSV was not found at the required path. |

## Whether FPT/HPG/VNM Are Ready

No. All three remain blocked because the CSV file was not available at the required path during validation.

## Whether All Six Core Tickers Can Be Written Together Next

No.

Phase 151V left `MSN`, `MWG`, and `VCB` ready for Company metadata confirm-write. Phase 151X did not make `FPT`, `HPG`, or `VNM` ready because the manual CSV was not found. A single all-six Company metadata confirm-write is therefore not ready.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- `MarketPrice` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- MSN/MWG/VCB untouched: yes.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.
- Raw CSV committed: no.

## Validation

- `npx eslint scripts/dry-run-fpt-hpg-vnm-manual-company-identity-csv.ts` - passed.
- `npx tsx scripts/dry-run-fpt-hpg-vnm-manual-company-identity-csv.ts` - passed, fail-closed with `csvFound=false`.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

Some tickers remain blocked.

Recommended next step:

- Put the manual reviewed CSV at `data/manual-review/company-identity/fpt-hpg-vnm-company-identity-reviewed.csv` and rerun Phase 151X validation; or
- proceed later only with already-ready Company metadata tickers from Phase 151V (`MSN`, `MWG`, `VCB`) while leaving `FPT`, `HPG`, and `VNM` blocked.
