# Phase 145Y - MarketPrice daily provider refresh job dry-run, no write
**Date:** 2026-06-27

## 1. Tóm tắt phase
Phase 145Y thực hiện dry-run mô phỏng chạy **MarketPrice daily provider refresh job** tự động lấy dữ liệu giá hằng ngày từ nhà cung cấp (provider) và chuẩn bị ghi vào `MarketPrice` và bảng sidecar `MarketPriceProvenanceMetadata`.
- Không ghi DB.
- Không import.
- Không seed.
- Không migration.
- Không productionApproved=true.
- Không production deploy.

## 2. Vì sao cần phase này
Sản phẩm thật không nên phụ thuộc vào việc người dùng/dev tải thủ công báo cáo thường niên hoặc nhập dữ liệu tay hàng ngày.
Dữ liệu giá nên được backend/job lấy từ provider theo lịch, lưu vào DB một cách an toàn thông qua pipeline staging candidate, sau đó UI/AI sẽ đọc từ DB.
Phase này kiểm tra kịch bản lấy và ánh xạ dữ liệu (dry-run) trước khi cấp quyền chạy thực tế (confirm-write).

## 3. Provider fetch
- providerFetchAttempted: true
- providerFetchSucceeded: true
- tickersChecked: FPT, HPG, VNM, MSN, MWG
- fallbackUsed: false (Không dùng dữ liệu mô phỏng, gọi thẳng payload provider VNStock thật).

## 4. MarketPrice candidate mapping
- candidateMarketPriceRows: 25
- required fields coverage: Đã phủ đủ `closePrice`, `tradingDate` (từ `row.close` và `row.time`).
- rowsAlreadyExist: 0 (Vì truy vấn fetch dữ liệu 5 ngày qua chưa có trong DB).
- rowsWouldInsert: 25
- rowsWouldUpdate: 0
- rowsBlocked: 0
- blockedReasons: (Trống)

## 5. Provenance candidate mapping
- candidateProvenanceRows: 25
- productionApproved true count: 0
- needsReview count: 25 (Đánh dấu cần xem lại do dữ liệu vẫn còn metadata cảnh báo chưa được xác minh).
- dataMode distribution: `{"candidate_provider_data":25}`
- providerType distribution: `{"undocumented_provider":25}`
- adjustmentStatus distribution: `{"needs_review":25}`
- warningCodes summary: `{"MISSING_CURRENCY":25,"MISSING_EXCHANGE":25,"MISSING_PRICE_UNIT":25,"MISSING_VOLUME_UNIT":25,"MISSING_ADJUSTMENT_EVIDENCE":25}`
- payloadChecksumGeneratedCount: 25

## 6. Guardrail checks
- dbWriteAttempted: false
- marketPriceWriteAttempted: false
- provenanceWriteAttempted: false
- importAttempted: false
- seedAttempted: false
- migrationAttempted: false
- Không missing-to-zero.
- Không fallback-as-real.
- Không production deploy.

## 7. Readiness decision
- readyForConfirmWritePhase: true (Vì dữ liệu mapping đầy đủ, checksum đầy đủ, provider fetch thành công).
- readyForScheduledJobPhase: false
- readyForProductionApproval: false
- Lý do `readyForProductionApproval=false`: Dữ liệu thu thập vẫn trong trạng thái `candidate_provider_data`, provider `undocumented_provider`, `needsReview=true` do khuyết currency/exchange/unit và evidence hiệu chỉnh (adjustment).

## 8. Validation
Code tuân thủ an toàn Type-Check và Linting hiện có:
- Không chèn thêm vi phạm TypeScript hay ESLint vào các file liên quan.
- (Chỉ các lỗi global ngoài scope từ trước vẫn tồn tại, không ghi nhận thêm trong scope Phase này).

## 9. Recommended next phase
**Phase 145Z — Explicitly approved MarketPrice daily provider refresh confirm-write on staging**
