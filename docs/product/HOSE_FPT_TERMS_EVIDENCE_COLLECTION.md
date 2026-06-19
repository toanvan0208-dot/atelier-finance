# HOSE/FPT Terms Evidence Collection

Date: 2026-06-19

Phase: 30G - HOSE/FPT Terms Evidence Collection

This document records evidence collected by browser review of HOSE and FPT Corporation pages related to Terms, usage rights, copyright, and legal disclaimers for the FPT Corporation Annual Report 2025 disclosure candidate. It does not download files, parse data, commit raw reports, write to the database, create fixtures, create live adapters, promote `productionApproved`, or change runtime behavior.

Phase 30H academic/local/non-commercial AI disclosure boundaries are tracked in `ACADEMIC_DATA_BOUNDARY_FOR_AI_DISCLOSURE.md`. Phase 30H does not override the findings in this document: HOSE/FPT remains `needs_legal_review`, and Phase 30H only defines how such data should be discussed or bounded in academic/local/non-commercial contexts.

## 1. Evidence Collection Summary

| Field | Value |
| --- | --- |
| Candidate page URL | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` |
| Browser review date | 2026-06-19 |
| Reviewer | Antigravity automated browser review (not legal counsel) |
| Exact report/file URL found | Yes, found on FPT IR page (see Section 2) |
| FPT IR Annual Report 2025 PDF (via fpt.com.vn) | `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/ir/information-disclosures/year-report/2026/april/annual-report-2025.pdf` |
| FPT IR Annual Report 2025 PDF (via bctn2025.fpt.com) | `https://bctn2025.fpt.com/wp-content/uploads/2026/04/Annual-Report-2025.pdf` |
| FPT Digital Annual Report 2025 | `https://bctn2025.fpt.com/en/` |
| Current status | `needs_legal_review` |
| productionApproved | `false` |
| Report/file downloaded into repo | No |
| Raw data committed | No |
| Real data parsed | No |
| Database write | No |

Note: The HOSE candidate page URL (`hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668`) returned only an empty SPA shell when fetched statically. The page content is rendered client-side via JavaScript. No exact report/file URL could be confirmed from the HOSE page itself via static fetch. The report/file URLs were found on FPT Corporation's own IR page.

## 2. Evidence Links Found

| # | Evidence item | URL | Source owner | What it says (paraphrased) | Relevance | Confidence | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | HOSE candidate disclosure page | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` | HOSE (Ho Chi Minh Stock Exchange) | Page exists but content is rendered by JavaScript SPA; static fetch returned only the HTML shell with title ".:HOSE:. » HOSE" and description "HOSE - Sở Giao dịch Chứng khoán Thành phố Hồ Chí Minh - TỔNG HỢP THÔNG TIN GIAO DỊCH - TRADING SUMMARY". No visible disclosure content, file links, or terms were extractable from static HTML. | Display/cache/attribution: URL confirmed to exist; content not extractable without JS rendering. | low | HOSE site is a JavaScript SPA. Static HTTP fetch cannot extract page body content, file links, or embedded terms. Manual browser review is required. |
| 2 | FPT Annual Report 2025 PDF (via fpt.com.vn IR page) | `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/ir/information-disclosures/year-report/2026/april/annual-report-2025.pdf` | FPT Corporation | PDF download link found in FPT IR page HTML under "Annual report" section. Labeled "2025 Annual Report" with view and download icons. | Direct file URL for the report. Relevant to display/cache/derived/redistribution if usage terms permit. Not downloaded into repo. | high | File was not downloaded or opened; copyright/usage inside the PDF is unknown. |
| 3 | FPT Annual Report 2025 PDF (via bctn2025.fpt.com) | `https://bctn2025.fpt.com/wp-content/uploads/2026/04/Annual-Report-2025.pdf` | FPT Corporation | PDF download link found in FPT Digital Annual Report 2025 site header download menu. Labeled "Annual Report 2025". | Alternative file URL for the same report PDF hosted on a dedicated FPT subdomain. | high | Same file, different hosting path. Not downloaded or opened. |
| 4 | FPT Digital Annual Report 2025 site | `https://bctn2025.fpt.com/en/` | FPT Corporation | Interactive digital version of Annual Report 2025. Title: "Annual Report 2025 FPT Group". Theme: "Mastering Strategic Technologies". Contains 2025 highlights: Revenue 70,113 Billion VND (+11.6% YoY), Profit after tax 11,232 Billion VND (+19.1% YoY). No visible copyright/terms/disclaimer in static HTML body. | Digital version of the report. May contain copyright inside interactive pages not extractable statically. | medium | Content is rendered via Elementor/WordPress. Deeper pages may contain terms not visible in the homepage static fetch. |
| 5 | HOSE Terms/Legal/Copyright/Disclaimer | not found | HOSE | Multiple URL patterns attempted: `/en/terms-of-use`, `/en/quy-che-su-dung`, `/en/chinh-sach-bao-mat`, `/en/Modules/Cms/Web/NewsByCat/dieu-khoan-su-dung`. All returned empty SPA shell HTML with no body content. Web search indicates HOSE's content is governed by Vietnamese securities regulations and exchange-issued decisions (labeled "QĐ-SGDHCM"), not typical "Terms of Use" pages. | Critical for determining if HOSE disclosure data may be displayed, cached, redistributed, or automated. Not found via static fetch. | low | HOSE site requires JavaScript rendering. Terms may exist behind SPA navigation or as regulatory documents (PDF decisions), not as standard web Terms of Use pages. |
| 6 | HOSE data usage or website usage policy | not found | HOSE | No data usage, website usage, or API policy page was found via static fetch or web search for hsx.vn. | Critical for automated access, caching, and redistribution decisions. | low | May exist as Vietnamese-language regulatory documents or internal exchange policies not published as web pages. |
| 7 | FPT Corporation IR/Report page | `https://fpt.com.vn/en/ir` (canonical: `https://fpt.com/en/ir`) | FPT Corporation | Official "For Investors" page. Contains sections: General meetings of shareholders, Information disclosures, Report (Annual Report, Financial Report, Earning Report, ESG Report), Stock information, Corporate governance. Subpages: `/en/ir/report`, `/en/ir/information-disclosures`, `/en/ir/stock-information`, `/en/ir/governance`. | Primary FPT investor relations hub. Confirms FPT publishes annual reports and financial statements. | high | Page exists and is accessible. Does not itself state usage terms for report data. |
| 8 | FPT Terms of Use page | `https://fpt.com.vn/en/terms-of-use` (canonical: `https://fpt.com/en/terms-of-use`) | FPT Corporation | Full Terms of Use page found and extracted. Key clauses paraphrased: (a) "RIGHTS TO COPY AND TRADEMARK": All content including text, design, graphics, pictures, and code are owned or licensed by FPT. Copyright shown as "2015 Copyright by FPT Corp. All rights reserved". Trademarks, trade names, logos, and product designs are protected under Vietnamese IP law. (b) "Without FPT's previous written agreement, any act of copying, quoting, editing, distributing, publishing, or circulating... for commercial purposes in any form constitutes an infringement of FPT's rights." (c) "FPT permits users to read, extract, and share content on the website (print, download, forward...), but only for personal and non-commercial purposes, providing that the notice is cited: '©2015 Copyright by FPT Corp.'" (d) Users must comply with applicable laws; no interference with website. (e) Governed by Vietnamese law. | Directly relevant to display, cache, derived, redistribution, and automation decisions. The Terms explicitly restrict commercial use without written agreement. Personal/non-commercial extraction with attribution is permitted. | high | Terms apply to fpt.com.vn website content. Applicability to report PDF content or data extracted from reports needs legal review. The Terms do not explicitly address database storage, derived normalized records, or automated access/download for commercial products. |
| 9 | FPT Copyright notice (footer) | `https://fpt.com.vn/en/ir` (footer section) | FPT Corporation | Footer contains: "Copyright © FPT" and links to: Terms of use (`/en/terms-of-use`), Sitemap (`/en/sitemap`), Contact & Support (`/en/contact`), Trademark PDF (`/-/media/project/fpt-corporation/fpt/common/fpt/file/trade-mark.pdf`). | Confirms copyright ownership by FPT Corporation. Attribution text candidate: "Copyright © FPT" or "©2015 Copyright by FPT Corp. All rights reserved". | high | General website copyright; does not specify report-specific or data-specific restrictions. |
| 10 | FPT Trademark document | `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/common/fpt/file/trade-mark.pdf` | FPT Corporation | PDF link found in footer. Not downloaded or opened. | May contain trademark usage restrictions relevant to attribution. | medium | PDF not opened; content unknown. |
| 11 | FPT Regulations on Information Disclosure | `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/ir/governance/document/quy-che-cong-bo-thong-tin_en.pdf` | FPT Corporation | PDF link found in Corporate Governance section of FPT IR page. Labeled "Regulations on information disclosure of FPT Corporation". Not downloaded or opened. | May define how disclosed information may be used, redistributed, or cited. Directly relevant to display/cache/derived/redistribution decisions. | medium | PDF not opened; content unknown. May contain relevant usage clauses. |
| 12 | FPT IR contact information | `ir@fpt.com` / `+84 24 7300 7300` | FPT Corporation | FPT IR department contact for investor-related questions, found via web search and structured data. | Relevant for contacting FPT to confirm data usage rights. | high | Contact details confirmed from structured data and web search. |

## 3. Permission Assessment

| Permission area | Decision | Evidence URL or status | Reason | Consequence |
| --- | --- | --- | --- | --- |
| Runtime display | `pending_review` | FPT Terms at `https://fpt.com.vn/en/terms-of-use` | FPT Terms allow personal/non-commercial reading and extraction with attribution. Commercial display is explicitly restricted without written agreement. No HOSE terms were found. Product runtime display is a commercial use. | No product runtime display until FPT provides written agreement for commercial use or legal review confirms an exemption. |
| Database storage/cache | `pending_review` | FPT Terms at `https://fpt.com.vn/en/terms-of-use` | FPT Terms do not explicitly address database storage or caching of extracted values. Commercial use restriction implies database storage for a commercial product may require written agreement. No HOSE terms were found. | No database ingestion until usage rights for commercial storage are confirmed by FPT or legal review. |
| Derived normalized records | `pending_review` | FPT Terms at `https://fpt.com.vn/en/terms-of-use` | FPT Terms do not explicitly address derived/normalized data creation. Derived records from FPT copyrighted content for commercial use likely requires written agreement under FPT Terms. | No persisted normalized records until derived-data rights are confirmed. |
| Raw/source-equivalent redistribution | `not_allowed` | FPT Terms at `https://fpt.com.vn/en/terms-of-use` | FPT Terms explicitly prohibit "copying, quoting, editing, distributing, publishing, or circulating... for commercial purposes" without written agreement. Raw report redistribution is a clear violation. | No raw report, raw extracted data, or source-equivalent redistribution. Default product posture: no raw redistribution. |
| Automated access/download | `unknown` | HOSE terms: not found; FPT Terms: no explicit clause on automated access | Neither HOSE nor FPT Terms explicitly address automated access, bots, scrapers, or scheduled downloads. HOSE site is a JavaScript SPA which may itself serve as a technical barrier. | No live adapter, automated download, or scheduled access implementation. |
| Manual-reviewed local fixture | `pending_review` | FPT Terms at `https://fpt.com.vn/en/terms-of-use` | FPT Terms permit personal/non-commercial extraction with attribution. A manual-reviewed local fixture for internal development review may fall under personal/non-commercial use, but this requires legal confirmation for a product context. | No fixture pack until legal review confirms whether manual-reviewed local extraction is allowed for internal product development. |
| Attribution required | `yes` (likely) | FPT Terms at `https://fpt.com.vn/en/terms-of-use`; Footer: "Copyright © FPT" | FPT Terms state personal/non-commercial use requires citation of "©2015 Copyright by FPT Corp." Copyright notice in footer: "Copyright © FPT". | Attribution text must be confirmed with FPT. Candidate text: "©2015 Copyright by FPT Corp. All rights reserved" or "Copyright © FPT". |

## 4. Next Decision

Final Phase 30G status: **`needs_legal_review`**.

Reason:

- FPT Terms of Use were found and contain explicit restrictions on commercial use. Commercial display, storage, and redistribution require FPT's "previous written agreement".
- HOSE Terms were not found due to JavaScript SPA rendering. HOSE terms remain completely unknown.
- Runtime display for a commercial product is restricted by FPT Terms without written agreement → no display.
- Database storage/cache rights for commercial product use are not explicitly addressed → no ingestion.
- Derived normalized records rights are not explicitly addressed → no persisted normalized records.
- Raw/source-equivalent redistribution is explicitly prohibited for commercial purposes → no redistribution.
- Automated access/download terms are unknown for both HOSE and FPT → no live adapter.
- Manual-reviewed local fixture may be allowed under personal/non-commercial use clause, but legal confirmation is needed for product context → no fixture yet.
- Attribution is required per FPT Terms; exact text needs confirmation.
- `productionApproved` remains `false`.

Status decision rules applied:

- Terms found but restrict commercial use → `needs_legal_review` (not `research_only` because rights may be obtainable with written agreement).
- Display rights restricted for commercial use → no product UI display.
- Storage/cache rights not explicitly addressed → no database ingestion.
- Automated access rights unknown → no live adapter.
- Only `production_approved` if all product runtime rights are explicitly confirmed → not met.
- Not `pilot_ready_local_review` because manual fixture permission requires legal confirmation.
- Not `pilot_ready_official_api` because automated access terms are unknown.
- Not `blocked` because rights may become available with FPT written agreement.

## 5. Recommended Next Action

1. **Contact FPT Investor Relations** (`ir@fpt.com`, `+84 24 7300 7300`) to request written agreement for:
   - Commercial display of normalized values from the annual report.
   - Database storage/cache of normalized values.
   - Derived normalized records and calculated metrics.
   - Attribution text requirements.
   - Whether automated access to published report files is permitted.

2. **Manual browser review of HOSE Terms**: Open `https://www.hsx.vn` in a JavaScript-capable browser and navigate to any Terms/Legal/Disclaimer/Quy chế sử dụng pages. Record findings. Search for regulatory decisions labeled "QĐ-SGDHCM" related to data usage.

3. **Manual browser review of FPT report copyright**: Open the Annual Report 2025 PDF in a browser (without downloading into the repo) and look for copyright, usage, and disclaimer pages inside the report. Record findings.

4. **Manual browser review of FPT Information Disclosure Regulations**: Open `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/ir/governance/document/quy-che-cong-bo-thong-tin_en.pdf` in a browser and check for relevant data usage clauses. Record findings.

5. **Docs-only follow-up**: Continue evidence collection in this document and `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`.

6. **No fixture, ingestion, adapter, or data work** until:
   - FPT written agreement for commercial use is obtained, OR
   - Legal review confirms an exemption or permitted use category, OR
   - HOSE terms are reviewed and found to allow the intended use.

7. **Adapter skeleton hardening only** (code guardrails, no real data) is allowed now.

## 6. Evidence Collection Audit

| Check | Result |
| --- | --- |
| Report/file downloaded into repo? | No |
| Raw data committed? | No |
| Real data parsed? | No |
| Database write? | No |
| API/private endpoint called? | No |
| Automated scraping performed? | No |
| Live adapter created? | No |
| Schema/migration changed? | No |
| UI connected? | No |
| FPTLAB ticker changed? | No |
| vnstock used as source? | No |
| productionApproved promoted? | No, remains `false` |
| Evidence fabricated? | No; items marked "not found" where not extractable |
