# Phase 148P: Global Macro API-Key Boundary & USD Index Semantic Decision

## Metadata
- **Phase**: 148P
- **Scope**: API-key boundary for FRED, USD index semantic decision, and unavailable-state hardening for global macro.
- **Starting Commit**: 82282f3
- **Files Audited**:
  - `src/features/macro/data/macroCompass.data.ts`
  - `src/features/macro/lib/macro-indicator-registry.ts`
  - `src/features/macro/lib/load-macro-runtime-data.ts`
  - `src/app/api/assistant/route.ts`
  - `scripts/smoke-global-macro-api-key-boundary.ts`
  - `docs/product/*.md`
- **Files Changed**:
  - `src/features/macro/data/macroCompass.data.ts`
  - `src/features/macro/lib/macro-indicator-registry.ts`
  - `src/app/api/assistant/route.ts`
  - `scripts/smoke-global-macro-api-key-boundary.ts`
  - `docs/product/MACRO_INDICATOR_UNIVERSE.md`
  - `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
  - `docs/product/MACRO_PARSER_STRATEGY.md`
  - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
  - `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`

## Summary
- **Target Indicators**: `FED_FUNDS_RATE`, `DXY`, `BRENT_OIL_PRICE`
- **Frontend Visibility**: All three indicators are visible in `worldMetrics`.
- **FRED API Key Boundary**: Finalized (`fredApiKeyRequired=true`). Fetching from FRED API is strictly blocked unless an API key is provided and securely configured.
- **USD Index Semantic Decision**: Rebranded the UI label for DXY from "Chỉ số USD (DXY)" to "Sức mạnh USD" to explicitly reflect the use of FRED's `DTWEXBGS` as a broad dollar index proxy (`dxyProxyNotTreatedAsOfficialDxy=true`). The description clarifies: "Theo dõi biến động tương đối của đồng USD qua chỉ số USD rộng; không phải ICE DXY chính thức."
- **UI Label or Copy Changed**: Yes (`usdIndexLabelOrCopyClarified=true`).
- **Runtime Unavailable State**: Hardened for all three indicators with explicit `statusLabel: "Chưa có dữ liệu"` and corresponding warnings.
- **Assistant Unavailable Boundary**: Changed. The guardrail now strictly mandates: "Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho lãi suất Fed, chỉ số USD hoặc giá dầu Brent, nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này."
- **Source Candidates**: FRED API.
- **Source URL Statuses**: `source_assessment_needed` due to `auth_required`.
- **Provider Fetch Attempted**: `false`
- **Numeric Values Extracted**: `0`
- **Candidate Macro Rows**: `0`
- **Candidate Provenance Rows**: `0`
- **DB Write Attempted**: `false`
- **Production Approved True Count**: `0`

## Indicator Status By Type
- **FED_FUNDS_RATE**:
  - `dbBacked`: `false`
  - `needsReview`: `true`
  - `parserReadiness`: `blocked_auth_required`
- **DXY**:
  - `dbBacked`: `false`
  - `needsReview`: `true`
  - `parserReadiness`: `blocked_auth_required_or_manual_review`
- **BRENT_OIL_PRICE**:
  - `dbBacked`: `false`
  - `needsReview`: `true`
  - `parserReadiness`: `blocked_auth_required`

## Guardrail Results
- `targetIndicators=FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE`
- `dbWriteAttempted=false`
- `providerFetchAttempted=false`
- `numericValuesExtracted=0`
- `candidateMacroRows=0`
- `candidateProvenanceRows=0`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `fedFundsRateDbBacked=false`
- `dxyDbBacked=false`
- `brentOilPriceDbBacked=false`
- `fedFundsRateNeedsReview=true`
- `dxyNeedsReview=true`
- `brentOilPriceNeedsReview=true`
- `fredApiKeyRequired=true`
- `dxyProxyNotTreatedAsOfficialDxy=true`
- `frontendIndicatorUniverseExpanded=false`
- `assistantDoesNotInventGlobalMacro=true`
- `investmentAdviceAdded=false`
- `mockOrSampleAsReal=false`

## Validation Results
- Prisma Validation/Generation: Pass
- TypeScript Typecheck: Pass
- Build: Pass
- Lint: Pre-existing out-of-scope errors remained (253 problems), no new lint errors introduced by this phase. Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status.
- Smoke Test (`smoke-global-macro-api-key-boundary.ts`): Pass (`smokePassed=true`)

## Manual Data or API Needed From User
To unblock parser implementation and import:
1. **FRED API Key**: Provide a valid FRED API key via environment variables if the system should automatically fetch data for `FED_FUNDS_RATE`, `BRENT_OIL_PRICE`, and `FRED USD broad index`.
2. **Final Decision on USD Index**: 
   - Acknowledge and approve the rebranding to "Sức mạnh USD" when using FRED `DTWEXBGS`.
   - OR, supply an alternate source (API or CSV) that provides the official ICE DXY without semantic proxy risks.
3. **Alternate Sources**: If FRED is rejected, provide public CSV/API endpoints (that do not require API keys or bot circumvention) for Fed Funds Rate and Brent Oil.

## Recommended Next Phase
**Phase 148Q**: External Provider or FRED API Key Integration (if key is provided) or manual data CSV import capability for Macro data.
