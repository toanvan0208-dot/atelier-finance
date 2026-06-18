# Manual Data Import Workspace

Phase 28D added a small UI workspace for manually pasted CSV data. Phase 28E hardens that workspace so users can understand the input format, required fields, validation issues, and preview scope. Phase 28G positions the workspace as a user-provided source adapter, not the product's main data architecture.

It is a local validation and preview surface only; it does not call APIs, write a database, import external data files, or connect manual upload data to production module runtime.

## Route

- UI route: `/data-import`
- Component: `src/components/data-import/ManualDataImportWorkspace.tsx`
- Default mode: `thesis_verification`
- UX hardening doc: `docs/product/MANUAL_IMPORT_UX_HARDENING.md`
- Product integration doc: `docs/product/MANUAL_IMPORT_PRODUCT_INTEGRATION.md`
- Discoverability: Overview includes a "Nhập dữ liệu" CTA card that links to `/data-import`.
- Roadmap context: `docs/product/PRODUCT_ROADMAP.md`

## Product Positioning

Manual Data Import is a secondary user-provided source adapter. It is valuable for local thesis verification, student/project workflows, and checking CSV data owned or supplied by the user.

Manual Data Import is not:

- a production database;
- the main product data provider;
- an approved automatic data source;
- a verified market data feed;
- a replacement for backend source approval, persistence, auditing, or access control.

After Phase 28F, backend/database work becomes the main productization direction. Manual Import should eventually plug into that backend as a clearly flagged user-provided source path.

## Pipeline

The workspace calls the existing Phase 28A-28C pipeline:

1. User pastes simple CSV text and optional `targetTicker` / `targetPeriod`.
2. `buildManualUploadPreview(...)` receives `kind: "csv"`.
3. The preview bridge calls `normalizeManualUpload(...)`.
4. The validation report is built by `buildManualUploadValidationReport(...)`.
5. Canonical financial, market, and valuation records flow through the data-contract module bridge.
6. The UI renders summary, report, module readiness, metadata, Financials preview, and Valuation preview.

The React component does not parse CSV directly and does not duplicate validation rules.

## Input Scope

The workspace supports simple CSV only:

- Header row is required.
- Canonical fields and aliases are handled by the manual upload schema.
- Quoted CSV, commas inside cells, and complex spreadsheet formats are not supported in this phase.
- Missing values must remain blank, `null`, `NA`, or `N/A`; missing values must not be replaced with `0`.

The workspace includes a template button. The template numbers are illustrative structure only and are not verified source data.

## Output

The workspace displays:

- Total rows, valid rows, warning rows, and error rows.
- Overall preview status, report status, and readiness.
- Selected ticker and period.
- Source metadata including `source`, `asOf`, `period`, `sourceType`, `isDemoData`, and `isStale`.
- Record picker when multiple valid records exist.
- Top validation issues.
- Field coverage.
- Module readiness for Financials, Valuation, Risk, PVT, and Overview.
- Financials preview for `revenue`, `netIncome`, `operatingCashFlow`, `totalAssets`, `equity`, ROA, and CFOA contract metrics.
- Valuation preview for `closePrice`, `eps`, `bvps`, `sharesOutstanding`, `marketCap`, P/E metric, P/B metric, and BVPS metric.
- A data source warning card that states manual upload is user-provided, not production-approved, not saved to server storage, and not connected to external APIs.
- A field guide for required, recommended, and optional/context fields.
- Empty, error, and record-selection states with user-facing copy.

## Guardrails

- The UI uses bridge output instead of calculating module metrics itself.
- Denominator `0` or `null` remains insufficient data through the data-contract layer.
- EPS `<= 0` keeps P/E not applicable.
- Equity `<= 0` blocks normal ROE, P/B, and BVPS interpretation.
- Financial-sector records rely on data-contract warnings for generic ratio caveats.
- Demo input is marked with `isDemoData: true` in the workspace batch.
- EPS `<= 0` keeps P/E not applicable.
- Equity `<= 0` blocks normal interpretation for equity-based ratios.

## Error Handling

The workspace renders validation output without crashing when:

- CSV header is missing or invalid.
- No valid rows are available.
- `targetTicker` / `targetPeriod` does not match a record.
- Multiple valid records exist and no target is provided.
- Required fields are missing.
- Parser limitations are detected.
- No valid rows are available.
- A target ticker/period does not match a record.

## What This Does Not Do

- No real API integration.
- No backend endpoint.
- No database write.
- No external data download.
- No production runtime attachment.
- No generated pricing claim.
- No transaction instruction.
- No approved automatic data provider.
- No verified automatic market data.

## Gaps For Phase 29 / 30

- Phase 29A: Backend & Database Architecture.
- Phase 29B: Database Schema Foundation.
- Phase 29C: Backend API Foundation.
- Phase 29D: Manual Import Server-side Persistence.
- Phase 29E: Frontend Data Fetch Bridge.
- Phase 30A: Approved Source Adapter Pilot.
