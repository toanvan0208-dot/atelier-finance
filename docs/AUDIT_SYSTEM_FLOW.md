# Audit System Flow

Ngày audit: 2026-06-12  
Phạm vi: navigation config, AppShell, URL query, sidebar/mobile nav, topbar actions, drawer/popup, CTA liên module, các module trong `src/features`.

## 1. Danh sách module

| Key | Label | Navigation | Journey | Render trong AppShell | Vai trò sản phẩm | Kết luận |
|---|---|---:|---:|---:|---|---|
| `overview` | Tổng quan | Có | Có | Có | Điều phối tiến độ, thiếu dữ liệu, học tập, cảnh báo | Hợp lệ, nhưng cần tránh làm thay Watchlist |
| `learning` | Học tập | Có | Có | Có | Trợ giảng theo ngữ cảnh | Hợp lệ; hiện chưa nhận context module từ CTA |
| `macro` | Vĩ mô | Có | Có | Có | Bối cảnh thị trường/ngành | Hợp lệ |
| `industry` | Ngành | Có | Có | Có | Chuyển từ vĩ mô sang ngành | Hợp lệ |
| `screening` | Lọc cổ phiếu | Có | Có | Có | Tạo danh sách ứng viên, không khuyến nghị mua | Hợp lệ; cần giảm CTA đi quá nhanh sang BCTC/Định giá |
| `business` | Hiểu doanh nghiệp | Có | Có | Có | Mô hình kinh doanh, lợi thế, rủi ro phi tài chính | Hợp lệ |
| `financials` | Báo cáo tài chính | Có | Có | Có | Kiểm chứng mô hình bằng số liệu | Hợp lệ; đã nối nút quay lại DN |
| `valuation` | Định giá | Có | Có | Có | Giả định, vùng giá, biên an toàn | Hợp lệ |
| `risk` | Rủi ro & minh bạch | Có | Có | Có | Kiểm tra điều gì có thể sai | Hợp lệ |
| `technical` | Giá - Thanh khoản - Thời điểm | Có | Có | Có | Quan sát PVT, không tạo tín hiệu mua/bán độc lập | Hợp lệ |
| `checklist` | Kiểm tra & luyện tư duy | Có | Có | Có | Gate chất lượng phân tích | Hợp lệ |
| `simulation` | Mô phỏng | Có | Có | Có | Paper trading/ghi nhận giả lập | Hợp lệ; thiếu CTA rõ về Watchlist sau mô phỏng |
| `watchlist` | Watchlist | Có | Có | Có | Theo dõi tiến độ phân tích theo mã | Hợp lệ |
| `route-config` | Hồ sơ/Cấu hình lộ trình | Không | Có | Không render page; mở drawer hồ sơ | Phụ trợ có chủ đích | Chấp nhận được nếu giữ là drawer; không nên xem là module chính |

## 2. Bảng nút / CTA / action

| Khu vực | Nút/action chính | Loại | Trạng thái hiện tại | Đề xuất |
|---|---|---|---|---|
| Sidebar desktop | 13 module trong `navigationItems` | Điều hướng | Đã render, active state đúng sau sửa | Giữ |
| Mobile navigation | 13 module short label | Điều hướng | Đã render, URL query đúng | Giữ |
| Topbar | Tìm kiếm, Thông báo, Tài khoản | Nút giả | Không có handler | Disable + nhãn `Sắp có` hoặc ẩn khỏi topbar |
| Topbar/profile | Hồ sơ phân tích | Drawer | Có mở `PersonalAnalysisProfileDrawer` | Giữ, nên thống nhất tên với `route-config` |
| Right assistant | Next actions theo `aiTutor.config.ts` | Điều hướng/drawer | Điều hướng module; `route-config` mở drawer | Giữ, nhưng loại bớt next actions trùng trong Macro |
| Overview | Tiếp tục BCTC, mở missing data, pipeline, watchlist/practice/profile | Điều hướng | Có handler | Giữ; giảm vai trò watchlist chi tiết ở Overview |
| Learning | Tab/lesson/quiz/profile | UI nội bộ | Không thấy luồng quay về context module | Cần context return target |
| Macro | CTA sang Ngành; block nội bộ | Điều hướng/UI nội bộ | Có navigate sang Industry | Giữ |
| Industry | CTA sang Lọc cổ phiếu; deep dive | Điều hướng/UI nội bộ | Hợp lệ | Giữ |
| Screening | Mở hồ sơ DN, BCTC, so sánh, Watchlist, Risk; drawer giải thích | Điều hướng/drawer | Có nhiều CTA; một số đi quá sâu | P1: ưu tiên Business trước, BCTC/Định giá nên secondary |
| Business | Quay lại Screening, sang Financials, deep dive drawers, mini check | Điều hướng/drawer/UI nội bộ | Hợp lệ | Giữ; nút rủi ro phi tài chính cần rõ là không thay Risk module |
| Financials | Ghi chú, quay lại DN, sang Định giá | Popover/điều hướng/disabled | Đã nối quay lại DN; Định giá vẫn disabled khi chưa đủ readiness | Giữ disabled; text nên là `Sắp đủ điều kiện: hoàn thành nhận định BCTC` |
| Valuation | CTA Risk, Technical, Financials; method detail popup | Điều hướng/popup | Đã có test hook, navigate đúng | Giữ; đổi `trước khi mua` thành `trước khi đi tiếp` |
| Risk | CTA quay module nguồn, PVT/checklist/watchlist; risk drawers | Điều hướng/drawer/UI nội bộ | Một số nút trong `RiskUi` là ghost chưa nối | Disable/`Sắp có` các nút source/action chưa handler |
| Technical/PVT | Watchlist, Risk, Valuation, Checklist; FOMO/detail popup | Điều hướng/popup | CTA cuối module navigate đúng | Giữ; đảm bảo mọi text tránh cảm giác tín hiệu mua/bán |
| Checklist | Quay module thiếu, Simulation, Watchlist, save result | Điều hướng/UI nội bộ/nút giả | `Lưu kết quả kiểm tra` chưa nối | Disable + `Sắp có` hoặc lưu local rõ ràng |
| Simulation | Tạo lệnh giả lập, đóng vị thế drawer, scenario/history tabs, prompt inputs | Paper trading/drawer/UI nội bộ | Đúng tinh thần giả lập; thiếu CTA Watchlist sau mô phỏng | P1 thêm CTA quay Watchlist/cập nhật tiến độ |
| Watchlist | Filter, mở idea drawer, mở module liên quan, cập nhật thesis, mở mô phỏng | Filter/drawer/nút giả/điều hướng | Một số nút trong insight panel chưa có handler | P1 nối module target hoặc disable `Sắp có` |
| AnalysisNotePopover | Mở/lưu/xóa/đóng ghi chú | Popover/state local | Có logic local | Giữ |

## 3. Bảng lỗi điều hướng

| Mức | Lỗi | Bằng chứng | Trạng thái |
|---|---|---|---|
| P0 | Back/forward không hoạt động đúng vì `handleNavigate` dùng `replaceState` và `activeModuleOverride` che URL | AppShell trước sửa | Đã sửa sang `pushState` + navigation event |
| P0 | Click module không tạo history entry | AppShell trước sửa | Đã sửa, E2E pass |
| P0 | `financials` render nhưng không nhận `onNavigate`, nút quay lại DN là nút chết | AppShell/FinancialsPage/Header | Đã sửa nút quay lại DN; nút Định giá giữ disabled theo readiness |
| P1 | `route-config` có trong `moduleJourney`/AI Tutor nhưng không có `navigationItems` và không render page | Config | Chấp nhận nếu chủ đích là drawer; cần rename thành `profile` hoặc document rõ |
| P1 | Topbar search/notifications/account là nút không handler | `Topbar.tsx` | Chưa sửa; cần quyết định ẩn hay `Sắp có` |
| P1 | Một số CTA trong Watchlist insight (`Cập nhật thesis`, `Mở module liên quan`, `Mở mô phỏng`) chưa nối logic | Watchlist components | Chưa sửa |
| P1 | Một số nút trong Risk/PVT/Valuation command center là action text nhưng chưa handler | Feature components | Chưa sửa |
| P2 | Learning chưa nhận context `fromModule` để quay lại đúng module | LearningPage không nhận `onNavigate/context` | Chưa sửa |

## 4. Bảng nút dư thừa

| Module | Nút/CTA | Vấn đề | Đề xuất |
|---|---|---|---|
| Macro assistant | `Xem bản đồ ngành` và `Chuyển sang Module Ngành` | Trùng đích `industry` | Giữ 1 nút |
| Overview | Nhiều lối vào Watchlist/practice/profile | Overview có nguy cơ làm quá vai trò điều phối | Giữ 1 CTA chính + các thẻ tóm tắt |
| Screening | `Xem báo cáo tài chính`, `Xem quản trị rủi ro` ngay từ kết quả lọc | Người mới có thể bỏ qua Business | Đưa xuống secondary hoặc chỉ hiện sau khi chọn mã |
| Valuation | `trước khi mua` | Gợi ý hành động mua quá sớm | Đổi thành `trước khi đi tiếp` |
| Technical | `Đưa vào Watchlist` và `Chuyển sang Rủi ro` đều primary | Hai hành động chính cạnh tranh | Chỉ một primary; Risk nên primary theo luồng chuẩn |

## 5. Bảng nút chưa có chức năng

| Khu vực | Nút | Đề xuất xử lý |
|---|---|---|
| Topbar | Tìm kiếm | Disable + `Sắp có` hoặc mở search drawer thật |
| Topbar | Thông báo | Disable + `Sắp có` |
| Topbar | Tài khoản | Disable + `Sắp có` |
| Checklist | Lưu kết quả kiểm tra | Disable + `Sắp có` nếu chưa có persistence |
| Watchlist insight | Cập nhật thesis | Nối form cập nhật hoặc disable |
| Watchlist insight | Mở module liên quan | Nối `onNavigateModule(target)` |
| Watchlist insight | Mở mô phỏng | Nối `simulation` |
| Watchlist action queue | Xem tất cả việc cần xử lý | Nối filter/tab hoặc disable |
| Risk UI | Các nút source/detail không handler | Nối drawer hoặc disable |
| PVT command center | Ghi chú quan sát / Xem tất cả sự kiện | Nối popover/drawer hoặc disable |
| Valuation input readiness | Quay lại BCTC / Xem giả định / Tiếp tục | Nối điều hướng/scroll hoặc disable |

## 6. Bảng module bị trùng chức năng

| Cặp module | Điểm chồng lấn | Ranh giới nên giữ |
|---|---|---|
| Overview vs Watchlist | Overview hiển thị watchlist ideas và next actions | Overview chỉ điều phối; Watchlist là nơi quản lý tiến độ theo mã |
| Business vs Financials | Business có bridge/check về BCTC | Business chỉ nêu giả thuyết mô hình; BCTC kiểm chứng bằng số liệu |
| Financials vs Valuation | BCTC có readiness sang định giá | BCTC kết luận chất lượng số liệu; Valuation mới xử lý vùng giá/giả định |
| Screening vs Recommendation | Kết quả lọc có CTA đi sâu nhanh | Screening chỉ tạo ứng viên, không kết luận mua |
| PVT vs Trading signal | PVT có risk/reward và đưa Watchlist | PVT chỉ quan sát hành vi giá/thanh khoản/thời điểm |
| Simulation vs Real order | Paper trading có order ticket | Luôn giữ copy `giả lập`, không dùng từ như đặt lệnh thật |

## 7. Bảng flow bị đứt

| Flow | Kết quả audit | Điểm đứt | Ưu tiên |
|---|---|---|---|
| 1. Người mới → Tổng quan → Vĩ mô → Ngành → Lọc cổ phiếu | Có thể đi qua sidebar/CTA | Overview CTA chính hiện nhảy về BCTC theo case mẫu, không phải flow người mới | P1 |
| 2. Lọc cổ phiếu → Hiểu DN → BCTC → Định giá | Có đường đi, nhưng BCTC sang Định giá đang bị gate | Hợp lý nếu readiness chưa đủ; cần text giải thích dễ hiểu hơn | P1 |
| 3. Định giá → Rủi ro → PVT → Checklist | Định giá sang Risk/PVT có; Risk/PVT sang Checklist có qua CTA/assistant | Luồng chuẩn trong prompt nói Risk → PVT → Checklist, nhưng AI Tutor đôi chỗ gợi Watchlist trước Checklist | P1 |
| 4. Checklist → Mô phỏng → Watchlist | Checklist sang Simulation có; Simulation thiếu CTA Watchlist rõ | Đứt ở Simulation → Watchlist | P1 |
| 5. Watchlist quay lại module còn thiếu | Có nhiều action theo mã, nhưng một số drawer button chưa handler | Cần nối các nút `Mở module liên quan` | P1 |
| 6. Bất kỳ module mở Học tập đúng ngữ cảnh | Assistant có Learning action | Learning chưa nhận context quay lại module gốc | P2 |
| 7. Hồ sơ phân tích / Cấu hình lộ trình | `route-config` mở drawer hồ sơ; `RouteConfigPage` tồn tại nhưng không render | Tên và implementation chưa thống nhất | P1 |

## 8. Đề xuất ưu tiên

### P0 - Đã xử lý

| Việc | Trạng thái |
|---|---|
| Sửa URL query/history/back/forward trong AppShell | Xong |
| Thêm E2E cho sidebar, URL query, refresh, invalid module, back/forward, mobile nav, CTA quan trọng | Xong |
| Nối `FinancialsPage` nhận `onNavigate` và nút quay lại Business | Xong |

### P1 - Cần quyết định/sửa gần

| Việc | Lý do |
|---|---|
| Quyết định `route-config`: drawer hồ sơ hay module cấu hình lộ trình đầy đủ | Hiện có `RouteConfigPage` nhưng AppShell không render |
| Disable hoặc nối Topbar actions | Tránh nút chết |
| Nối Watchlist insight buttons với module target/simulation | Watchlist phải là nơi theo dõi tiến độ phân tích |
| Thêm CTA Simulation → Watchlist/cập nhật tiến độ | Flow 4 đang đứt |
| Đổi copy `Kiểm tra rủi ro trước khi mua` | Tránh tạo cảm giác khuyến nghị mua |
| Giảm CTA nhảy sâu trong Screening | Giữ đúng vai trò ứng viên, không khuyến nghị |

### P2 - Cải thiện sau

| Việc | Lý do |
|---|---|
| Learning nhận `fromModule` hoặc context query | Học tập đúng ngữ cảnh hơn |
| Chuẩn hóa `group` type trong config thành ASCII enum + label riêng | Tránh rủi ro encoding và dễ test |
| Chuẩn hóa `moduleKey` cho mọi CTA data | Giảm hard-code theo label |
| Thêm test drawer hồ sơ và assistant next actions | Tăng coverage phụ trợ |

## 9. Kiểm thử đã thêm

File: `tests/e2e/navigation.spec.ts`

| Case | Trạng thái |
|---|---|
| Click từng item sidebar thì module đúng hiển thị | Pass |
| URL query `?module=` đúng | Pass |
| Refresh giữ đúng module | Pass |
| Module không hợp lệ fallback overview | Pass |
| Back/forward hoạt động đúng | Pass |
| Mobile navigation hoạt động đúng | Pass |
| CTA quan trọng đi đúng module | Pass |

Lệnh đã chạy:

```bash
npm run lint
npm run test:e2e
```

Kết quả: lint pass, E2E 6/6 pass.
