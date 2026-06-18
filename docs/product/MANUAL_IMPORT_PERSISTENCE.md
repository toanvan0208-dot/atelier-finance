# Manual Import Persistence

Date: 2026-06-18

Phase: 29F - Manual Import Server-side Persistence

This phase adds a backend write foundation for manual import sessions. It lets the server receive user-provided CSV or row payloads, run the existing manual upload normalization and data-quality report, persist an audit trail, and return a safe summary. It does not connect the `/data-import` UI to the API and does not turn manual input into an approved production source.

## Scope

Manual import is a secondary user-provided adapter. It is useful for local verification, preview, and workflow audit, but it does not replace controlled source adapters or source evidence review.

Phase 29F stores:

- `ManualImportSession` for batch metadata, row counts, status, readiness, and source mode.
- `ManualImportRecord` for row-level raw payload, normalized payload, missing fields, warnings, errors, period, `asOf`, and readiness metadata.
- `DataQualityReport` for validation summary, top issues, field coverage, and next steps.

The service keeps `sourceType: user_input` and `dataMode: user_input`. It does not create canonical `FinancialStatement` or `MarketPrice` records from manual input in this phase.

## API

Route:

```text
POST /api/manual-imports
```

The route is intentionally thin. It validates basic JSON shape, rejects unsupported source claims, calls the database service layer, and returns the standard API response helper from `src/lib/api/response.ts`.

## Payload Example

```json
{
  "kind": "csv",
  "csvText": "ticker,period,asOf,netIncome,totalAssets,equity,closePrice\nFPTLAB,2025Q4,2026-01-15,100,1000,500,45",
  "sourceLabel": "manual_upload",
  "fileName": "local-sample.csv",
  "targetTicker": "FPTLAB",
  "targetPeriod": "2025Q4",
  "batch": {
    "source": "manual_upload",
    "isDemoData": true
  }
}
```

Row input is also supported:

```json
{
  "kind": "rows",
  "rows": [
    {
      "ticker": "FPTLAB",
      "period": "2025Q4",
      "asOf": "2026-01-15",
      "netIncome": 100,
      "totalAssets": 1000,
      "equity": 500
    }
  ],
  "sourceLabel": "manual_upload"
}
```

## Response Example

```json
{
  "ok": true,
  "status": "success",
  "data": {
    "sessionId": "cm...",
    "dataQualityReportId": "cm...",
    "status": "needs_review",
    "readiness": "needs_review",
    "counts": {
      "totalRows": 1,
      "validRows": 1,
      "warningRows": 1,
      "errorRows": 0
    },
    "warningCodes": ["DEMO_DATA"],
    "errorCodes": [],
    "missingFields": [],
    "topIssues": [],
    "sourceType": "user_input",
    "dataMode": "user_input",
    "productionApproved": false
  },
  "meta": {
    "source": "database",
    "fallback": false
  }
}
```

## Curl

Start the app:

```bash
npm run dev
```

Then call:

```bash
curl -X POST http://localhost:3000/api/manual-imports \
  -H "Content-Type: application/json" \
  -d '{"kind":"csv","csvText":"ticker,period,asOf,netIncome,totalAssets,equity\nFPTLAB,2025Q4,2026-01-15,100,1000,500","sourceLabel":"manual_upload","fileName":"local-sample.csv"}'
```

Before testing locally, prepare the database:

```bash
npm run prisma:generate
npm run db:reset
```

## Guardrails

The persistence path reuses the existing manual upload adapter and validation report. It keeps these rules:

- unavailable numeric values remain `null`;
- missing values are not converted to zero;
- `source`, `asOf`, period, readiness, missing fields, warning codes, and error codes are persisted;
- EPS and equity guardrails stay in the validation report;
- manual input remains `user_input`;
- no generated price conclusion fields are created;
- no transaction-guidance vocabulary is added as API or database semantics;
- errors return safe messages without stack traces or secrets.

## Current Non-Scope

Phase 29F does not:

- connect frontend modules or `/data-import` to this route;
- create a production data provider;
- call external APIs;
- add real authentication;
- create new migrations;
- promote manual input into canonical financial or market tables;
- add a readback route for manual import sessions.

Readback endpoints can be added in a later phase once the product needs session history or audit screens.

## Files Not To Commit

Do not commit:

- `.env.local`
- `dev.db`
- `dev.db-journal`
- `prisma/dev.db`
- `prisma/dev.db-journal`
- `.next-dev.log`
- `.next-dev.err.log`
- `src/generated/prisma`

