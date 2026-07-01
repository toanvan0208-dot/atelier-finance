# Phase 150G — Industry UI Data Requirements Audit

## Phase Objective

Audit the current Industry module UI and data files to determine exactly what data the Industry module needs before collecting or writing new industry data.

Phase 150G did not write DB rows, fetch providers, import CSV, migrate schema, redesign UI, create `IndustryMetric`, create valuation/risk benchmarks, or collect/write reviewed source packages.

## Starting Commit

`89307fdd736ee383287140fd6114688f349b84e6`

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
Get-Content src/features/industry/components/IndustryPage.tsx
Get-Content src/features/industry/components/IndustryCompassSections.tsx
Get-Content src/features/industry/data/industry.data.ts
Get-Content src/features/industry/data/industryCompass.data.ts
Get-Content src/features/industry/types.ts
Get-Content src/features/industry/lib/load-industry-context.ts
Get-Content src/app/workspace/page.tsx
Select-String -Path src/app/api/assistant/route.ts -Pattern "industry|IndustryContext|loadIndustryContextRuntimeByTicker"
Select-String -Path prisma/schema.prisma -Pattern "model Industry|IndustryContext|IndustryContextProvenance|IndustryMetric|CompanyIndustry"
```

## Files Changed

```text
docs/product/evidence/PHASE150G_INDUSTRY_UI_DATA_REQUIREMENTS_AUDIT.md
```

## Current Industry UI Sections

The current Industry module is driven by `IndustryPage.tsx`, `IndustryCompassSections.tsx`, and static compass data in `industryCompass.data.ts`.

```text
IndustryPage
- MacroIndustryReadinessSkeleton
- IndustryCurrentHeader
- IndustryQuickPicture
- IndustryMoneyMap
- IndustryMacroPressureSection
- IndustryDataConfirmationSection
- IndustryConditionalConclusion
- IndustryCompanyMapSection
```

The page also receives DB-backed `IndustryContextRuntimePayload` records from the workspace read path. The DB context is currently used as qualitative research-only context and warning/caveat metadata, not as numeric industry metrics.

## Data Requirement Table

| UI section | Current data source | Current mode | Required future data type | Recommended source type | Data level | Annual reports suitable? |
| --- | --- | --- | --- | --- | --- | --- |
| `MacroIndustryReadinessSkeleton` | Static readiness component | Static educational/system guidance | Module readiness state and missing-data messaging | App readiness metadata | Module/system | No. Not an industry source. |
| `IndustryCurrentHeader` | Static `industryCompassData` plus DB context count/warnings | Static plus DB qualitative context | Industry identity, status, related tickers, source/caveat summary | Future `Industry`, `CompanyIndustry`, `IndustryContext`, `IndustryContextProvenance` | Industry-level and ticker mapping | Only supplemental for ticker exposure, not primary industry taxonomy. |
| `IndustryQuickPicture` | Static `quickPicture` | Static qualitative guidance | Reviewed qualitative industry context, beginner explanation, caveats | `IndustryContext` with `IndustryContextProvenance`; static educational guidance may remain labeled as guidance | Industry-level qualitative | Not primary. Company reports may support company-specific examples only. |
| `IndustryMoneyMap` | Static `moneyMap` | Static qualitative guidance | Value chain, revenue/cost drivers, profit pool, operating leverage explanation | Reviewed industry primers, regulator/statistical sources, future industry taxonomy | Industry-level qualitative/value-chain | Not primary for industry-level structure. Useful only for company role validation. |
| `IndustryMacroPressureSection` | Static `macroDrivers` | Static qualitative macro-link guidance | Macro sensitivity taxonomy and conditional linkage to macro observations | Product-reviewed mapping plus macro DB observations/caveats; future mapping model may be needed | Industry-level macro linkage | No. Annual reports can mention exposure but should not define macro mapping. |
| `IndustryDataConfirmationSection` | Static `dataSignals` | Static signal checklist, no numeric values | Signal catalog plus future numeric industry metrics when stable sources exist | Static educational signal catalog; future `IndustryMetric` with provenance for numeric values | Metric-level and benchmark-level future | No for industry metrics. Company filings are company-level, not industry benchmark. |
| `IndustryConditionalConclusion` | Static `conclusion` | Static conditional synthesis | Runtime synthesis from reviewed context, metrics if available, and missing-data warnings | Derived view from `IndustryContext`, future `IndustryMetric`, macro context, and caveats | Synthesis layer | No. Source claims must stay traceable to underlying sources. |
| `IndustryCompanyMapSection` | Static `companyGroups` | Static peer/company map guidance | Ticker-to-industry mapping, peer groups, role labels | Future `CompanyIndustry` and peer-group model; exchange classification/manual reviewed taxonomy | Ticker-level and peer-group-level | Supplemental for company role; not primary for industry-level claims. |
| Assistant context | DB `IndustryContext` loader by ticker | DB research-only qualitative context | Ticker-specific qualitative context, provenance summary, missing metrics/benchmark warning | `IndustryContext` + `IndustryContextProvenance` | Assistant runtime context | No direct use. Assistant should receive curated DB/runtime context only. |

## Current Coverage

```text
IndustryContext DB rows: 5
Readable DB tickers: FPT, MWG, VNM, HPG, MSN
Missing-safe ticker: VCB
IndustryContextProvenance table: present and readable
IndustryContextProvenance rows: 0 after Phase 150F
Numeric IndustryMetric model: not present
Valuation/risk industry benchmark model: not present
Industry taxonomy model: not present
CompanyIndustry mapping model: not present
Peer-group model: not present
```

Current static compass coverage is stronger for the front-page educational experience than for sourced industry data. The compass data includes first-class static options for FPT, MWG, and VNM-oriented industries. HPG and MSN have DB `IndustryContext` rows, but the current compass UI does not yet have equivalent first-class sourced section data for those rows.

## Current Data Boundaries

### `IndustryContext`

Should hold qualitative, ticker-linked industry context:

```text
industry overview
key drivers
industry risks
related tickers
dataMode
productionApproved
needsReview
sourceLabel
asOfDate
```

It should not be treated as a provenance record and should not carry numeric industry metrics or valuation/risk benchmarks.

### `IndustryContextProvenance`

Should hold source metadata for `IndustryContext` rows:

```text
sourceLabel
sourceUrl
sourceType
publicationDate or retrievedAt
extractedQuote or reviewNote
warningCodes
productionApproved=false
needsReview=true
```

It should not store rewritten content, numeric metrics, benchmark values, or static educational guidance as if it were reviewed source data.

### Future `Industry`, `CompanyIndustry`, And Peer-Group Models

Needed for durable taxonomy and mapping:

```text
industry identity and display labels
sector classification
ticker-to-industry mapping
company role in value chain
peer-group membership
classification source and caveats
```

This should not be inferred from static UI copy. It should use exchange classification, provider taxonomy, official sector mapping, or manually reviewed mapping with provenance.

### Future `IndustryMetric`

Needed only after stable source/unit/frequency contracts exist:

```text
industry revenue/volume indicators
capacity/utilization if sourceable
market-wide industry metrics
peer-group benchmark metrics
unit, period, periodType
source/provenance
productionApproved=false until separate approval gate
needsReview=true for candidate/manual/provider rows
```

`IndustryMetric` should not be created from placeholder values, company-only annual report values, or static signal names.

### Static Educational Guidance

Can remain static when clearly treated as guidance:

```text
beginner explanations
how-to-read prompts
generic checklist questions
module warnings
conditional wording templates
navigation and workflow copy
```

Static guidance must not be promoted to sourced DB data or shown as reviewed industry fact without provenance.

## Missing Data

```text
reviewed IndustryContextProvenance rows
first-class industry taxonomy
ticker-to-industry mapping
peer-group mapping
numeric IndustryMetric values
industry metric provenance
valuation/risk benchmark data
macro-to-industry mapping contract
source hierarchy per UI section
VCB IndustryContext
```

Missing data should remain unavailable/needs_review. It should not be filled from static copy, fallback values, annual-report snippets, or zeroes.

## Recommended Source Hierarchy

1. Official exchange/regulator classifications for sector/industry/ticker mapping.
2. Official statistical or regulator datasets for industry-level metrics.
3. Recognized industry associations or reviewed market/industry research for qualitative industry structure.
4. Manual reviewed notes only when they include source URL, date, evidence note or quote, caveats, and reviewer status.
5. Company annual reports only as supplemental evidence for a company-specific segment, role, or exposure. They are not primary industry-level sources.

## Annual Report Suitability By Requirement

```text
Industry taxonomy: not primary.
Ticker-to-industry mapping: supplemental only; prefer exchange/provider taxonomy.
Peer groups: supplemental only; prefer classification taxonomy plus manual review.
Industry qualitative context: supplemental only; can support company examples, not broad industry claims.
Industry metrics: not suitable as primary industry-level source.
Valuation/risk benchmarks: not suitable as primary benchmark source.
Macro-to-industry sensitivity: not primary; can provide exposure notes only.
Assistant context: should receive curated DB/runtime context, not raw annual-report claims.
```

## Assistant Context Status

The Assistant currently injects DB `IndustryContext` by ticker through the runtime loader. It includes research-only/needs-review caveats and explicit warnings that numeric industry metrics and valuation/risk benchmarks are unavailable.

Required future behavior:

```text
Include IndustryContext only when DB context exists.
Include provenance summary when sidecar rows exist.
Keep VCB missing-safe until a reviewed context exists.
State missing industry metrics/benchmarks clearly.
Avoid deterministic macro-to-industry conclusions.
Avoid investment-advice wording.
Do not invent source claims, metrics, peer groups, or benchmark values.
```

## Runtime And UI Implications

The current UI can continue using static guidance for educational sections, but data claims should be separated into these lanes:

```text
DB qualitative context: IndustryContext
DB source metadata: IndustryContextProvenance
taxonomy/mapping: future Industry and CompanyIndustry/PeerGroup models
numeric metrics: future IndustryMetric
static guidance: educational UI copy only
```

No UI redesign is required before source collection. The next data work should define the taxonomy/mapping contract before creating metrics or benchmarks.

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaMigrationAttempted=false
uiRedesigned=false
industryMetricCreated=false
valuationRiskBenchmarkCreated=false
sourcePackagesCollected=false
productionApprovedTrueCount=0
mockOrSampleAsReal=false
staticGuidancePromotedToRealData=false
missingDataZeroFilled=false
investmentAdviceAdded=false
companyAnnualReportsUsedAsPrimaryIndustrySource=false
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt
targeted lint: not applicable, docs-only phase
```

Global lint failure boundary:

```text
Global lint still reports existing lint debt in older macro, market-price, technical, assistant, and audit scripts/modules.
No Phase 150G TypeScript source files were created or touched.
The only Phase 150G changed file is this evidence document.
```

## Known Limitations

```text
This phase is an audit only.
No new source packages were collected.
No DB rows were written.
IndustryContextProvenance remains empty.
VCB remains missing-safe with no IndustryContext.
Numeric industry metrics and valuation/risk benchmarks remain unavailable.
The current Industry UI still relies heavily on static compass guidance.
```

## Recommended Phase 150H

Define and dry-run a taxonomy/mapping contract before collecting metrics:

```text
Phase 150H — Define Industry / CompanyIndustry / PeerGroup taxonomy source contract
```

Recommended scope:

```text
No DB writes initially.
No UI redesign.
Define industry taxonomy fields.
Define ticker-to-industry and peer-group mapping fields.
Decide source hierarchy for exchange/provider/manual reviewed classifications.
Dry-run coverage for FPT, MWG, VNM, HPG, MSN, VCB.
Keep numeric IndustryMetric delayed until mapping and source taxonomy are stable.
```

## Commit

Recorded in the Phase 150G Git commit.
