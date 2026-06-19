# Source Owner Terms Evidence Follow-up

Date: 2026-06-19

Phase: 30F-A - Source Owner/Terms Evidence Collection Follow-up

This document is a source-owner and reviewer evidence collection pack for the Vietnam official filing pilot. It does not approve, ingest, scrape, download, parse, display, or store real source data. It does not create a fixture, ingestion route, live adapter, Prisma schema change, migration, or runtime behavior.

Phase 30G browser-based Terms evidence collection is recorded in `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md`. That phase found FPT Terms of Use (restricting commercial use without written agreement), FPT copyright notice, FPT IR report file URLs, and the FPT Digital Annual Report 2025 site. HOSE Terms were not extractable due to JavaScript SPA rendering. Status remains `needs_legal_review`; `productionApproved:false`.

## 1. Phase 30F-A Summary

Candidate: HOSE-hosted FPT Corporation Annual Report 2025 disclosure page.

Official source URL: `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668`

Exact report/file URL: pending manual review; not downloaded or committed.

Ticker `FPT` is a source-review candidate only. `FPTLAB` remains the local sample ticker and must not be changed into `FPT`.

Current status: `needs_legal_review`.

`productionApproved:false`.

HOSE is treated as the disclosure page host. FPT Corporation is treated as the issuer/report owner. Both roles may have relevant usage restrictions. Phase 30F-A only lists the evidence the user/reviewer must collect before any later fixture, adapter, product display, or database work can be considered.

## 2. Evidence Collection Tracker

| Evidence item | Owner to confirm | Current status | Required evidence | Acceptable evidence format | Blocking consequence if missing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Exact report/file URL | Reviewer/user; HOSE if needed | pending_user_review | Exact official file URL, if a file is in scope | Official page link, file link, or reviewer note that no file will be used | No report/file use, no fixture pack, no parsing plan | Do not download or commit the file in this phase. |
| HOSE Terms/usage policy | HOSE/source host | unknown | Terms governing disclosure page/data use | Public Terms URL, official policy page, or written source-owner response | Keep `needs_legal_review`; no runtime display, cache, automation, or ingestion | Must cover the intended use, not only site browsing. |
| FPT/issuer report usage statement | FPT/issuer/report owner | unknown | Usage terms for report content and extracted values | Report copyright page, issuer Terms URL, IR policy, or written issuer response | No report-file use and no extracted-value use beyond review notes | Needed if the report file is the source of values. |
| Copyright notice | FPT/issuer/report owner; reviewer | unknown | Copyright owner and restrictions for report/page/file | Notice copied into reviewer notes with source URL and date | No raw/source-equivalent redistribution | Do not copy long report text into repo. |
| Runtime display permission | HOSE and/or FPT, depending on source/file | unknown | Permission to show normalized values in the application | Terms clause or written confirmation | No product UI display | Display is separate from storage and redistribution. |
| Database storage/cache permission | HOSE and/or FPT, depending on source/file | unknown | Permission to store/cache normalized values in the database | Terms clause, cache policy, license text, or written confirmation | No database ingestion | Must cover persistence, not only viewing. |
| Derived normalized record permission | HOSE and/or FPT, depending on source/file | unknown | Permission to create normalized records and derived readiness/metric fields | Terms clause or written confirmation | No persisted normalized records | Normalization still inherits source obligations. |
| Raw/source-equivalent redistribution permission | HOSE and/or FPT, depending on source/file | unknown | Whether report file/raw extracted data may be redistributed | Terms clause or written confirmation | No raw/source-equivalent commit, download export, or redistribution | Default product posture should be no raw redistribution. |
| Automated access/download permission | HOSE/source host | unknown | Permission for automated access, download, schedule, user-agent, and retry behavior | API/download Terms, robots/automation policy if applicable, or written confirmation | No live adapter/download implementation | Private or undocumented access remains blocked. |
| Manual-reviewed local fixture permission | HOSE and/or FPT, depending on source/file | unknown | Permission for local academic/internal manually reviewed extraction | Written approval, explicit Terms clause, or reviewer-approved internal-only statement | No fixture pack | Needed before Phase 30F-B can create any fixture. |
| Attribution requirement and exact text | HOSE and/or FPT, depending on source/file | unknown | Whether attribution is required and exact wording | Terms clause or written confirmation | Attribution text must be confirmed before use | Store exact required text in reviewer template. |
| Rate limit / anti-automation restriction | HOSE/source host | unknown | Access limits and anti-automation restrictions | Terms URL, technical policy, or written source-owner response | No automated adapter/download | Applies even if page is public. |
| Report correction/restatement policy if available | HOSE and/or FPT; reviewer | unknown | How corrections, restatements, or replacement files are published | Policy URL, report note, disclosure page note, or reviewer observation | No reliable update/correction workflow | Needed before production ingestion design. |
| Reviewer/date/sign-off note | Reviewer/user | pending_user_review | Named reviewer, review date, and final decision note | Filled reviewer template in Section 5 | Keep `needs_legal_review` | This is not a legal opinion unless performed by qualified counsel. |

## 3. Source Owner Question List

Questions for HOSE/source host:

1. May the application display normalized values extracted from the disclosure/report?
2. May the application store/cache normalized financial statement values in its database?
3. May the application create derived metrics/readiness fields from the disclosed values?
4. May the application redistribute raw or source-equivalent report data?
5. Is automated access/download permitted?
6. Is manual-reviewed local academic/internal fixture extraction permitted?
7. Is attribution required? If yes, what exact text is required?
8. Are there rate limits or anti-automation restrictions?
9. Are there restrictions on commercial/product/runtime usage?

## 4. Issuer/Report Owner Question List

Questions for FPT/issuer/report owner:

1. May the application display normalized values from the annual report?
2. May the application store/cache normalized values?
3. May the application create derived ratios/readiness fields?
4. May the report file or raw extracted data be redistributed?
5. Is attribution required? If yes, what exact text is required?
6. Is local academic/manual-reviewed extraction allowed?
7. Are there any restrictions on product/runtime usage?

## 5. Reviewer Decision Template

| Field | Reviewer entry |
| --- | --- |
| Reviewer name |  |
| Review date |  |
| Source owner reviewed |  |
| Source URL | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` |
| Report/file URL |  |
| Terms URL |  |
| License/usage statement URL |  |
| Runtime display decision | unknown / allowed / not_allowed / pending_review |
| Storage/cache decision | unknown / allowed / not_allowed / pending_review |
| Derived-data decision | unknown / allowed / not_allowed / pending_review |
| Redistribution decision | unknown / allowed / not_allowed / pending_review |
| Automated access decision | unknown / allowed / not_allowed / pending_review |
| Manual fixture decision | unknown / allowed / not_allowed / pending_review |
| Attribution text |  |
| Final status decision | `needs_legal_review` / `research_only` / `pilot_ready_local_review` / `pilot_ready_official_api` / `production_approved` / `blocked` |
| Notes |  |

## 6. Status Decision Rules

- If Terms/license are missing, keep `needs_legal_review`.
- If display rights are unknown, no product UI display.
- If storage/cache rights are unknown, no database ingestion.
- If derived-data rights are unknown, no persisted normalized records.
- If automated access rights are unknown, no live adapter/download.
- If manual fixture rights are unknown, no fixture pack.
- If only academic/internal local review is allowed, use `pilot_ready_local_review` or `research_only`, not production.
- If source owner denies storage, display, or derived rights, use `blocked` or `research_only` depending on the denial scope.
- Use `pilot_ready_official_api` only if automated access/download terms are explicit and compatible with the intended adapter behavior.
- Use `production_approved` only if all rights needed for deployed product use are explicitly confirmed and evidence is recorded.

## 7. Allowed Next Actions After This Phase

Allowed now:

- evidence collection
- contact/source-owner confirmation
- docs-only follow-up
- adapter skeleton hardening

Conditionally allowed later:

- Phase 30F-B: Manual-reviewed Official Filing Fixture Pack, only if manual-reviewed local fixture permission is confirmed.
- Phase 30G: Database Ingestion Pilot, only if storage/cache and derived-data rights are confirmed.
- Live official adapter/download implementation, only if automated access/download terms are confirmed.
- Product runtime display, only if display rights and attribution are confirmed.

Still not allowed now:

- report/file download into the repo
- raw/source-equivalent data commit
- real report parsing
- database write of real source values
- product UI display of real source values
- source status promotion

## 8. Recommended User Workflow

1. Open the exact HOSE page manually.
2. Identify the exact report/file URL, but do not commit the raw file.
3. Find HOSE Terms or usage policy related to disclosure/data usage.
4. Find any statement, copyright notice, or Terms inside the report file or issuer page.
5. Record evidence in the reviewer template in Section 5.
6. If rights remain unclear, contact the source owner or keep `needs_legal_review`.
7. Proceed to a fixture pack only after local manual-review permission is confirmed.

If any core permission remains unknown, keep the candidate non-production and fail closed in later implementation work.
