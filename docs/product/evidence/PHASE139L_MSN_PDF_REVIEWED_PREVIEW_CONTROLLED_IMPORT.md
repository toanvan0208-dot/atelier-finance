# Phase 139L: MSN PDF Reviewed-Preview Controlled Import and Post-Import Smoke

## Objective

Perform an MSN-only controlled local database import of the three primary financial values validated in Phase 139K, verify idempotency, prefer the reviewed-preview source for MSN at runtime, and exercise offline product boundaries after the write.

## Scope Boundaries

- Target ticker: MSN only.
- Imported fields: `eps`, `sharesOutstanding`, and `totalDebt` only.
- Secondary fields were not imported.
- No other ticker was written.
- No schema change or migration.
- No PDF binary commit.
- `productionApproved` remains `false`.
- Existing `vnstock_financials_candidate` MSN data remains preserved.
- No total-liabilities mapping, debt-component double counting, missing-to-zero conversion, or investment recommendation language.

## Why MSN After FPT/HPG/VNM and Before VCB

FPT, HPG, and VNM already use the reviewed-preview import pattern. Phase 139K confirmed equivalent consolidated audited provenance for MSN. VCB remains deferred because bank liabilities require a separate banking-specific interpretation rather than the industrial-company debt mapping used here.

## Reference

- Phase 139K commit: `9256ee712f4591866a2b084b91e5897cb2e4ac9a`

## Pre-Phase Worktree Isolation

Three unrelated tracked modifications existed before Phase 139L:

- `docs/thesis/use-case-design-final.md`
- `docs/thesis/use-case-diagram.puml`
- `src/app/layout.tsx`

They were isolated with the requested path-specific stash:

`stash@{0}: On main: pre-139L unrelated thesis layout changes`

Only allowed pre-existing untracked assets remained. They were not staged, deleted, moved, or modified.

## Entity Identity

- Company: Công ty Cổ phần Tập đoàn Masan.
- Ticker: MSN.
- Consolidated group-level statements: confirmed.
- Auditor: KPMG Vietnam.
- MCH/subsidiary-only scope: ruled out.
- Phase 139K entity status: `valid_msn_consolidated`.

## Source PDF Preview Values

| Field | Source value | Source unit | Provenance |
| :--- | ---: | :--- | :--- |
| EPS | 2,710 | VND/share | PDF page 102, report pages 206-207, Note 36(c) |
| Shares outstanding | 1,520,491,927 | shares | PDF page 97, report pages 196-197, Note 23 |
| Current debt | 24,330,984 | million VND | PDF page 64, report pages 130-131 |
| Non-current debt | 40,546,194 | million VND | PDF page 64, report pages 130-131 |

## Total-Debt Normalization

Source total:

`24,330,984 + 40,546,194 = 64,877,178 million VND`

Conversion:

`64,877,178 / 1,000 = 64,877.178 billion VND`

Stored value: `64877.178` with unit `billion_vnd`.

The raw `64877178` million-VND magnitude was not written to the billion-VND field. Current maturities, bonds, and finance leases were not added again because they are already represented inside the current and non-current balance-sheet debt lines.

## Imported Record

- Ticker: `MSN`
- Fiscal year: `2025`
- Period type: annual/year
- EPS: `2710` (`vnd_per_share`)
- Shares outstanding: `1520491927` (`shares`)
- Total debt: `64877.178` (`billion_vnd`)
- Source label: `annual_report_2025_pdf_reviewed_preview`
- Data mode: `research_only`
- Production approved: `false`

Revenue, net income, total assets, and equity were explicitly excluded and remain null in the imported row.

## Commands Run

- `git stash push -m "pre-139L unrelated thesis layout changes" -- docs/thesis/use-case-design-final.md docs/thesis/use-case-diagram.puml src/app/layout.tsx`
- `git status --short`
- `npx tsx scripts/import-msn-pdf-reviewed-preview.ts`
- `npx tsx scripts/import-msn-pdf-reviewed-preview.ts --confirm-write`
- `npx tsx scripts/import-msn-pdf-reviewed-preview.ts --confirm-write`
- `npx tsx scripts/smoke-msn-pdf-reviewed-post-import.ts`
- Targeted Vitest suites for import validation, source priority, and post-import smoke.
- `npx prisma validate`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

## Dry-Run Output Summary

- Mode: dry-run by default.
- Accepted rows: 1.
- Invalid rows: 0.
- DB writes: 0.
- Candidate ticker: MSN only.
- Candidate fields: EPS, shares outstanding, and total debt only.
- Normalized total debt: `64877.178 billion_vnd`.
- `--confirm-write` required before mutation.

## Confirm-Write Output Summary

- Status: `write_completed`.
- Written rows: 1.
- Skipped rows: 0.
- Invalid/rejected rows: 0.
- `productionApproved`: false.

## Duplicate Re-Run Summary

- Status: `write_completed_with_skips`.
- Written rows: 0.
- Skipped rows: 1.
- Invalid/rejected rows: 0.
- Existing reviewed-preview row was not overwritten.

## Runtime Verification

MSN now resolves to:

- Source: `annual_report_2025_pdf_reviewed_preview`
- Data mode: `research_only`
- Production approved: `false`
- Fallback used: `false`
- EPS: `2710`
- Shares outstanding: `1520491927`
- Total debt: `64877.178`
- EPS unit: `vnd_per_share`
- Shares unit: `shares`
- Total-debt unit: `billion_vnd`

The existing MSN `vnstock_financials_candidate` row remains in the database alongside the new reviewed-preview row.

## Source-Priority Behavior

- MSN: now resolves to `annual_report_2025_pdf_reviewed_preview`.
- FPT: remains `annual_report_2025_pdf_reviewed_preview`.
- HPG: remains `annual_report_2025_pdf_reviewed_preview`.
- VNM: remains `annual_report_2025_pdf_reviewed_preview`.
- MWG: remains `phase109_controlled_local_financials`.
- VCB: remains on its existing `vnstock_financials_candidate` behavior; no reviewed-PDF probe was added for VCB.

## Product Boundary Summary

### Risk

Risk receives `totalDebt=64877.178` from `statementSnapshot.totalDebt`. Debt is no longer treated as missing. Leverage calculation remains `insufficient_data` when equity is absent, rather than inferring equity or replacing it with zero. This is a data-readiness result, not investment advice.

### Valuation

Valuation consumes the verified runtime inputs only as a safety/readiness boundary. `productionApproved=false` and `canClaimValuationDbBacked=false` remain enforced. No fair value, target price, upside/downside, cheap/expensive conclusion, or recommendation is produced.

### Checklist

The runtime missing-field list no longer contains `totalDebt`. Other missing secondary fields remain missing and are not synthesized.

### AI Context

The offline assistant context contains:

- Source label `annual_report_2025_pdf_reviewed_preview`
- Data mode `research_only`
- `productionApproved=false`
- EPS `2710`
- Shares outstanding `1520491927`
- Total debt `64877.178`

Its constraints prohibit buy/sell/hold recommendations, fair value, target price, upside/downside, price predictions, and positive/negative investment labels.

## Schema Provenance Limitation

The current schema stores units in `FinancialStatementUnitMetadata` and preserves source/data-mode/production-approval boundaries. It does not provide dedicated page-level provenance columns on `FinancialStatement`; detailed PDF pages and table provenance therefore remain in the committed Phase 139K/139L evidence artifacts rather than the DB row.

## Confirmations

- No schema change or migration: confirmed.
- No PDF binary commit: confirmed.
- No other ticker import: confirmed.
- No secondary field import: confirmed.
- No total-liabilities-as-total-debt mapping: confirmed.
- No double-counted debt components: confirmed.
- No missing-to-zero conversion: confirmed.
- No raw million VND stored into the billion-VND field: confirmed.
- No `productionApproved=true`: confirmed.
- No claim that research preview data is production-approved or investment-grade: confirmed.
- No investment recommendation language: confirmed.
- Existing MSN VNStock candidate row preserved: confirmed.

## Validation Results

- Targeted Phase 139L suites: 3 test files and 19 tests passed.
- `npx prisma validate`: passed, exit code 0.
- `npm run typecheck`: passed, exit code 0.
- `npm run lint`: passed, exit code 0.
- `npm test`: passed on the first full run, exit code 0; 140 test files and 1,168 tests passed.
- `npm run build`: passed, exit code 0.

## Final Git Status

Pending final staging, commit, and push. The unrelated tracked changes remain isolated in `stash@{0}`. Only allowed untracked diagram, source-PDF, and thesis assets remain outside the Phase 139L files.

## Next Recommended Phase

Handle VCB in a separate bank-specific provenance and mapping phase. Do not reuse standard corporate total-debt logic for bank deposits or general banking liabilities.
