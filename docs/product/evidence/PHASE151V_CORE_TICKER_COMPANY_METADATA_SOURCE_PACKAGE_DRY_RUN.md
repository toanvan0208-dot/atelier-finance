# Phase 151V - Core Ticker Company Metadata Source Package Dry Run

## Goal

Prepare dry-run-only reviewed `Company` metadata source packages for the six core tickers:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

This phase closes only the Company metadata blocker when the source package is eligible. It does not touch `MarketPrice`, `FinancialStatement`, `CompanyIndustry`, or `ScreeningCandidate` data.

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
- No static UI/runtime copy as real data.
- No test fixture as real data.
- No evidence text alone as real data unless tied to reviewed source/provenance artifacts.
- Missing data remains null/N/A/needs_review.
- `productionApproved=true` remains zero.
- HSG/NKG untouched.
- TVN absent.

## Files Changed

- `scripts/dry-run-core-ticker-company-metadata-source-package.ts`
- `docs/product/evidence/PHASE151V_CORE_TICKER_COMPANY_METADATA_SOURCE_PACKAGE_DRY_RUN.md`

## Sources Inspected

- `prisma/schema.prisma`
- `src/lib/data-sources/issuer-metadata-service.ts`
- `src/lib/data-sources/annual-report-2025-msn-manual-preview.ts`
- `src/lib/data-sources/annual-report-2025-vcb-manual-preview.ts`
- `docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json`
- `docs/product/evidence/PHASE139K_MSN_PDF_2025_PROVENANCE_DRY_RUN.md`
- `docs/product/evidence/PHASE139M_VCB_BANK_SPECIFIC_ANNUAL_REPORT_PREVIEW.md`
- `docs/product/evidence/PHASE151U_CORE_TICKER_REVIEWED_SCREENING_SOURCE_IMPORT_DRY_RUN.md`

Important source decision:

- `issuer-metadata-service.ts` contains local research metadata for FPT/MWG/VNM, but it explicitly says no source/legal approval has been recorded. Phase 151V does not treat that local seed as reviewed Company metadata.
- Annual-report identity evidence is accepted only where a reviewed identity/provenance package is explicit enough for dry-run candidate preparation.

## Dry-Run Summary

```json
{
  "phase": "151V",
  "mode": "dry_run",
  "candidateTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "companyCandidatesPrepared": 6,
  "eligibleCompanyCandidates": 3,
  "blockedCompanyCandidates": 3,
  "readyForCompanyConfirmWriteByTicker": {
    "FPT": false,
    "HPG": false,
    "VNM": false,
    "MSN": true,
    "MWG": true,
    "VCB": true
  },
  "tickersReadyForCompanyConfirmWrite": ["MSN", "MWG", "VCB"],
  "tickersBlocked": ["FPT", "HPG", "VNM"],
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
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "forbiddenAdviceDetected": false,
  "smokePassed": true
}
```

## Company Metadata Candidates

| Ticker | Company candidate | Company name | Exchange | Source | Blocker |
| --- | --- | --- | --- | --- | --- |
| FPT | Blocked | null | null | `controlled_local_company_metadata` was not eligible | reviewed_company_metadata_source_missing |
| HPG | Blocked | null | null | local seed / financial preview references only | reviewed_company_metadata_source_missing |
| VNM | Blocked | null | null | `controlled_local_company_metadata` was not eligible | reviewed_company_metadata_source_missing |
| MSN | Eligible | Công ty Cổ phần Tập đoàn Masan | HOSE | annual-report reviewed identity evidence | null |
| MWG | Eligible | Công ty Cổ phần Đầu tư Thế Giới Di Động | null | refreshed annual-report manual preview artifact | null |
| VCB | Eligible | Ngân hàng TMCP Ngoại thương Việt Nam | null | annual-report bank-specific identity evidence | null |

## Missing Company Metadata Fields

| Ticker | Missing fields |
| --- | --- |
| FPT | companyName, exchange, industryLabel |
| HPG | companyName, exchange, industryLabel |
| VNM | companyName, exchange, industryLabel |
| MSN | industryLabel |
| MWG | exchange, industryLabel |
| VCB | exchange |

Missing fields remain null/N/A/needs_review and were not inferred from static UI/runtime copy.

## Whether This Closes The 151U Company Blocker

| Ticker | 151U Company blocker closed? |
| --- | --- |
| FPT | No |
| HPG | No |
| VNM | No |
| MSN | Yes |
| MWG | Yes |
| VCB | Yes |

This dry-run does not make any ticker ready for Screening backfill by itself, because `MarketPrice` and other upstream gaps remain separate blockers from Phase 151U.

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
- HSG/NKG untouched: yes.
- TVN absent: yes.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx eslint scripts/dry-run-core-ticker-company-metadata-source-package.ts` - passed.
- `npx tsx scripts/dry-run-core-ticker-company-metadata-source-package.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

At least one ticker has `readyForCompanyConfirmWrite=true`.

Recommended next phase:

- Phase 151W - bounded Company metadata confirm-write for ready tickers only (`MSN`, `MWG`, `VCB`), while leaving `FPT`, `HPG`, and `VNM` blocked until reviewed Company metadata sources are collected.
