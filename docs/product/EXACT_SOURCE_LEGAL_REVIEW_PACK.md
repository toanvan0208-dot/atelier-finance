# Exact Source Legal Review Pack

Date: 2026-06-19

Phase: 30C - Exact Source Legal/ToS Review Pack

This review pack is a pre-ingestion legal and data-quality checklist for the official disclosure financials pilot. It does not approve any source, call an external API, scrape a website, download a real report, parse real PDF/Excel files, write real financial data to the database, or change runtime behavior.

No exact source URL has been provided in the repo or Phase 30C brief. This document therefore records a review template for the selected source class and keeps the adapter decision at `needs_legal_review`.

Phase 30D narrows the Vietnam pilot direction in `OFFICIAL_FILING_SOURCE_SELECTION_VIETNAM_PILOT.md`.

## 1. Exact Source Identification

| Field | Current value |
| --- | --- |
| Source id | `official-disclosure-financials-pilot` |
| Source owner | Pending user/reviewer confirmation |
| Source class | Official company filings / investor relations / official disclosure files |
| Source URL | Pending user/reviewer confirmation |
| Report/file URL | Pending user/reviewer confirmation |
| Access method | `public_file` or official documented download, pending exact source |
| Data groups | `financial_statement`, optional `company_profile` |
| Pilot ticker(s) | Pending user/reviewer confirmation |
| Pilot period(s) | Pending user/reviewer confirmation |
| Pilot fields | Financial statement snapshot fields already mapped in `DATA_DICTIONARY_MAPPING.md` |
| Review date | 2026-06-19 |
| Reviewer | Documentation review by Codex; legal/source-owner review still required |

Exact source selection is intentionally unresolved. Until source owner, official URL, file/report URL, and usage terms are known, the candidate must not be treated as production-ready.

## 2. Legal/Terms Evidence

| Evidence item | Current value | Review note |
| --- | --- | --- |
| License URL | Not found / not provided | Must be supplied or reviewed before any approval. |
| Terms URL | Not found / not provided | Must be supplied or reviewed before any approval. |
| Copyright notice | Unknown | Requires exact source page/report review. |
| API/download terms | Unknown | No automated download or live adapter allowed. |
| Automated access terms | Unknown | No automated access allowed until official terms permit it. |
| Data display terms | Unknown | No product runtime display of real source data. |
| Caching/storage terms | Unknown | No database ingestion of real source data. |
| Redistribution terms | Unknown | No raw/source-equivalent redistribution. |
| Derived-data terms | Unknown | Do not persist normalized/derived product records from this source. |
| Attribution requirement | Unknown | Attribution text must be recorded if required. |
| Notes | Exact source not selected | This pack is a template and blocker list, not a legal approval. |

Unresolved questions:

- Which exact official source owner will be used?
- Which exact URL/file/report is in scope?
- Do the source terms allow product runtime display?
- Do the source terms allow database storage/cache?
- Do the source terms allow normalized records and derived metrics?
- Is attribution required?
- Is automated access/download allowed, or is manual-reviewed local fixture review the only acceptable next step?

## 3. Permission Decision Matrix

| Permission | Decision | Reason |
| --- | --- | --- |
| Runtime display | `unknown` | No exact terms reviewed. |
| Database storage/cache | `unknown` | No caching/storage permission reviewed. |
| Derived normalized values | `unknown` | Derived-data rights are not confirmed. |
| Redistribution of raw/source-equivalent data | `unknown` | Redistribution rights are not confirmed. |
| Automated access/download | `unknown` | No official automation/download terms reviewed. |
| Manual-reviewed local ingestion | `unknown` | May become allowed only after source owner and allowed-use terms are reviewed. |
| Attribution required | `unknown` | Attribution text is not known. |

Decision consequence:

- No production runtime display.
- No database ingestion pilot.
- No live adapter/API download.
- No raw report/data commit.
- No production-approved claim.

## 4. Data Quality Review

| Area | Current assessment | Required before ingestion |
| --- | --- | --- |
| Source authority | Potentially high if official company filing, IR page, exchange filing page, or official disclosure file is selected | Confirm exact source owner and official URL. |
| Update frequency | Unknown | Record filing cadence and expected publication timing. |
| Period coverage | Unknown | Confirm annual, quarterly, or TTM period coverage. |
| Field coverage | Not reviewed against exact source | Map source rows to canonical fields such as `ticker`, `period`, `netIncome`, `totalAssets`, `equity`, `currency`, and `unit`. |
| Currency/unit clarity | Unknown | Confirm currency, unit scale, and whether source values are raw, thousands, millions, or billions. |
| Restatement/correction risk | Unknown | Store `asOf`, `publishedDate`, `collectedAt`, and correction notes when available. |
| Mapping ambiguity | High until exact file format is reviewed | Require manual mapping notes before parser automation. |
| Company type classification risk | Unknown | Confirm company type before sector-sensitive metric interpretation. |
| Missing field behavior | Must stay null/metadata | Missing numeric values must remain `null`; no missing-to-zero behavior. |
| Duplicate/conflict handling | Not implemented for real ingestion | Future ingestion must detect ticker + period + source + asOf conflicts. |
| Evidence traceability | Incomplete | Source URL, report URL, reviewed date, reviewer, and attribution must be recorded. |

## 5. Adapter Decision

Final Phase 30C decision: `needs_legal_review`.

Reason:

- Exact source owner is not selected.
- Source URL and report/file URL are not provided.
- License and Terms are not reviewed.
- Runtime display rights are unknown.
- Caching/database storage rights are unknown.
- Derived-data rights are unknown.
- Automated access/download rights are unknown.

This candidate is not `blocked` because the source class may still become viable after review. It is not `research_only`, `pilot_ready_local_review`, `pilot_ready_official_api`, or `production_approved` because the required evidence is not present.

## 6. Allowed Next Action

Allowed now:

- Docs-only follow-up.
- Adapter skeleton hardening only.
- Exact source/legal evidence collection.

Not allowed now:

- Official API adapter implementation.
- Live download.
- Scraping.
- Database ingestion pilot.
- Product runtime display of real source data.
- Raw report/file commit.

Database ingestion pilot is explicitly blocked until caching/storage rights and source evidence are reviewed.

## 7. User/Reviewer Required Actions

The user or legal/source reviewer must provide:

1. Exact source owner and official source URL.
2. Exact report/file URL if a file-based pilot is intended.
3. License URL or official license statement.
4. Terms URL or official usage terms.
5. Runtime display decision.
6. Caching/database storage decision.
7. Derived-data/normalized-record decision.
8. Redistribution decision.
9. Attribution requirement and exact attribution text.
10. Automated access/download decision.
11. Pilot ticker(s), period(s), and fields.
12. Decision between manual-reviewed file fixture and documented official API/download path.

Until these are complete, the source evidence record should remain `usageStatus:needs_legal_review`, `evidenceStatus:missing`, and `productionApproved:false`.
