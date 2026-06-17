# Source Candidate Evaluation Matrix

Date: 2026-06-17

Phase: 27C - Source Candidate Evaluation Matrix

## 1. Purpose

This document evaluates candidate data-source categories before Atelier Finance writes any real adapter. It is not a real-data integration plan, does not call APIs, does not import data, and does not approve any production source.

The goal is to map each candidate category to required evidence, legal/technical risk, current status, and next action. If a source has no verified evidence for license, Terms of Service, runtime display, caching, and derived-data rights, it is not production-ready.

This matrix follows `SOURCE_EVIDENCE_POLICY.md`: the policy reduces legal and technical risk, but it is not a legal opinion. Final production use still requires manual review of each source's license, Terms of Service, and applicable law.

## 2. Evaluation Principles

- No evidence, no production use.
- No license/ToS, no production use.
- No caching rights, no caching.
- No runtime display rights, no public product runtime output.
- No redistribution rights, no raw/source-equivalent redistribution.
- Private or undocumented APIs are blocked by default.
- Scraped sources require legal review.
- Academic-only sources are not public product runtime sources.
- Missing data remains `null`, `not_available`, `insufficient_data`, or `not_applicable`.
- Adapters must not fallback to mock data when a source is blocked.
- Source candidates from external audits are research input only, not production-approved.

## 3. Evaluation Criteria

| Criterion | Why it matters |
| --- | --- |
| Data coverage | Candidate must cover required canonical fields for the target module. |
| Source authority | Official or licensed sources are preferred for review, but still need rights evidence. |
| Access method | Official API/download/manual upload is safer than private API or scraping. |
| License clarity | Production use requires explicit license evidence. |
| ToS clarity | Terms must allow the intended access and runtime mode. |
| Caching rights | Cache/storage behavior must be allowed before any database/cache adapter. |
| Runtime display rights | Displaying data in the app is separate from redistributing raw datasets. |
| Redistribution rights | Required only for raw/source-equivalent redistribution or downloadable datasets. |
| Derived-data rights | Ratios, flags, readiness status, and normalized records still inherit source obligations. |
| Attribution requirements | Required attribution must be shown or carried in metadata. |
| Update frequency | Affects stale thresholds and asOf rules. |
| asOf/period availability | Every displayed record needs source, asOf, and period semantics. |
| Historical data availability | Needed for trends, PVT, valuation context, and comparisons. |
| Reliability | Source stability and correction process matter before adapter work. |
| Implementation complexity | Parsing PDFs/HTML/Excel is higher risk than typed APIs. |
| Legal risk | License, ToS, scraping, redistribution, and commercial-use risk. |
| Technical risk | Rate limits, schema drift, missing fields, duplicate periods, and stale data. |
| Cost risk | Vendor fees and contract constraints can block product use. |
| Recommended status | `approved`, `needs_legal_review`, `research_only`, `blocked`, or `unknown`. |
| Next action | Manual review, research-only, defer, blocked, or not enough information. |

## 4. Candidate Matrix By Data Group

### Market Data

Required fields include `ticker`, `exchange`, `closePrice`, `previousClose`, OHLC where available, `volume`, `tradingValue`, and `asOf`.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official exchange sources | HOSE, HNX, UPCoM | market, company_profile | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | medium | needs_legal_review | proceed_to_manual_review | High-authority candidate, not approved. | Exchange data terms, runtime display, caching, derived-data rights, attribution. |
| Commercial data vendors | FiinTrade or similar licensed vendors | market, financial_statement, valuation, industry | licensed_feed | contract required | contract required | contract required | contract required | contract required | missing | high | medium | unknown | not_enough_information | Potentially robust but cost/license dependent. | Signed license, API docs, rate limits, runtime/cache/derived-data clauses. |
| Broker/data portal APIs | SSI, VNDIRECT, Vietcap, Vietstock if officially documented | market, financial_statement, valuation | official_api if documented | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | needs_legal_review | defer | Only review documented APIs. | Official API docs, ToS, auth/rate limits, runtime/cache/derived-data rights. |
| Public finance websites | CafeF, FireAnt, Vietstock public pages or similar | market, company_profile, valuation | public_web | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | needs_legal_review | defer | Useful for comparison only until rights are clear. | Terms allowing automated use, display, caching, attribution. |
| Private/undocumented APIs | Hidden endpoints discovered by inspection | market | private_or_undocumented_api | missing | blocked | blocked | blocked | blocked | missing | blocked | blocked | blocked | blocked | Do not write adapter. | Documented rights from source owner would be required to reconsider. |
| Scraped sources | HTML scraping of public pages | market, company_profile | scraped | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | needs_legal_review | defer | Requires legal and stability review. | ToS allowing scraping, rate-limit policy, runtime/cache/derived rights. |

### Financial Statements

Required fields include `revenue`, `grossProfit`, `netIncome`, `operatingCashFlow`, `totalAssets`, `equity`, `totalDebt`, `currentAssets`, `currentLiabilities`, fiscal period, and asOf/source metadata.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official company filings / IR | Annual reports, financial statements, IR pages | financial_statement, company_profile, valuation | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | high | needs_legal_review | proceed_to_manual_review | Strong authority, complex parsing. | Filing terms, period metadata, parser QA, caching/storage rights. |
| Regulator/government disclosures | SSC or equivalent disclosure portals | financial_statement, risk, company_profile | public_web | not reviewed | unknown | unknown | unknown | unknown | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Good transparency candidate. | Terms, display rights, storage rights, period/asOf rules. |
| Commercial vendors | Licensed financial database vendors | financial_statement, valuation, industry | licensed_feed | contract required | contract required | contract required | contract required | contract required | missing | high | medium | unknown | not_enough_information | Viable only after contract review. | Signed data agreement and field-level rights. |
| External audit repo sources | Valky data docs/scripts, BCTC samples | financial_statement | unknown | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | research_only | research_only | Research input only; do not copy data/scripts. | Independent source evidence and rewritten adapter. |
| Manual academic upload | Small reviewed thesis fixture | financial_statement | manual_upload | academic/local only | limited/unknown | no public runtime | no raw redistribution | unclear | partially_verified | medium | medium | research_only | research_only | Suitable for thesis verification path. | Provenance, permission, source/asOf/period, null/duplicate tests. |

### Valuation Inputs

Required fields include `eps`, `bvps`, `sharesOutstanding`, `marketCap`, `enterpriseValue` if available, `closePrice`, and linked financial statement periods.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Derived from market + filings | Exchange price plus financial statements | valuation, market, financial_statement | derived_internal | depends on inputs | depends on inputs | depends on inputs | depends on inputs | required | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Preferred once input sources are approved. | `derivedFrom`, source/asOf/period, EPS/equity guardrails, derived-data rights. |
| Commercial vendors | Licensed valuation/financial feeds | valuation, market, financial_statement | licensed_feed | contract required | contract required | contract required | contract required | contract required | missing | high | medium | unknown | not_enough_information | Do not import fair value/target price examples. | License terms for displayed metrics and derived ratios. |
| Public finance websites | CafeF, FireAnt, Vietstock-like pages | valuation | public_web | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | needs_legal_review | defer | Use only as candidate for review. | ToS, source authority, runtime/cache/derived rights. |

### Macro Data

Required fields include GDP, CPI/inflation, interest rate, exchange rate, credit growth if available, period, unit, source, and asOf.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official macro/statistical sources | GSO, SBV or equivalent official sources | macro | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Priority review candidate due authority. | Public data terms, release calendar, attribution, cache/display rights. |
| Commercial vendors | Licensed macro feeds | macro | licensed_feed | contract required | contract required | contract required | contract required | contract required | missing | high | medium | unknown | not_enough_information | Useful if budget and rights allow. | Vendor agreement and update cadence. |
| External audit repo macro files | Macro CSV samples from audit repo | macro | unknown | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | research_only | research_only | Research input only; do not copy. | Original source evidence, duplicate-period policy, rewrite adapter. |

### Industry Data

Required fields include industry classification, sector classification, taxonomy source, peer set, industry metrics if available, period, and asOf.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official exchange/regulator taxonomy | Exchange classifications, regulator disclosures | industry, company_profile | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Good taxonomy candidate. | Taxonomy license, version, review date, display/cache rights. |
| Commercial vendors | Licensed sector/industry datasets | industry | licensed_feed | contract required | contract required | contract required | contract required | contract required | missing | high | medium | unknown | not_enough_information | May improve peer comparisons. | Peer-set and derived-data rights. |
| Manual internal taxonomy | Curated thesis taxonomy | industry, company_profile | manual_upload | internal only | local only | no public runtime | no raw redistribution | internal | partially_verified | medium | medium | research_only | research_only | Useful for local validation only. | Reviewer, methodology, source references, no public claims. |

### Company Profile

Required fields include `companyName`, `ticker`, `exchange`, `industry`, `sector`, `companyType`, `businessDescription`, and listing info if available.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official company websites / IR | Company website, annual reports | company_profile, financial_statement | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | high | needs_legal_review | proceed_to_manual_review | Good authority but text extraction and claims need care. | Terms, attribution, reviewedAt, source URL per claim. |
| Official exchange/company listing pages | HOSE/HNX/UPCoM listing references | company_profile, market | official_download | not reviewed | unknown | unknown | unknown | unknown | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Useful for ticker/exchange identity. | Listing data rights and update cadence. |
| Public finance websites | CafeF, FireAnt, Vietstock-like profiles | company_profile | public_web | not reviewed | unknown | unknown | unknown | unknown | missing | high | medium | needs_legal_review | defer | Do not treat descriptions as verified without source evidence. | ToS, runtime display rights, attribution. |

### Risk / Transparency Data

Required fields may include audit opinion, late filing flag, liquidity/risk flags, abnormal data flags, source reliability notes, and evidence metadata.

| Candidate/source category | Example source names if known | Data groups supported | Access method | License/ToS status | Caching status | Runtime display status | Redistribution status | Derived-data status | Evidence status | Legal risk | Technical risk | Current policy status | Candidate decision | Notes | Required evidence before adapter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Derived internal risk flags | Calculated from approved inputs | risk | derived_internal | depends on inputs | depends on inputs | depends on inputs | depends on inputs | required | missing | medium | medium | needs_legal_review | proceed_to_manual_review | Best path after input data is approved. | `derivedFrom`, calculation version, source/asOf/period, no recommendation wording. |
| Regulator/company filings | Late filings, audit opinions, disclosure events | risk, company_profile | official_download/public_web | not reviewed | unknown | unknown | unknown | unknown | missing | medium | high | needs_legal_review | proceed_to_manual_review | Useful but requires careful claim sourcing. | Legal terms, exact filing source, period, reviewedAt. |
| Public finance websites / scraped pages | News-like or portal flags | risk | public_web/scraped | not reviewed | unknown | unknown | unknown | unknown | missing | high | high | needs_legal_review | defer | Avoid unsourced qualitative claims. | ToS, attribution, display rights, reliability policy. |

## 5. Recommended Shortlist For Next Review

- Official exchange sources are candidates for manual review because authority is high, but market data rights may be restrictive.
- Official company filings and investor relations documents are candidates for manual review because they can support financial statements and business profile, but parsing and caching rights need review.
- Official macro/statistical sources are candidates for manual review because they can support macro context with clear release periods.
- Commercial vendors are candidates only after cost, license, caching, runtime display, and derived-data rights are reviewed.
- Broker/data portal APIs and public finance websites should be deferred unless access is documented and Terms allow the intended use.
- Private or undocumented APIs should not be used for production.
- Manual academic datasets may be useful for thesis/local verification, not public product runtime.

No source is recommended for immediate production use in this phase.

## 6. Adapter Readiness Gate

A source can move toward a real adapter only when:

- A `SourceEvidence` record exists.
- `evidenceStatus` is `verified`, or the mode is explicitly limited to research/thesis verification.
- License and Terms of Service are reviewed.
- Access method is valid and not private/undocumented.
- Runtime mode is defined.
- Runtime display, caching, and derived-data rights are clear.
- Redistribution rights are clear if raw/source-equivalent data will be redistributed.
- Required fields map to the canonical data contract.
- Source, asOf, period, collectedAt, missing fields, and warnings can be preserved.
- Missing data semantics are documented and tested.
- Tests cover blocked, research-only, legal-review, and approved behavior.
- The source does not violate `SOURCE_EVIDENCE_POLICY.md`.

## 7. Phase 27D / 28 Recommendation

Recommended next phase:

- Phase 27D: Source Evidence Records For Shortlisted Candidates.

Alternative if no production-safe source is verified:

- Phase 28A: Manual Upload Adapter For Thesis Verification.

If no source is production-approved, do not write a production API adapter. A manual upload/thesis verification adapter is safer than using private or undocumented APIs, as long as the source evidence and runtime mode stay explicit.

