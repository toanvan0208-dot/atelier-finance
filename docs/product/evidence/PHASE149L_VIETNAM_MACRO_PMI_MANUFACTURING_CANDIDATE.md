# Phase 149L - Vietnam Macro PMI Manufacturing Candidate

## Phase objective

Acquire a real candidate path for `PMI_MANUFACTURING` only. This phase does not confirm-write `GDP_GROWTH` or `CPI_YOY` because production Supabase already has `MacroIndicator`, `MacroObservation`, and `MacroObservationProvenance` rows for both with `sourceLabel=world_bank_candidate` / `providerType=public_api_candidate`.

## Commands run

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`
- `node scripts/run-staging.mjs npx tsx scripts/dry-run-vietnam-macro-pmi-manufacturing-candidate.ts`
- `node scripts/run-staging.mjs npx eslint scripts/dry-run-vietnam-macro-pmi-manufacturing-candidate.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`

Validation commands are listed after execution.

## Files changed

- `scripts/dry-run-vietnam-macro-pmi-manufacturing-candidate.ts`
- `docs/product/evidence/PHASE149L_VIETNAM_MACRO_PMI_MANUFACTURING_CANDIDATE.md`

## Current macro coverage summary

Current DB-backed indicators, per product context:

- `FED_FUNDS_RATE`
- `DXY` / `Sức mạnh USD` proxy
- `BRENT_OIL_PRICE`
- `CPI_YOY`
- `GDP_GROWTH`
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`
- `CREDIT_GROWTH`

Remaining missing/blocked indicators:

- `PMI_MANUFACTURING`
- `POLICY_RATE`
- `MARKET_TRADING_VALUE`
- `FOREIGN_NET_FLOW`
- `GLOBAL_FLOW`

Phase 149L script result for `PMI_MANUFACTURING`:

- `dbReadAttempted=true`
- `currentDbCount=0`
- `currentProvenanceCount=0`
- `currentCoverageStatus=missing_from_current_db`
- `dbWriteAttempted=false`

## PMI source investigation result

Source candidates investigated:

| Source | URL | Shape | Fetch result | Parser status |
| --- | --- | --- | --- | --- |
| S&P Global PMI landing page | `https://www.pmi.spglobal.com/` | `official_html_landing_page` | HTTP 403 / `text/html` | blocked: not a stable series API |
| S&P Global PMI press release directory | `https://www.pmi.spglobal.com/Public/Release/PressReleases` | `official_press_release_directory` | HTTP 403 / `text/html` | blocked: directory, not a machine-readable series API |
| S&P Global Vietnam Manufacturing PMI press release PDF | `https://www.pmi.spglobal.com/Public/Home/PressRelease/d05d320a82f840b4b910a30255537863` | `official_pdf_press_release` | HTTP 403 / `text/html` | blocked: PDF/manual review required |

Conclusion:

- `sourceCandidateFound=true`
- `providerFetchAttempted=true`
- `providerFetchSucceeded=false`
- No stable machine-readable S&P Global Vietnam Manufacturing PMI series API is documented in the repo.
- Numeric extraction is blocked because the available source candidates are HTML/PDF press-release surfaces and S&P Global PMI data is proprietary.

## Candidate rows generated

- `candidateRowsGenerated=0`
- `candidateRowsPersisted=false`
- `readyForConfirmWrite=false`

No PMI value was invented, copied from memory, zero-filled, or parsed from an unstable source.

## Manual CSV schema

Manual CSV is required before a future parser/confirm-write phase:

```csv
period,period_type,pmi_value,unit,definition,scope,source_name,source_url,publication_date,extracted_quote,notes
```

Proposed local-only path:

```text
data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual-reviewed.csv
```

Required semantics:

- `unit=index`
- `definition=Vietnam manufacturing PMI; threshold 50 separates expansion from contraction when stated by the source`
- `scope=Vietnam manufacturing sector`
- each row must include `source_url`, `publication_date`, and `extracted_quote`

## DB writes

- `dbWriteAttempted=false`
- `MacroObservation` rows created: 0
- `MacroObservationProvenance` rows created: 0

## Production approval policy

- `productionApproved=true` rows created: 0
- Future PMI candidate rows must remain `productionApproved=false`
- Future PMI candidate rows must remain `needsReview=true`
- Coverage/readiness does not mean production approval

## Guardrail results

- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `fallbackAsReal=false`
- `frontendIndicatorUniverseExpanded=false`
- `investmentAdviceAdded=false`
- No trading signal, target price, fair value, upside/downside, or buy/sell/hold recommendation was added.

## Validation results

- `node scripts/run-staging.mjs npx eslint scripts/dry-run-vietnam-macro-pmi-manufacturing-candidate.ts`: pass
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail globally due to existing/out-of-scope lint debt in older scripts and modules. The new Phase 149L dry-run script is not listed in global lint failures.

## Next recommended phase

Phase 149M should either:

1. add a controlled manual CSV parser dry-run for `PMI_MANUFACTURING` once the local CSV contract is populated from official S&P Global source evidence, or
2. acquire an approved licensed/provider API for Vietnam Manufacturing PMI and rerun source assessment before any confirm-write.

Any future confirm-write must keep `productionApproved=false`, `needsReview=true`, and explicit PMI source caveats.

## Commit

Pending.
