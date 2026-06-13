# RISK_SCORE_LOGIC.md

# Logic chấm điểm rủi ro cho Atelier Finance

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa logic chấm điểm rủi ro trong hệ thống Atelier Finance.

Mục tiêu của Risk Score không phải là khuyến nghị mua/bán/nắm giữ, mà là giúp người dùng:

```txt
Nhìn thấy rủi ro chính của một cổ phiếu.
Hiểu vì sao hệ thống cảnh báo rủi ro đó.
Biết dữ liệu nào còn thiếu.
Biết cần kiểm tra thêm điều gì trước khi đưa cổ phiếu vào watchlist, checklist hoặc mô phỏng.
```

Risk Score trong hệ thống chỉ có vai trò:

```txt
Cảnh báo.
Giải thích.
Gợi ý điểm cần kiểm tra.
Hỗ trợ người dùng tự phản biện.
```

Risk Score không có vai trò:

```txt
Ra quyết định thay người dùng.
Đưa tín hiệu mua.
Đưa tín hiệu bán.
Xếp hạng cổ phiếu tốt/xấu tuyệt đối.
```

---

## 2. Phạm vi áp dụng

File này áp dụng cho các module:

```txt
Risk / Rủi ro minh bạch
Overview / Tổng quan
Financials / Báo cáo tài chính
Valuation / Định giá
Technical / Giá - Thanh khoản - Thời điểm
Watchlist
Checklist
AI Assistant
RAG Knowledge Base
```

Các file liên quan:

```txt
FINANCIAL_DATA_REQUIREMENTS.md
→ Quy định dữ liệu đầu vào cần có.

FINANCIAL_METRICS_LOGIC.md
→ Quy định công thức tính các chỉ số tài chính.

VALUATION_LOGIC.md
→ Quy định logic định giá.

RISK_SCORE_LOGIC.md
→ Quy định logic chấm rủi ro.

AI_EXPLANATION_RULES.md
→ Quy định AI được nói gì và không được nói gì.
```

---

## 3. Nguyên tắc cốt lõi

### 3.1. Risk Score là cảnh báo, không phải kết luận đầu tư

Không được nói:

```txt
Risk thấp nên mua.
Risk cao nên bán.
Risk thấp nghĩa là cổ phiếu an toàn.
Risk cao nghĩa là cổ phiếu xấu tuyệt đối.
```

Chỉ được nói:

```txt
Risk thấp nghĩa là hệ thống hiện chưa phát hiện nhiều cảnh báo lớn từ dữ liệu hiện có.
Risk cao nghĩa là có nhiều điểm cần kiểm tra thêm.
Risk Score không phải khuyến nghị mua/bán.
```

---

### 3.2. Thiếu dữ liệu thì không chấm bừa

Nếu thiếu dữ liệu đầu vào quan trọng:

```txt
score = null
level = unknown
missing_fields = [...]
warning = "Chưa đủ dữ liệu để đánh giá rủi ro này."
```

Không được:

```txt
Tự điền 0.
Tự giả định chỉ số.
Tự chấm rủi ro thấp khi thiếu dữ liệu.
Tự kết luận doanh nghiệp an toàn vì chưa thấy rủi ro.
```

Thiếu dữ liệu không có nghĩa là rủi ro thấp.

Thiếu dữ liệu phải được xem là một loại rủi ro riêng:

```txt
Data Quality Risk
```

---

### 3.3. Không chấm trung bình máy móc

Không được lấy trung bình đơn giản của tất cả risk score trong mọi trường hợp.

Ví dụ:

```txt
Debt Risk = low
Earnings Quality Risk = low
Cash Flow Risk = low
Data Quality Risk = high
```

Không được kết luận Overall Risk = low.

Nếu dữ liệu thiếu nghiêm trọng, Overall Risk phải là:

```txt
unknown
hoặc
high do data quality risk
```

---

### 3.4. Rủi ro phải có lý do rõ ràng

Mỗi risk score phải trả:

```txt
score
level
main_reason
warnings
missing_fields
related_metrics
next_checks
```

Không được chỉ hiển thị một con số như:

```txt
Risk Score: 72/100
```

mà không giải thích.

---

## 4. Chuẩn output chung

Mỗi nhóm rủi ro nên trả về theo format thống nhất.

```ts
type RiskLevel = "low" | "medium" | "high" | "unknown";

type RiskScoreResult = {
  key: string;
  label: string;
  score: number | null;
  level: RiskLevel;
  mainReason: string;
  warnings: string[];
  missingFields: string[];
  relatedMetrics: string[];
  nextChecks: string[];
  beginnerExplanation: string;
  commonMisread: string;
  notFinancialAdvice: true;
};
```

Ví dụ:

```json
{
  "key": "earnings_quality_risk",
  "label": "Rủi ro chất lượng lợi nhuận",
  "score": 78,
  "level": "high",
  "mainReason": "Lợi nhuận sau thuế dương nhưng dòng tiền kinh doanh âm.",
  "warnings": [
    "Lợi nhuận kế toán chưa chuyển hóa tốt thành tiền.",
    "Cần kiểm tra khoản phải thu, tồn kho và dòng tiền kinh doanh."
  ],
  "missingFields": [],
  "relatedMetrics": [
    "net_profit",
    "operating_cash_flow",
    "cfo_to_net_profit"
  ],
  "nextChecks": [
    "Kiểm tra CFO/Net Profit trong nhiều kỳ.",
    "Kiểm tra tăng trưởng khoản phải thu.",
    "Kiểm tra tăng trưởng hàng tồn kho."
  ],
  "beginnerExplanation": "Doanh nghiệp có lợi nhuận trên báo cáo nhưng chưa chắc đã thu được tiền thật.",
  "commonMisread": "Không được kết luận gian lận chỉ vì CFO âm một kỳ.",
  "notFinancialAdvice": true
}
```

---

## 5. Thang điểm tổng quát

Risk Score dùng thang điểm:

```txt
0 - 100
```

Trong đó:

```txt
0   → chưa phát hiện rủi ro lớn từ dữ liệu hiện có
100 → có rất nhiều dấu hiệu cần kiểm tra
```

Quy đổi level:

```txt
0 - 30     → low
31 - 65    → medium
66 - 100   → high
null       → unknown
```

Lưu ý:

```txt
Điểm càng cao không có nghĩa cổ phiếu chắc chắn xấu.
Điểm càng thấp không có nghĩa cổ phiếu chắc chắn an toàn.
Điểm chỉ phản ánh số lượng và mức độ cảnh báo từ dữ liệu hiện có.
```

---

## 6. Các nhóm rủi ro trong hệ thống

Risk Score V1 gồm các nhóm:

```txt
Debt Risk
Earnings Quality Risk
Cash Flow Risk
Valuation Risk
Liquidity Risk
Business Risk
Transparency Risk
Data Quality Risk
Overall Risk
```

Trong V1, các nhóm có thể triển khai trước bằng dữ liệu định lượng:

```txt
Debt Risk
Earnings Quality Risk
Cash Flow Risk
Valuation Risk
Liquidity Risk
Data Quality Risk
Overall Risk
```

Các nhóm cần thêm dữ liệu định tính/RAG:

```txt
Business Risk
Transparency Risk
```

---

## 7. Debt Risk

```txt
Key: debt_risk
Tên tiếng Việt: Rủi ro nợ vay
```

### 7.1. Ý nghĩa

Debt Risk đánh giá áp lực nợ vay và khả năng doanh nghiệp chịu được chi phí lãi vay.

Debt Risk không chỉ nhìn vào số nợ cao hay thấp.

Phải đọc cùng:

```txt
Dòng tiền kinh doanh
Chi phí lãi vay
Khả năng trả lãi
Tiền mặt
Kỳ hạn nợ
Đặc thù ngành
```

---

### 7.2. Dữ liệu đầu vào

```txt
total_debt
short_term_debt
long_term_debt
total_equity
total_assets
cash_and_equivalents
interest_expense
ebit
operating_cash_flow
company_type
```

Chỉ số liên quan:

```txt
debt_to_equity
liabilities_to_assets
net_debt
interest_coverage
cash_to_debt
short_term_debt_ratio
cfo_to_net_profit
```

---

### 7.3. Điều kiện thiếu dữ liệu

Nếu thiếu các field sau:

```txt
total_debt hoặc short_term_debt + long_term_debt
total_equity
interest_expense
ebit
cash_and_equivalents
operating_cash_flow
```

thì không được kết luận chắc chắn Debt Risk thấp.

Nếu thiếu quá nhiều dữ liệu:

```txt
score = null
level = unknown
```

---

### 7.4. Logic chấm rủi ro

#### Low Debt Risk

Có thể là low khi:

```txt
Nợ vay thấp hoặc vừa phải.
Debt/Equity không cao.
Interest Coverage tốt.
Tiền mặt tương đối ổn.
CFO không yếu.
Không có dấu hiệu nợ ngắn hạn quá lớn.
```

Diễn giải:

```txt
Dữ liệu hiện tại chưa cho thấy áp lực nợ vay lớn.
```

---

#### Medium Debt Risk

Có thể là medium khi:

```txt
Debt/Equity bắt đầu cao.
Nợ vay tăng nhanh.
Interest Coverage chưa thật sự thoải mái.
Cash to Debt thấp.
CFO chưa đủ mạnh để hỗ trợ nợ.
Tỷ trọng nợ ngắn hạn cao nhưng chưa nghiêm trọng.
```

Diễn giải:

```txt
Doanh nghiệp có áp lực nợ cần theo dõi thêm.
```

---

#### High Debt Risk

Có thể là high khi:

```txt
Debt/Equity cao.
Interest Coverage thấp.
CFO yếu hoặc âm.
Cash to Debt thấp.
Nợ ngắn hạn chiếm tỷ trọng lớn.
Vốn chủ sở hữu thấp hoặc âm.
```

Diễn giải:

```txt
Doanh nghiệp có dấu hiệu áp lực tài chính đáng chú ý, cần kiểm tra kỹ khả năng trả nợ và dòng tiền.
```

---

### 7.5. Ngưỡng V1 tham khảo

Ngưỡng này chỉ là mặc định cho V1, chưa thay thế phân tích ngành.

```txt
Debt/Equity:
- < 0.5       → điểm rủi ro thấp hơn
- 0.5 - 1.0   → cần theo dõi
- 1.0 - 2.0   → rủi ro trung bình
- > 2.0       → rủi ro cao

Interest Coverage:
- > 5         → tốt
- 2 - 5       → theo dõi
- 1 - 2       → rủi ro
- < 1         → rủi ro cao

Cash to Debt:
- > 0.5       → tốt hơn
- 0.2 - 0.5   → theo dõi
- < 0.2       → rủi ro
```

Cảnh báo:

```txt
Không áp dụng máy móc cho ngân hàng, chứng khoán, bảo hiểm.
```

---

### 7.6. Trường hợp đặc biệt

Với ngân hàng, chứng khoán, bảo hiểm:

```txt
Debt/Equity không được diễn giải như doanh nghiệp phi tài chính.
Current Ratio không dùng máy móc.
Cần logic riêng dựa trên vốn chủ, chất lượng tài sản, nợ xấu, dự phòng, thanh khoản hệ thống nếu có dữ liệu.
```

Nếu chưa có logic riêng:

```txt
level = unknown hoặc not_applicable
warning = "Chỉ số nợ vay này không phù hợp để diễn giải máy móc với doanh nghiệp tài chính."
```

---

## 8. Earnings Quality Risk

```txt
Key: earnings_quality_risk
Tên tiếng Việt: Rủi ro chất lượng lợi nhuận
```

### 8.1. Ý nghĩa

Earnings Quality Risk đánh giá lợi nhuận kế toán có được hỗ trợ bởi dòng tiền và hoạt động kinh doanh thật hay không.

Người mới thường nhầm:

```txt
Lợi nhuận tăng = doanh nghiệp chắc chắn tốt.
```

Thực tế cần kiểm tra:

```txt
Lợi nhuận có đi kèm tiền thật không?
Khoản phải thu có tăng quá nhanh không?
Tồn kho có tăng bất thường không?
Lợi nhuận có đến từ khoản bất thường không?
```

---

### 8.2. Dữ liệu đầu vào

```txt
net_profit
previous_net_profit
operating_cash_flow
previous_operating_cash_flow
revenue
previous_revenue
accounts_receivable
previous_accounts_receivable
inventory
previous_inventory
gross_profit
operating_profit
```

Chỉ số liên quan:

```txt
cfo_to_net_profit
operating_cash_flow_growth
receivables_growth_vs_revenue_growth
inventory_growth_vs_revenue_growth
gross_margin
operating_margin
net_margin
```

---

### 8.3. Logic chấm rủi ro

#### Low Earnings Quality Risk

Có thể là low khi:

```txt
Lợi nhuận dương.
CFO dương.
CFO/Net Profit xấp xỉ hoặc cao hơn 1.
Phải thu không tăng nhanh hơn doanh thu quá nhiều.
Tồn kho không tăng bất thường.
Biên lợi nhuận không suy giảm mạnh.
```

---

#### Medium Earnings Quality Risk

Có thể là medium khi:

```txt
Lợi nhuận dương nhưng CFO thấp hơn lợi nhuận.
CFO/Net Profit dưới 1 trong một số kỳ.
Phải thu tăng nhanh hơn doanh thu.
Tồn kho tăng nhanh hơn doanh thu.
Biên lợi nhuận có dấu hiệu giảm.
```

---

#### High Earnings Quality Risk

Có thể là high khi:

```txt
Lợi nhuận dương nhưng CFO âm.
CFO/Net Profit thấp kéo dài.
Doanh thu tăng nhưng phải thu tăng nhanh hơn nhiều.
Doanh thu tăng nhưng tồn kho tăng nhanh hơn nhiều.
Biên lợi nhuận giảm mạnh trong khi doanh thu tăng.
Lợi nhuận tăng nhưng operating profit không cải thiện.
```

---

### 8.4. Ngưỡng V1 tham khảo

```txt
CFO/Net Profit:
- >= 1.0       → tốt hơn
- 0.6 - 1.0    → theo dõi
- 0 - 0.6      → rủi ro trung bình
- < 0          → rủi ro cao nếu net_profit dương

Receivables Growth - Revenue Growth:
- < 10 điểm %   → bình thường hơn
- 10 - 25 điểm % → theo dõi
- > 25 điểm %   → cảnh báo

Inventory Growth - Revenue Growth:
- < 10 điểm %   → bình thường hơn
- 10 - 25 điểm % → theo dõi
- > 25 điểm %   → cảnh báo
```

---

### 8.5. Cảnh báo bắt buộc

Không được nói:

```txt
CFO âm nghĩa là doanh nghiệp gian lận.
Phải thu tăng nghĩa là doanh nghiệp xấu.
Tồn kho tăng nghĩa là chắc chắn có vấn đề.
```

Nên nói:

```txt
Đây là dấu hiệu cần kiểm tra thêm về chất lượng lợi nhuận, chính sách bán chịu, vòng quay hàng tồn kho và khả năng thu tiền.
```

---

## 9. Cash Flow Risk

```txt
Key: cash_flow_risk
Tên tiếng Việt: Rủi ro dòng tiền
```

### 9.1. Ý nghĩa

Cash Flow Risk đánh giá khả năng doanh nghiệp tạo ra tiền từ hoạt động kinh doanh và sau đầu tư.

Lợi nhuận kế toán không đồng nghĩa tiền thật.

---

### 9.2. Dữ liệu đầu vào

```txt
operating_cash_flow
previous_operating_cash_flow
free_cash_flow
capital_expenditure
revenue
net_profit
```

Chỉ số liên quan:

```txt
operating_cash_flow
operating_cash_flow_growth
operating_cash_flow_margin
free_cash_flow
fcf_margin
fcf_to_net_profit
capex_to_revenue
cfo_to_net_profit
```

---

### 9.3. Logic chấm rủi ro

#### Low Cash Flow Risk

```txt
CFO dương.
CFO/Net Profit ổn.
FCF dương hoặc âm có lý do hợp lý do đầu tư mở rộng.
Operating Cash Flow Margin ổn định.
```

---

#### Medium Cash Flow Risk

```txt
CFO dương nhưng thấp.
FCF âm do Capex cao.
Operating Cash Flow Margin giảm.
CFO biến động mạnh giữa các kỳ.
```

---

#### High Cash Flow Risk

```txt
CFO âm trong khi lợi nhuận dương.
FCF âm kéo dài.
CFO/Net Profit thấp kéo dài.
Dòng tiền không đủ hỗ trợ trả nợ hoặc đầu tư.
```

---

### 9.4. Cảnh báo bắt buộc

FCF âm không tự động xấu.

Cần phân biệt:

```txt
FCF âm vì doanh nghiệp đầu tư mở rộng.
FCF âm vì CFO yếu.
FCF âm vì vốn lưu động xấu đi.
FCF âm vì doanh nghiệp không tạo được tiền.
```

---

## 10. Valuation Risk

```txt
Key: valuation_risk
Tên tiếng Việt: Rủi ro định giá
```

### 10.1. Ý nghĩa

Valuation Risk đánh giá rủi ro người dùng hiểu sai hoặc tin quá mức vào kết quả định giá.

Nó không chỉ xem cổ phiếu đắt hay rẻ.

Valuation Risk phải kiểm tra:

```txt
P/E có dùng được không?
EPS có dương và bền vững không?
P/B có ý nghĩa với loại doanh nghiệp này không?
Dữ liệu so sánh ngành/lịch sử có đủ không?
Kết quả định giá có confidence thấp không?
Margin of Safety có đáng tin không?
```

---

### 10.2. Dữ liệu đầu vào

```txt
close_price
eps
bvps
pe_ratio
pb_ratio
ps_ratio
ev_ebitda
roe
net_profit
operating_cash_flow
cfo_to_net_profit
valuation_readiness
valuation_confidence
industry_pe
industry_pb
historical_pe
historical_pb
fair_value_low
fair_value_base
fair_value_high
margin_of_safety
```

---

### 10.3. Logic chấm rủi ro

#### Low Valuation Risk

```txt
Phương pháp định giá phù hợp.
EPS dương.
Dòng tiền không quá lệch lợi nhuận.
Có dữ liệu so sánh hợp lý.
Valuation Confidence ít nhất medium.
Không có cảnh báo lớn về lợi nhuận hoặc dữ liệu.
```

---

#### Medium Valuation Risk

```txt
Có thể định giá sơ bộ nhưng thiếu dữ liệu ngành/lịch sử.
P/E hoặc P/B cho kết quả trái chiều.
CFO yếu làm giảm độ tin cậy của P/E.
Confidence medium hoặc low.
```

---

#### High Valuation Risk

```txt
EPS âm nhưng vẫn cố dùng P/E.
P/E thấp nhưng CFO yếu hoặc lợi nhuận không bền vững.
P/B thấp nhưng ROE thấp hoặc vốn chủ có vấn đề.
DCF thiếu giả định nhưng vẫn ra fair value.
Valuation Confidence low nhưng vẫn hiển thị Margin of Safety như tín hiệu mạnh.
```

---

### 10.4. Cảnh báo bắt buộc

Không được nói:

```txt
P/E thấp là rẻ.
P/B thấp là an toàn.
Margin of Safety cao là nên mua.
Fair value cao hơn giá hiện tại là tín hiệu mua.
```

Nên nói:

```txt
Định giá đang có dấu hiệu hấp dẫn/cao hơn tham chiếu theo dữ liệu hiện tại, nhưng cần kiểm tra thêm chất lượng lợi nhuận, dòng tiền, rủi ro ngành và độ tin cậy dữ liệu.
```

---

## 11. Liquidity Risk

```txt
Key: liquidity_risk
Tên tiếng Việt: Rủi ro thanh khoản giao dịch
```

### 11.1. Ý nghĩa

Liquidity Risk đánh giá khả năng mua/bán cổ phiếu mà không bị ảnh hưởng quá lớn bởi thanh khoản thấp.

Thanh khoản thấp không có nghĩa doanh nghiệp xấu.

Nhưng thanh khoản thấp làm tăng rủi ro:

```txt
Khó mua đủ khối lượng.
Khó bán khi cần thoát.
Spread rộng.
Giá dễ biến động mạnh.
Dễ bị nhiễu bởi giao dịch nhỏ.
```

---

### 11.2. Dữ liệu đầu vào

```txt
close_price
volume
avg_volume_20d
trading_value
avg_trading_value_20d
market_cap
free_float nếu có
```

---

### 11.3. Logic chấm rủi ro

#### Low Liquidity Risk

```txt
Giá trị giao dịch trung bình đủ lớn.
Volume ổn định.
Không có dấu hiệu thanh khoản cạn kiệt.
```

---

#### Medium Liquidity Risk

```txt
Thanh khoản vừa phải.
Volume biến động mạnh.
Giá trị giao dịch chưa đủ lớn cho một số nhà đầu tư.
```

---

#### High Liquidity Risk

```txt
Avg Trading Value 20D thấp.
Volume thấp.
Giao dịch thưa.
Giá biến động mạnh với khối lượng nhỏ.
```

---

### 11.4. Ngưỡng V1 tham khảo

```txt
Avg Trading Value 20D:
- > 5 tỷ VND/phiên      → thanh khoản tốt hơn
- 1 - 5 tỷ VND/phiên    → cần theo dõi
- < 1 tỷ VND/phiên      → rủi ro thanh khoản cao
```

Cảnh báo:

```txt
Ngưỡng này chỉ phục vụ V1 và cần điều chỉnh theo quy mô người dùng, thị trường và loại cổ phiếu.
```

---

## 12. Business Risk

```txt
Key: business_risk
Tên tiếng Việt: Rủi ro mô hình kinh doanh
Trạng thái V1: Defined, dùng dữ liệu định tính hoặc RAG nếu có
```

### 12.1. Ý nghĩa

Business Risk đánh giá rủi ro đến từ mô hình kinh doanh, ngành, chu kỳ và lợi thế cạnh tranh.

Business Risk không chỉ dựa trên báo cáo tài chính.

---

### 12.2. Dữ liệu đầu vào

```txt
industry
business_model
revenue_segments
customer_concentration
supplier_concentration
competitive_position
cyclicality
regulatory_risk
macro_sensitivity
```

Nếu chưa có dữ liệu thật, Business Risk có thể ở trạng thái:

```txt
unknown
```

---

### 12.3. Các dấu hiệu cần cảnh báo

```txt
Doanh nghiệp phụ thuộc vào một nhóm khách hàng lớn.
Doanh nghiệp phụ thuộc vào một nhà cung cấp lớn.
Ngành có tính chu kỳ cao.
Biên lợi nhuận bị cạnh tranh làm giảm.
Doanh nghiệp phụ thuộc mạnh vào chính sách.
Mô hình kinh doanh khó hiểu hoặc thiếu minh bạch.
```

---

### 12.4. Không được kết luận

Không được nói:

```txt
Ngành chu kỳ là xấu.
Doanh nghiệp phụ thuộc vĩ mô là không nên đầu tư.
```

Nên nói:

```txt
Doanh nghiệp có độ nhạy cao với chu kỳ/ngành/chính sách, cần kiểm tra thêm bối cảnh vĩ mô và ngành.
```

---

## 13. Transparency Risk

```txt
Key: transparency_risk
Tên tiếng Việt: Rủi ro minh bạch
Trạng thái V1: Defined, dùng dữ liệu định tính hoặc RAG nếu có
```

### 13.1. Ý nghĩa

Transparency Risk đánh giá rủi ro đến từ chất lượng công bố thông tin, quản trị, giao dịch bất thường hoặc dữ liệu thiếu rõ ràng.

---

### 13.2. Dữ liệu đầu vào

```txt
source_name
source_url
audited_report_available
financial_statement_notes_available
management_explanation
related_party_transactions
audit_opinion
restatement_history
late_disclosure_events
governance_events
```

Nếu chưa có dữ liệu:

```txt
level = unknown
```

Không được tự chấm thấp chỉ vì chưa có thông tin xấu.

---

### 13.3. Dấu hiệu cảnh báo

```txt
Thiếu nguồn dữ liệu.
Thiếu báo cáo kiểm toán.
Có ý kiến kiểm toán ngoại trừ.
Có điều chỉnh hồi tố lớn.
Công bố thông tin chậm.
Giao dịch với bên liên quan nhiều nhưng thiếu thuyết minh.
Số liệu thay đổi nhưng không có giải thích rõ.
```

---

### 13.4. Cảnh báo bắt buộc

Không được nói:

```txt
Thiếu dữ liệu nghĩa là doanh nghiệp gian lận.
```

Nên nói:

```txt
Thiếu dữ liệu làm giảm độ tin cậy của phân tích và cần kiểm tra nguồn công bố chính thức.
```

---

## 14. Data Quality Risk

```txt
Key: data_quality_risk
Tên tiếng Việt: Rủi ro chất lượng dữ liệu
```

### 14.1. Ý nghĩa

Data Quality Risk đánh giá độ đầy đủ, độ mới và độ tin cậy của dữ liệu đầu vào.

Đây là nhóm rủi ro rất quan trọng vì hệ thống dùng dữ liệu để tính chỉ số, định giá, risk score và AI explanation.

---

### 14.2. Dữ liệu đầu vào

```txt
ticker
company_name
industry
company_type
revenue
net_profit
total_assets
total_liabilities
total_equity
operating_cash_flow
close_price
volume
source_name
source_url
collected_at
last_updated
```

---

### 14.3. Core fields V1

Core fields tối thiểu:

```txt
revenue
net_profit
total_assets
total_liabilities
total_equity
operating_cash_flow
close_price
volume
source_name
collected_at
```

---

### 14.4. Logic chấm rủi ro

#### Low Data Quality Risk

```txt
Đủ phần lớn core fields.
Có nguồn dữ liệu rõ ràng.
Dữ liệu không quá cũ.
Không phát hiện thiếu field nghiêm trọng.
```

---

#### Medium Data Quality Risk

```txt
Thiếu một số field nhưng vẫn phân tích sơ bộ được.
Thiếu source_url nhưng có source_name.
Dữ liệu hơi cũ.
Thiếu một số dữ liệu phụ như industry benchmark hoặc historical valuation.
```

---

#### High Data Quality Risk

```txt
Thiếu nhiều core fields.
Thiếu source.
Dữ liệu quá cũ.
Dữ liệu không đủ để tính chỉ số chính.
Dữ liệu không đủ để định giá.
Dữ liệu không đủ để AI giải thích có trách nhiệm.
```

---

### 14.5. Quy tắc dữ liệu cũ

Mặc định V1:

```txt
Nếu collected_at cũ hơn 180 ngày → stale warning.
```

Cảnh báo:

```txt
Ngưỡng 180 ngày chỉ là mặc định kỹ thuật, có thể cần điều chỉnh theo loại dữ liệu.
Dữ liệu giá cần cập nhật thường xuyên hơn dữ liệu BCTC.
Dữ liệu BCTC cần cập nhật theo quý/năm.
```

---

## 15. Overall Risk Score

```txt
Key: overall_risk_score
Tên tiếng Việt: Rủi ro tổng hợp
```

### 15.1. Ý nghĩa

Overall Risk Score tổng hợp các nhóm rủi ro để giúp người dùng nhìn nhanh.

Nó không thay thế từng nhóm rủi ro chi tiết.

---

### 15.2. Nhóm đầu vào

```txt
debt_risk
earnings_quality_risk
cash_flow_risk
valuation_risk
liquidity_risk
business_risk
transparency_risk
data_quality_risk
```

---

### 15.3. Trọng số V1 gợi ý

Với dữ liệu định lượng V1:

```txt
Debt Risk: 15%
Earnings Quality Risk: 20%
Cash Flow Risk: 20%
Valuation Risk: 15%
Liquidity Risk: 10%
Data Quality Risk: 20%
```

Nếu có dữ liệu định tính đầy đủ:

```txt
Business Risk: 10%
Transparency Risk: 10%
```

Khi thêm Business Risk và Transparency Risk, cần giảm lại trọng số các nhóm khác để tổng bằng 100%.

---

### 15.4. Quy tắc chặn kết luận sai

Nếu Data Quality Risk high:

```txt
Overall Risk không được là low.
```

Nếu quá nhiều nhóm risk unknown:

```txt
Overall Risk = unknown.
```

Nếu Earnings Quality Risk high và Cash Flow Risk high:

```txt
Overall Risk ít nhất là medium, thường là high.
```

Nếu Debt Risk high và Cash Flow Risk high:

```txt
Overall Risk có thể high dù các nhóm khác thấp.
```

Nếu Valuation Risk high do thiếu dữ liệu:

```txt
Không được nói cổ phiếu rủi ro cao tuyệt đối,
phải nói rủi ro định giá cao do thiếu dữ liệu/độ tin cậy thấp.
```

---

### 15.5. Output mẫu

```json
{
  "key": "overall_risk_score",
  "label": "Rủi ro tổng hợp",
  "score": 72,
  "level": "high",
  "mainReason": "Rủi ro tổng hợp cao do chất lượng lợi nhuận yếu, dòng tiền chưa hỗ trợ lợi nhuận và dữ liệu định giá còn thiếu.",
  "warnings": [
    "Lợi nhuận dương nhưng CFO âm.",
    "Thiếu dữ liệu so sánh ngành cho định giá.",
    "Dữ liệu nguồn chưa đầy đủ."
  ],
  "missingFields": [
    "industry_pe",
    "source_url"
  ],
  "relatedMetrics": [
    "cfo_to_net_profit",
    "pe_ratio",
    "data_quality_status"
  ],
  "nextChecks": [
    "Kiểm tra CFO/Net Profit trong nhiều kỳ.",
    "Kiểm tra khoản phải thu và tồn kho.",
    "Kiểm tra nguồn dữ liệu chính thức.",
    "Không dùng P/E đơn lẻ để kết luận định giá."
  ],
  "beginnerExplanation": "Rủi ro tổng hợp cao nghĩa là có nhiều điểm cần kiểm tra thêm, không có nghĩa cổ phiếu chắc chắn xấu.",
  "commonMisread": "Không được hiểu risk cao là tín hiệu bán.",
  "notFinancialAdvice": true
}
```

---

## 16. Mapping Risk Score theo module

### 16.1. Overview

Overview chỉ hiển thị:

```txt
overall_risk_level
main_risk_reason
top_3_warnings
next_check
data_quality_status
```

Không hiển thị toàn bộ bảng rủi ro chi tiết.

---

### 16.2. Risk Module

Risk Module hiển thị đầy đủ:

```txt
Debt Risk
Earnings Quality Risk
Cash Flow Risk
Valuation Risk
Liquidity Risk
Business Risk nếu có
Transparency Risk nếu có
Data Quality Risk
Overall Risk
```

Mỗi nhóm phải có:

```txt
Điểm số
Mức rủi ro
Lý do chính
Cảnh báo
Dữ liệu thiếu
Bước kiểm tra tiếp theo
```

---

### 16.3. Financials Module

Financials dùng Risk Score để cảnh báo:

```txt
CFO yếu
Nợ cao
Biên lợi nhuận giảm
Vốn lưu động xấu đi
Dữ liệu thiếu
```

Không hiển thị risk tổng hợp quá nổi bật để tránh làm loãng module báo cáo tài chính.

---

### 16.4. Valuation Module

Valuation dùng:

```txt
valuation_risk
earnings_quality_risk
cash_flow_risk
data_quality_risk
```

Mục tiêu:

```txt
Ngăn người dùng hiểu nhầm P/E thấp là rẻ.
Ngăn người dùng tin vào fair value khi confidence thấp.
Ngăn người dùng dùng Margin of Safety khi dữ liệu yếu.
```

---

### 16.5. Watchlist

Watchlist dùng:

```txt
overall_risk_level
main_warning
last_risk_update
missing_fields
next_check
```

Mục tiêu:

```txt
Giúp người dùng biết mã nào cần kiểm tra lại.
```

---

### 16.6. AI Assistant

AI dùng Risk Score để giải thích:

```txt
Vì sao hệ thống cảnh báo risk này?
Dữ liệu nào tạo ra cảnh báo?
Cần kiểm tra thêm gì?
Dữ liệu nào còn thiếu?
```

AI không dùng Risk Score để khuyến nghị mua/bán.

---

## 17. AI Explanation Rules cho Risk Score

AI được phép nói:

```txt
Dữ liệu hiện tại cho thấy rủi ro chính nằm ở...
Hệ thống cảnh báo vì...
Điểm cần kiểm tra thêm là...
Chưa đủ dữ liệu để kết luận phần...
Rủi ro này không đồng nghĩa cổ phiếu chắc chắn xấu.
Đây không phải khuyến nghị mua/bán.
```

AI không được nói:

```txt
Nên mua vì risk thấp.
Nên bán vì risk cao.
Cổ phiếu này an toàn.
Cổ phiếu này xấu chắc chắn.
Rủi ro thấp nên không cần kiểm tra thêm.
Risk score là tín hiệu giao dịch.
```

---

## 18. Response template của AI khi giải thích rủi ro

AI nên trả lời theo cấu trúc:

```txt
1. Rủi ro nào đang nổi bật?
2. Dữ liệu nào tạo ra cảnh báo?
3. Ý nghĩa dễ hiểu là gì?
4. Có thể hiểu nhầm gì?
5. Dữ liệu nào còn thiếu?
6. Người dùng nên kiểm tra thêm gì?
7. Nhắc rằng đây không phải khuyến nghị mua/bán.
```

Ví dụ:

```txt
Rủi ro nổi bật hiện tại là chất lượng lợi nhuận.
Nguyên nhân là lợi nhuận sau thuế dương nhưng dòng tiền kinh doanh âm.
Điều này có nghĩa lợi nhuận kế toán chưa chuyển hóa tốt thành tiền thật.
Tuy nhiên, không nên kết luận gian lận chỉ từ một kỳ dữ liệu.
Bạn cần kiểm tra thêm khoản phải thu, hàng tồn kho và CFO/Net Profit trong nhiều kỳ.
Đây không phải khuyến nghị mua/bán.
```

---

## 19. Missing Data Rules

### 19.1. Thiếu dữ liệu tài chính lõi

Nếu thiếu:

```txt
revenue
net_profit
total_assets
total_equity
operating_cash_flow
```

thì:

```txt
financial_risk không được low
earnings_quality_risk có thể unknown
cash_flow_risk có thể unknown
data_quality_risk tăng
overall_risk không được low
```

---

### 19.2. Thiếu dữ liệu giá/thanh khoản

Nếu thiếu:

```txt
close_price
volume
trading_value
avg_trading_value_20d
```

thì:

```txt
liquidity_risk = unknown
valuation_risk có thể unknown
data_quality_risk tăng
```

---

### 19.3. Thiếu dữ liệu định giá

Nếu thiếu:

```txt
eps
bvps
market_cap
industry_pe
historical_pe
```

thì:

```txt
valuation_risk không được low nếu kết quả định giá đang được hiển thị.
valuation_confidence giảm.
```

---

### 19.4. Thiếu nguồn dữ liệu

Nếu thiếu:

```txt
source_name
source_url
collected_at
```

thì:

```txt
data_quality_risk tăng.
AI phải nhắc rằng nguồn dữ liệu chưa rõ.
```

---

## 20. Test cases bắt buộc

### Test 1: Lợi nhuận dương nhưng CFO âm

Input:

```json
{
  "net_profit": 2500,
  "operating_cash_flow": -800
}
```

Expected:

```json
{
  "key": "earnings_quality_risk",
  "level": "high",
  "warning": "Lợi nhuận dương nhưng dòng tiền kinh doanh âm, cần kiểm tra chất lượng lợi nhuận."
}
```

---

### Test 2: EPS âm nhưng vẫn có P/E input

Input:

```json
{
  "eps": -1200,
  "close_price": 50000
}
```

Expected:

```json
{
  "key": "valuation_risk",
  "level": "medium",
  "warning": "EPS âm nên không thể diễn giải P/E theo cách thông thường."
}
```

---

### Test 3: P/E thấp nhưng CFO yếu

Input:

```json
{
  "pe_ratio": 7,
  "cfo_to_net_profit": 0.25
}
```

Expected:

```json
{
  "key": "valuation_risk",
  "level": "medium",
  "warning": "P/E thấp cần được kiểm tra thêm vì dòng tiền kinh doanh chưa hỗ trợ tốt cho lợi nhuận."
}
```

---

### Test 4: P/B thấp nhưng ROE thấp

Input:

```json
{
  "pb_ratio": 0.8,
  "roe": 0.03
}
```

Expected:

```json
{
  "key": "valuation_risk",
  "level": "medium",
  "warning": "P/B thấp chưa chắc là rẻ nếu ROE thấp."
}
```

---

### Test 5: Nợ cao và khả năng trả lãi thấp

Input:

```json
{
  "debt_to_equity": 2.3,
  "interest_coverage": 0.8
}
```

Expected:

```json
{
  "key": "debt_risk",
  "level": "high",
  "warning": "Nợ vay cao và khả năng trả lãi thấp, cần kiểm tra áp lực tài chính."
}
```

---

### Test 6: Thiếu CFO

Input:

```json
{
  "net_profit": 3000,
  "operating_cash_flow": null
}
```

Expected:

```json
{
  "key": "earnings_quality_risk",
  "level": "unknown",
  "missing_fields": ["operating_cash_flow"],
  "warning": "Chưa đủ dữ liệu dòng tiền kinh doanh để đánh giá chất lượng lợi nhuận."
}
```

---

### Test 7: Thanh khoản thấp

Input:

```json
{
  "avg_trading_value_20d": 500000000
}
```

Expected:

```json
{
  "key": "liquidity_risk",
  "level": "high",
  "warning": "Thanh khoản giao dịch thấp, có thể gây khó khăn khi mua/bán."
}
```

---

### Test 8: Thiếu nguồn dữ liệu

Input:

```json
{
  "source_name": null,
  "source_url": null,
  "collected_at": null
}
```

Expected:

```json
{
  "key": "data_quality_risk",
  "level": "high",
  "warning": "Thiếu nguồn dữ liệu và thời điểm cập nhật, độ tin cậy phân tích thấp."
}
```

---

### Test 9: Data Quality Risk high nhưng các risk khác low

Input:

```json
{
  "debt_risk": "low",
  "earnings_quality_risk": "low",
  "cash_flow_risk": "low",
  "data_quality_risk": "high"
}
```

Expected:

```json
{
  "key": "overall_risk_score",
  "level": "medium",
  "warning": "Dữ liệu thiếu hoặc kém tin cậy nên rủi ro tổng hợp không được xem là thấp."
}
```

---

### Test 10: Ngân hàng dùng Current Ratio

Input:

```json
{
  "company_type": "bank",
  "current_assets": 10000,
  "current_liabilities": 8000
}
```

Expected:

```json
{
  "key": "debt_risk",
  "level": "unknown",
  "warning": "Current Ratio không phù hợp để diễn giải máy móc với ngân hàng."
}
```

---

## 21. Definition of Done

File `RISK_SCORE_LOGIC.md` được coi là hoàn thành khi:

```txt
Có đầy đủ nhóm risk chính.
Có logic input/output rõ ràng.
Có ngưỡng V1 tham khảo.
Có missing data rules.
Có quy tắc không khuyến nghị mua/bán.
Có quy tắc không chấm thấp khi thiếu dữ liệu.
Có overall risk logic.
Có mapping sang module Overview, Financials, Valuation, Risk, Watchlist, AI.
Có AI explanation rules.
Có test cases.
Có thể làm nền cho code trong src/lib/financial-logic/risk.
```

---

## 22. Kết luận

Risk Score trong Atelier Finance phải giúp người dùng hiểu:

```txt
Rủi ro nằm ở đâu?
Vì sao có cảnh báo?
Dữ liệu nào tạo ra cảnh báo?
Dữ liệu nào còn thiếu?
Cần kiểm tra thêm gì?
```

Nguyên tắc cuối cùng:

```txt
Risk Score là công cụ cảnh báo, không phải tín hiệu giao dịch.
Risk thấp không có nghĩa là an toàn tuyệt đối.
Risk cao không có nghĩa là chắc chắn xấu.
Thiếu dữ liệu không được chấm bừa là thấp.
Không đưa khuyến nghị mua/bán.
```
