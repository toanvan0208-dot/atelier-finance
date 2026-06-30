# Phase 150A - Industry Data Coverage Audit

## Phase Objective

Audit the current industry data layer after macro coverage was accepted at 13/14 frontend-locked indicators. This phase is audit-only and checks whether the Macro -> Industry -> Screening -> Business -> Financials -> Valuation -> Risk -> AI path has enough real, sourced industry context for the current ticker set.

## Commands Run

Preflight:

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`

Audit and validation:

- `node scripts/run-staging.mjs npx tsx scripts/audit-industry-data-coverage.ts`
- `node scripts/run-staging.mjs npx eslint scripts/audit-industry-data-coverage.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`

## Files Audited

- `prisma/schema.prisma`
- `src/features/industry/lib/load-industry-context.ts`
- `src/features/industry/data/industry.data.ts`
- `src/features/industry/data/industryCompass.data.ts`
- `src/features/industry/components/IndustryPage.tsx`
- `src/app/api/companies/[ticker]/route.ts`
- `src/app/api/assistant/route.ts`
- `src/features/macro/lib/macro-industry-data-boundary.ts`
- `src/features/macro/lib/macro-industry-readiness-ui.ts`
- `scripts/dry-run-staging-industry-context-coverage-seed.ts`
- `scripts/smoke-staging-macro-industry-read-path.ts`
- `docs/product/MACRO_INDUSTRY_DATA_BOUNDARY.md`
- `docs/product/MACRO_INDUSTRY_READINESS_UI_SKELETON.md`
- `docs/product/INDUSTRY_MVP_REVIEWED_CONTEXT_EVIDENCE.md`

## Files Changed

- `scripts/audit-industry-data-coverage.ts`
- `docs/product/evidence/PHASE150A_INDUSTRY_DATA_COVERAGE_AUDIT.md`

## Starting Commit

- `f4740d4eb38bfa29b36b780f862b178f25e0f907`

## Guardrail Results

- `dbWriteAttempted=false`
- `providerFetchAttempted=false`
- `csvImportAttempted=false`
- `schemaChanged=false`
- `productionApprovedTrueCount=0` for `IndustryContext`
- `needsReviewTrueCount=5` for `IndustryContext`
- `mockOrSampleAsReal=false`
- `missingDataZeroFilled=false`
- `investmentAdviceAdded=false`

## Industry Models Found

| Model / mapping | Status |
| --- | --- |
| `Industry` model | Not found |
| `CompanyIndustry` model | Not found |
| `IndustryMetric` model | Not found |
| `IndustryContext` model | Found |
| Company industry fields | Found: `industryCode`, `industryName` |
| Dedicated industry provenance model | Not found |
| Industry source URL field on `IndustryContext` | Not found |

`IndustryContext` is currently the main DB-backed industry context model. It is research-only by design: `dataMode="research_only"`, `productionApproved=false`, and `needsReview=true`.

## Industry Data Source Type

| Source layer | Current state |
| --- | --- |
| DB industry context | 5 `IndustryContext` rows found |
| DB industry context for target tickers | 5 rows |
| DB source labels | `staging_macro_industry_research_seed` |
| DB data modes | `research_only` |
| Static industry compass rows | 3 rows |
| Static data mode | `research_only/static_guidance` |
| Numeric industry metrics | Not found |
| Valuation/risk industry benchmarks | Not found |

Risk note: the legacy staging seed script contains mock-labeled text and should not be treated as production data. Current UI static industry data also has missing source name/source URL metadata.

## Industry Page Data Mode

| Check | Result |
| --- | --- |
| Industry page uses DB read path | false |
| Industry page uses static `industryCompassData` | true |
| Industry page uses static `industryPageData` | true |
| Readiness/warning skeleton visible | true |

The Industry page currently appears to be a static/readiness experience rather than a DB-backed industry data module. It has guardrail-oriented UI scaffolding, but it does not yet surface the DB `IndustryContext` rows audited here.

## Ticker Industry Coverage

| Ticker | Company row | Company industry fields | DB industry context | Static industry context | Numeric metrics | Valuation/risk benchmark |
| --- | --- | --- | --- | --- | --- | --- |
| FPT | yes | null in `Company`; DB context says Công nghệ thông tin | yes, research-only | yes | no | no |
| MWG | yes | null in `Company`; DB context says Bán lẻ | yes, research-only | yes | no | no |
| VNM | yes | null in `Company`; DB context says Hàng tiêu dùng thiết yếu | yes, research-only | yes | no | no |
| HPG | yes | null in `Company`; DB context says Thép và vật liệu xây dựng | yes, research-only | no | no | no |
| VCB | no | N/A | no | no | no | no |
| MSN | yes | null in `Company`; DB context says Hàng tiêu dùng | yes, research-only | no | no | no |

## Missing Industry Data List

| Ticker | Missing items |
| --- | --- |
| FPT | numeric industry metrics, valuation/risk benchmarks |
| MWG | numeric industry metrics, valuation/risk benchmarks |
| VNM | numeric industry metrics, valuation/risk benchmarks |
| HPG | static industry context, numeric industry metrics, valuation/risk benchmarks |
| VCB | company row, DB industry context, static industry context, numeric industry metrics, valuation/risk benchmarks |
| MSN | static industry context, numeric industry metrics, valuation/risk benchmarks |

## Industry Metric Coverage

- `IndustryMetric` model: not found.
- Numeric industry metric rows: not found.
- Static signal guidance: present for FPT, MWG, and VNM through `industryCompassData`.
- Benchmarks for valuation/risk: not found.
- Stale policy for industry metrics: not found.
- Production approval / needs-review equivalent: present on `IndustryContext`, but not on static industry compass guidance.

## Assistant Industry Context Status

| Check | Result |
| --- | --- |
| Assistant route injects DB industry context | false |
| Assistant prompt can receive passed industry module context | true |
| Macro-to-industry guardrail present | true |
| DB `IndustryContext` available to Assistant by default | false |

Assistant guardrails include a boundary against definitive macro-to-industry conclusions. However, the Assistant route does not currently load `IndustryContext` by ticker, so DB industry context is not yet reliably available in Assistant responses unless separately passed as module context.

## UI/UX Audit

- The current Industry module is suitable as a readiness/education scaffold.
- It is not yet a DB-backed industry data surface.
- It uses static research-only guidance for a small subset of tickers.
- It does not expose numeric industry metrics, source provenance, stale policy, or valuation/risk benchmarks.
- Missing data is not zero-filled.
- The current design should keep warnings visible until sourced industry data and provenance are added.

## Mock Or Fallback Risk

| Risk | Status |
| --- | --- |
| Static industry guidance used in UI | yes |
| Static source metadata missing | yes |
| Legacy staging seed contains mock-labeled text | yes |
| Industry page uses static data instead of DB `IndustryContext` | yes |
| Assistant does not inject DB industry context | yes |

These are audit findings, not new data writes. Phase 150B should remove or quarantine mock-labeled seed content before any industry data is treated as user-facing data.

## Validation Results

| Command | Result |
| --- | --- |
| `npx prisma validate` | pass |
| `npx prisma generate` | pass |
| `npx prisma migrate status` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npx eslint scripts/audit-industry-data-coverage.ts` | pass |
| `npm run lint` | fail: global lint is not a clean pass due to old/out-of-scope lint debt |

Targeted lint for the new Phase 150A script passed.

## Recommended Next Phase

Phase 150B should harden the industry data layer before import/write work:

1. Define the `IndustryContext` source/provenance contract.
2. Remove or quarantine legacy mock-labeled staging seed wording.
3. Add reviewed source metadata for industry context.
4. Connect Industry UI and Assistant to DB-backed `IndustryContext` with missing-data warnings.
5. Decide whether numeric industry metrics need a dedicated `IndustryMetric` model or an existing observation pattern.

## Commit

Pending at evidence creation time.
