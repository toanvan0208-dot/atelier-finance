# Approved Source Adapter Pilot

Date: 2026-06-19

Phase: 30A - Approved Source Adapter Pilot

This document defines the first approved-source adapter pilot direction for Atelier Finance. It is an evaluation and adapter-design document only. It does not call an external API, scrape a website, add real financial data to the database, approve a source for production use, or change frontend behavior.

Phase 30B follow-up artifacts are tracked in `SOURCE_EVIDENCE_RECORDS.md` and `src/lib/data-sources/official-disclosure-financials-adapter.ts`. Phase 30C exact-source legal review is tracked in `EXACT_SOURCE_LEGAL_REVIEW_PACK.md`. Phase 30D Vietnam source selection is tracked in `OFFICIAL_FILING_SOURCE_SELECTION_VIETNAM_PILOT.md`. Phase 30E exact-source evidence approval state is tracked in `EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`. Phase 30F-A source-owner and Terms evidence collection follow-up is tracked in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`.

## 1. Current State

Atelier Finance now has the full-stack foundation needed to evaluate a real source adapter:

- Prisma schema, local SQLite workflow, and PostgreSQL production target are documented.
- Company, financial statement, market price, source, evidence, quality report, and manual import entities exist in the schema.
- API routes read company, financial-statement, and market-price data through the service layer.
- Manual import persistence exists as a user-provided workflow.
- Financials, Valuation, and Overview can read API/database-backed records.
- Current local data is still sample/demo or user-provided.

No production-approved real data source exists yet. Phase 30A therefore selects a pilot direction and defines the approval gate before any real ingestion work.

## 2. Source Candidates Reviewed

The review uses the existing `SOURCE_CANDIDATE_EVALUATION_MATRIX.md`, `SOURCE_EVIDENCE_POLICY.md`, `DATA_SOURCE_REGISTRY.md`, and `DATA_QUALITY_AND_LEGAL_CHECKLIST.md`.

| Candidate | Data groups | Access method | Current status | Decision for 30A | Reason |
| --- | --- | --- | --- | --- | --- |
| Official company filings and investor relations | Financial statements, company profile, valuation inputs | Official download/public file | `needs_legal_review` | Selected as pilot candidate | High-authority source class; aligns with Financials and Valuation; can begin with one issuer and one reporting period after rights review. |
| Official exchange market data | Market data, company profile | Official download | `needs_legal_review` | Shortlist, not first | Useful for prices, but market data rights can be restrictive and may require clearer runtime/cache terms first. |
| Regulator or government disclosure data | Company profile, risk, financial statements | Public web/public file | `needs_legal_review` | Shortlist, not first | Valuable for disclosure evidence, but source-specific terms and structure need review. |
| Official macro/statistical data | Macro | Official download | `needs_legal_review` | Defer for product core | Good authority but not the narrowest path for current Financials/Valuation bridges. |
| Commercial data vendors | Market, financials, valuation, industry, company profile, macro | Licensed feed | `unknown` | Defer | Needs contract, cost, API docs, and explicit runtime/cache terms. |
| Broker/data portal APIs | Market, financials, valuation, company profile | Official API only if documented | `needs_legal_review` | Defer | Do not use unless API access and rights are official and documented. |
| Public finance websites | Market, financials, valuation, company profile | Public web | `needs_legal_review` | Defer | Terms, automated access, display, caching, and attribution are not verified. |
| Manual academic upload | Market, financials, macro, industry, company profile | Manual upload | `research_only` | Not a production-source pilot | Already covered as user-provided/manual workflow; useful for local verification only. |
| External audit repo sources | Multiple | Unknown | `research_only` | Not a source | Research input only; do not copy data or scripts. |
| Private or undocumented APIs | Multiple | Private/undocumented | `blocked` | Blocked | No adapter work without documented rights from the source owner. |
| Scraped sources | Multiple | Scraped/public web | `needs_legal_review` | Defer | Requires legal review and stability assessment before any adapter. |

## 3. Selected Pilot Candidate

Selected pilot candidate: official company filings and investor relations / official disclosure files for financial statement snapshots.

Pilot scope:

- Data group: `financial_statement`
- Optional linked group: `company_profile`
- Ticker count: 1 to 3 issuers after source rights are reviewed
- Period count: one annual or quarterly period first
- Runtime mode before approval: design only or local review
- Database path after approval: `DataSource` + `SourceEvidence` + normalized `FinancialStatement`

This source class is selected because it best matches the product's current backend bridge: Financials and Valuation already read database/API records, and financial statements require explicit period/source metadata that the current schema can preserve.

## 4. Legal, Terms, And Source Status

Current status for the selected candidate:

| Area | Status | Required before adapter implementation |
| --- | --- | --- |
| Source identity | Candidate source class selected, exact source not yet approved | Choose exact filing/disclosure location and source owner. |
| License | Not reviewed | Record license name and URL, or document why no explicit license exists and obtain manual approval. |
| Terms of Service | Not reviewed | Record Terms URL and allowed use. |
| Runtime display | Unknown | Confirm the product may display normalized values and source attribution. |
| Caching/storage | Unknown | Confirm downloaded/source-derived values may be stored in the database. |
| Redistribution | Unknown | Confirm whether raw/source-equivalent data may be redistributed; default to no redistribution. |
| Derived data | Unknown | Confirm ratios/readiness/normalized records may be derived from the source. |
| Attribution | Unknown | Record attribution text if required. |
| Evidence status | Missing | Create `SourceEvidence` record and mark verified only after review. |
| Production status | Not approved | Keep `usageStatus:needs_legal_review` until all evidence is complete. |

The selected candidate is not production-approved in Phase 30A.

## 5. Field Coverage Matrix

The pilot should start with fields that already exist in the Prisma schema and data contract.

| Canonical field | Required for pilot | Source requirement | Missing behavior |
| --- | --- | --- | --- |
| `ticker` | Yes | Issuer/security identifier from source or reviewed mapping | Block record if absent. |
| `companyName` | Recommended | Official issuer name or reviewed mapping | Keep null if absent. |
| `companyType` | Yes | Reviewed classification before metric interpretation | Use `unknown` and conservative readiness if not reviewed. |
| `periodType` | Yes | Annual, quarter, or TTM construction rule | Block period-specific use if absent. |
| `period` | Yes | Canonical period string | Block record if absent. |
| `fiscalYear` | Yes | Statement period | Mark insufficient if absent. |
| `fiscalQuarter` | Conditional | Required for quarterly records | Null is allowed for annual records. |
| `reportDate` | Recommended | Filing/report date | Keep null and add warning if unavailable. |
| `publishedDate` | Recommended | Disclosure/publication date | Keep null and add warning if unavailable. |
| `currency` | Yes | Source currency | Block monetary comparison if absent. |
| `unit` | Yes | Source unit and normalization rule | Block normalization if unknown. |
| `revenue` | Optional | Statement line or company-type-specific equivalent | Keep null if absent. |
| `grossProfit` | Optional | Statement line if applicable | Keep null if absent. |
| `netIncome` | Required for many metrics | Statement line | Keep null; affected metrics become insufficient. |
| `operatingCashFlow` | Optional | Cash-flow statement line | Keep null; no cash-quality metric if absent. |
| `totalAssets` | Recommended | Balance-sheet line | Keep null; affected metrics become insufficient. |
| `equity` | Recommended | Balance-sheet line | Keep null; equity-based metrics become insufficient. |
| `totalDebt` | Optional | Interest-bearing debt definition | Keep null if definition is not explicit. |
| `currentAssets` | Optional | Balance-sheet line | Keep null if unavailable. |
| `currentLiabilities` | Optional | Balance-sheet line | Keep null if unavailable or not applicable. |
| `eps` | Optional | Source EPS or calculated only from validated inputs | Keep null if absent or unsupported. |
| `sourceId` | Yes | Registered `DataSource` | Block canonical write if missing. |
| `sourceLabel` | Yes | Human-readable source | Block product use if missing. |
| `asOf` | Yes | Validity/review timestamp | Block product use if missing. |
| `collectedAt` | Yes | Collection/import timestamp | Add warning if unavailable. |
| `missingFields` | Yes | Adapter validation output | Preserve as serialized array. |
| `warningCodes` | Yes | Adapter/source validation output | Preserve as serialized array. |

## 6. Data Quality Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Source terms do not allow runtime display | Cannot use in product runtime | Block source; keep research notes only. |
| Source allows reading but not caching | Cannot store normalized records | Do not persist; use only if legal review allows a non-cached path later. |
| Filing tables differ across issuers | Parser drift and wrong field mapping | Start with manual mapping spec and one issuer; add tests before automation. |
| Units are ambiguous | Monetary values can be scaled wrong | Require currency and unit; block normalization if unit is unknown. |
| Company type is unknown | Sector-sensitive metrics can be misread | Store `companyType`; use conservative readiness when unknown. |
| Missing statement lines | Downstream metrics can be incomplete | Keep null and list missing fields; do not fill with zero. |
| Duplicate periods | Conflicting values can overwrite each other | Detect by ticker, period, source, and asOf; record conflict in quality report. |
| Source changes published values | Historical corrections need traceability | Store source/asOf/collectedAt and do not silently overwrite without audit. |

## 7. Adapter Design

Phase 30A does not create a live adapter. The next implementation phase can add a skeleton only after exact source evidence is reviewed.

Proposed adapter boundary:

```ts
type OfficialDisclosureFinancialStatementAdapterInput = {
  sourceId: string;
  sourceUrl: string;
  sourceLabel: string;
  fetchedAt: string;
  rawRecord: Record<string, string | number | null>;
};

type OfficialDisclosureFinancialStatementAdapterOutput = {
  data: FinancialStatementRecord | null;
  metadata: DataSourceMetadata | null;
  readiness: ReadinessStatus;
  warnings: AdapterWarning[];
  errors: AdapterError[];
  sourceEvidenceStatus: SourceEvidenceStatus;
  usageStatus: SourceUsageStatus;
};
```

Required behavior:

- Fail closed when source evidence is missing, blocked, or still limited to legal review.
- Require `source`, `sourceUrl`, `asOf`, `period`, `periodType`, `currency`, and `unit`.
- Preserve `fetchedAt`/`collectedAt`.
- Preserve `missingFields`, `warningCodes`, and source evidence status.
- Keep missing numeric values as null.
- Do not calculate ratios inside the adapter.
- Do not promote the source to approved status.
- Do not use private or undocumented access.
- Do not fallback to sample/mock data when the source is blocked.

Potential future file path if approved:

- `src/lib/data-sources/official-disclosure-financials-adapter.ts`
- `src/lib/data-sources/__tests__/official-disclosure-financials-adapter.test.ts`

No adapter file is created in Phase 30A because exact source rights are not verified yet.

## 8. Environment And Access Requirements

No environment variable is required in Phase 30A because no external API is called.

If the selected exact source later requires an account or API key:

- The key must be supplied by the user through environment variables.
- No key, token, cookie, downloaded raw dataset, or private endpoint may be committed.
- Adapter code must fail closed when the required env value is missing.
- Access must be official and documented.

## 9. What Is Explicitly Not Approved Yet

- No exact source is approved for production runtime.
- No real source data is inserted into the database.
- No external API is called.
- No scraping is approved.
- No private or undocumented endpoint is approved.
- No runtime display, caching, redistribution, or derived-data right is confirmed.
- No source is marked `production_approved` or `approved`.
- Manual CSV remains user-provided data, not the main provider pipeline.
- `FPTLAB` remains local sample/lab data.
- Risk, Technical/PVT, Checklist, Watchlist, Simulation, and AI context are not newly bridged in this phase.

## 10. Required User Actions Before Phase 30B

Before implementation, the user or reviewer must provide:

1. Exact source name and URL for the pilot disclosure/filing source.
2. License URL or documented license statement.
3. Terms URL or official usage terms.
4. Confirmation for runtime display, caching/database storage, and derived-data use.
5. Attribution text, if required.
6. Confirmation that access is official and documented.
7. A small approved pilot scope: ticker(s), period(s), and data fields.
8. Decision on whether the first pilot is manual-reviewed file ingestion or official API/download ingestion.

## 11. Next Implementation Phase

Recommended next phase: Phase 30B - Source Evidence Record And Adapter Skeleton.

Phase 30B should:

- Add or update source registry/evidence entries for the exact selected source.
- Keep status as `needs_legal_review` unless all rights are verified.
- Add adapter skeleton with fail-closed policy behavior.
- Add unit tests for missing fields, missing env/permission, blocked source, null preservation, metadata preservation, and no source-status promotion.
- Avoid live provider calls unless the source is official, documented, and approved for the requested mode.

Production ingestion should wait until source evidence is verified and the production database plan is ready.
