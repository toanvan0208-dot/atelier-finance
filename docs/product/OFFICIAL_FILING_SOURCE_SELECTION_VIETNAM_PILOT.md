# Official Filing Source Selection - Vietnam Pilot

Date: 2026-06-19

Phase: 30D - Official Filing Source Selection - Vietnam Pilot

This document narrows the Phase 30A-30C source direction for a Vietnam financial-statement pilot. It does not call a live API, scrape, download a report, parse a real PDF/Excel file, write real financial data to the database, approve a production source, or change runtime behavior.

Phase 30E exact-source evidence and permission state is tracked in `EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`. Phase 30F-A source-owner and Terms evidence collection follow-up is tracked in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`.

## 1. Decision Summary

Selected direction:

- Vietnam official company filing / investor relations / official exchange disclosure for one financial statement snapshot.
- Primary data group: `financial_statement`.
- Optional data group: `company_profile`.
- First candidate for legal/source review: FPT Corporation Annual Report 2025 disclosure page hosted on HOSE.
- Current status: `needs_legal_review`.
- `productionApproved:false`.

Explicit exclusions:

- `vnstock` is not selected as a production source in this phase.
- Market data feed is not selected as the first source because market data runtime/cache/display rights are usually more sensitive.
- Public finance portals, private endpoints, and scraped pages are not selected.

## 2. Candidate Options

| Option | Source owner | Source URL | Data groups | Access method | Legal/ToS status | Storage/cache | Runtime display | Derived data | Pros | Risks | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Company investor relations / official company website | Company issuer, e.g. FPT Corporation if confirmed | Pending exact issuer page | `financial_statement`, `company_profile` | Official company website or file | Unknown | Unknown | Unknown | Unknown | Highest proximity to issuer; may include full report context | Company website terms and file rights still need review; parser format may vary | Shortlist |
| Official exchange disclosure page/file | HOSE/HNX depending on listed venue | HOSE candidate page: `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668`; HNX disclosure portal candidate: `https://www.hnx.vn/en-gb/thong-tin-cong-bo-up-hnx.html` | `financial_statement`, `company_profile` | Official exchange disclosure page/file | Unknown | Unknown | Unknown | Unknown | Official exchange-hosted disclosure path; good audit trail for listed-company filing | Need exchange terms, file usage, storage/cache rights, attribution, and exact report URL review | Selected review candidate |
| Regulator/government disclosure source | SSC or related official disclosure channel | SSC site/regulation examples exist, exact issuer disclosure URL pending | `financial_statement`, `risk`, `company_profile` | Official regulator/government page/file | Unknown | Unknown | Unknown | Unknown | Strong regulatory authority and disclosure context | Exact company report discovery and use terms need review | Shortlist |
| Licensed vendor | Licensed data vendor | Pending contract/API docs | `financial_statement`, `market`, `valuation`, `industry` | Licensed feed | Contract required | Contract required | Contract required | Contract required | Could support normalized data and service terms | Cost, contract, redistribution, and field-rights constraints | Future option |
| `vnstock` research/access tooling | Third-party package/tooling, not source owner | Not used as production source | Research comparison only if ever reviewed | Package/tooling access | Not approved for product source use | Not approved | Not approved | Not approved | May help exploratory research outside product runtime | Not an official source owner; not selected for production source path | Not selected |

## 3. Selected Pilot Candidate

Selected review candidate:

| Field | Value |
| --- | --- |
| Source class | Official exchange disclosure page/file |
| Source owner | HOSE as disclosure page host; FPT Corporation as issuer/report owner, subject to legal confirmation |
| Official source URL | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` |
| Report/file URL | Not downloaded or committed; exact file URL pending manual legal review |
| Ticker | `FPT` for source review only; do not mix with local `FPTLAB` sample ticker |
| Period | 2025 annual report candidate |
| Report type | Annual report |
| Intended fields | Financial statement snapshot fields listed in Section 5 |
| Access method | Official disclosure page/file, manual review only |
| Review status | `needs_legal_review` |
| Production approval | `false` |
| Phase 30E evidence update | `docs/product/EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`; no promotion because license, Terms, display, storage/cache, derived-data, redistribution, automated access, manual fixture, and attribution evidence remain unresolved |
| Phase 30F-A evidence follow-up | `docs/product/SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`; docs-only tracker for HOSE/FPT questions and reviewer sign-off |

Rationale:

- The selected candidate is specific enough for a legal/source review pack.
- The source direction aligns with existing `financial_statement` schema and adapter skeleton.
- It avoids market data feed rights as the first pilot.
- It avoids private, undocumented, or third-party tooling as the source of truth.

Important boundary:

The HOSE page and FPT report candidate are not approved for database ingestion or product runtime display until license, Terms, runtime display, storage/cache, derived-data, and attribution rights are reviewed.

## 4. Legal/ToS/Permission Matrix

| Permission | Current status | Decision consequence |
| --- | --- | --- |
| License/Terms found? | `unknown` | Do not mark approved. |
| Runtime display allowed? | `unknown` | Do not display real source data in product UI. |
| Database storage/cache allowed? | `unknown` | Do not run database ingestion pilot. |
| Derived normalized data allowed? | `unknown` | Do not persist normalized records from this source. |
| Raw/source-equivalent redistribution allowed? | `unknown` | Do not commit or redistribute report/raw data. |
| Automated access/download allowed? | `unknown` | Do not implement live download/API adapter. |
| Manual-reviewed local fixture allowed? | `unknown` | Can be considered only after source owner/terms review. |
| Attribution required? | `unknown` | Attribution text must be confirmed before use. |

Current adapter decision: `needs_legal_review`.

Phase 30E keeps this decision unchanged. The exact HOSE page candidate is known, but the exact report/file URL is still pending manual review and was not downloaded or committed. Legal/ToS and permission evidence remains insufficient for runtime display, database ingestion, persisted normalized records, live adapter/download work, or raw/source-equivalent redistribution.

## 5. Pilot Scope

Proposed narrow scope after legal/source review:

- 1 ticker: `FPT` source review candidate.
- 1 period: 2025 annual report candidate.
- 1 official report/disclosure page/file.
- Data group: `financial_statement`.
- No market price feed in Phase 30D.

Pilot fields:

- `ticker`
- `companyName`
- `period`
- `fiscalYear`
- `fiscalQuarter` when applicable
- `reportDate` or `publishedDate` when available
- `currency`
- `unit`
- `revenue`
- `netIncome`
- `totalAssets`
- `equity`
- `operatingCashFlow` when available
- `eps` when available
- `sourceUrl`
- `collectedAt`
- `missingFields`
- `warningCodes`

All missing numeric values must remain `null`. No missing field may be converted to zero.

## 6. Allowed Next Action

Allowed now:

- Exact source evidence collection.
- Docs-only follow-up.
- Adapter skeleton hardening only.

Conditionally allowed later:

- Manual-reviewed local fixture only, if legal/source review allows local academic or internal review.

Not allowed now:

- Database ingestion pilot.
- Official API/download adapter implementation.
- Production runtime display.
- Raw report/file commit.
- Scraping.
- Private or undocumented access.

Rules:

- Database ingestion pilot is allowed only if storage/cache rights are clear.
- Official API/download adapter is allowed only if automated access/download terms are clear.
- Product runtime display is allowed only if display rights are clear.

## 7. Required User Actions

The user/reviewer must confirm:

1. Exact official company/source URL.
2. Exact report/file URL.
3. License URL, Terms URL, or official usage statement.
4. Runtime display rights.
5. Database storage/cache rights.
6. Derived normalized data rights.
7. Attribution requirement and exact attribution text.
8. Pilot ticker, period, and fields.
9. Whether the next step is manual-reviewed file fixture or official API/download flow.

## 8. Recommended Next Phase

Recommended next phase:

- Phase 30E: Exact Source Evidence Approval Update, completed in `EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`; status remains `needs_legal_review`.

Alternative:

- Phase 30E: Manual-reviewed Official Filing Fixture Pack, only if the user/reviewer confirms local review rights and supplies an allowed fixture path or manual extracted values.

Do not proceed to ingestion until legal, storage/cache, runtime display, and derived-data rights are clear.

After Phase 30E, the recommended follow-up is Phase 30F - Source Owner/Terms Evidence Collection Follow-up unless the user/reviewer explicitly confirms manual-reviewed local fixture rights.

Phase 30F-A creates the source-owner/Terms evidence tracker and keeps the candidate at `needs_legal_review`.
