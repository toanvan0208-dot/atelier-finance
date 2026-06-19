# Academic Data Boundary For AI Disclosure

Date: 2026-06-19

Phase: 30H - Academic Data Boundary For AI Disclosure

This document defines how Atelier Finance should describe academic, local, research, and non-commercial data boundaries to users, especially through AI disclosure. It does not approve any source, scrape, download, parse, ingest, create a live provider, change UI behavior, change Prisma schema, or promote any `productionApproved` value.

Phase 31A Vnstock academic research connector planning is tracked in `VNSTOCK_ACADEMIC_RESEARCH_CONNECTOR_PLAN.md`.

## 1. Purpose

Atelier Finance is a real capstone application. It has backend services, a database foundation, API routes, manual import workflows, financial analysis logic, UI modules, and AI/RAG behavior. It may use real-world data in local, research, or academic validation, but the current project must not claim that such data has all rights required for deployed commercial production use.

The intended boundary is:

- Real application for capstone/academic use.
- Non-commercial local/research usage.
- Not demo-only.
- Not commercial production data distribution.
- Not a licensed provider for production use.

The purpose is to keep the main UI understandable while preserving accurate backend/source metadata and allowing AI to explain source origin, usage limits, reliability, and academic/non-commercial status when users ask.

## 2. Scope

Current allowed data groups or source modes may include:

| Data group or mode | Current use boundary | Default approval state | Metadata expectation | AI disclosure expectation |
| --- | --- | --- | --- | --- |
| `sample_demo` | Local sample data for product behavior and development checks | `productionApproved:false` | Must be labeled as sample/demo/lab | Must not overstate reliability or source approval |
| `user_input` / manual import | Data supplied by the user | `productionApproved:false` | Must keep source label, import context, missing fields, and review status | Must explain that the system has not independently verified it |
| Manual-reviewed research data | Human-reviewed local/academic extraction if permitted | `productionApproved:false` | Must keep reviewer, source URL, as-of period, and limitations | Must explain local/research scope and review limitations |
| `third_party_tool` research connector, such as vnstock if used later | Tool-assisted research/local access | `productionApproved:false` | Must identify tool, original provider if known, retrieval time, and review status | Must explain that the tool is not automatically an officially licensed provider |
| Official disclosure documents | Source evidence or research reference, such as reports/filings | `productionApproved:false` unless rights are later confirmed | Must record source owner, URL, report/file URL if used, rights review, and attribution | Must explain that official disclosure reference is not the same as approved product use |

All groups default to:

- `productionApproved:false`
- not commercial production source
- requires source metadata
- AI must not overclaim reliability

## 3. Non-goals

Phase 30H does not:

- Approve HOSE/FPT as a production source.
- Approve vnstock as a licensed provider for production use.
- Add automated scraping.
- Download or parse real PDF/report files.
- Ingest new real data.
- Add a real API provider.
- Add broad legal-warning UI across the main product.
- Commit raw data, PDFs, Excel files, or databases containing real source data.

## 4. Data Boundary Definitions

| Term | Vietnamese explanation | Practical meaning |
| --- | --- | --- |
| `sample_demo` | Du lieu mau | Local sample/lab data used to exercise product behavior, not approved source data. |
| `user_input` | Du lieu do nguoi dung cung cap | Manual import or user-supplied data; the system preserves it but does not independently verify it by default. |
| `academic_non_commercial` | Du lieu dung trong pham vi hoc thuat/do an | Data used for capstone, thesis, local validation, or academic work, not for commercial distribution. |
| `research_only` | Du lieu nghien cuu | Data or notes used to compare, inspect, or validate ideas before any production approval. |
| `third_party_tool` | Du lieu qua cong cu ben thu ba | Data accessed through a tool or package; the tool is not automatically the source owner or a licensed provider. |
| `manual_reviewed` | Da duoc nguoi review thu cong | Human-reviewed local extraction or mapping, still bounded by source rights and reviewer notes. |
| `needs_review` | Can kiem tra them | More technical, data-quality, or provenance review is needed. |
| `needs_legal_review` | Can kiem tra quyen su dung nguon | License, Terms, display, caching, redistribution, attribution, or access rights are not fully confirmed. |
| `productionApproved:false` | Chua phai nguon production duoc phe duyet | The source must not be treated as approved for deployed product use. |

## 5. UI Disclosure Approach

The main UI should stay lightweight and user-friendly. Phase 30H should not turn the product into a wall of legal or technical warnings.

Recommended UI principles:

- Do not show raw backend labels such as `needs_legal_review` or `productionApproved:false` as primary UI copy.
- If an existing UI surface has a natural place for source context, keep it short, for example: `Nguon: vnstock`, `Cap nhat: ...`, `Du lieu do nguoi dung cung cap`, or `Mot so truong con thieu`.
- Do not add a large legal-warning banner in Phase 30H.
- Do not confuse new users with internal source-policy states.
- Let AI provide detailed source and usage-limit explanations when the user asks.

## 6. AI Disclosure Behavior

AI must explain source boundary details when users ask questions such as:

- "Du lieu nay lay tu dau?"
- "Du lieu nay co dang tin khong?"
- "Day co phai du lieu realtime khong?"
- "Co dung duoc de dau tu that khong?"
- "Nguon nay co chinh thuc khong?"
- "Du lieu nay co phai production-approved khong?"
- "Co duoc phep dung thuong mai khong?"
- "vnstock co phai nguon chinh thuc khong?"

Required AI behavior:

- Explain that current data is used within academic/capstone/local research boundaries.
- If data comes through vnstock or a similar tool, explain that the tool helps access data but does not automatically make the data an officially licensed provider for deployed use.
- If data is manual import, explain that it was supplied by the user and has not been independently verified by the system.
- If data comes from reports or filings, explain that the document may be an official reference while product-use rights still require review.
- Encourage users to cross-check official disclosures or approved data sources before real financial decisions.
- Do not provide buy/sell/hold-style investment instructions.
- Do not present a risk score as a final safe/bad-stock conclusion.
- Do not present PVT output as a trading instruction.
- Do not invent data-usage rights, source permissions, or legal status.

Safe Vietnamese response examples:

Example 1 - source origin:

> Du lieu hien tai duoc he thong su dung trong pham vi hoc thuat/do an. Neu du lieu den tu cong cu ben thu ba hoac nguoi dung nhap, he thong can xem day la du lieu nghien cuu/can kiem tra lai, khong phai nguon du lieu cho san pham thuong mai da duoc cap phep day du.

Example 2 - reliability:

> Khong nen xem du lieu la tuyet doi. He thong co the ho tro phat hien truong thieu, diem bat thuong va giai thich chi so, nhung nguoi dung nen doi chieu lai voi bao cao cong bo chinh thuc hoac nguon du lieu da duoc phep su dung cho muc dich can thiet.

Example 3 - realtime status:

> Chi mot so nhom du lieu nhu gia/khoi luong moi can cap nhat nhanh. Bao cao tai chinh thuong theo quy hoac nam. He thong can luu thoi diem cap nhat de tranh hieu nham du lieu cu la du lieu hien tai.

Example 4 - real financial decisions:

> He thong ho tro doc hieu du lieu va tu hinh thanh luan diem, khong thay the tu van dau tu va khong dua ra huong dan hanh dong dau tu cu the.

## 7. Backend Metadata Expectations

Phase 30H does not require a database migration. Future backend/runtime metadata should preserve enough source context for AI and audits.

Minimum expected metadata:

- `provider`
- `sourceType`
- `usageScope`
- `productionApproved`
- `reviewStatus`
- `legalStatus`
- `sourceOwner`
- `sourceUrl`
- `retrievedAt`
- `asOf`
- `extractionMethod`
- `sourceNote`

Example metadata object:

```json
{
  "provider": "vnstock",
  "sourceType": "third_party_tool",
  "usageScope": "academic_non_commercial",
  "productionApproved": false,
  "reviewStatus": "research_only",
  "legalStatus": "needs_review",
  "sourceOwner": "unknown_or_original_provider",
  "sourceUrl": null,
  "retrievedAt": null,
  "asOf": null,
  "extractionMethod": "not_configured",
  "sourceNote": "Used for academic/local research validation only; not a licensed provider for deployed product data."
}
```

## 8. Forbidden Claims

Do not claim these phrases as true in docs, UI copy, AI responses, or code comments related to data status:

- productionApproved:true
- production-approved source
- licensed production data provider
- verified official production data
- official real-time feed
- commercial-ready data source
- fully licensed
- du lieu chuan tuyet doi
- du lieu duoc cap phep thuong mai day du
- nguon du lieu production chinh thuc
- vnstock la nguon chinh thuc

These phrases may appear in this section only because this is the forbidden-claims list. If a future phase gains verified rights, use precise reviewed wording and cite the evidence record rather than broad claims.

## 9. Relationship To Previous Docs

This Phase 30H boundary should be read with the existing source-evidence documents:

- `docs/product/HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md`
- `docs/product/SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`
- `docs/product/EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/APPROVED_SOURCE_ADAPTER_PILOT.md`

Phase 30H does not override Phase 30G findings. HOSE/FPT remains `needs_legal_review`, and `productionApproved` remains `false`. This document only defines how Atelier Finance should discuss and handle academic/local/non-commercial data boundaries, especially when AI explains source origin, reliability, realtime status, or usage limits.

Phase 31A treats Vnstock as an academic/research connector candidate. It does not override this academic/non-commercial data boundary. AI disclosure should describe Vnstock as a third-party tool, not as a provider approved for deployed product data.
