# Sơ đồ Cơ sở dữ liệu Atelier Finance

Tài liệu này giải thích cấu trúc cơ sở dữ liệu của hệ thống Atelier Finance, phục vụ cho báo cáo khóa luận tốt nghiệp (Mục 3.5 và 3.11.5).

Hệ thống được thiết kế theo hướng tập trung vào chất lượng dữ liệu, khả năng phân tích và tính giáo dục dành cho nhà đầu tư cá nhân có mức độ hiểu biết tài chính thấp. Các bảng được tổ chức theo nhóm dữ liệu và quan hệ nghiệp vụ, không rập khuôn theo từng module giao diện.

## 1. Danh sách các nhóm bảng và Vai trò

Hệ thống sử dụng các nhóm bảng chính sau:

### 1.1. Nhóm dữ liệu doanh nghiệp / cổ phiếu (Business / Stock Data)
* **`Company`**: Bảng trung tâm lưu trữ hồ sơ công ty, mã chứng khoán (ticker), sàn giao dịch và phân loại ngành. Đóng vai trò là gốc cho mọi dữ liệu tài chính, giá và phân tích liên quan đến một cổ phiếu cụ thể.

### 1.2. Nhóm dữ liệu giá thị trường (Market Data)
* **`MarketPrice`**: Lưu trữ lịch sử giá cổ phiếu, khối lượng giao dịch và vốn hóa thị trường theo từng phiên (hoặc ngày).
* **`MarketPriceUnitMetadata`**: Lưu trữ siêu dữ liệu về đơn vị tính, trạng thái và cảnh báo chất lượng cho từng trường dữ liệu cụ thể trong `MarketPrice`.

### 1.3. Nhóm dữ liệu báo cáo tài chính (Financial Statements)
* **`FinancialStatement`**: Chứa các số liệu tài chính quan trọng của doanh nghiệp (Doanh thu, Lợi nhuận, Vốn chủ sở hữu, EPS, Nợ vay, v.v.) theo các kỳ báo cáo (quý, năm, ttm). 
* **`FinancialStatementUnitMetadata`**: Quản lý đơn vị tính, trạng thái duyệt và cảnh báo cho từng field tài chính nhằm đảm bảo tính chính xác trước khi đưa vào phân tích.

### 1.4. Nhóm dữ liệu Nguồn, Bằng chứng và Chất lượng (Source, Evidence & Quality)
* **`DataSource`**: Quản lý danh mục các nguồn cung cấp dữ liệu, phương thức tiếp cận và trạng thái pháp lý/bản quyền (License/TOS).
* **`SourceEvidence`**: Lưu trữ các bằng chứng pháp lý (URL tài liệu, URL điều khoản) khẳng định quyền sử dụng dữ liệu hợp lệ (phục vụ học thuật/phi thương mại).
* **`DataQualityReport`**, **`ManualImportSession`**, **`ManualImportRecord`**: Phục vụ việc theo dõi quá trình nhập liệu thủ công, đánh giá chất lượng (thiếu sót, cảnh báo, lỗi) và kiểm toán nguồn gốc dữ liệu phục vụ nghiên cứu.

### 1.5. Nhóm dữ liệu Người dùng, Watchlist và Mô phỏng (User & Simulation)
* **`User`**: Quản lý thông tin định danh của người dùng.
* **`Watchlist`**: Lưu trữ danh sách theo dõi cổ phiếu và tóm tắt luận điểm (thesis summary) của người dùng.
* **`PaperTrade`**: Lưu vết các giao dịch mô phỏng/học tập nhằm giúp người dùng kiểm chứng luận điểm đầu tư mà không gặp rủi ro tài chính thực tế.

### 1.6. Nhóm dữ liệu AI / Context (AI Assistant)
* **`AssistantInteraction`**: Lưu trữ lịch sử tương tác giữa người dùng và AI Assistant. Bao gồm câu hỏi, câu trả lời và đặc biệt là `moduleContext` và `dataQualityContext` nhằm ép AI chỉ giải thích dựa trên dữ liệu thật của hệ thống, tránh việc AI tự bịa số liệu.

### 1.7. Nhóm dữ liệu Vĩ mô, Ngành và Định tính (Macro, Industry & Qualitative Context)
*(Lưu ý: Nhóm dữ liệu này là đề xuất mở rộng kiến trúc dành riêng cho báo cáo, hỗ trợ góc nhìn đa chiều (Top-down) từ Vĩ mô xuống Ngành).*
* **`MacroIndicator`**: Lưu trữ các chỉ số kinh tế vĩ mô (CPI, GDP, Lãi suất, Tỷ giá) theo trục chỉ tiêu - kỳ thời gian - giá trị. Thiết kế này tránh việc gắn cứng dữ liệu vĩ mô vào từng công ty.
* **`IndustryMetric`**: Lưu trữ các chỉ số cấp ngành (Tăng trưởng tín dụng, Nhu cầu thép, v.v.).
* **`ContextNote`**: Bảng dữ liệu định tính, hoạt động theo cơ chế **Đa hình (Polymorphic)** qua `scopeType` (macro/industry/ticker) và `scopeCode`. Bảng này giải quyết bài toán quan trọng trong tài chính là lưu trữ các "nhận định" (ví dụ: "Lãi suất giảm hỗ trợ nhóm vay nợ cao") đi kèm với dữ liệu số, giúp AI hoặc UI có thể giải thích bối cảnh thay vì chỉ hiển thị những con số khô khan.

## 2. Quan hệ chính giữa các bảng

* **Centrality của `Company`**: Bảng `Company` là trái tim của hệ thống. Một công ty có nhiều báo cáo tài chính (`FinancialStatement`), nhiều bản ghi giá (`MarketPrice`), và được tham chiếu nhiều bởi các bảng theo dõi/mô phỏng (`Watchlist`, `PaperTrade`).
* **Nguồn và Dữ liệu (Source to Data)**: `DataSource` có quan hệ 1-N với `FinancialStatement` và `MarketPrice`. Mọi điểm dữ liệu đều phải có nguồn gốc rõ ràng.
* **Metadata Data Quality**: Các bảng `*UnitMetadata` liên kết 1-N tới bảng dữ liệu gốc tương ứng để gắn cờ (flag) từng field nếu phát hiện bất thường.
* **Tương tác AI (AI Interactions)**: `AssistantInteraction` liên kết với `User` và `Company`, đóng vai trò là "biên bản" giữa người dùng và hệ thống về một cổ phiếu.

## 3. Bản đồ ánh xạ Bảng dữ liệu - Module (Giao diện)

Một module giao diện thường tổng hợp từ nhiều bảng thay vì chỉ đọc từ 1 bảng duy nhất:

* **Module Hồ sơ Doanh nghiệp (Company Profile)**: Sử dụng `Company` + `DataSource`.
* **Module Phân tích Báo cáo Tài chính**: Sử dụng `FinancialStatement` + `FinancialStatementUnitMetadata` + `Company`.
* **Module Định giá & Thị trường**: Lấy dữ liệu từ `MarketPrice` + `FinancialStatement` (để tính P/E, P/B kết hợp).
* **Module Trợ lý AI (AI Assistant)**: Ghi log vào `AssistantInteraction`, nhưng đọc context từ `FinancialStatement`, `MarketPrice`, và `DataQualityReport`.
* **Module Quản lý Đầu tư (Portfolio / Paper Trade)**: Sử dụng `Watchlist` + `PaperTrade` + `Company` + `MarketPrice` (để tính hiệu suất).
* **Module Kiểm soát Dữ liệu (Data Governance - Admin)**: Truy xuất `DataSource`, `SourceEvidence`, `ManualImportSession`, `DataQualityReport`.

## 4. Các Guardrails Nghiệp vụ Thể hiện Trong Thiết kế Dữ liệu

Thiết kế Database của hệ thống tuân thủ chặt chẽ các quy tắc tài chính và đạo đức dành cho một hệ thống mang tính giáo dục:

1. **Không can thiệp làm sai lệch dữ liệu thiếu**: Hệ thống **không** tự động thay thế các giá trị null bằng số `0`. `missingFields` được lưu trữ tường minh để hệ thống cảnh báo thay vì tính toán sai lệch.
2. **Xử lý số liệu âm / chia cho 0**:
   - Nếu `EPS` bị thiếu hoặc `<= 0`, hệ thống sẽ từ chối tính và diễn giải chỉ số P/E.
   - Nếu `Equity` (Vốn chủ sở hữu) bị thiếu hoặc `<= 0`, hệ thống từ chối tính ROE, P/B và BVPS.
   - Nếu `sharesOutstanding` bị thiếu hoặc `<= 0`, hệ thống không diễn giải vốn hóa hoặc các chỉ số trên mỗi cổ phần.
3. **Phân biệt Nợ vay và Nợ phải trả**: Bảng `FinancialStatement` sử dụng chính xác trường `totalDebt` (Nợ vay) nhằm tính toán đòn bẩy tài chính, không nhầm lẫn với `totalLiabilities` (Nợ phải trả/Nợ chiếm dụng).
4. **Kiểm soát tính ảo tưởng của AI (Hallucination)**: AI Assistant không có quyền truy cập trực tiếp internet để đoán giá. Cấu trúc `AssistantInteraction` bắt buộc phải tiêm `moduleContext` chứa dữ liệu thật vào payload của prompt.
5. **Không mang tính tư vấn thương mại**: Cấu trúc Database không thiết kế các trường như `targetPrice`, `fairValue`, `upside`, hay `downside` trong cơ sở dữ liệu. Mọi đánh giá thuộc về nhận định cá nhân thông qua `Watchlist` (thesis) hoặc `PaperTrade` (reflection). Dữ liệu nghiên cứu, rà soát được đánh dấu rõ trạng thái thông qua enum `ReadinessStatus` và `QualityStatus`.
