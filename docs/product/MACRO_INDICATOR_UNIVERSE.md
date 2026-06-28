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
