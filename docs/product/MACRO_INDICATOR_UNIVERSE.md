# Macro Indicator Universe Expansion & Source Strategy

## Mục tiêu (Phase 148A)
Định nghĩa danh mục các chỉ số vĩ mô (Macro Indicator Universe) mà Atelier Finance dự kiến hỗ trợ, xác định trạng thái sẵn sàng về dữ liệu của từng chỉ số (DB-backed, Candidate identified, Assessment needed), loại bỏ toàn bộ mock data khỏi UI và Assistant, đảm bảo quy tắc "Không bịa số, không dùng data giả".

## Phân loại trạng thái dữ liệu (Support Status)
1. **db_backed**: Đã có dữ liệu thật trong hệ thống, cập nhật định kỳ.
2. **candidate_source_identified**: Đã có nguồn khả thi (VD: GSO, SBV, FRED), cần tích hợp.
3. **source_assessment_needed**: Đang lên kế hoạch nhưng chưa chốt nguồn cung cấp.
4. **planned**: Nằm trong kế hoạch mở rộng dài hạn.
5. **unsupported**: Nằm ngoài phạm vi của sản phẩm.

## Danh mục (Universe)
Được quản lý tập trung tại `src/features/macro/lib/macro-indicator-registry.ts`.
Gồm 5 nhóm chính:
- **Tăng trưởng kinh tế**: GDP_GROWTH (db_backed), INDUSTRIAL_PRODUCTION_GROWTH, RETAIL_SALES_GROWTH...
- **Lạm phát và giá cả**: CPI_YOY (db_backed), CPI_MOM, CORE_INFLATION, PPI...
- **Lãi suất và tiền tệ**: POLICY_RATE, INTERBANK_RATE_OVERNIGHT, CREDIT_GROWTH, M2_GROWTH...
- **Tỷ giá và quốc tế**: USD_VND, DXY, FED_FUNDS_RATE...
- **Thị trường chứng khoán**: VNINDEX_CLOSE, VN30_CLOSE, MARKET_TRADING_VALUE, FOREIGN_NET_FLOW...

## Frontend-Locked Policy (Phase 148B)
Từ Phase 148B, việc mở rộng dữ liệu và đánh giá nguồn được khóa chặt theo scope của Macro Frontend hiện tại:
- `inCurrentFrontend=true`: Các chỉ số đang được trình bày trên giao diện. Chỉ các chỉ số này mới được fetch, import và cập nhật dữ liệu từ nguồn thực tế.
- `inCurrentFrontend=false`: Các chỉ số nằm ngoài scope UI (e.g. `VNINDEX_CLOSE`, `VN30_CLOSE`, `INDUSTRIAL_PRODUCTION_GROWTH`). Hệ thống tuyệt đối không fetch, import hoặc giả lập dữ liệu cho các chỉ số này.

## Source Verification & Automation Level (Phase 148C)
Phase 148C xác minh trạng thái tự động hóa của các chỉ số trong Frontend:
- **machine_readable_api**: Đã có/dễ dàng có API tự động (World Bank cho CPI/GDP, Market Provider cho VNINDEX/thanh khoản/khối ngoại, FRED cho Fed rate).
- **html_table_manual_review**: Nguồn công bố dưới dạng HTML/PDF khó parse (SBV cho tỷ giá/lãi suất, GSO cho xuất nhập khẩu/đầu tư công).
- **blocked**: Các chỉ số có bản quyền (S&P Global PMI).

## Parser Feasibility Strategy (Phase 148D, 148E & 148F)
Đánh giá mức độ ưu tiên và khả năng viết parser tự động cho các nguồn manual-review:
- **Candidate for Phase 148E**: `USD_VND` (SBV HTML), `INTERBANK_RATE_OVERNIGHT` (SBV HTML), `MARKET_TRADING_VALUE` (Market API), `FOREIGN_NET_FLOW` (Market API).
- **Phase 148E Dry Run Result**: `USD_VND` và `INTERBANK_RATE_OVERNIGHT` bị fail-closed (`previewBlocked=true`) do chưa có `sourceUrl` cụ thể trong strategy, chứng minh hệ thống không bịa số liệu hay parse bừa bãi.
- **Phase 148F Source URL Verification**: `USD_VND` và `INTERBANK_RATE_OVERNIGHT` đã được verify URL nguồn thật (từ SBV). Đã sẵn sàng để test parser dry-run tiếp theo. Không extract data nào trong phase này.
- **Manual Review Only**: `CREDIT_GROWTH` (do dữ liệu ẩn trong PDF press release của SBV).
- Lưu ý: Parser feasibility không phải là dữ liệu. Hệ thống vẫn tiếp tục báo "Chưa có dữ liệu" cho đến khi parser hoàn thiện và test pass.

## Stale Data Policy
Mọi indicator đều bị đánh giá độ trễ dữ liệu (`freshness`) theo tần suất kỳ vọng:
- `daily`: stale sau 5 ngày
- `weekly`: stale sau 14 ngày
- `monthly`: stale sau 60 ngày
- `quarterly`: stale sau 150 ngày
- `annual`: stale sau 450 ngày

## Assistant Guardrails
- Assistant được tiêm danh sách các chỉ số db_backed, missingObservationIndicators, staleIndicators và notInFrontendIndicators.
- Nếu được hỏi về một chỉ số không thuộc frontend (`notInFrontendIndicators`), Assistant bắt buộc trả lời: "Hệ thống hiện chưa hỗ trợ chỉ số này trong module Macro hiện tại."
- Nếu được hỏi về một chỉ số thuộc frontend nhưng thiếu dữ liệu, Assistant trả lời: "Hệ thống chưa có dữ liệu quan sát cho chỉ số này."
- Nếu chỉ số `stale`, cảnh báo dữ liệu có thể đã cũ.
- Nghiêm cấm bịa số liệu. Mọi fake data đều không được phép tồn tại (No fake data rule).
