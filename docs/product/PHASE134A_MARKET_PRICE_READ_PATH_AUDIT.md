# Phase 134A: Market Price Input Read-Path Audit for Valuation/Risk

## 1. Mục tiêu
Kiểm tra đường đi của dữ liệu giá thị trường (market price) để làm rõ nguyên nhân module Valuation và Risk tiếp tục báo thiếu `marketCap` và `marketPrice` (insufficient_data) mặc dù các input hỗ trợ như `eps`, `sharesOutstanding`, `totalDebt` đã được bổ sung thành công ở Phase 133B–133C.

## 2. Quá trình kiểm tra (Audit)

### 2.1. Trạng thái cơ sở dữ liệu (Database State)
- Module đã có dữ liệu trong bảng `MarketPrice` cho các ticker mục tiêu (FPT, MWG, VNM) thông qua nguồn `vnstock_market_price` với `dataMode` là `research_only`.
- Script kiểm tra (getLatestMarketPrice) xác nhận query lấy được giá (ví dụ: FPT có `closePrice: 71500`).
- Trường `marketCap` trong DB có giá trị `null`, tuy nhiên logic hệ thống (ví dụ `calculateMarketCap(logicInput)`) tự động tính toán giá trị này qua công thức `closePrice * sharesOutstanding`. Do đó, nguyên nhân cốt lõi là hệ thống runtime không nhận được `closePrice`.

### 2.2. Đường đi dữ liệu của Risk (Risk Read-Path)
- `RiskPage.tsx` phụ thuộc hoàn toàn vào `initialFinancialsRuntimeData` được truyền từ `WorkspacePage`.
- Service cung cấp `FinancialsRuntimeData` là `loadFinancialsRuntimeData` và `financial-statement-read-service.ts`.
- **Phát hiện:** Service này chỉ query từ bảng `FinancialStatement`. Nó không thực hiện query bảng `MarketPrice`. Do đó, `runtimeData.statementSnapshot.closePrice` luôn bị khuyết (`undefined`). Khi Risk module nhận vào, giá thị trường bị báo thiếu, dẫn đến `marketCap` cũng không thể tính.

### 2.3. Đường đi dữ liệu của Valuation (Valuation Read-Path)
- Valuation sử dụng một API client (`fetchValuationInputsByTicker`) để gọi song song:
  - `/api/companies/[ticker]/financials`
  - `/api/companies/[ticker]/market-prices`
- API `market-prices` hoạt động bình thường và trả về giá `closePrice`.
- **Phát hiện:** Mặc dù client-side API có thể lấy được giá, nhưng quy trình xác minh (verification) runtime và một số bước fallback lại phụ thuộc vào `ValuationFinancialsRuntimeReadiness`.
- `ValuationFinancialsRuntimeReadiness` sử dụng `FinancialsRuntimeData` làm "nguồn chuẩn" để đánh giá trạng thái readiness (`insufficient_data` hay `ready`). Vì `FinancialsRuntimeData` (sinh ra từ backend / `loadFinancialsRuntimeData`) không chứa `closePrice`, quy trình xác minh tự động báo lỗi `insufficient_data` cho `marketCap`.

## 3. Kết luận
Nguyên nhân gốc rễ (bottleneck) nằm ở lớp đọc dữ liệu hợp nhất cho runtime (`loadFinancialsRuntimeData`). Lớp này đóng vai trò cung cấp snapshot chuẩn cho toàn bộ Workspace (được truyền vào Risk và làm gốc cho Valuation readiness), nhưng hiện tại nó chỉ đọc bảng `FinancialStatement` mà "bỏ quên" bảng `MarketPrice`. 

Thiếu giá trị `closePrice` trong `statementSnapshot` khiến mọi logic phụ thuộc (đặc biệt là Market Cap trong Risk và kiểm tra Readiness trong Valuation) đều bị chặn ở trạng thái `insufficient_data`.

## 4. Đề xuất cho Phase 134B (Merge Market Price)
- **Phase 134B:** Bổ sung việc đọc giá trị từ bảng `MarketPrice` (thông qua `getLatestMarketPrice`) vào luồng `loadFinancialsRuntimeData` (hoặc xử lý trực tiếp tại lớp `financial-statement-read-service.ts` / `load-financials-runtime-data.ts`).
- **Thực thi dự kiến:** 
  - Trong quá trình tạo `FinancialsRuntimeData`, gọi thêm `marketPriceService` để lấy `closePrice` hiện tại.
  - Merge `closePrice` vào `FinancialsRuntimeData.statementSnapshot.closePrice`.
  - Giữ nguyên ràng buộc không write DB, không đổi schema, chỉ điều chỉnh read-path.
- **Kết quả mong đợi:** Risk sẽ nhận đủ `closePrice`, Valuation sẽ vượt qua được bài kiểm tra Readiness cho `marketCap`, từ đó chuyển module sang trạng thái `ready`.
