# Phase 145R — MarketPrice Provenance Schema Migration Apply

## 1. Tóm tắt phase
- Phase 145R apply migration tạo bảng `MarketPriceProvenanceMetadata` trên staging.
- Không import dữ liệu.
- Không seed dữ liệu.
- Không ghi dữ liệu nghiệp vụ.
- Không bật `productionApproved=true`.
- Không production deploy.

## 2. Điểm bắt đầu từ Phase 145Q
- Migration draft đã được review tại `20260627225000_add_market_price_provenance_metadata`.
- Migration chỉ target `MarketPriceProvenanceMetadata`.
- Không có destructive SQL (không drop table, column, không delete/truncate).
- Không có data-write SQL.
- `safeForManualReview=true`.
- `explicitApprovalRequired=true`.
- User đã đồng ý triển khai phase apply trên staging.

## 3. Pre-migration checks
- Migration folder exists: Yes (`prisma/migrations/20260627225000_add_market_price_provenance_metadata`)
- `migration.sql` exists: Yes
- SQL safety result: Passed (No destructive commands)
- Pre-migration `migrate status`: 1 pending migration
- Check script result: Passed

## 4. Migration execution
- Command run: `npx prisma migrate deploy`
- Migration name: `20260627225000_add_market_price_provenance_metadata`
- Migration apply succeeded: Yes
- Migrate dev used: No
- Migrate reset used: No
- DB push used: No
- Resolve used: No

## 5. Post-migration smoke
- Post-migration `migrate status`: Database schema is up to date!
- `MarketPriceProvenanceMetadata` exists: Yes
- `MarketPriceProvenanceMetadata` row count: 0
- `MarketPrice` row count: 85 (Preserved)
- `MarketPriceUnitMetadata` row count: 0 (Preserved)
- `productionApproved` true count: 0
- `needsReview` default check: Verified (default `true`)
- `productionApproved` default false check: Verified (default `false`)

## 6. Guardrail checks
- No DB reset
- No table drop
- No column drop
- No delete/truncate
- No business data write
- No provider import
- No seed
- No `productionApproved=true`
- No `research_only` promotion
- No production deploy

## 7. Validation
```bash
node scripts/run-staging.mjs npx prisma validate # Pass
node scripts/run-staging.mjs npx prisma migrate status # Pass
node scripts/run-staging.mjs npx prisma generate # Pass
node scripts/run-staging.mjs npm run typecheck # Pass
node scripts/run-staging.mjs npm run lint # Pass
node scripts/run-staging.mjs npm run build # Pass
node scripts/run-staging.mjs npm test # Fail
```
*Note: `npm test` is not a clean pass. Failure classified as local PostgreSQL temp test DB infrastructure issue.*

## 8. Recommended next phase
Phase 145S — MarketPrice provenance dry-run import mapping to sidecar, no write by default
