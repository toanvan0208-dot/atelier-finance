# Exact Source Evidence Approval Update

Date: 2026-06-19

Phase: 30E - Exact Source Evidence Approval Update

This document updates the exact-source evidence state for the Vietnam official filing pilot. It does not call an external API, scrape a website, download a report, parse a real PDF/Excel file, commit raw/source data, write to the database, approve production use, or change runtime behavior.

Phase 30F-A source-owner and Terms evidence collection follow-up is tracked in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`. Phase 30G browser-based Terms evidence collection is tracked in `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md`.

## 1. Phase 30E Summary

Candidate: HOSE-hosted FPT Corporation Annual Report 2025 disclosure page.

Ticker: `FPT` is a source-review candidate only. Local sample ticker `FPTLAB` remains separate and unchanged.

Current decision: `needs_legal_review`.

`productionApproved:false`.

Phase 30E does not promote the source status. The existing docs identify an official HOSE disclosure page candidate, but the repo does not contain reviewed license, Terms, display, storage/cache, derived-data, redistribution, automated access, manual fixture, or attribution evidence. Because those rights remain unknown, this candidate is not approved for product runtime display, database ingestion, persisted normalized records, live download/API adapter work, or raw/source-equivalent redistribution.

## 2. Exact Source Evidence Table

| Field | Value |
| --- | --- |
| Source id | `official-disclosure-financials-pilot` |
| Source class | Official exchange disclosure page/file; company disclosure financials pilot |
| Source owner | HOSE as disclosure page host, pending legal/source-owner confirmation |
| Issuer/report owner | FPT Corporation, pending legal/source-owner confirmation |
| Official source URL | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` |
| Exact report/file URL | pending manual review; not downloaded or committed |
| Access method | `public_file` / official disclosure page, manual review only |
| Report type | Annual report |
| Period | 2025 annual report candidate |
| Ticker | `FPT` source-review candidate only; do not mix with `FPTLAB` |
| Data group | `financial_statement`, optional `company_profile` |
| Review date | 2026-06-19 |
| Reviewer | Documentation review by Codex; legal/source-owner review still required |
| Evidence status | `missing` / pending legal and source-owner review |
| Usage status | `needs_legal_review` |
| Production approved | `false` |

## 3. Legal/ToS Evidence Table

| Evidence item | Status | Notes |
| --- | --- | --- |
| License URL | unknown | No explicit license URL found. FPT Terms of Use page exists at `https://fpt.com.vn/en/terms-of-use` but does not constitute a data license. |
| Terms URL | found (FPT only) | FPT Terms of Use found at `https://fpt.com.vn/en/terms-of-use`. HOSE terms not found (JavaScript SPA). See `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md` Section 2 item #8. |
| Copyright notice | found (FPT only) | FPT footer: "Copyright © FPT". FPT Terms: "©2015 Copyright by FPT Corp. All rights reserved". See `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md` Section 2 item #9. |
| HOSE usage terms | unknown | Requires source-owner or legal review before any runtime, cache, or automation decision. |
| Issuer/FPT usage terms | unknown | Requires issuer/report usage statement if the report file is used. |
| Report/file usage statement | pending_user_review | Exact file URL and file usage terms have not been provided or reviewed. |
| Automated access/download terms | unknown | No live adapter, automated download, or scheduled access is allowed. |
| Display terms | unknown | No product runtime display is allowed. |
| Storage/cache terms | unknown | No database ingestion or cache/storage is allowed. |
| Derived-data terms | unknown | No persisted normalized records or derived records are allowed. |
| Redistribution terms | unknown | No raw/source-equivalent report or data redistribution is allowed. |
| Attribution requirement | unknown | Attribution text must be confirmed before any use. |
| Notes/unresolved questions | pending_user_review | User/reviewer must provide exact links and rights confirmations listed in Section 7. |

Allowed status values for this table are `found`, `not_found`, `unknown`, `pending_user_review`, `confirmed_allowed`, and `confirmed_not_allowed`. Phase 30E does not invent links, permissions, or legal conclusions.

## 4. Permission Decision Matrix

| Permission | Decision | Evidence | Consequence |
| --- | --- | --- | --- |
| Runtime display | `unknown` | No reviewed display terms in repo docs. | No product UI display of real HOSE/FPT source data. |
| Database storage/cache | `unknown` | No reviewed storage/cache terms in repo docs. | No database ingestion. |
| Derived normalized records | `unknown` | No reviewed derived-data terms in repo docs. | No persisted normalized records. |
| Raw/source-equivalent redistribution | `unknown` | No reviewed redistribution terms in repo docs. | No raw report, raw extracted data, or source-equivalent commit/redistribution. |
| Automated access/download | `unknown` | No reviewed automated access/download terms in repo docs. | No live adapter, scheduled download, or automated API/download implementation. |
| Manual-reviewed local fixture | `pending_review` | Manual fixture permission has not been confirmed. | No local fixture pack yet; continue docs/source-owner confirmation only. |
| Attribution required | `unknown` | No reviewed attribution statement in repo docs. | Attribution text must be confirmed before use. |

## 5. Status Decision

Final Phase 30E status: `needs_legal_review`.

Reason:

- License and Terms remain unknown.
- Runtime display rights remain unknown, so product UI display is blocked.
- Storage/cache rights remain unknown, so database ingestion is blocked.
- Derived-data rights remain unknown, so persisted normalized records are blocked.
- Automated access/download terms remain unknown, so live adapter/download work is blocked.
- Manual-reviewed local fixture permission is still pending review, so the candidate is not `pilot_ready_local_review`.
- Automated official access is not confirmed, so the candidate is not `pilot_ready_official_api`.
- Required product runtime rights are not verified, so the candidate is not `production_approved`.

The source class is not marked `blocked` because an official disclosure source may still become usable after legal/source-owner evidence collection. The current evidence state, however, is insufficient for product use.

## 6. Allowed Next Action

Allowed now:

- docs-only follow-up
- contact/source-owner confirmation
- exact report URL confirmation
- adapter skeleton hardening only

Not allowed now:

- manual-reviewed local fixture only, until manual fixture rights are confirmed
- official API/download adapter implementation, until automated access/download terms are clear
- database ingestion pilot, until storage/cache and derived-data rights are clear
- product runtime display, until display rights and attribution text are clear

## 7. User/Reviewer Required Actions

The user or legal/source reviewer must provide or confirm:

1. Exact HOSE page link.
2. Exact report/file link if the file is intended for use.
3. HOSE Terms or usage policy link related to disclosure data.
4. FPT/issuer report usage link or statement if the report file is used.
5. Runtime display rights.
6. Database storage/cache rights.
7. Derived normalized data rights.
8. Raw/source-equivalent redistribution restriction.
9. Automated access/download rights.
10. Required attribution text.
11. Whether a manual-reviewed local fixture is allowed.
12. Ticker, period, and allowed fields.

## 8. Recommended Next Phase

Recommended next phase: Phase 30F - Source Owner/Terms Evidence Collection Follow-up.

This is the safest next phase because legal, display, storage/cache, derived-data, redistribution, automated access, manual fixture, and attribution evidence are still missing. Do not proceed to ingestion while those rights remain unknown.

Phase 30F-A implements this follow-up as a docs-only evidence tracker in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`. It does not change the final status from `needs_legal_review`.

Alternative Phase 30F paths are conditional only:

- Phase 30F - Manual-reviewed Official Filing Fixture Pack, only if manual-reviewed local fixture rights are explicitly confirmed.
- Phase 30F - Adapter Skeleton Hardening For Official Filing Candidate, only for code guardrails and no real source data.

Ingestion is not a recommended next phase because storage/cache, display, and derived-data rights are not clear.
