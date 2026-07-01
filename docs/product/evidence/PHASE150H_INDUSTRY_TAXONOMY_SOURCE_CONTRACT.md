# Phase 150H — Industry Taxonomy Source Contract

## Phase Objective

Define the production-safe taxonomy and ticker-to-industry/peer-group mapping contract for the Industry module before collecting metrics, benchmarks, or writing new industry data.

Phase 150H did not write DB rows, fetch providers, import CSV, migrate schema, redesign UI, create `IndustryMetric`, create valuation/risk benchmarks, collect numeric metrics, or collect `IndustryContextProvenance` source packages.

## Starting Commit

`bb2200efc92033629420ec6545c4db50ceb351d8`

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
Get-Content prisma/schema.prisma
Get-Content src/features/industry/types.ts
Get-Content src/features/industry/lib/load-industry-context.ts
Get-Content src/features/industry/data/industry.data.ts
Get-Content src/features/industry/data/industryCompass.data.ts
Get-Content src/features/industry/components/IndustryPage.tsx
Get-Content src/features/industry/components/IndustryCompassSections.tsx
Get-Content docs/product/evidence/PHASE150G_INDUSTRY_UI_DATA_REQUIREMENTS_AUDIT.md
Get-Content docs/product/INDUSTRY_PROVENANCE_CONTRACT.md
Get-Content scripts/confirm-write-industry-context-provenance.ts
Get-Content scripts/smoke-industry-context-provenance-read-path.ts
```

Dry-run:

```text
node scripts/run-staging.mjs npx eslint scripts/dry-run-industry-taxonomy-source-contract.ts
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-taxonomy-source-contract.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/dry-run-industry-taxonomy-source-contract.ts
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-taxonomy-source-contract.ts
```

## Files Changed

```text
scripts/dry-run-industry-taxonomy-source-contract.ts
docs/product/evidence/PHASE150H_INDUSTRY_TAXONOMY_SOURCE_CONTRACT.md
```

## Current Schema Limitation

Current schema has:

```text
Company.industryCode
Company.industryName
IndustryContext
IndustryContextProvenance
```

Current schema does not have:

```text
Industry
CompanyIndustry
IndustryPeerGroup / PeerGroup
IndustryMetric
dedicated classification provenance for ticker-to-industry mapping
```

`Company.industryCode` and `Company.industryName` can hold a simple profile label, but they are not enough for a product-safe taxonomy because they do not carry source URL, classification system, role type, mapping confidence, multi-segment caveats, or peer-group inclusion evidence.

## Proposed `Industry` Model Contract

Recommended fields for a future schema phase:

| Field | Purpose |
| --- | --- |
| `id` | Stable row id. |
| `industryCode` | Stable internal industry key. |
| `industryName` | Canonical industry name. |
| `displayNameVi` | User-facing Vietnamese label. |
| `sectorCode` | Parent sector code. |
| `sectorName` | Parent sector name. |
| `classificationSystem` | Exchange/provider/manual classification system. |
| `description` | Short qualitative definition. |
| `dataMode` | `research_only` or later reviewed mode. |
| `productionApproved` | Must remain `false` for candidate/manual/research rows. |
| `needsReview` | Must remain `true` until a stronger review gate. |
| `createdAt` / `updatedAt` | Audit timestamps. |

Required source boundary:

```text
Industry identity should come from exchange/regulator/provider taxonomy or manually reviewed taxonomy with source metadata.
Company annual reports are not primary industry-level classification sources.
```

## Proposed `CompanyIndustry` Mapping Contract

Recommended fields for a future schema phase:

| Field | Purpose |
| --- | --- |
| `id` | Stable row id. |
| `ticker` | Company ticker. |
| `industryCode` | Link to future `Industry`. |
| `roleType` | `primary`, `secondary`, or `ambiguous`. |
| `segmentDescription` | Company-specific role or exposure note. |
| `mappingConfidence` | `low`, `medium`, `high`, or `missing`. |
| `sourceLabel` | Classification source label. |
| `sourceUrl` | Real source URL. |
| `sourceType` | Exchange, provider taxonomy, official classification, or reviewed manual note. |
| `publicationDate` or `retrievedAt` | Date evidence was published or retrieved. |
| `reviewNote` or `extractedQuote` | Evidence note or short extracted support. |
| `warningCodes` | Caveats such as multi-segment exposure. |
| `dataMode` | Candidate/research mode. |
| `productionApproved` | Must remain `false` for candidate/manual/research rows. |
| `needsReview` | Must remain `true` until separate review gate. |
| `createdAt` / `updatedAt` | Audit timestamps. |

Mapping eligibility rule:

```text
A ticker-to-industry mapping is not eligible for reviewed import without industryCode, industryName, sourceUrl, sourceType, publication/retrieved date, evidence note/quote, productionApproved=false, and needsReview=true.
```

## Proposed Peer-Group Contract

Recommended fields for future `IndustryPeerGroup` or `PeerGroup` support:

| Field | Purpose |
| --- | --- |
| `id` | Stable row id. |
| `industryCode` | Link to future `Industry`. |
| `peerTicker` | Ticker included in peer group. |
| `peerRole` | Role in group, such as direct peer, adjacent peer, or watch-only. |
| `inclusionReason` | Why this ticker belongs in this group. |
| `sourceLabel` | Source label for inclusion. |
| `sourceUrl` | Real source URL. |
| `sourceType` | Exchange/provider/manual reviewed taxonomy. |
| `publicationDate` or `retrievedAt` | Date evidence was published or retrieved. |
| `reviewNote` or `extractedQuote` | Evidence note or short extracted support. |
| `warningCodes` | Caveats such as single-company group or ambiguous segment. |
| `dataMode` | Candidate/research mode. |
| `productionApproved` | Must remain `false` for candidate/manual/research rows. |
| `needsReview` | Must remain `true` until separate review gate. |
| `createdAt` / `updatedAt` | Audit timestamps. |

Peer-group rule:

```text
Existing IndustryContext.relatedTickers can suggest a future peer-group candidate, but it cannot be treated as reviewed peer membership without classification source provenance.
```

## Source Hierarchy By Purpose

| Purpose | Preferred source hierarchy | Annual-report role |
| --- | --- | --- |
| Industry identity | Exchange/regulator classification, provider taxonomy, reviewed manual taxonomy | Not primary. |
| Ticker-to-industry mapping | Exchange/provider classification first; reviewed manual mapping with source caveats second | Supplemental for company-specific exposure only. |
| Peer groups | Classification taxonomy plus reviewed manual peer logic | Supplemental for company role, not primary peer definition. |
| Company role/value-chain exposure | Reviewed manual note, company disclosures, industry source cross-check | Suitable as supplemental evidence only. |
| Qualitative industry structure | Industry associations, regulator/statistical sources, reviewed research | Supplemental for company examples only. |
| Future numeric industry metrics | Official/statistical/regulator/provider datasets with stable units/frequency | Not primary. |

## Multi-Industry Handling Rules

1. A ticker can have one primary industry and zero or more secondary industries.
2. The UI default should use the reviewed primary mapping when available.
3. If mapping is ambiguous, the UI should show a missing/needs-review state rather than silently selecting a static fallback.
4. Assistant context must say the mapping is qualitative/needs-review and must not say one company represents the whole industry.
5. Secondary exposure should be shown only when sourced and caveated.
6. Missing mapping remains unavailable; it should not be filled from static compass guidance.
7. Company annual reports may support a company-specific segment exposure, but they should not define the industry taxonomy.

Ticker-specific review flags:

```text
FPT: technology services, telecom, education exposure.
MWG: retail with multiple retail subsegments.
VNM: dairy / consumer staples.
HPG: steel/materials; supplemental agriculture or real estate exposure requires source review.
MSN: consumer, retail, food, possible materials/mining exposure depending source.
VCB: banking/financials; currently missing Company/IndustryContext in this snapshot and remains missing-safe.
```

## Dry-Run Results

Script:

```text
scripts/dry-run-industry-taxonomy-source-contract.ts
```

Output summary:

```text
phase=150H
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
supportedTickersChecked=FPT, MWG, VNM, HPG, MSN, VCB
currentIndustryContextRowsFound=5
companyRowsFound=5
candidateIndustryRowsGenerated=5
candidateCompanyIndustryRowsGenerated=6
candidatePeerGroupRowsGenerated=5
eligibleReviewedMappings=0
blockedRows=16
multiIndustryTickersDetected=FPT, MWG, VNM, HPG, MSN
missingSafeTickers=VCB
currentSchemaCanSupportTaxonomyWithoutMigration=false
industryMetricCreated=false
valuationRiskBenchmarksInvented=false
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryIndustrySource=false
productionApprovedTrueCount=0
missingDataZeroFilled=false
investmentAdviceAdded=false
smokePassed=true
```

Blocked reasons:

```text
MISSING_CLASSIFICATION_SYSTEM
MISSING_COMPANY_AND_INDUSTRY_CONTEXT
MISSING_INDUSTRY_CODE
MISSING_INDUSTRY_CONTEXT
MISSING_INDUSTRY_NAME
MISSING_PUBLICATION_OR_RETRIEVED_DATE
MISSING_REAL_SOURCE_URL
MISSING_REVIEW_NOTE_OR_EXTRACTED_QUOTE
MISSING_SECTOR_CODE
MISSING_SECTOR_NAME
MISSING_SOURCE_TYPE
MULTI_INDUSTRY_REVIEW_REQUIRED
PEER_GROUP_SOURCE_REQUIRED
```

## Ticker Coverage Result

```text
FPT: Company row found; IndustryContext found; candidate mapping blocked by missing reviewed classification source and multi-industry review requirement.
MWG: Company row found; IndustryContext found; candidate mapping blocked by missing reviewed classification source and multi-industry review requirement.
VNM: Company row found; IndustryContext found; candidate mapping blocked by missing reviewed classification source and multi-industry review requirement.
HPG: Company row found; IndustryContext found; candidate mapping blocked by missing reviewed classification source and multi-industry review requirement.
MSN: Company row found; IndustryContext found; candidate mapping blocked by missing reviewed classification source and multi-industry review requirement.
VCB: Company row not found; IndustryContext not found; missing-safe; no fallback mapping created.
```

## Recommended Models

```text
Industry
CompanyIndustry
IndustryPeerGroup
IndustryClassificationProvenance or embedded source fields on mapping rows
```

The current schema cannot safely support the full taxonomy contract without a later migration because `Company.industryCode` and `Company.industryName` do not carry classification source metadata or multi-industry role semantics.

## Why `IndustryMetric` Remains Delayed

`IndustryMetric` should remain delayed because this phase is about identity, mapping, and peer grouping. Numeric metrics require separate source, unit, frequency, and provenance contracts. Creating metrics before taxonomy is stable would make the Industry module harder to explain and easier to misread.

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
uiLayoutChanged=false
industryMetricCreated=false
valuationRiskBenchmarksInvented=false
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryIndustrySource=false
productionApprovedTrueCount=0
missingDataZeroFilled=false
investmentAdviceAdded=false
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150H files
targeted lint for Phase 150H script: pass
dry-run taxonomy source contract script: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, and audit scripts/modules.
The new Phase 150H script is not listed in the global lint failures and passed targeted lint.
```

## Known Limitations

```text
This phase is contract/dry-run only.
No reviewed taxonomy source packages were collected.
No Industry/CompanyIndustry/PeerGroup schema was added.
No DB rows were written.
VCB remains missing-safe.
All candidate mappings remain blocked for reviewed import.
```

## Recommended Phase 150I

Create a schema migration proposal and dry-run for taxonomy models:

```text
Phase 150I — Add Industry / CompanyIndustry / PeerGroup schema draft and migration readiness
```

Recommended scope:

```text
Draft schema only if approved.
Keep no runtime data writes until a reviewed source package exists.
Preserve productionApproved=false and needsReview=true defaults for candidate/manual/research mappings.
Keep IndustryMetric delayed.
No UI redesign.
No provider fetch.
```

## Commit

Recorded in the Phase 150H Git commit.
