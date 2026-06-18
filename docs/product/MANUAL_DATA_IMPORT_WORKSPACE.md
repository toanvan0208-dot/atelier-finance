# Manual Data Import Workspace

Phase 28D adds a small UI workspace for manually pasted CSV data. It is a local validation and preview surface only; it does not call APIs, write a database, import external data files, or connect manual upload data to production module runtime.

## Route

- UI route: `/data-import`
- Component: `src/components/data-import/ManualDataImportWorkspace.tsx`
- Default mode: `thesis_verification`

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

## Guardrails

- The UI uses bridge output instead of calculating module metrics itself.
- Denominator `0` or `null` remains insufficient data through the data-contract layer.
- EPS `<= 0` keeps P/E not applicable.
- Equity `<= 0` blocks normal ROE, P/B, and BVPS interpretation.
- Financial-sector records rely on data-contract warnings for generic ratio caveats.
- Demo input is marked with `isDemoData: true` in the workspace batch.

## Error Handling

The workspace renders validation output without crashing when:

- CSV header is missing or invalid.
- No valid rows are available.
- `targetTicker` / `targetPeriod` does not match a record.
- Multiple valid records exist and no target is provided.
- Required fields are missing.
- Parser limitations are detected.

## What This Does Not Do

- No real API integration.
- No backend endpoint.
- No database write.
- No external data download.
- No production runtime attachment.
- No generated pricing claim.
- No transaction instruction.

## Gaps For Phase 28E / 29

- Add richer CSV parsing only after product requirements confirm it is needed.
- Add file upload once source evidence and local privacy rules are settled.
- Add save/load workflow only after persistence boundaries are defined.
- Add production source approval flow before any manual upload is allowed to affect production views.
