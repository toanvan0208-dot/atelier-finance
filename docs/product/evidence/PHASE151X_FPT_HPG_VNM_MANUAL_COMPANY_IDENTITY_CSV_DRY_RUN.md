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

Result: `csvFound=true`.

The raw CSV was found at the expected local manual-review path. The dry-run validated it without mutating the CSV and without copying raw CSV content into this evidence file.

## CSV Validation Result

```json
{
  "phase": "151X",
  "mode": "dry_run",
  "targetTickers": ["FPT", "HPG", "VNM"],
  "csvFound": true,
  "requiredColumnsPresent": true,
  "identityCandidatesPrepared": 3,
  "eligibleIdentityCandidates": 3,
  "blockedIdentityCandidates": 0,
  "readyForCompanyConfirmWriteByTicker": {
    "FPT": true,
    "HPG": true,
    "VNM": true
  },
  "tickersReadyForCompanyConfirmWrite": ["FPT", "HPG", "VNM"],
  "tickersBlocked": [],
  "manualCsvAccepted": true,
  "wouldAllowAllCoreCompanyConfirmWrite": true,
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

| Ticker | CSV row available | Company name | Exchange | Eligible | Blocker |
| --- | --- | --- | --- | --- | --- |
| FPT | Yes | Công ty Cổ phần FPT | HOSE | Yes | null |
| HPG | Yes | Công ty Cổ phần Tập đoàn Hòa Phát | HOSE | Yes | null |
| VNM | Yes | Công ty Cổ phần Sữa Việt Nam | HOSE | Yes | null |

## Missing Identity Fields

| Ticker | Missing fields |
| --- | --- |
| FPT | industryLabel |
| HPG | industryLabel |
| VNM | industryLabel |

`industryLabel` remains intentionally absent because the CSV validates Company identity only. Nothing was inferred from issuer local seed, runtime copy, static UI copy, or test fixtures.

## Source Decision By Ticker

| Ticker | Source decision |
| --- | --- |
| FPT | Accepted: manual reviewed Company identity CSV row passed dry-run validation. |
| HPG | Accepted: manual reviewed Company identity CSV row passed dry-run validation. |
| VNM | Accepted: manual reviewed Company identity CSV row passed dry-run validation. |

## Whether FPT/HPG/VNM Are Ready

Yes. All three target tickers are ready for a later bounded Company metadata confirm-write.

## Whether All Six Core Tickers Can Be Written Together Next

Yes.

Phase 151V left `MSN`, `MWG`, and `VCB` ready for Company metadata confirm-write. This rerun of Phase 151X validates `FPT`, `HPG`, and `VNM` as ready. A single all-six Company metadata confirm-write is now ready as a later explicit confirm-write phase, subject to keeping the same research-only caveats and write guards.

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
- `npx tsx scripts/dry-run-fpt-hpg-vnm-manual-company-identity-csv.ts` - passed with `csvFound=true`, `manualCsvAccepted=true`, and `rawCsvCommitted=false`.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

All three target tickers are ready.

Recommended next step:

- Phase 151Y - Core ticker Company metadata confirm-write for all six ready tickers (`FPT`, `HPG`, `VNM`, `MSN`, `MWG`, `VCB`), with no `ScreeningCandidate`, `MarketPrice`, `FinancialStatement`, or `CompanyIndustry` writes unless separately approved.
