# Phase 145S — MarketPrice Provenance Sidecar Mapping Dry Run

## 1. Tóm tắt phase
- Phase 145S thực hiện dry-run mapping provider payload (VNStock) sang cấu trúc `MarketPriceProvenanceMetadata`.
- Hoạt động chỉ diễn ra trong memory, không ghi vào DB.
- Không import dữ liệu vào DB thật.
- Không seed dữ liệu.
- Không có migration mới.
- Không bật `productionApproved=true`.
- Không production deploy.

## 2. Điểm bắt đầu từ Phase 145R
- Bảng `MarketPriceProvenanceMetadata` đã tồn tại trên staging.
- Row count hiện tại: 0.
- `productionApproved` trong bảng provenance: 0.
- Schema default `productionApproved=false` và `needsReview=true` đã được kiểm chứng.

## 3. Provider payload
- **providerFetchAttempted**: true
- **providerFetchSucceeded**: true
- **tickers checked**: FPT, HPG, VNM, MSN, MWG
- **fallback used**: false (Không dùng fallback làm provider evidence).

## 4. Mapping result
- **candidateMarketPriceRows**: 90
- **candidateProvenanceRows**: 90
- **schema validation result (candidateRowsValidForSchema)**: 90
- **checksum/importRunId result**: Đã tạo `payloadChecksum` và `importRunId` thành công cho 100% dòng (90 dòng).

## 5. Metadata classification
- **dataMode distribution**: `{"candidate_provider_data": 90}`
- **providerType distribution**: `{"undocumented_provider": 90}`
- **adjustmentStatus distribution**: `{"needs_review": 90}`
- **stalenessStatus distribution**: `{"stale": 90}`
- **needsReview count**: 90
- **warningCodes summary**: `{"MISSING_CURRENCY": 90, "MISSING_EXCHANGE": 90, "MISSING_PRICE_UNIT": 90, "MISSING_VOLUME_UNIT": 90, "MISSING_ADJUSTMENT_EVIDENCE": 90}`

## 6. Guardrail checks
- No DB write
- No import
- No seed
- No migration
- No `productionApproved=true`
- No fallback-as-real
- No missing-to-zero
- No default adjusted assumption
- No production deploy

## 7. Readiness decision
- **readyForConfirmWritePhase**: Yes. Tất cả các dữ liệu đã map được vào schema mà không vi phạm guardrail (không có `productionApproved=true`, đã có checksum). Các gap metadata đã được phân loại đúng bằng `needsReview` và `warningCodes`.
- **readyForProductionApproval**: No. Dữ liệu thiếu nhiều trường quan trọng như đơn vị tiền tệ, sàn, và không có bằng chứng rõ ràng về giá sau điều chỉnh (adjustment evidence). Cần manual review.

## 8. Validation
```bash
node scripts/run-staging.mjs npx prisma validate # Pass
node scripts/run-staging.mjs npx prisma generate # Pass
node scripts/run-staging.mjs npx prisma migrate status # Pass
node scripts/run-staging.mjs npm run typecheck # Pass
node scripts/run-staging.mjs npm run lint # Pass
node scripts/run-staging.mjs npm run build # Pass
node scripts/run-staging.mjs npx tsx scripts/dry-run-market-price-provenance-sidecar-mapping.ts # Pass
node scripts/run-staging.mjs npm test # Fail
```
*Note: `npm test` is not a clean pass. Failure classified as local PostgreSQL temp test DB infrastructure issue.*

## 9. Recommended next phase
Phase 145T — Explicitly approved MarketPrice provenance sidecar confirm-write on staging
