# Phase 145X - MarketPrice Provenance Full HTTP SSR Smoke Test
**Date:** 2026-06-27

## Tóm tắt mục tiêu
- Chạy web server thật (`next start`) ở môi trường staging local (kết nối DB staging).
- Gọi HTTP fetch đến route Technical cho 5 mã: FPT, HPG, VNM, MSN, MWG.
- Kiểm tra kết xuất HTML SSR thực tế để đảm bảo phần **Cảnh báo nguồn dữ liệu (Source Transparency)** luôn xuất hiện và hoạt động chính xác (ngay cả trong trạng thái thiếu hụt DB Unit Metadata dẫn đến giao diện Unavailable).
- Kiểm tra tính nguyên vẹn:
  - 100% trả về HTTP 200 (không 500/lỗi nội bộ).
  - Không vi phạm các từ khóa cấm (official, verified, production data, v.v.).
  - Không thực hiện bất kỳ lệnh ghi mới, import, seed, drop nào vào database.

## Kết quả kiểm tra
- Toàn bộ 5 route (FPT, HPG, VNM, MSN, MWG) đều trả HTTP 200 OK từ process Node thật.
- Khắc phục sự cố giấu bảng cảnh báo bằng cách đưa khối **Cảnh báo nguồn dữ liệu Market Price (Chưa được phê duyệt production)** hiển thị trực tiếp bên trong vùng giao diện *Unavailable* khi chưa đủ dữ liệu DB nhưng metadata minh bạch vẫn tồn tại (Phát sinh do chưa hoàn thiện UnitMetadata trong CSDL thực tế cho các mã).
- HTML đã chứa đầy đủ từ khóa `"cảnh báo nguồn dữ liệu market price"` và KHÔNG có từ cấm.

## Bằng chứng Output

```text
> atelier-finance@0.1.0 build
> prisma generate && next build

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.

Generated Prisma Client (7.8.0) to .\src\generated\prisma in 273ms

Next.js 16.2.7 (Turbopack)
- Environments: .env.local, .env

  Creating an optimized production build ...
Compiled successfully in 8.3s
  Running TypeScript ...
  Finished TypeScript in 21.0s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (10/10) in 448ms
  Finalizing page optimization ...

Phase 145X - MarketPrice provenance full HTTP SSR smoke

[Phase 145X] Starting HTTP smoke test on actual server...
Waiting for Next.js server at http://localhost:3456...
Server is up and running!
Cleaning up server process...

--- Smoke Summary ---
phase: 145X
mode: market_price_provenance_full_http_ssr_smoke
tickersChecked: FPT, HPG, VNM, MSN, MWG
technicalRouteResolved: /workspace?module=technical&ticker=[TICKER]
httpServerStarted: true
httpSsrChecked: true
routesChecked: full
http200Count: 5
httpFailures: 
provenanceLabelsFound: true
warningLabelsFound: true
forbiddenCopyDetected: false
forbiddenCopyMatches: 
productionApprovedTrueCount: 0
needsReviewTrueCount: 90
marketPriceProvenanceRowCount: 90
marketPriceRowCountBefore: 85
marketPriceRowCountAfter: 85
marketPriceRowsChanged: 0
dbWriteAttempted: false
importAttempted: false
seedAttempted: false
migrationAttempted: false
fullHttpSsrSmokePassed: yes
readyForNextPhase: yes
readyForProductionApproval: false
recommendedNextPhase: Phase 145Y — MarketPrice provenance API/assistant context exposure audit
```

## Kết luận
Phase 145X đã thành công. Việc chạy app thật qua server Next.js production SSR không xảy ra crash, trả về đầy đủ metadata minh bạch, và tuân thủ chặt chẽ việc không thay đổi dữ liệu hiện hữu.

**Sẵn sàng cho:** Phase 145Y — MarketPrice provenance API/assistant context exposure audit.
