# Backend API Foundation

Date: 2026-06-18

Phase: 29D - Backend API Foundation

This phase adds the first read-only backend API routes for database-backed company, financial statement, and market price records. It is a foundation for later productization only. It is not a production data provider, does not call external APIs, does not persist manual imports, and does not connect frontend modules to API data.

## Routes

| Route | Method | Service |
| --- | --- | --- |
| `/api/companies` | `GET` | `listCompanies` |
| `/api/companies/[ticker]` | `GET` | `getCompanyByTicker` |
| `/api/companies/[ticker]/financials` | `GET` | `getFinancialStatementsByTicker` or `getLatestFinancialStatement` when `latest=true` |
| `/api/companies/[ticker]/market-prices` | `GET` | `getMarketPricesByTicker` or `getLatestMarketPrice` when `latest=true` |

The route handlers are intentionally thin. They parse minimal route/query input, call the service layer, and return standardized JSON through `src/lib/api/response.ts`.

## Response Shape

Successful responses use:

```json
{
  "ok": true,
  "status": "success",
  "data": {},
  "meta": {
    "source": "database",
    "fallback": false
  }
}
```

Error responses use:

```json
{
  "ok": false,
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe user-facing message"
  }
}
```

Internal errors must not expose secrets, stack traces, database URLs, provider credentials, or raw Prisma error objects.

## Guardrails

The API routes do not fall back to static/mock data. If no persisted record exists, the response is either a `404` for single/latest reads or an empty array with an explicit `meta.reason` for list reads.

The API layer preserves database fields that carry source and quality metadata:

- `sourceId`
- `sourceLabel`
- `sourceType`
- `dataMode`
- `asOf`
- `period`
- `periodType`
- `qualityStatus`
- `readiness`
- `missingFields`
- `warningCodes`
- `errorCodes`

The API layer does not create generated price conclusion fields or transaction-guidance fields.

## Relationship To Service Layer

Future API routes should call `src/lib/database` services instead of importing Prisma directly. Business logic should stay in service/data-contract modules, not in route handlers. The existing data contract, source policy, data quality guardrails, and module bridge remain the authority for normalization, readiness, missing-data behavior, and module-specific transformations.

## Current Non-Scope

Phase 29D does not:

- connect Overview, Financials, Valuation, Risk, Watchlist, or Simulation UI to these APIs;
- add `POST /api/manual-import`;
- create real authentication;
- create a production data provider;
- call any external API;
- create a database migration or seed data;
- migrate existing static module data.

## Next Step

Phase 29E can use this foundation to add manual import persistence or frontend fetch bridges, depending on product priority. Any write path should call existing data-source and data-contract guardrails before storing canonical records.
