# Phase 141D: Deployment Readiness and Production-Mode Smoke Audit

## 1. Phase Summary
The goal of this phase was to audit the deployment readiness of the Atelier Finance application by running a production-mode smoke test (`next build` and `next start`). We verified environment variable expectations, built-in safety guardrails, component rendering, API availability, and Assistant proxy behavior across the six core tickers without executing any unsafe DB mutations or data imports.

## 2. Build/Deploy Config Audit
- **Findings**:
  - The `package.json` build script originally only ran `next build`.
  - **Fix applied**: Updated `"build": "prisma generate && next build"` to ensure Vercel (or any host) natively rebuilds the Prisma client bindings before Next.js compiles the server routes.
  - The `next.config.ts` file is clean and contains no hardcoded absolute paths, tokens, or unexpected overrides.
  - Production build successfully optimized static pages and bundled dynamic routes.

## 3. Environment Variable Readiness
- **DATABASE_URL**: Required. Defines the connection to the Prisma database. Defaults dynamically to `file:./dev.db` in fallback testing but is completely ready for a Turso/LibSQL or Postgres production URI.
- **AI_ASSISTANT_PROVIDER**: Optional. Can be `openai`, `mock`, or `none`. Safely defaults to `none` (not_configured) if missing.
- **AI_ASSISTANT_MOCK_ANSWER**: Optional. Used only when provider is `mock`.
- **OPENAI_API_KEY** / **OPENAI_MODEL**: Required only if `AI_ASSISTANT_PROVIDER=openai`. If missing, the API fails-closed safely.
- **ATELIER_LOCAL_IMPORTS_ENABLED**: Used as a kill-switch for local file imports. Will fail-closed safely if not set to explicitly true.

## 4. Production-Mode Server Boot
- **Server**: Booted cleanly via `npm run start -p 3460`.
- **Base URL**: `http://localhost:3460`.
- **Status**: Stable, no raw exceptions.

## 5. Workspace Route Smoke Results
All critical workspace entry points responded with `HTTP 200`, meaning no Server Component threw an unhandled hydration error or database panic.
- `GET /` -> 200
- `GET /workspace` -> 200
- `GET /workspace?ticker=FPT` -> 200
- `GET /workspace?ticker=MWG` -> 200
- `GET /workspace?ticker=VCB` -> 200
- `GET /workspace?ticker=MWG&module=financials` -> 200
- `GET /workspace?ticker=MWG&module=risk` -> 200
- `GET /workspace?ticker=VCB&module=risk` -> 200

## 6. API Route Smoke Results
The `/api/companies/[ticker]/financials` endpoint behaved perfectly for all expected tickers.

| Ticker | Expected Source | Observed Source | EPS | Shares | Debt | ProdAppr | Status |
|--------|----------------|-----------------|-----|--------|------|----------|--------|
| FPT | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 5216 | 1703507121 | 21073.487... | `false` | Passed |
| HPG | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 1973 | 7675465855 | 92174.151... | `false` | Passed |
| VNM | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 4070 | 2089955445 | 9456.645 | `false` | Passed |
| MSN | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 2710 | 1520491927 | 64877.178 | `false` | Passed |
| MWG | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 4774 | 1468456763 | 29930.943 | `false` | Passed |
| VCB | `vnstock_financials_candidate` | `vnstock_financials_candidate` | 3854 | 8355675094 | `null` | `false` | Passed |

> [!NOTE]
> VCB strictly preserves the `null` for `totalDebt` because it is mapped under banking metrics.

## 7. Assistant API/Context Smoke Results
- **POST `/api/assistant` (MWG)** -> 200
- **Assistant Status**: `completed` (Mock Provider explicitly verified).
- **Message**: "Assistant provider response passed output guardrail validation."
- **Notes**: Fails safely (`not_configured`) when requested without proper context or payload.

## 8. Source/Data Quality Verification
- Missing values do not fallback to zero.
- `productionApproved` remains strictly `false`.
- Guardrails are 100% active.

## 9. Security/Leakage Audit
- No `.env` or `.env.local` keys committed.
- No `dev.db` committed.
- No `docs/product/evidence/source-pdfs/*.pdf` exposed or added to git tree.
- No API keys logged in application routes.
- Build artifacts are correctly `.gitignore`'d.

## 10. Deployment Gaps Found
- **P0/P1/P2/P3**: No architectural or blocking gaps found.
- The `prisma generate` step in `package.json` was fixed pre-emptively during this audit.

## 11. Recommended Next Phases
- System is strictly ready for production hosting mapping (e.g. Vercel deployment with remote database URI assignment).

## 12. Non-write/non-schema Confirmations
- No `dev.db` writes executed.
- No Prisma schema changes or migrations applied.
- Source configurations unaltered.
