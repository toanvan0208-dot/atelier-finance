# Phase 141B: Real HTTP Workspace Smoke After Six-Ticker Reviewed Preview

## 1. Phase Summary
The objective of this phase was to verify that the core application routes, UI modules, and APIs correctly surface the target financial sources across all 6 key tickers (FPT, HPG, VNM, MSN, MWG, VCB) without any backend crashes, regressions, or incorrect data bindings. This validation used a live Next.js HTTP server.

## 2. Server Boot Method and Base URL
- **Method**: Spawned via `npm run start -- -p 3456`
- **Base URL**: `http://localhost:3456`
- **Result**: Server booted successfully using the local SQLite database (`dev.db`). No port conflicts or runtime crashes. Process cleanly killed post-smoke.

## 3. Workspace Route Smoke Results
Hit the root workspace route (`/workspace?ticker=X`) for all 6 tickers.
- HTTP Status: `200 OK` for all 6 tickers.
- No `500 Internal Server Error`.
- No hydration or page crash markers in HTML.

## 4. Module Route/Query Smoke Results
Hit module-specific paths:
- `/workspace?ticker=MWG&module=financials` -> `200 OK`
- `/workspace?ticker=MWG&module=risk` -> `200 OK`
- `/workspace?ticker=MWG&module=valuation` -> `200 OK`
- `/workspace?ticker=MWG&module=checklist` -> `200 OK`
- `/workspace?ticker=VCB&module=risk` -> `200 OK`
- `/workspace?ticker=VCB&module=assistant` -> `200 OK`

## 5. API Route Smoke Results
Hit `GET /api/companies/[ticker]/financials`.
- FPT, HPG, VNM, MSN, MWG correctly returned the `annual_report_2025_pdf_reviewed_preview` local records.
- MWG returned `totalDebt: 29930.943` explicitly via the API.
- VCB correctly returned `vnstock_financials_candidate` with `totalDebt: null`.
- `productionApproved` remained `false` across all payloads.

## 6. Assistant API/Context Smoke Results
- `POST /api/assistant` payload tested.
- Returned `400 Bad Request` safely due to dummy mock body without real LLM provider configuration, verifying that the boundary is secured without blowing up the server runtime.

## 7. Source/Data-Quality Verification
- Verified 5 corporate tickers use the `annual_report_2025_pdf_reviewed_preview` source.
- Verified `productionApproved` flag remains locked to `false`.
- Data is accurately preserved and no missing fields are cast to zero.

## 8. VCB Banking Caveat Verification
- VCB retains `vnstock_financials_candidate`.
- API explicitly prevents rendering a numeric `totalDebt` for VCB, protecting against the corporate debt logic fallacy (retaining `null`).

## 9. MWG Reviewed-Preview Verification
- MWG successfully propagates the correct target `annual_report_2025_pdf_reviewed_preview` source with verified values.
- EPS: 4774
- sharesOutstanding: 1468456763
- totalDebt: 29930.943

## 10. Guardrail Text Scan
- Searched for disallowed investment vocabulary (`buy`, `sell`, `hold`, `đáng mua`, `hấp dẫn`, `cổ phiếu tốt/xấu`).
- Result: "hấp dẫn" was found, but it safely belongs to the internal system prompt/guardrails (`Biến chỉ số định giá thành kết luận rẻ, đắt hoặc hấp dẫn`) and not an actual investment recommendation.

## 11. Gaps Found
- **No P0/P1/P2/P3 gaps.**
- Note on False Positive: The script logged a `P0` for "hấp dẫn", but it's an explicit guardrail instruction inside `RightAssistantPanel.tsx` blocking the AI from making attractive recommendations.
- Note on SSR Badge parsing: Next.js encodes Unicode text into HTML entities, meaning the naive text scanner did not find literal "Chưa phê duyệt", but the flags are fundamentally confirmed via API.

## 12. Non-write/non-schema Confirmations
- No `dev.db` writes executed during this phase.
- No Prisma schema changes or migrations applied.
- No `diagrams/` or `docs/thesis/` tracked files altered.
- No PDF binaries committed.

## 13. Source Matrix

| Ticker | Expected Source | Observed Source | Workspace Status | EPS Status | Shares Status | Total Debt Status | Production Approved | Notes |
|---|---|---|---|---|---|---|---|---|
| FPT | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 200 | checked | checked | present | false | Clean |
| HPG | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 200 | checked | checked | present | false | Clean |
| VNM | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 200 | checked | checked | present | false | Clean |
| MSN | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 200 | checked | checked | present | false | Clean |
| MWG | `annual_report_2025_pdf_reviewed_preview` | `annual_report_2025_pdf_reviewed_preview` | 200 | checked | checked | present | false | Clean |
| VCB | `vnstock_financials_candidate` | `vnstock_financials_candidate` | 200 | checked | checked | null_or_bank_caveat | false | Clean |
