# Company Issuer Metadata Foundation

Phase: 35 - Company/Issuer Metadata Foundation

Date: 2026-06-20

## 1. Goal

Phase 35 adds a local/research-only issuer metadata foundation so Technical/PVT can resolve company/issuer metadata from a separate source layer instead of relying on static sample fallback data.

This phase is not a production issuer metadata provider. It does not approve company metadata for production use.

## 2. Why This Follows Phase 34

Phase 34 separated:

- market price data source: local DB / vnstock / research_only or sample fallback
- issuer metadata source: company/industry/sector metadata status and limitations

Phase 34 made missing issuer metadata visible as unavailable/not verified. Phase 35 adds the first safe local metadata foundation behind that boundary.

## 3. Boundary

Technical/PVT now keeps two independent layers:

1. Market price data source
   - local DB manual import or sample/static fallback
   - source label
   - data mode
   - fallback state
   - date span/as-of where available
   - `productionApproved:false`

2. Issuer metadata source
   - ticker
   - display/company/issuer name
   - exchange
   - industry
   - sector
   - source label
   - data mode
   - verification status
   - limitations/warnings
   - `productionApproved:false`

The two layers must not be mixed. A DB-backed market price source can use `vnstock` while issuer metadata uses `local_issuer_metadata_seed` or `unavailable`.

## 4. Local Seed Behavior

Phase 35 adds `src/lib/data-sources/issuer-metadata-service.ts`.

The service exposes `getIssuerMetadata(ticker)` and returns serializable issuer metadata. The current seed is intentionally small:

- `FPT`
- `MWG`
- `VCB`

For these seed entries:

- `sourceLabel:local_issuer_metadata_seed`
- `dataMode:research_only`
- `verificationStatus:local_research_seed`
- `productionApproved:false`
- display/company/issuer name is limited to the ticker label
- exchange is null
- industry is null
- sector is null

Industry and sector are intentionally unavailable because Phase 35 does not add source evidence for them.

## 5. Unknown Ticker Behavior

Unknown tickers return unavailable issuer metadata:

- ticker is preserved in normalized uppercase form
- display/company/issuer name is null
- industry is null
- sector is null
- `sourceLabel:unavailable`
- `dataMode:unavailable`
- `verificationStatus:unavailable`
- `productionApproved:false`

Static sample company, industry, or sector metadata must not be reused for unknown DB-backed tickers.

## 6. Sample Fallback Behavior

When Technical/PVT uses sample/static fallback:

- sample UI still renders
- issuer metadata can come from the sample fallback object
- `verificationStatus:static_sample`
- `productionApproved:false`
- the UI keeps the sample/static fallback label

Sample metadata is not official and is not production-ready.

## 7. UI Transparency

TechnicalPage continues to show two layers near the data-quality banner:

- Price/volume source: source label, data mode, ticker/as-of, runtime badge, `productionApproved:false`
- Issuer metadata source: verification status, industry/sector if available, and metadata badge

When issuer metadata comes from the local seed, the UI shows:

- `Metadata doanh nghiep: local research seed`
- `metadata:local_research_seed`
- `Chi dung cho academic/local research; productionApproved:false`

When issuer metadata is unavailable, the UI shows unavailable/not verified metadata and does not fill industry/sector from sample values.

## 8. Tests And Validation Evidence

Phase 35 adds/updates tests for:

- `getIssuerMetadata("FPT")` returns local research seed metadata.
- Unknown ticker returns unavailable metadata.
- DB-backed Technical/PVT keeps `marketDataSource.sourceLabel:vnstock` while `issuerMetadata.sourceLabel` is `local_issuer_metadata_seed` or `unavailable`.
- DB-backed Technical/PVT does not reuse sample industry/sector when ticker differs from sample.
- Sample fallback keeps `verificationStatus:static_sample`.
- UI displays local seed or unavailable metadata status.
- Recommendation/trading-signal fields and wording remain absent.

Targeted checks run during implementation:

- `npx vitest run src/lib/data-sources/__tests__/issuer-metadata-service.test.ts src/features/technical/lib/__tests__/load-technical-desk-data.test.ts src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `npx tsc --noEmit`

Full validation is recorded in the final Phase 35 implementation report.

## 9. Manual Browser Verification Evidence

Manual browser verification was completed locally on 2026-06-20.

DB-backed mode:

- URL: `http://localhost:3000/workspace?module=technical`
- Env: `DATABASE_URL=file:./dev.db`
- Env: `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`
- Page rendered.
- FPT market price rendered from local DB / `vnstock` / `research_only`.
- Source transparency separated the price/volume source from the issuer metadata source.
- Price/volume source displayed as local DB manual import / `vnstock` / `research_only`.
- Issuer metadata displayed as local research seed.
- Industry displayed as unavailable / not verified.
- Sector displayed as unavailable / not verified.
- `productionApproved:false` remained visible.
- Header did not reuse sample industry/sector for FPT.
- No official, realtime, or production metadata claim was observed.
- No recommendation or trading-signal wording was observed.

Later-phase review note:

- The browser UI still shows support/resistance style PVT derived levels while the current DB-backed price is `129.12`. This may indicate a separate PVT derived-metrics/sample-boundary issue and should be reviewed in a later phase. Phase 35 does not change this behavior.

## 10. Safety Notes

Phase 35 did not:

- call external APIs
- scrape or download data
- import real internet data
- write DB rows
- add cron, public API, or auto sync
- add a production data provider
- set `productionApproved:true`
- claim official/realtime/production metadata
- claim issuer profiles are fully verified
- add buy/sell/hold recommendation wording
- add trading-signal wording

## 11. Limitations

- FPT/MWG/VCB seed entries are local research-only labels, not official company profiles.
- Industry and sector remain null until source evidence exists in the repo.
- The service is in-code seed data, not DB-backed metadata.
- There is no public API or external provider for issuer metadata.
- Manual browser verification has been completed for DB-backed Phase 35 behavior.
- PVT support/resistance style derived levels were not changed and need later review against DB-backed price boundaries.

## 12. Files Changed

- `src/lib/data-sources/issuer-metadata-service.ts`
- `src/lib/data-sources/index.ts`
- `src/lib/data-sources/__tests__/issuer-metadata-service.test.ts`
- `src/features/technical/types.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/technical/lib/__tests__/load-technical-desk-data.test.ts`
- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `docs/product/COMPANY_ISSUER_METADATA_FOUNDATION.md`
