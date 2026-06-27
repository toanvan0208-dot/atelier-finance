# Phase 145G — MarketPrice / Technical Provider Payload Gap Closure

## 1. Phase Summary
- Phase 145G closes the real provider payload gap by fetching data via the embedded Python `vnstock` scraper tool.
- No DB write.
- No seed/import.
- No schema migration.
- No `productionApproved=true`.
- No production deploy.

## 2. 145F Gap Being Addressed
- 145F `providerFetchSucceeded=false` because the script checked the staging read path relying on `prisma.marketPrice.findMany`, which failed due to a known local DB `TlsConnectionError`.
- 145F used `existing_local_contract` / mock fallback, which did not prove real provider payload readiness.
- This phase correctly calls the `vnstock` provider using the Python script execution path to inspect actual output.

## 3. Provider Fetch Path Audited
- Inspected: `scripts/inspect-market-technical-provider-payload.ts`, `src/lib/data-sources/vnstock-market-pvt-controlled-ingestion.ts`
- Connector used: `fetchLocalPythonVnstockHistory` executing the embedded Python script.
- Tickers checked: `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- Env requirements: Requires Node to spawn the `python` process and the `vnstock` package to be installed in the local Python environment.

## 4. Provider Payload Inspection Result
- **providerFetchAttempted:** true
- **providerFetchSucceeded:** true
- **Error classification:** none
- **payloadReceived:** true
- **payloadShapeValid:** true
- **normalizationPossible:** true
- Output successfully fetched 90 rows (approx. 18 days * 5 tickers) natively from VNStock.

## 5. Field Coverage
- **Price fields:** Found (`close` mapped correctly)
- **Volume fields:** Found (`volume` mapped correctly)
- **Timestamp/TradingDate fields:** Found (`time` parsed properly)
- **Unit fields:** Not explicit in payload (implicitly assumed by source mapping)
- **Adjustment evidence:** Not found (Payload does not explicitly differentiate adjusted vs. unadjusted close prices, leaving ambiguity for P/E valuation).
- **Checksum / importRunId possibility:** Possible to generate checksums from the raw JSON payload records.

## 6. Fallback Boundary
- Fallback was NOT used in this phase.
- No fallback-as-real data used.
- Provider evidence is legitimately based on live scraping from VNStock.

## 7. Readiness Decision
- **readyForDryRunIngestionFromRealProvider:** true
- **readyForWritePath:** false
- **Reason:** While the payload is complete enough for dry-runs, the lack of explicit adjustment metadata means it cannot be written to production tables safely without closing the metadata gap. Valuation engines will break if given unadjusted prices without awareness.

## 8. Guardrail Checks
- No DB write.
- No `productionApproved=true`.
- No `research_only` promotion.
- No fallback-as-real.
- No missing-to-zero conversions (missing values return `null`).
- No real-time guarantee.
- `VCB` excluded/unsupported.

## 9. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/inspect-market-technical-provider-payload.ts
node scripts/run-staging.mjs npm test
```
All static validations pass cleanly. `npm test` is not a clean pass.
Failure classified as local PostgreSQL temp test DB infrastructure issue only.

## 10. Recommended Next Phase
Phase 145H — MarketPrice / Technical payload metadata gap closure
