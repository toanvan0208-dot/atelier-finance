# Source Evidence Records

Date: 2026-06-19

Phase: 30B - Source Evidence Record And Adapter Skeleton

This document records source-evidence candidates used by Atelier Finance before any production source adapter is allowed. It is not a legal approval, does not connect to a live source, does not import real financial data, and does not mark any source as production-approved.

Phase 30C exact-source review is tracked in `EXACT_SOURCE_LEGAL_REVIEW_PACK.md`. Phase 30D Vietnam source selection is tracked in `OFFICIAL_FILING_SOURCE_SELECTION_VIETNAM_PILOT.md`. Phase 30E exact-source evidence approval update is tracked in `EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md`. Phase 30F-A source-owner and Terms evidence collection follow-up is tracked in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`. Phase 30G browser-based Terms evidence collection is tracked in `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md`. Phase 30H academic/local/non-commercial AI disclosure boundaries are tracked in `ACADEMIC_DATA_BOUNDARY_FOR_AI_DISCLOSURE.md`.

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
| Exact source | Phase 30D selected review candidate: HOSE-hosted FPT Corporation Annual Report 2025 disclosure page; still pending legal/ToS/rights confirmation and not approved for ingestion/runtime use |
| Official source URL | `https://www.hsx.vn/en/tin-tuc/fpt-annual-report-2025/2451668` |
| Report/file URL | Found on FPT IR page: `https://fpt.com.vn/-/media/project/fpt-corporation/fpt/ir/information-disclosures/year-report/2026/april/annual-report-2025.pdf`; not downloaded or committed |
| License | Not reviewed; no explicit license found; FPT Terms of Use restrict commercial use |
| Terms of Service | FPT Terms of Use found at `https://fpt.com.vn/en/terms-of-use`; HOSE terms not found (JavaScript SPA); see `HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md` |
| Runtime display rights | Unknown |
| Caching/storage rights | Unknown |
| Redistribution rights | Unknown |
| Derived-data rights | Unknown |
| Automated access/download rights | Unknown |
| Manual-reviewed local fixture rights | Pending review |
| Attribution | Unknown |
| Runtime ingestion | Not allowed |
| External API call | None |
| Scraping | None |
| Database write | None |
| Phase 30C review pack | `docs/product/EXACT_SOURCE_LEGAL_REVIEW_PACK.md` |
| Phase 30D Vietnam source selection | `docs/product/OFFICIAL_FILING_SOURCE_SELECTION_VIETNAM_PILOT.md` |
| Phase 30E evidence approval update | `docs/product/EXACT_SOURCE_EVIDENCE_APPROVAL_UPDATE.md` |
| Phase 30F-A source-owner follow-up | `docs/product/SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md` |
| Phase 30G terms evidence collection | `docs/product/HOSE_FPT_TERMS_EVIDENCE_COLLECTION.md` |
| Phase 30H academic data boundary | `docs/product/ACADEMIC_DATA_BOUNDARY_FOR_AI_DISCLOSURE.md` |

The corresponding code registry entry is in `src/lib/data-sources/source-policy.ts` under `official-disclosure-financials-pilot`. Phase 30E and Phase 30F-A do not change code status because the safe registry state is already conservative: `usageStatus:needs_legal_review`, `evidenceStatus:missing`, and `productionApproved:false` behavior.

Phase 30H adds an academic/local/research data boundary for AI disclosure. Current source candidates remain not production-approved. AI disclosure should rely on backend/source metadata when users ask about data origin, reliability, realtime status, or usage limits.

## 1A. Vnstock Academic Research Connector Candidate

| Field | Value |
| --- | --- |
| sourceCandidateId | `vnstock-academic-research-connector` |
| provider | `vnstock` |
| sourceType | `third_party_tool` |
| usageScope | `academic_non_commercial` |
| reviewStatus | `research_connector_candidate` |
| legalStatus | `needs_review` |
| productionApproved | `false` |
| attributionRequired | `true` |
| runtimeUse | `local_command_only` / `manual_file_write_verified` / `db_read_path_verified` / `pvt_adapter_ready` / `technical_helper_available` / `technical_runtime_wrapper_default_off` / `technical_source_transparency_visible` / `technical_browser_verified_local` / `technical_metadata_boundary_added` / `technical_local_issuer_seed_foundation` / `technical_derived_metrics_boundary_added` / `technical_chart_series_boundary_added` |
| implementationStatus | `technical_pvt_browser_verified_local_with_metadata_boundary_local_seed_derived_metrics_and_chart_series_boundary` |
| dataCategories | `market_prices_research_only` |
| persistence | `local_database_only` |
| publicRuntime | `not_enabled` |
| realFetcher | `not_configured` |
| fixtureData | `fake_sample_only` |
| dataInputMode | `user_provided_manual_export` |
| fileImport | `csv_json` |
| latestDryRun | `ticker:FPT`, `dateRange:2025-01-01_to_2025-01-31`, `normalizedCount:17`, `rejectedCount:0`, `dbWrite:false` |
| latestWriteTrial | `ticker:FPT`, `dateRange:2025-01-01_to_2025-01-31`, `normalizedCount:17`, `insertedCount:17`, `updatedCount:0`, `skippedCount:0`, `rejectedCount:0`, `dbWrite:true`, `productionApproved:false` |
| latestDbReadVerification | `ticker:FPT`, `dateRange:2025-01-01_to_2025-01-31`, `expectedRows:17`, `sourceLabel:vnstock`, `dataMode:research_only`, `productionApproved:false` |
| latestPvtAdapterVerification | `ticker:FPT`, `sourceLabel:vnstock`, `dataMode:research_only`, `productionApproved:false`, `noInvestmentSignals:true` |
| latestTechnicalMetadataBoundary | DB-backed FPT market prices do not reuse static sample issuer industry/sector when issuer metadata is unavailable; FPT issuer profile remains not verified |
| latestTechnicalMetadataBoundaryBrowserVerification | `2026-06-20`, DB-backed FPT rendered local DB / `vnstock` / `research_only` market price with issuer metadata unavailable/not verified; fallback rendered `static_sample`; `productionApproved:false`; no recommendation/trading-signal wording |
| Phase 34 metadata boundary | `docs/product/TECHNICAL_PVT_COMPANY_METADATA_BOUNDARY.md` |
| Phase 35 issuer metadata foundation | `docs/product/COMPANY_ISSUER_METADATA_FOUNDATION.md`; local/research-only seed labels for FPT/MWG/VCB, industry/sector null, `productionApproved:false`, not official metadata |
| latestPhase35BrowserVerification | `2026-06-20`, DB-backed FPT rendered local DB / `vnstock` / `research_only` market price; source transparency separated price/volume source from issuer metadata source; issuer metadata displayed as local research seed; industry/sector unavailable; `productionApproved:false`; no official/realtime/production metadata claim; no recommendation/trading-signal wording |
| latestPhase35LaterReviewNote | Support/resistance style PVT derived levels appeared while DB-backed current price was `129.12`; review later as possible PVT derived-metrics/sample-boundary issue; no behavior changed in Phase 35 |
| Phase 36 derived metrics boundary | `docs/product/TECHNICAL_PVT_DERIVED_METRICS_BOUNDARY.md`; DB-backed PVT derived metrics must be computed from active market price series or marked insufficient/unavailable; sample support/resistance, volume ratio, and FOMO must not leak into DB-backed mode |
| latestPhase36BrowserVerification | `2026-06-20`, DB-backed FPT rendered current price `129.12` from local DB / `vnstock` / `research_only`; `derived:insufficient_data`; sample support `38.000 - 40.000`, resistance `44.000 - 46.000`, volume `1.4x TB20`, and FOMO `Trung bình, 3/6` were not shown; support/resistance, volume, FOMO, and risk/reward rendered insufficient/unavailable states; `productionApproved:false`; no recommendation/trading-signal wording |
| latestPhase36Limitation | Chart can still display presentation/sample chart points, MA lines, volume bars, and annotations such as `KQKD` / `Ngành`; defer to Phase 37 - PVT Chart Series Boundary |
| Phase 37 chart series boundary | `docs/product/TECHNICAL_PVT_CHART_SERIES_BOUNDARY.md`; DB-backed PVT chart points must come from the active local DB market price series or render unavailable/insufficient; sample chart points, MA lines, volume bars, and annotations must not leak into DB-backed mode |
| latestPhase37Validation | DB-backed 17-observation FPT series builds 17 chart points from active DB rows; MA20/MA50 remain insufficient; annotations unavailable; `productionApproved:false`; no recommendation/trading-signal wording |
| latestPhase37BrowserVerification | `2026-06-20`, DB-backed FPT rendered current price `129.12` from local DB / `vnstock` / `research_only`; source transparency and chart section displayed `chart:computed_from_market_price_series`; chart note said it uses the active local DB market price series; sample annotations `KQKD` / `Ngành` were not shown; MA20/MA50 hidden for 17 observations; support/resistance/FOMO/volume remained unavailable/insufficient; `productionApproved:false`; no recommendation/trading-signal wording |
| latestPhase37FallbackNote | Fallback mode was not re-verified in the Phase 37 browser pass; automated tests cover sample fallback chart `static_sample` behavior |
| realDataCommitAllowed | `false` |
| nextDecision | `manual_export_bridge_or_offline_contract_or_python_bridge` |
| financialStatements | `out_of_scope_for_31E` |
| Phase 31A plan | `docs/product/VNSTOCK_ACADEMIC_RESEARCH_CONNECTOR_PLAN.md` |
| usageGuide | `docs/product/VNSTOCK_LOCAL_IMPORT_USAGE_GUIDE.md` |
| realFetcherAudit | `docs/product/VNSTOCK_REAL_FETCHER_FEASIBILITY_AUDIT.md` |
| offlineContract | `docs/product/VNSTOCK_OFFLINE_FETCHER_CONTRACT.md` |
| firstRealManualExportTrialGuide | `docs/product/VNSTOCK_FIRST_REAL_MANUAL_EXPORT_TRIAL_GUIDE.md` |
| firstRealCsvDryRunReview | `docs/product/VNSTOCK_FIRST_REAL_CSV_DRY_RUN_REVIEW.md` |
| firstLocalDbWriteTrialPlan | `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_PLAN.md` |
| firstLocalDbWriteTrialReview | `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_REVIEW.md` |
| marketPriceDbReadPathVerification | `docs/product/MARKET_PRICE_DB_READ_PATH_VERIFICATION.md` |
| marketPricePvtAdapterConnection | `docs/product/MARKET_PRICE_PVT_ADAPTER_CONNECTION.md` |
| technicalPvtDataFlowConnection | `docs/product/TECHNICAL_PVT_MODULE_DATA_FLOW_CONNECTION.md` |
| technicalPvtRuntimeDataFlowWiring | `docs/product/TECHNICAL_PVT_RUNTIME_DATA_FLOW_WIRING.md` |
| technicalPvtDbBackedUiVerification | `docs/product/TECHNICAL_PVT_DB_BACKED_UI_VERIFICATION.md` |
| technicalPvtBrowserVerification | `docs/product/TECHNICAL_PVT_BROWSER_VERIFICATION_RECORD.md` |
| Notes | Vnstock is planned as a local/academic research connector candidate only; original data rights may belong to upstream providers. |

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
| Exact report/file URL not confirmed | Keep report/file use pending manual review; do not download or commit raw/source files. |
| License and Terms not reviewed | Keep `usageStatus:needs_legal_review` and `evidenceStatus:missing`. |
| Runtime display rights unknown | Block production runtime. |
| Caching/storage rights unknown | Do not insert real source records into the database. |
| Derived-data rights unknown | Do not persist normalized records derived from this source. |
| Automated access/download rights unknown | Do not implement live adapter/download behavior. |
| Source file/parser drift | Adapter accepts local fixture input only; parser automation belongs to a later phase. |
| Missing values in filings | Missing values remain `null` and are listed in metadata. |
| Conflicting source periods | Future ingestion must detect ticker + period + source + asOf conflicts before writing. |

## 5. Next User Actions

Before any Phase 30F fixture, adapter, or ingestion work, the user/reviewer must provide:

1. The exact official disclosure source to evaluate.
2. Legal/ToS links or a reviewed source-usage statement.
3. Runtime display, caching/storage, derived-data, and attribution decisions.
4. Pilot ticker(s), period(s), and allowed fields.
5. Confirmation whether the first implementation should use manual-reviewed file review or a documented official API/download flow.

Until those actions are complete, this source remains a candidate only.

Phase 30F-A provides the collection tracker and reviewer template for these actions in `SOURCE_OWNER_TERMS_EVIDENCE_FOLLOW_UP.md`.
