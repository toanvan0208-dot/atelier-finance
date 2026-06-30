# Phase 149K - Macro Remaining Real Candidates Dry Run

## Phase objective

Fill remaining frontend-locked macro indicators with real candidate-data progress where feasible, without DB writes or production approval. This phase prioritizes real dry-run candidate generation and explicit source/manual-contract boundaries.

## Commands run

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`
- `git checkout -- tsconfig.tsbuildinfo`
- `node scripts/run-staging.mjs npx tsx scripts/dry-run-macro-remaining-real-candidates.ts`
- `node scripts/run-staging.mjs npx eslint scripts/dry-run-macro-remaining-real-candidates.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`
- `node scripts/run-staging.mjs npx eslint scripts/smoke-macro-production-readiness-gate.ts`

Validation commands are listed in the validation section after execution.

## Files changed

- `scripts/dry-run-macro-remaining-real-candidates.ts`
- `scripts/smoke-macro-production-readiness-gate.ts`
- `docs/product/evidence/PHASE149K_MACRO_REMAINING_REAL_CANDIDATES.md`

## Current coverage

Dry-run read the current staging DB snapshot and did not write any rows.

| Indicator | Current DB observations | Current provenance rows | Current coverage status |
| --- | ---: | ---: | --- |
| `GDP_GROWTH` | 1 | 1 | `db_backed_candidate_present` |
| `CPI_YOY` | 1 | 1 | `db_backed_candidate_present` |
| `PMI_MANUFACTURING` | 0 | 0 | `missing_from_current_db` |
| `POLICY_RATE` | 0 | 0 | `missing_from_current_db` |
| `MARKET_TRADING_VALUE` | 0 | 0 | `missing_from_current_db` |
| `FOREIGN_NET_FLOW` | 0 | 0 | `missing_from_current_db` |
| `GLOBAL_FLOW` | 0 | 0 | `missing_from_current_db` |

## Newly dry-run candidate rows

| Indicator | Source | Source type | HTTP/content type | Candidate rows generated | Unit | Period type | Ready for confirm-write |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| `GDP_GROWTH` | World Bank Open Data - GDP growth (annual %) | `world_bank_api_candidate` | HTTP 200 / `application/json;charset=utf-8` | 1 | `percent_yoy` | `annual` | true |
| `CPI_YOY` | World Bank Open Data - Inflation, consumer prices (annual %) | `world_bank_api_candidate` | HTTP 200 / `application/json;charset=utf-8` | 1 | `percent_yoy` | `annual` | true |
| `PMI_MANUFACTURING` | S&P Global Vietnam Manufacturing PMI press releases | `manual_csv_required` | not fetched | 0 | `index_points` | `monthly` | false |
| `POLICY_RATE` | State Bank of Vietnam policy rate portal | `manual_csv_required` | not fetched | 0 | `percent` | `event_based` | false |
| `MARKET_TRADING_VALUE` | HOSE trading summary or documented market-wide exchange source | `manual_csv_required` | not fetched | 0 | `billion_vnd` | `daily_or_monthly` | false |
| `FOREIGN_NET_FLOW` | HOSE/HNX/VNX market-wide foreign trading statistics or documented provider source | `manual_csv_required` | not fetched | 0 | `billion_vnd` | `daily_or_monthly` | false |
| `GLOBAL_FLOW` | Product definition required before source selection | `definition_decision_needed` | not fetched | 0 | N/A | `definition_pending` | false |

Total dry-run candidate rows generated: 2.

## Indicators ready for confirm-write

- `GDP_GROWTH`
- `CPI_YOY`

Both rows come from the existing World Bank parser/source family used in earlier macro ingestion phases. They remain candidate rows only; a later confirm-write phase must keep `productionApproved=false` and `needsReview=true`.

## Indicators requiring manual CSV

### `PMI_MANUFACTURING`

Blockers:
- S&P Global PMI is proprietary and no stable free machine-readable API is documented in the repo.
- Manual extraction needs source URL, publication date, and quoted evidence for each row before confirm-write.

Manual CSV schema:

```csv
period,period_type,pmi_value,unit,definition,scope,source_name,source_url,publication_date,extracted_quote,notes
```

### `POLICY_RATE`

Blockers:
- SBV policy-rate page was previously verified as dynamic/unstable; automated scraping remains blocked.
- `INTERBANK_RATE_OVERNIGHT` must not be substituted for `POLICY_RATE`.

Manual CSV schema:

```csv
period,period_type,policy_rate_value,unit,definition,scope,rate_name,source_name,source_url,publication_date,extracted_quote,notes
```

### `MARKET_TRADING_VALUE`

Blockers:
- No documented stable public CSV/API endpoint for market-wide trading value is present in the repo.
- Single-ticker trading value is not acceptable for this market-wide indicator.

Manual CSV schema:

```csv
period,period_type,trading_value,unit,definition,scope,market,source_name,source_url,publication_date,extracted_quote,notes
```

### `FOREIGN_NET_FLOW`

Blockers:
- No documented stable public CSV/API endpoint for market-wide foreign net flow is present in the repo.
- Foreign net flow of a single ticker is not acceptable for this market-wide indicator.

Manual CSV schema:

```csv
period,period_type,foreign_net_flow_value,unit,definition,scope,market,source_name,source_url,publication_date,extracted_quote,notes
```

## Indicators blocked and why

### `GLOBAL_FLOW`

`GLOBAL_FLOW` remains blocked because the product definition is not locked. Possible meanings include:

- global equity fund flow
- ETF flow
- risk-on/risk-off proxy
- global liquidity or financial conditions proxy

A proxy can be considered later only as `proxy_candidate`; it must not be described as official global flow.

## DB writes

- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `candidateRowsPersisted=false`
- `MacroObservation` rows created: 0
- `MacroObservationProvenance` rows created: 0

## Production approval policy

- `productionApprovedTrueCount=0`
- Candidate rows remain `productionApproved=false`.
- Candidate rows remain `needsReview=true`.
- Coverage/readiness does not equal production approval.

## Guardrail results

- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `fallbackAsReal=false`
- `frontendIndicatorUniverseExpanded=false`
- `investmentAdviceAdded=false`
- No trading signal, target price, fair value, upside/downside, or buy/sell/hold recommendation was added.

## Validation results

- `node scripts/run-staging.mjs npx eslint scripts/dry-run-macro-remaining-real-candidates.ts`: pass
- `node scripts/run-staging.mjs npx eslint scripts/smoke-macro-production-readiness-gate.ts`: pass
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass
- `node scripts/run-staging.mjs npm run typecheck`: pass after a minimal typing fix in the existing Phase 149J smoke (`Number(...) + 1` instead of `++` on a `Record<string, boolean | number>` field).
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail globally due to existing/out-of-scope lint debt in older scripts and modules. The new Phase 149K dry-run script is not listed in global lint failures, and targeted lint for the touched Phase 149J smoke passes.

## Next recommended phase

Phase 149L should confirm-write the two ready World Bank candidate rows only if product accepts annual World Bank candidate coverage for `GDP_GROWTH` and `CPI_YOY` in the current staging DB. The confirm-write phase must keep `productionApproved=false`, `needsReview=true`, and provenance/caveats intact.

For broader coverage after that, prioritize manual CSV collection for `PMI_MANUFACTURING` or `POLICY_RATE`, because both have clear indicator semantics but lack a parser-safe public endpoint.

## Commit

Final Phase 149K commit is the repository HEAD after this evidence update; the exact hash is reported in the final phase summary.
