# Vnstock Academic Research Connector Plan

Date: 2026-06-19

Phase: 31A - Vnstock Academic Research Connector Planning

This document plans a possible Vnstock connector for local academic and research validation. It does not implement a connector, install a package, call Vnstock, call an external API, scrape, download, parse, ingest, seed real data, change Prisma schema, create a migration, or change runtime UI/API behavior.

## 1. Purpose

Atelier Finance may use Vnstock as an academic/local research connector candidate, not as a commercial production data provider.

Vnstock is considered because waiting indefinitely for HOSE/FPT legal confirmation is not a practical way to validate the product pipeline. A local academic connector candidate can help test the shape of market/fundamental data flows, database design, PVT, valuation, financials, and AI explanation behavior while keeping source boundaries honest.

Phase 31A does not change source approval status:

- Vnstock is suitable only as a local research/academic validation candidate.
- Vnstock may help plan data pipeline tests and source-metadata handling.
- Vnstock does not change `productionApproved:false`.
- Vnstock must not be described as a provider approved for deployed commercial product use.

## 2. Scope

Allowed planning scope:

- Local academic validation.
- Capstone testing.
- Research-only market/fundamental data retrieval planning.
- Backend/database pipeline design.
- AI explanation testing with source metadata.
- Manual or controlled future ingestion only after explicit user approval and source review.

Not allowed in Phase 31A:

- No code connector implementation.
- No live API call.
- No scrape/download.
- No package installation.
- No Prisma schema change.
- No migration.
- No seed with real Vnstock data.
- No raw data commit.
- No production approval.
- No commercial license claim.

## 3. Source Classification

Recommended source-evidence classification:

| Field | Value |
| --- | --- |
| provider | `vnstock` |
| sourceType | `third_party_tool` |
| usageScope | `academic_non_commercial` |
| reviewStatus | `research_connector_candidate` |
| legalStatus | `needs_review` |
| productionApproved | `false` |
| sourceOwner | `vnstock/original_data_provider` |
| attributionRequired | `true` |
| redistributionAllowed | `false/unknown` |
| commercialUse | `not_approved` |
| automatedAccess | `planning_only` |
| runtimeUse | `not_configured` |

Vnstock is a tool/connector layer. The underlying data may come from other public websites, APIs, or original providers. The project must not treat Vnstock as the sole owner of all accessed data or as proof that downstream rights are cleared for product deployment.

## 4. Data Categories To Consider

| Data category | Possible use | Risk level | Suitable for Phase 31B? | Source metadata required | Missing-data behavior |
| --- | --- | --- | --- | --- | --- |
| Market prices | Validate ticker/date/open/high/low/close/volume/trading value pipeline and PVT metadata | High | Yes, skeleton only | provider, original source if known, ticker, trading date, retrievedAt, asOf, currency, usageScope, reviewStatus | Missing values remain `null`; no fake zero fill |
| Intraday/PVT data | Explore PVT shape only if access terms and technical stability are clear | High | No for first skeleton beyond interface placeholders | provider, original source, session timestamp, delay/staleness note, retrieval mode | Mark unavailable unless explicitly enabled and reviewed |
| Company profile | Validate company name, exchange, industry, listing info mapping | Medium | Yes, skeleton only | provider, original source if known, source URL if available, asOf/reviewedAt, usageScope | Missing fields remain `null` or `not_available` |
| Financial statements/fundamentals | Plan statement/fundamental field mapping where source and fields are clear | High | Limited planning only | provider, original source, fiscal period, report date if available, unit, currency, field provenance | Missing numeric values remain `null`; no ratio interpretation if inputs missing |
| Ratios/derived metrics | Prefer internal recomputation from validated inputs when possible | Medium | Yes, as internal calculation design only | input lineage, formula version, source periods, missing fields, warnings | Derived output becomes `null` or `not_applicable` when inputs are missing |
| Corporate actions/news | Defer due source, rights, timing, and interpretation risk | High | No | source owner, URL, timestamp, rights review, correction policy | Out of scope for first connector |

## 5. Recommended First Implementation Path After 31A

Recommended next phase: Phase 31B - Vnstock Research Connector Skeleton.

Phase 31B should be a fail-closed skeleton only:

- No automatic fetch by default.
- Feature flag/env disabled by default.
- Provider returns `not_configured` unless explicitly enabled.
- No `productionApproved:true`.
- No raw data redistribution.
- Logs source metadata.
- Validates missing fields as `null`.
- Does not overwrite user/manual data silently.
- Does not call AI with unlabelled source data.

Phase 31C may later consider controlled local fetch/import only if the user explicitly approves and source/use constraints are reviewed.

## 6. AI Disclosure Rules For Vnstock

AI should answer source questions clearly when users ask:

- "Du lieu nay lay tu dau?"
- "Vnstock co chinh thuc khong?"
- "Du lieu co dang tin khong?"
- "Co realtime khong?"
- "Co dung de dau tu that duoc khong?"
- "Co phai nguon production khong?"

Required AI behavior:

- If data is accessed through Vnstock, say it is accessed "qua cong cu Vnstock".
- Explain that Vnstock supports data access/normalization, but that does not by itself prove product-deployment rights for the data.
- Explain that data is used within capstone/local academic research boundaries.
- Encourage users to cross-check official disclosures, securities company data, or a reviewed data source before real financial decisions.
- Do not give buy/sell/hold-style investment instructions.
- Do not call data absolute or error-free.
- Do not describe PVT output as a trading instruction.
- Do not invent rights, source ownership, or reliability status.

Safe Vietnamese response examples:

Example 1 - source origin:

> Du lieu nay duoc he thong du kien lay thong qua cong cu Vnstock trong pham vi hoc thuat/do an. Vnstock la cong cu ho tro truy xuat va chuan hoa du lieu; dieu nay khong co nghia la he thong da co day du quyen du lieu cho san pham thuong mai.

Example 2 - reliability:

> Co the dung de tham khao va kiem thu phan tich, nhung khong nen xem la tuyet doi. Khi ra quyet dinh tai chinh that, nen doi chieu voi bao cao cong bo chinh thuc hoac nguon du lieu da duoc phep su dung cho muc dich can thiet.

Example 3 - realtime:

> Neu tich hop sau nay, mot so du lieu thi truong co the cap nhat nhanh hon bao cao tai chinh. Tuy nhien he thong can luu thoi diem cap nhat va nguon du lieu de tranh hieu nham du lieu cu la du lieu hien tai.

## 7. Attribution Requirement

If Vnstock is used in the capstone, docs, UI source label, or AI disclosure, attribution is required.

Suggested attribution in English:

> Data access supported by Vnstock for academic/local research validation. Original data ownership may belong to the respective source providers.

Suggested attribution in Vietnamese:

> Viec truy xuat du lieu duoc ho tro boi cong cu Vnstock trong pham vi nghien cuu/hoc thuat; quyen so huu du lieu goc co the thuoc ve cac don vi cung cap du lieu ban dau.

Do not claim that the data belongs to Atelier Finance.

## 8. Risks And Mitigations

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| License/data-rights ambiguity | Tool access does not prove downstream product-use rights | Keep `productionApproved:false`; record usageScope and legalStatus |
| Original provider ownership unclear | Upstream provider terms may govern the data | Track original source/provider where known |
| Field mapping instability | Returned fields may differ by endpoint, ticker, or time | Start with skeleton contracts and strict field validation |
| API/source behavior changes | Connector behavior may break without notice | Fail closed and avoid silent fallback |
| Missing/incorrect data | Financial logic can become misleading | Preserve missing as `null`; keep warning/missing-field metadata |
| Realtime misunderstanding | Users may assume data is current enough for trading decisions | Store `retrievedAt`, `asOf`, delay/staleness notes |
| User over-trust | Academic research data may be overread as verified product data | AI disclosure explains academic/local boundaries when asked |
| Accidental production claim | Mislabeling can create legal and product risk | Use source metadata and forbidden-claim checks |
| Raw data redistribution | Redistribution rights may be absent | Do not commit raw data or expose source-equivalent downloads |
| AI overclaim/hallucination | AI may invent rights or reliability | Require metadata-grounded answers and no unsupported claims |

## 9. Acceptance Criteria

Phase 31A is complete when:

- `docs/product/VNSTOCK_ACADEMIC_RESEARCH_CONNECTOR_PLAN.md` exists.
- No real code connector exists.
- No new dependency is added.
- No Prisma schema or migration is changed.
- No API call, scrape, or download is performed.
- No raw data file is committed.
- `productionApproved` remains `false`.
- The plan cross-references Phase 30H when available.
- The plan includes a risk table.
- The plan includes AI disclosure rules.
- The plan proposes Phase 31B as a fail-closed skeleton.

## 10. Relationship To Phase 30H

This plan follows `docs/product/ACADEMIC_DATA_BOUNDARY_FOR_AI_DISCLOSURE.md`. Vnstock is treated as an academic/research connector candidate under the Phase 30H boundary. It must be described as a third-party tool for local academic validation, not as a source approved for deployed commercial product data.
