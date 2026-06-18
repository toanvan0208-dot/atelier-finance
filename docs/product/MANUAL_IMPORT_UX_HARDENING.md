# Manual Import UX Hardening

Date: 2026-06-18

Phase: 28E - Manual Import UX Hardening

This phase improves the `/data-import` workspace so a real user can understand how to paste manual CSV data, identify required fields, fix validation issues, and read Financials/Valuation preview output safely.

It does not call external APIs, add a database, add backend endpoints, upload binary files, connect to production runtime, or approve manual upload as a production data provider.

## UX Goals

The workspace now makes five points explicit:

- Data is user-provided and not externally verified by the system in this step.
- CSV needs a clear header and simple comma-separated rows.
- Required, recommended, and optional/context fields are shown before validation.
- Errors and readiness states are shown in user-facing language.
- Financials and Valuation preview reflect the pasted data only and are not investment guidance.

## Main UI Changes

- Header changed to "Nhập dữ liệu thủ công" with scope wording.
- A prominent data source warning card shows:
  - `Source mode: user-provided / manual_upload`
  - `Runtime mode: thesis_verification`
  - `Production source: not approved`
  - `Server storage: not saved`
  - `External API: not used`
  - `Investment recommendation: no`
- CSV template card added with "Dùng template mẫu".
- Field guide added for required, Financials recommended, Valuation recommended, PVT recommended, and optional/context fields.
- Textarea is larger and labelled.
- Row count estimate is shown.
- `targetTicker` / `targetPeriod` labels are shown as "Mã cần xem" and "Kỳ dữ liệu cần xem".
- Clear action resets CSV, target fields, preview, and UI error state.
- Empty state appears before preview instead of showing an empty report.
- Status badges use human-readable readiness labels.

## Template Scope

The template is illustrative only. Its numbers demonstrate CSV structure and are not verified source data.

The workspace sets `isDemoData: true` when building preview output. Metadata and warnings continue to flow through the Phase 28A-28C pipeline.

## Field Guide

Required:

- `ticker`
- `period`
- `source`
- `asOf`

Financials recommended:

- `revenue`
- `netIncome`
- `operatingCashFlow`
- `totalAssets`
- `equity`

Valuation recommended:

- `closePrice`
- `eps`
- `bvps`
- `sharesOutstanding`

PVT recommended:

- `closePrice`
- `volume`
- `tradingValue`

Optional/context:

- `companyType`
- `currency`
- `unit`
- `previousClose`
- `totalDebt`
- `currentAssets`
- `currentLiabilities`

Missing values remain missing. The UI does not replace missing values with `0`.

## Error And Readiness UX

The workspace maps pipeline output to user-facing messages for:

- empty CSV;
- invalid header;
- quoted/complex CSV parser limitation;
- no valid rows;
- missing `asOf`;
- target mismatch;
- multiple valid records without a clear target.

Readiness labels:

- `ready`: "Đủ dữ liệu để xem preview"
- `needs_review`: "Cần kiểm tra thêm"
- `not_ready`: "Chưa sẵn sàng"
- `insufficient_data`: "Không đủ dữ liệu"
- `failed`: "Không đọc được dữ liệu"
- `unknown`: "Chưa rõ trạng thái"

Severity labels:

- `info`: "Thông tin"
- `warning`: "Cảnh báo"
- `error`: "Lỗi dữ liệu"
- `critical`: "Lỗi nghiêm trọng"

## Preview Guardrails

Financials preview shows revenue, net income, operating cash flow, total assets, equity, readiness, warnings, and missing/blocking reasons.

Valuation preview shows close price, EPS, BVPS, shares outstanding, market cap when present, readiness, warnings, and missing/blocking reasons.

Guardrail copy is explicit:

- EPS `<= 0` keeps P/E not applicable.
- Equity `<= 0` blocks normal interpretation for equity-based ratios.
- Missing close price blocks valuation preview readiness.
- Non-VND data is not converted without exchange-rate/source context.

## Pipeline Boundary

The React workspace still calls:

1. `buildManualUploadPreview(...)`
2. `normalizeManualUpload(...)`
3. `buildManualUploadValidationReport(...)`
4. canonical records
5. data-contract module bridge

The component does not parse CSV directly and does not duplicate data-quality validation.

## Test Coverage

The existing copy test now includes this document and the workspace component to prevent forbidden advisory wording from entering Phase 28D/28E UI/docs.

React component testing is not expanded in this phase because the repo currently runs Vitest in a Node environment and does not include React Testing Library setup.

## Gaps For Phase 28F / 29

- Add component-level tests if a React DOM test setup is introduced.
- Add richer CSV parser only after product requirements confirm it.
- Add file upload only after source evidence, privacy, and persistence rules are clear.
- Add persistence only after deciding where manual data may be stored.
- Add production approval flow before any manual data affects production views.
