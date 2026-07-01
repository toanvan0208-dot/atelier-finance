# Phase 150X - Industry UI Static Compass Alignment

## Phase Objective

Audit and fix the Industry UI static compass so it does not present unsupported technology/FPT-style guidance as reviewed Industry milestone coverage.

Phase 150X did not write DB rows, fetch providers, import CSV, change schema, create new taxonomy rows, create peer groups, create `IndustryMetric`, create valuation/risk benchmarks, or set `productionApproved=true`.

## Starting Commit

`b4f390965321156748f806217bf6bb251f7bbf14`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Inspection:

```text
rg -n "Công nghệ|Dịch vụ công nghệ|cong nghe|technology|Bán lẻ|Sữa|STEEL_MATERIALS|RETAIL|CONSUMER_STAPLES_DAIRY" src/features/industry/data src/features/industry/components src/features/industry/lib
rg -n "industryCompass|compass|static|cards|industryOptions|IndustryCurrentHeader|IndustryCompanyMap|selected" src/features/industry
Get-Content src/features/industry/data/industryCompass.data.ts
Get-Content src/features/industry/components/IndustryCompassSections.tsx
Get-Content src/features/industry/components/IndustryPage.tsx
```

Targeted checks:

```text
node scripts/run-staging.mjs npx eslint src/features/industry/data/industryCompass.data.ts src/features/industry/lib/__tests__/industry-mvp-sector-context.test.ts src/features/industry/lib/load-industry-context.ts scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-milestone-e2e.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint src/features/industry/data/industryCompass.data.ts src/features/industry/lib/__tests__/industry-mvp-sector-context.test.ts src/features/industry/lib/load-industry-context.ts scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-milestone-e2e.ts
```

## Files Changed

```text
src/features/industry/data/industryCompass.data.ts
src/features/industry/lib/__tests__/industry-mvp-sector-context.test.ts
src/features/industry/lib/load-industry-context.ts
scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
docs/product/evidence/PHASE150X_INDUSTRY_UI_STATIC_COMPASS_ALIGNMENT.md
```

## Observed Localhost Issue

Manual localhost showed the warning box correctly using the reviewed coverage boundary:

```text
STEEL_MATERIALS, RETAIL, CONSUMER_STAPLES_DAIRY
mapped tickers: HPG, MWG, VNM
unsupported tickers remain missing-safe
```

But the visible Industry compass still defaulted to static technology/FPT content:

```text
Công nghệ thông tin / Dịch vụ công nghệ
FPT-style technology card
```

That could mislead users into thinking technology/FPT taxonomy was reviewed in the current milestone.

## Root Cause

The Industry header warning/read-path used the reviewed DB boundary, while `industryCompassData.industries` still exported a legacy static technology option as the first visible compass lane.

The UI selected the first compass option by default, so unsupported technology content could appear even though FPT is intentionally missing-safe.

## Fix Summary

`industryCompassData.industries` now exports reviewed milestone lanes only:

```text
STEEL_MATERIALS -> HPG
RETAIL -> MWG
CONSUMER_STAPLES_DAIRY -> VNM
```

The old static technology profile remains quarantined in the source file as historical/static content, but it is no longer part of the exported visible reviewed compass list.

Added a steel/materials static compass lane for HPG with explicit caveats:

```text
Static compass guidance only.
Reviewed DB taxonomy is limited to HPG -> STEEL_MATERIALS.
Peer group is research_only and needsReview.
Taxonomy/peer group is not a valuation or risk benchmark.
```

Also updated the industry MVP sector-context test from FPT/MWG/VNM to HPG/MWG/VNM.

## Before / After Source Explanation

Before:

```text
Header warning: reviewed DB boundary
Compass cards/header: static technology, retail, dairy
```

After:

```text
Header warning: reviewed DB boundary
Compass cards/header: steel/materials, retail, dairy
```

Static educational guidance may remain in the module, but the visible reviewed card group no longer includes unsupported technology as a reviewed lane.

## Reviewed Lane Results

```text
HPG: STEEL_MATERIALS, peer group available with HSG/NKG/TVN
MWG: RETAIL, peer group missing-safe
VNM: CONSUMER_STAPLES_DAIRY, peer group missing-safe
```

## Missing-Safe Results

```text
FPT: taxonomy missing-safe; no technology taxonomy inferred
VCB: taxonomy missing-safe
MSN: taxonomy missing-safe
```

## Smoke Result

`scripts/smoke-industry-ui-reviewed-coverage-alignment.ts`:

```text
reviewedIndustryCount=3
reviewedCoverageUiAligned=true
technologyNotShownAsReviewedCoverage=true
hpgSteelUiAligned=true
mwgRetailUiAligned=true
vnmDairyUiAligned=true
fptTechnologyNotInferred=true
vcbMissingSafe=true
msnMissingSafe=true
dbWriteAttempted=false
providerFetchAttempted=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
productionApprovedTrueCount=0
uiLayoutRedesigned=false
smokePassed=true
```

Regression smoke `scripts/smoke-industry-milestone-e2e.ts` also passed.

## Guardrail Results

```text
DB writes: no
Provider fetch: no
CSV import: no
Schema migration: no
New Industry rows: no
New CompanyIndustry rows: no
IndustryPeerGroup writes: no
IndustryMetric: not created
Valuation/risk benchmark: not created
productionApprovedTrueCount=0
Technology/FPT taxonomy inferred: no
Static guidance promoted to reviewed DB data: no
UI redesign: no
Investment advice added: no
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150X files
targeted lint: pass
Phase 150X smoke: pass
Phase 150W e2e smoke: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, audit, and unrelated modules/scripts, including:
- scripts/audit-assistant-macro-context-readiness.ts
- scripts/audit-macro-frontend-indicator-scope.ts
- scripts/confirm-write-fred-global-macro-candidates.ts
- scripts/confirm-write-market-price-daily-provider-refresh.ts
- scripts/job-market-price-daily-refresh.ts
- scripts/smoke-market-price-* files
- src/features/macro/types.ts
- src/features/technical/lib/load-technical-runtime-data.ts

New/touched Phase 150X files passed targeted lint:
- src/features/industry/data/industryCompass.data.ts
- src/features/industry/lib/__tests__/industry-mvp-sector-context.test.ts
- src/features/industry/lib/load-industry-context.ts
- scripts/smoke-industry-ui-reviewed-coverage-alignment.ts
```

## Known Limitations

```text
The steel/materials compass text is still qualitative static guidance, not a numeric IndustryMetric.
Only HPG/MWG/VNM are reviewed mapped tickers in this milestone.
FPT/VCB/MSN remain intentionally missing-safe until future reviewed source packages exist.
No RETAIL or CONSUMER_STAPLES_DAIRY peer groups exist yet.
```

## Recommended Next Step

Move to the next product-flow module after Industry, likely Screening coverage/read-path audit, while preserving the locked Industry boundary and missing-safe unsupported ticker behavior.
