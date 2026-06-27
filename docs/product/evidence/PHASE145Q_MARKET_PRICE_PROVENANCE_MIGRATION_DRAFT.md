# Phase 145Q — MarketPrice Provenance Sidecar Migration Draft

## 1. Tóm tắt phase
- Phase 145Q tạo migration nháp cho bảng `MarketPriceProvenanceMetadata`.
- Không chạy migration.
- Không resolve migration.
- Không ghi DB.
- Không import/seed.
- Không bật `productionApproved=true`.
- Không production deploy.

## 2. Điểm bắt đầu
- Macro/Industry drift đã được resolve và smoke xong ở Phase 145P.
- MarketPrice provider payload thật đã fetch được ở Phase 145G.
- Metadata gap còn lại: adjustment evidence thiếu, unit/currency/exchange chưa đủ.
- Vì vậy cần sidecar provenance metadata trước khi import/write-path.

## 3. Schema model
- **Model name**: `MarketPriceProvenanceMetadata`
- **Fields added**: `ticker`, `marketDate`, `providerName`, `providerType`, `sourceLabel`, `dataMode`, `productionApproved` (default `false`), `fetchedAt`, `exchange`, `currency`, `priceUnit`, `volumeUnit`, `adjustmentStatus`, `stalenessStatus`, `fallbackUsed` (default `false`), `needsReview` (default `true`), `importRunId`, `payloadChecksum`, `warningCodes` (Json).
- **Default values**: `productionApproved = false`, `fallbackUsed = false`, `needsReview = true`, `createdAt = now()`. Không có mặc định cho `adjustmentStatus` để bắt buộc ứng dụng phải xử lý và quyết định giá trị thật.
- **Indexes/Unique constraints**: 
  - `@@unique([ticker, marketDate, sourceLabel])`
  - Các index trên `ticker`, `marketDate`, `sourceLabel`, `dataMode`, `productionApproved`, `stalenessStatus`, `adjustmentStatus`.
- **Why sidecar table is used**: Để chứa provenance và audit metadata cho MarketPrice mà không ảnh hưởng trực tiếp tới cấu trúc hay data access layer của bảng lõi MarketPrice. Không thay thế MarketPrice cũng như MarketPriceUnitMetadata.

## 4. Migration draft
- **Migration folder**: `20260627225000_add_market_price_provenance_metadata`
- **Migration.sql path**: `prisma/migrations/20260627225000_add_market_price_provenance_metadata/migration.sql`
- **Target table**: `MarketPriceProvenanceMetadata`
- **Contains only expected targets**: Yes
- **Existing tables altered**: No

## 5. SQL safety review
- **DROP TABLE**: No
- **DROP COLUMN**: No
- **TRUNCATE**: No
- **DELETE FROM**: No
- **INSERT INTO**: No
- **UPDATE statement**: No
- **ALTER DROP**: No
- **destructiveSqlDetected**: No
- **dataWriteSqlDetected**: No

## 6. Guardrail checks
- No DB reset
- No table drop
- No column drop
- No delete/truncate
- No DB data write
- No migration apply
- No migration resolve
- No `productionApproved=true`
- No `research_only` promotion
- No provider import
- No seed
- No production deploy

## 7. Validation
```bash
node scripts/run-staging.mjs npx prisma validate # Pass
node scripts/run-staging.mjs npx prisma generate # Pass
node scripts/run-staging.mjs npx prisma migrate status # Pass
node scripts/run-staging.mjs npm run typecheck # Pass
node scripts/run-staging.mjs npm run lint # Pass (some warnings)
node scripts/run-staging.mjs npm run build # Pass
node scripts/run-staging.mjs npx tsx scripts/check-market-price-provenance-migration-draft.ts # Pass
node scripts/run-staging.mjs npm test # Fail
```
*Note: `npm test` is not a clean pass. Failure classified as local PostgreSQL temp test DB infrastructure issue.*

## 8. Recommended next phase
Phase 145R — Explicitly approved MarketPrice provenance schema migration apply on staging
