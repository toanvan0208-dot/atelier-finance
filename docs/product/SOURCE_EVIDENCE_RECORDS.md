# Source Evidence Records

Date: 2026-06-19

Phase: 30B - Source Evidence Record And Adapter Skeleton

This document records source-evidence candidates used by Atelier Finance before any production source adapter is allowed. It is not a legal approval, does not connect to a live source, does not import real financial data, and does not mark any source as production-approved.

## 1. Current Source Evidence Record

| Field | Value |
| --- | --- |
| Source id | `official-disclosure-financials-pilot` |
| Source candidate name | Official disclosure financials pilot candidate |
| Source class | Official company filings / investor relations / official disclosure files |
| Data groups | `financial_statement`, `company_profile` |
| Access method | `public_file` / official disclosure file after exact source is selected |
| Current usage status | `needs_legal_review` |
| Evidence status | `missing` |
| Production approved | `false` |
| Exact source | Not selected; pending user/reviewer confirmation |
| License | Not reviewed |
| Terms of Service | Not reviewed |
| Runtime display rights | Unknown |
| Caching/storage rights | Unknown |
| Redistribution rights | Unknown |
| Derived-data rights | Unknown |
| Attribution | Unknown |
| Runtime ingestion | Not allowed |
| External API call | None |
| Scraping | None |
| Database write | None |

The corresponding code registry entry is in `src/lib/data-sources/source-policy.ts` under `official-disclosure-financials-pilot`.

## 2. Required Evidence Before Approval

This candidate cannot move to `approved` until all required evidence is provided and reviewed:

- Exact source owner and source URL.
- License name and license URL, or a documented official statement that governs usage.
- Terms URL or official source usage terms.
- Explicit runtime display permission.
- Explicit caching/database storage permission.
- Derived-data permission for normalized records and downstream calculations.
- Redistribution permission if raw/source-equivalent data will ever be redistributed.
- Attribution text, if required.
- Confirmation that access is official and documented.
- Review date, reviewer, and review note.

If any of these are missing or unknown, product runtime must treat the source as not production-usable.

## 3. Adapter Skeleton Status

Phase 30B adds an adapter skeleton for local/test fixture normalization only:

- `src/lib/data-sources/official-disclosure-financials-adapter.ts`
- `src/lib/data-sources/__tests__/official-disclosure-financials-adapter.test.ts`

Adapter constraints:

- It does not fetch URLs.
- It does not scrape.
- It does not read downloaded/private files.
- It does not write to the database.
- It does not promote source status.
- It always returns `productionApproved:false`.
- It fails closed when source evidence is missing, blocked, or not verified.
- It fails closed in production mode unless the source is fully production-usable.
- It keeps missing numeric values as `null`.
- It preserves source, source URL, `asOf`, period, collected time, usage status, evidence status, missing fields, warnings, and errors.

## 4. Current Risk Notes

| Risk | Current mitigation |
| --- | --- |
| Exact source not selected | Keep the record at candidate level only. |
| License and Terms not reviewed | Keep `usageStatus:needs_legal_review` and `evidenceStatus:missing`. |
| Runtime display rights unknown | Block production runtime. |
| Caching/storage rights unknown | Do not insert real source records into the database. |
| Source file/parser drift | Adapter accepts local fixture input only; parser automation belongs to a later phase. |
| Missing values in filings | Missing values remain `null` and are listed in metadata. |
| Conflicting source periods | Future ingestion must detect ticker + period + source + asOf conflicts before writing. |

## 5. Next User Actions

Before Phase 30C or 30D, the user/reviewer must provide:

1. The exact official disclosure source to evaluate.
2. Legal/ToS links or a reviewed source-usage statement.
3. Runtime display, caching/storage, derived-data, and attribution decisions.
4. Pilot ticker(s), period(s), and allowed fields.
5. Confirmation whether the first implementation should use manual-reviewed file ingestion or a documented official API/download flow.

Until those actions are complete, this source remains a candidate only.
