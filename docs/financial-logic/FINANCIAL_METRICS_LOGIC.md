# FINANCIAL_METRICS_LOGIC.md

# Logic tính chỉ số tài chính cho Atelier Finance

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa logic tính toán, cách diễn giải, cách cảnh báo và cách trả output cho các chỉ số tài chính cốt lõi trong hệ thống Atelier Finance.

File này không thay thế `FINANCIAL_DATA_REQUIREMENTS.md`.

Vai trò của từng file:

```txt
FINANCIAL_DATA_REQUIREMENTS.md
→ Trả lời: Cần dữ liệu đầu vào nào?

FINANCIAL_METRICS_LOGIC.md
→ Trả lời: Khi có dữ liệu rồi thì tính như thế nào, diễn giải ra sao, thiếu dữ liệu thì xử lý thế nào?

API_CONTRACT_REVIEW.md
→ Trả lời: Backend/API cần trả dữ liệu theo format nào để frontend, AI và các module dùng được?
```

Mục tiêu của file này là giúp:

1. Người 1 chốt công thức tài chính, cách xử lý thiếu dữ liệu và cách diễn giải.
2. Người 2 biết dữ liệu nào là bắt buộc để tính được chỉ số.
3. Người 3 biết backend/API hoặc calculation functions phải trả output theo format nào.
4. Frontend hiển thị chỉ số kèm ý nghĩa, cảnh báo và trạng thái dữ liệu.
5. AI Assistant giải thích chỉ số đúng ngữ cảnh, không bịa số liệu và không đưa khuyến nghị mua/bán.

Nguyên tắc quan trọng:

```txt
Dữ liệu thiếu → trả null.
Công thức thiếu đầu vào → không tính.
Chỉ số thiếu ngữ cảnh → không kết luận.
AI thiếu context → nói chưa đủ dữ liệu.
Risk score → chỉ cảnh báo, không khuyến nghị mua/bán.
```

---

## 2. Phạm vi áp dụng trong hệ thống

File này áp dụng trực tiếp cho các module sau:

### 2.1. Module Tổng quan

Module Tổng quan chỉ dùng chỉ số tài chính ở mức tóm tắt.

Không hiển thị quá nhiều chỉ số.

Mục tiêu:

```txt
Giúp người dùng biết cổ phiếu đang có sức khỏe tài chính sơ bộ thế nào,
điểm nào cần đọc tiếp,
module nào còn thiếu dữ liệu,
và bước phân tích tiếp theo là gì.
```

Các chỉ số nên dùng ở Tổng quan:

```txt
revenue_growth
net_profit_growth
roe
debt_to_equity
cfo_to_net_profit
pe_ratio
pb_ratio
overall_financial_health_status
overall_risk_level
data_quality_status
```

Tổng quan không được kết luận:

```txt
Doanh nghiệp này tốt.
Cổ phiếu này rẻ.
Cổ phiếu này nên mua.
```

Tổng quan chỉ nên nói:

```txt
Dữ liệu hiện tại cho thấy...
Điểm cần kiểm tra tiếp là...
Chưa đủ dữ liệu để kết luận phần...
```

---

### 2.2. Module Báo cáo tài chính

Module Báo cáo tài chính là nơi dùng nhiều chỉ số nhất.

Mục tiêu:

```txt
Kiểm tra sức khỏe tài chính,
chất lượng lợi nhuận,
dòng tiền,
nợ vay,
biên lợi nhuận,
vốn lưu động
và khả năng chuyển sang định giá.
```

Các nhóm chỉ số chính:

```txt
Nhóm tăng trưởng
Nhóm sinh lời
Nhóm đòn bẩy và thanh khoản
Nhóm dòng tiền
Nhóm chất lượng lợi nhuận
Nhóm vốn lưu động
```

Module này phải giúp người dùng trả lời:

```txt
Doanh thu và lợi nhuận có tăng trưởng bền vững không?
Biên lợi nhuận có ổn định không?
Lợi nhuận có chuyển hóa thành tiền không?
Doanh nghiệp có dùng nợ quá mức không?
Tồn kho và phải thu có gây áp lực dòng tiền không?
Đã đủ điều kiện để sang định giá chưa?
```

---

### 2.3. Module Định giá

Module Định giá dùng một phần chỉ số tài chính để tạo đầu vào định giá.

Mục tiêu:

```txt
Giúp người dùng hiểu định giá là vùng ước lượng,
không phải con số chắc chắn,
và không phải khuyến nghị mua/bán.
```

Các chỉ số liên quan:

```txt
eps
bvps
pe_ratio
pb_ratio
ps_ratio
earnings_yield
market_cap
enterprise_value
ev_ebitda nếu đủ dữ liệu
net_profit_growth
roe
cfo_to_net_profit
```

Định giá phải kiểm tra trước:

```txt
EPS có dương không?
Lợi nhuận có bất thường không?
Dòng tiền có hỗ trợ lợi nhuận không?
ROE có bị bóp méo bởi nợ vay không?
Có dữ liệu ngành hoặc lịch sử để so sánh không?
```

Không được diễn giải:

```txt
P/E thấp nghĩa là cổ phiếu rẻ.
P/B thấp nghĩa là cổ phiếu an toàn.
Định giá thấp hơn giá thị trường nghĩa là nên mua.
```

---

### 2.4. Module Rủi ro và minh bạch

Module Rủi ro dùng chỉ số tài chính để tạo cảnh báo.

Mục tiêu:

```txt
Giúp người dùng biết điều gì có thể sai trước khi đưa cổ phiếu vào watchlist,
checklist hoặc mô phỏng.
```

Các nhóm rủi ro liên quan:

```txt
financial_risk
debt_risk
earnings_quality_risk
cash_flow_risk
valuation_risk
liquidity_risk
data_quality_risk
```

Risk score không được hiểu là kết luận mua/bán.

Risk score chỉ có nghĩa:

```txt
Điểm càng cao → càng nhiều dấu hiệu cần kiểm tra thêm từ dữ liệu hiện có.
```

---

### 2.5. Module Giá - Thanh khoản - Thời điểm

Module này dùng dữ liệu giá và thanh khoản.

Mục tiêu:

```txt
Quan sát hành vi giá, thanh khoản và thời điểm,
nhưng không thay thế phân tích cơ bản.
```

Các chỉ số liên quan:

```txt
close_price
price_change_pct
volume
trading_value
avg_volume_20d
avg_trading_value_20d
market_cap
liquidity_status
```

Không được diễn giải:

```txt
Giá tăng là tín hiệu mua.
Volume tăng là chắc chắn dòng tiền vào.
Giá giảm là doanh nghiệp xấu.
```

Nên diễn giải:

```txt
Giá và thanh khoản chỉ phản ánh hành vi thị trường trong một giai đoạn.
Cần kết hợp với nền tảng doanh nghiệp, định giá và rủi ro.
```

---

### 2.6. Module Watchlist

Watchlist không chỉ lưu mã cổ phiếu.

Watchlist cần lưu trạng thái phân tích.

Các chỉ số hoặc trạng thái nên dùng:

```txt
financial_health_status
valuation_status
overall_risk_level
data_quality_status
missing_fields
next_step_suggestion
last_reviewed_at
```

Watchlist nên trả lời:

```txt
Mã này đang thiếu dữ liệu gì?
Đã phân tích đến bước nào?
Điểm cần kiểm tra tiếp là gì?
Có cảnh báo nào mới không?
```

---

### 2.7. AI Assistant

AI Assistant sử dụng các chỉ số đã tính để giải thích.

AI không tự tính nếu context chưa có dữ liệu đầu vào.

AI không bịa số liệu.

AI không đưa khuyến nghị mua/bán.

AI phải phân biệt:

```txt
Dữ liệu
Diễn giải
Cảnh báo
Điểm cần kiểm tra thêm
```

---

## 3. Chuẩn output chung cho mọi chỉ số

Mỗi chỉ số tài chính nên trả về theo format thống nhất.

```ts
type MetricLevel =
  | "good"
  | "neutral"
  | "watch"
  | "risk"
  | "danger"
  | "not_applicable"
  | "unknown";

type DataQuality =
  | "sufficient"
  | "partial"
  | "missing"
  | "low_confidence"
  | "not_applicable";

type FinancialMetricResult = {
  key: string;
  label: string;
  value: number | null;
  display_value: string;
  unit: "%" | "x" | "vnd" | "billion_vnd" | "days" | "none";
  period: string;
  period_type: "annual" | "quarter" | "ttm";
  level: MetricLevel;
  data_quality: DataQuality;
  formula: string;
  input_fields: string[];
  missing_fields: string[];
  explanation: string;
  warning: string | null;
  beginner_interpretation: string;
  common_misread: string;
  module_usage: string[];
  source?: {
    source_name: string | null;
    source_url?: string | null;
    last_updated?: string | null;
  };
};
```

Ví dụ output cho ROE:

```json
{
  "key": "roe",
  "label": "ROE",
  "value": 0.18,
  "display_value": "18%",
  "unit": "%",
  "period": "2024",
  "period_type": "annual",
  "level": "good",
  "data_quality": "sufficient",
  "formula": "net_profit / average_equity",
  "input_fields": ["net_profit", "total_equity_beginning", "total_equity_ending"],
  "missing_fields": [],
  "explanation": "ROE cho biết doanh nghiệp tạo ra bao nhiêu lợi nhuận trên vốn chủ sở hữu.",
  "warning": "ROE cao cần được kiểm tra cùng nợ vay, vốn chủ và dòng tiền.",
  "beginner_interpretation": "ROE cao là điểm tích cực, nhưng chưa đủ để kết luận doanh nghiệp tốt.",
  "common_misread": "Không được hiểu ROE cao là doanh nghiệp chắc chắn tốt.",
  "module_usage": ["overview", "financials", "valuation", "risk", "ai"]
}
```

---

## 4. Quy tắc xử lý dữ liệu thiếu

### 4.1. Không dùng 0 thay cho dữ liệu thiếu

Nếu dữ liệu không có, lưu và trả về:

```txt
null
```

Không dùng:

```txt
0
```

Lý do:

```txt
0 là một giá trị tài chính có ý nghĩa riêng.
Nếu dùng 0 thay cho thiếu dữ liệu, hệ thống có thể tính sai hoặc cảnh báo sai.
```

Ví dụ:

```txt
Thiếu operating_cash_flow → không tính CFO/Net Profit.
Thiếu EPS → không tính P/E.
Thiếu total_equity → không tính ROE và P/B.
Thiếu close_price → không tính chỉ số định giá thị trường.
```

---

### 4.2. Không chia cho 0

Nếu mẫu số bằng 0 hoặc nhỏ hơn 0 trong các trường hợp không phù hợp, không tính chỉ số.

Ví dụ:

```txt
revenue <= 0 → không tính margin.
total_equity <= 0 → không diễn giải ROE thông thường.
eps <= 0 → không diễn giải P/E thông thường.
current_liabilities <= 0 → không tính Current Ratio thông thường.
```

---

### 4.3. Khi chỉ số không phù hợp với loại doanh nghiệp

Một số chỉ số không phù hợp với ngân hàng, chứng khoán, bảo hiểm.

Ví dụ:

```txt
Current Ratio không áp dụng máy móc cho ngân hàng.
Debt/Equity không áp dụng máy móc cho ngân hàng.
Dòng tiền ngân hàng không diễn giải giống doanh nghiệp sản xuất.
P/B thường quan trọng hơn với ngân hàng.
```

Khi không phù hợp, trả:

```json
{
  "value": null,
  "level": "not_applicable",
  "data_quality": "not_applicable",
  "warning": "Chỉ số này không phù hợp để diễn giải máy móc với loại doanh nghiệp hiện tại."
}
```

---

### 4.4. Khi chỉ có dữ liệu cuối kỳ

Một số chỉ số nên dùng bình quân đầu kỳ và cuối kỳ.

Ví dụ:

```txt
ROA nên dùng total_assets bình quân.
ROE nên dùng total_equity bình quân.
```

Nếu chỉ có số cuối kỳ:

```txt
Có thể tính phiên bản đơn giản hóa.
Nhưng phải ghi rõ data_quality = low_confidence hoặc partial.
```

---

## 5. Nhóm chỉ số tăng trưởng

Nhóm tăng trưởng dùng để xem doanh nghiệp đang mở rộng, suy giảm hay biến động.

Không được kết luận doanh nghiệp tốt chỉ vì tăng trưởng cao.

Tăng trưởng cần đọc cùng:

```txt
Biên lợi nhuận
Dòng tiền
Nợ vay
Vốn lưu động
Ngành
Chu kỳ kinh doanh
```

---

### 5.1. Revenue Growth

```txt
Key: revenue_growth
Tên tiếng Việt: Tăng trưởng doanh thu
```

Module sử dụng:

```txt
overview
financials
screening
valuation
risk
watchlist
ai
```

Dữ liệu đầu vào:

```txt
revenue_current_period
revenue_previous_period
period_type
```

Công thức:

```txt
Revenue Growth = revenue_current_period / revenue_previous_period - 1
```

Điều kiện tính:

```txt
revenue_current_period không null
revenue_previous_period không null
revenue_previous_period > 0
```

Nếu kỳ trước bằng 0:

```txt
Không tính tỷ lệ tăng trưởng thông thường.
Trả value = null.
Cảnh báo: "Kỳ trước bằng 0 nên tỷ lệ tăng trưởng phần trăm có thể gây hiểu nhầm."
```

Nếu kỳ trước âm:

```txt
Không diễn giải tăng trưởng phần trăm thông thường.
Trả data_quality = low_confidence.
```

Cách đọc cho người mới:

```txt
Doanh thu tăng cho thấy quy mô bán hàng hoặc hoạt động kinh doanh đang mở rộng.
Nhưng doanh thu tăng chưa chắc tốt nếu biên lợi nhuận giảm, dòng tiền yếu hoặc nợ tăng nhanh.
```

Cảnh báo:

```txt
Không được nói doanh thu tăng nghĩa là doanh nghiệp tốt.
Cần kiểm tra lợi nhuận, biên lợi nhuận và dòng tiền.
```

Level gợi ý:

```txt
good: tăng trưởng dương và đi cùng lợi nhuận/dòng tiền ổn.
neutral: tăng nhẹ hoặc ổn định.
watch: tăng trưởng dương nhưng lợi nhuận hoặc dòng tiền không theo kịp.
risk: doanh thu giảm mạnh nhiều kỳ hoặc biến động bất thường.
unknown: thiếu dữ liệu kỳ trước.
```

Output mẫu:

```json
{
  "key": "revenue_growth",
  "label": "Tăng trưởng doanh thu",
  "value": 0.12,
  "display_value": "12%",
  "unit": "%",
  "level": "good",
  "data_quality": "sufficient",
  "formula": "revenue_current_period / revenue_previous_period - 1",
  "input_fields": ["revenue_current_period", "revenue_previous_period"],
  "missing_fields": [],
  "explanation": "Doanh thu tăng cho thấy quy mô bán hàng hoặc hoạt động kinh doanh đang mở rộng.",
  "warning": "Cần kiểm tra thêm biên lợi nhuận và dòng tiền để đánh giá chất lượng tăng trưởng.",
  "beginner_interpretation": "Doanh thu tăng là tín hiệu tích cực, nhưng chưa đủ để kết luận doanh nghiệp tốt.",
  "common_misread": "Doanh thu tăng không đồng nghĩa lợi nhuận và tiền mặt cũng tăng."
}
```

---

### 5.2. Gross Profit Growth

```txt
Key: gross_profit_growth
Tên tiếng Việt: Tăng trưởng lợi nhuận gộp
```

Dữ liệu đầu vào:

```txt
gross_profit_current_period
gross_profit_previous_period
```

Công thức:

```txt
Gross Profit Growth = gross_profit_current_period / gross_profit_previous_period - 1
```

Cách đọc:

```txt
Lợi nhuận gộp tăng cho thấy phần lợi nhuận sau giá vốn đang cải thiện.
Chỉ số này quan trọng để kiểm tra doanh nghiệp có tăng doanh thu nhưng bị bào mòn biên lợi nhuận không.
```

Cảnh báo:

```txt
Nếu doanh thu tăng nhưng lợi nhuận gộp không tăng tương ứng, cần kiểm tra giá vốn, cạnh tranh giá hoặc cơ cấu sản phẩm.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 5.3. Operating Profit Growth

```txt
Key: operating_profit_growth
Tên tiếng Việt: Tăng trưởng lợi nhuận hoạt động
```

Dữ liệu đầu vào:

```txt
operating_profit_current_period
operating_profit_previous_period
```

Công thức:

```txt
Operating Profit Growth = operating_profit_current_period / operating_profit_previous_period - 1
```

Cách đọc:

```txt
Lợi nhuận hoạt động phản ánh hiệu quả từ hoạt động kinh doanh chính trước một số yếu tố tài chính và thuế.
```

Cảnh báo:

```txt
Nếu lợi nhuận sau thuế tăng nhưng lợi nhuận hoạt động không tăng, cần kiểm tra khoản bất thường, thu nhập tài chính hoặc hoàn nhập dự phòng.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 5.4. Net Profit Growth

```txt
Key: net_profit_growth
Tên tiếng Việt: Tăng trưởng lợi nhuận sau thuế
```

Dữ liệu đầu vào:

```txt
net_profit_current_period
net_profit_previous_period
```

Công thức:

```txt
Net Profit Growth = net_profit_current_period / net_profit_previous_period - 1
```

Điều kiện tính:

```txt
net_profit_previous_period > 0
```

Nếu kỳ trước âm:

```txt
Không diễn giải tăng trưởng phần trăm theo cách thông thường.
Cần ghi chú lợi nhuận phục hồi từ nền âm.
```

Cách đọc:

```txt
Lợi nhuận tăng là điểm tích cực, nhưng cần kiểm tra lợi nhuận đó có đến từ hoạt động cốt lõi và có chuyển thành dòng tiền hay không.
```

Cảnh báo:

```txt
Không được nói lợi nhuận tăng nghĩa là cổ phiếu nên mua.
Không được dùng lợi nhuận một kỳ để kết luận xu hướng dài hạn.
```

Module sử dụng:

```txt
overview
financials
valuation
risk
watchlist
ai
```

---

### 5.5. EPS Growth

```txt
Key: eps_growth
Tên tiếng Việt: Tăng trưởng EPS
```

Dữ liệu đầu vào:

```txt
eps_basic_current_period
eps_basic_previous_period
hoặc eps_diluted_current_period
hoặc eps_diluted_previous_period
```

Công thức:

```txt
EPS Growth = eps_current_period / eps_previous_period - 1
```

Cách đọc:

```txt
EPS tăng cho thấy lợi nhuận trên mỗi cổ phiếu tăng.
Chỉ số này quan trọng cho định giá P/E.
```

Cảnh báo:

```txt
EPS có thể tăng do lợi nhuận tăng hoặc do số cổ phiếu lưu hành giảm.
Cần kiểm tra pha loãng cổ phiếu, phát hành thêm và lợi nhuận bất thường.
```

Module sử dụng:

```txt
financials
valuation
risk
ai
```

---

### 5.6. Asset Growth

```txt
Key: asset_growth
Tên tiếng Việt: Tăng trưởng tổng tài sản
```

Dữ liệu đầu vào:

```txt
total_assets_current_period
total_assets_previous_period
```

Công thức:

```txt
Asset Growth = total_assets_current_period / total_assets_previous_period - 1
```

Cách đọc:

```txt
Tài sản tăng cho thấy doanh nghiệp mở rộng quy mô nguồn lực.
Nhưng cần kiểm tra tài sản tăng nằm ở tiền mặt, tồn kho, phải thu hay tài sản cố định.
```

Cảnh báo:

```txt
Tài sản tăng không tự động tốt.
Nếu tài sản tăng chủ yếu do tồn kho hoặc phải thu tăng nhanh, cần cảnh báo chất lượng tài sản.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 5.7. Equity Growth

```txt
Key: equity_growth
Tên tiếng Việt: Tăng trưởng vốn chủ sở hữu
```

Dữ liệu đầu vào:

```txt
total_equity_current_period
total_equity_previous_period
```

Công thức:

```txt
Equity Growth = total_equity_current_period / total_equity_previous_period - 1
```

Cách đọc:

```txt
Vốn chủ tăng cho thấy bộ đệm vốn của doanh nghiệp tăng.
Tuy nhiên cần kiểm tra vốn chủ tăng do lợi nhuận giữ lại hay do phát hành thêm cổ phiếu.
```

Cảnh báo:

```txt
Nếu vốn chủ tăng nhưng ROE giảm, hiệu quả sử dụng vốn có thể đang suy yếu.
Nếu vốn chủ âm, không diễn giải ROE/P/B thông thường.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 5.8. Operating Cash Flow Growth

```txt
Key: operating_cash_flow_growth
Tên tiếng Việt: Tăng trưởng dòng tiền kinh doanh
```

Dữ liệu đầu vào:

```txt
operating_cash_flow_current_period
operating_cash_flow_previous_period
```

Công thức:

```txt
Operating Cash Flow Growth = operating_cash_flow_current_period / operating_cash_flow_previous_period - 1
```

Cách đọc:

```txt
Dòng tiền kinh doanh tăng cho thấy hoạt động kinh doanh đang tạo ra nhiều tiền hơn.
Đây là tín hiệu quan trọng để kiểm tra chất lượng lợi nhuận.
```

Cảnh báo:

```txt
Nếu lợi nhuận tăng nhưng CFO giảm hoặc âm, cần cảnh báo chất lượng lợi nhuận.
```

Module sử dụng:

```txt
financials
risk
overview
ai
```

---

## 6. Nhóm chỉ số sinh lời

Nhóm sinh lời dùng để xem doanh nghiệp giữ lại bao nhiêu lợi nhuận từ doanh thu và sử dụng tài sản/vốn chủ hiệu quả ra sao.

Không được so sánh máy móc giữa các ngành.

Ví dụ:

```txt
Biên lợi nhuận bán lẻ thường mỏng hơn phần mềm.
ROE ngân hàng cần đọc khác ROE doanh nghiệp sản xuất.
ROA ngành tài sản nặng thường khác ngành dịch vụ.
```

---

### 6.1. Gross Margin

```txt
Key: gross_margin
Tên tiếng Việt: Biên lợi nhuận gộp
```

Dữ liệu đầu vào:

```txt
gross_profit
revenue
```

Công thức:

```txt
Gross Margin = gross_profit / revenue
```

Điều kiện tính:

```txt
gross_profit không null
revenue không null
revenue > 0
```

Cách đọc:

```txt
Biên lợi nhuận gộp cho biết sau khi trừ giá vốn, doanh nghiệp còn giữ lại bao nhiêu phần doanh thu.
```

Ý nghĩa theo module:

```txt
financials: kiểm tra sức khỏe hoạt động kinh doanh.
business: kiểm tra lợi thế cạnh tranh có phản ánh vào biên lợi nhuận không.
risk: cảnh báo nếu biên gộp suy giảm liên tục.
valuation: hỗ trợ đánh giá chất lượng lợi nhuận trước khi dùng P/E.
```

Cảnh báo:

```txt
Biên gộp cao chưa chắc tốt nếu chi phí bán hàng, chi phí quản lý hoặc chi phí tài chính quá lớn.
Biên gộp thấp chưa chắc xấu nếu mô hình kinh doanh có vòng quay nhanh.
```

Level gợi ý:

```txt
good: biên gộp ổn định hoặc cải thiện so với chính doanh nghiệp.
neutral: biên gộp đi ngang, không có cảnh báo lớn.
watch: biên gộp giảm trong một số kỳ.
risk: biên gộp giảm kéo dài hoặc giảm trong khi doanh thu tăng.
unknown: thiếu gross_profit hoặc revenue.
```

---

### 6.2. Operating Margin

```txt
Key: operating_margin
Tên tiếng Việt: Biên lợi nhuận hoạt động
```

Dữ liệu đầu vào:

```txt
operating_profit
revenue
```

Công thức:

```txt
Operating Margin = operating_profit / revenue
```

Cách đọc:

```txt
Operating Margin cho biết hoạt động kinh doanh chính tạo ra bao nhiêu lợi nhuận sau khi trừ chi phí vận hành.
```

Cảnh báo:

```txt
Nếu Gross Margin ổn nhưng Operating Margin giảm, có thể chi phí bán hàng hoặc chi phí quản lý đang tăng.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 6.3. Net Profit Margin

```txt
Key: net_margin
Tên tiếng Việt: Biên lợi nhuận ròng
```

Dữ liệu đầu vào:

```txt
net_profit
revenue
```

Công thức:

```txt
Net Profit Margin = net_profit / revenue
```

Cách đọc:

```txt
Biên lợi nhuận ròng cho biết mỗi 100 đồng doanh thu giữ lại bao nhiêu đồng lợi nhuận sau thuế.
```

Cảnh báo:

```txt
Biên ròng thấp không tự động xấu nếu đặc thù ngành có biên thấp nhưng vòng quay cao.
Biên ròng cao bất thường cần kiểm tra khoản lợi nhuận một lần.
```

Module sử dụng:

```txt
overview
financials
valuation
risk
ai
```

---

### 6.4. ROA

```txt
Key: roa
Tên tiếng Việt: Tỷ suất sinh lời trên tài sản
```

Dữ liệu đầu vào:

```txt
net_profit
total_assets_beginning nếu có
total_assets_ending nếu có
total_assets nếu chỉ có cuối kỳ
```

Công thức ưu tiên:

```txt
Average Assets = (total_assets_beginning + total_assets_ending) / 2
ROA = net_profit / average_assets
```

Công thức đơn giản hóa nếu thiếu đầu kỳ:

```txt
ROA = net_profit / total_assets
```

Điều kiện tính:

```txt
net_profit không null
total_assets không null
total_assets > 0
```

Cách đọc:

```txt
ROA cho biết doanh nghiệp tạo ra bao nhiêu lợi nhuận trên mỗi đồng tài sản.
```

Cảnh báo:

```txt
ROA thấp chưa chắc xấu nếu doanh nghiệp thuộc ngành tài sản nặng.
ROA cao cần so với ngành và kiểm tra tính bền vững của lợi nhuận.
```

Module sử dụng:

```txt
financials
overview
risk
ai
```

Output lưu ý:

```txt
Nếu dùng tài sản cuối kỳ thay vì tài sản bình quân:
data_quality = low_confidence
calculation_note = "ROA đang dùng tài sản cuối kỳ do thiếu dữ liệu đầu kỳ."
```

---

### 6.5. ROE

```txt
Key: roe
Tên tiếng Việt: Tỷ suất sinh lời trên vốn chủ sở hữu
```

Dữ liệu đầu vào:

```txt
net_profit
total_equity_beginning nếu có
total_equity_ending nếu có
total_equity nếu chỉ có cuối kỳ
```

Công thức ưu tiên:

```txt
Average Equity = (total_equity_beginning + total_equity_ending) / 2
ROE = net_profit / average_equity
```

Công thức đơn giản hóa nếu thiếu đầu kỳ:

```txt
ROE = net_profit / total_equity
```

Điều kiện tính:

```txt
net_profit không null
total_equity không null
total_equity > 0
```

Nếu vốn chủ âm hoặc bằng 0:

```txt
Không diễn giải ROE thông thường.
Trả value = null hoặc level = not_applicable.
```

Cách đọc:

```txt
ROE cho biết doanh nghiệp tạo ra bao nhiêu lợi nhuận trên vốn chủ sở hữu.
ROE cao là điểm tích cực, nhưng chưa đủ để kết luận doanh nghiệp tốt.
```

Cảnh báo:

```txt
ROE cao có thể do:
- doanh nghiệp thật sự hiệu quả;
- dùng nhiều nợ;
- vốn chủ thấp bất thường;
- lợi nhuận bất thường trong một kỳ.
```

Module sử dụng:

```txt
overview
financials
valuation
risk
ai
```

Level gợi ý:

```txt
good: ROE tốt và không đi kèm cảnh báo nợ/dòng tiền lớn.
neutral: ROE ổn nhưng chưa nổi bật.
watch: ROE cao nhưng Debt/Equity cao hoặc CFO yếu.
risk: ROE bị bóp méo do vốn chủ thấp/âm hoặc lợi nhuận bất thường.
unknown: thiếu net_profit hoặc total_equity.
```

---

### 6.6. EBITDA Margin

```txt
Key: ebitda_margin
Tên tiếng Việt: Biên EBITDA
```

Dữ liệu đầu vào:

```txt
ebitda
revenue
```

Công thức:

```txt
EBITDA Margin = ebitda / revenue
```

Điều kiện tính:

```txt
ebitda không null
revenue > 0
```

Cách đọc:

```txt
EBITDA Margin giúp nhìn khả năng tạo lợi nhuận trước khấu hao, lãi vay và thuế.
```

Cảnh báo:

```txt
Không dùng EBITDA thay thế hoàn toàn dòng tiền.
EBITDA không phản ánh Capex, vốn lưu động và tiền thật.
```

Module sử dụng:

```txt
financials
valuation
risk
ai
```

Nếu thiếu EBITDA:

```txt
Không tính EV/EBITDA.
Trả missing_fields = ["ebitda"].
```

---

## 7. Nhóm đòn bẩy và thanh khoản

Nhóm này dùng để đánh giá cấu trúc tài chính, áp lực nợ và khả năng thanh toán.

Không áp dụng máy móc cho ngân hàng, chứng khoán, bảo hiểm.

---

### 7.1. Debt to Equity

```txt
Key: debt_to_equity
Tên tiếng Việt: Nợ vay / Vốn chủ sở hữu
```

Dữ liệu đầu vào:

```txt
total_debt
short_term_debt
long_term_debt
total_equity
company_type
```

Công thức:

```txt
Nếu có total_debt:
Debt/Equity = total_debt / total_equity

Nếu không có total_debt nhưng có short_term_debt và long_term_debt:
total_debt = short_term_debt + long_term_debt
Debt/Equity = total_debt / total_equity
```

Điều kiện tính:

```txt
company_type không phải bank/securities/insurance nếu dùng cách diễn giải phổ thông
total_equity > 0
total_debt không null hoặc đủ short_term_debt + long_term_debt
```

Cách đọc:

```txt
Debt/Equity cho biết doanh nghiệp dùng bao nhiêu nợ vay so với vốn chủ sở hữu.
```

Cảnh báo:

```txt
Nợ cao không tự động xấu.
Cần xem dòng tiền kinh doanh, khả năng trả lãi, kỳ hạn nợ và đặc thù ngành.
```

Level gợi ý cho doanh nghiệp phi tài chính:

```txt
good: nợ vay thấp, dòng tiền ổn.
neutral: nợ vay vừa phải, chưa có cảnh báo lớn.
watch: nợ vay tăng nhanh hoặc dòng tiền chưa hỗ trợ rõ.
risk: nợ vay cao, interest coverage thấp hoặc CFO yếu.
unknown: thiếu total_debt hoặc total_equity.
not_applicable: ngân hàng/chứng khoán/bảo hiểm nếu chưa có logic riêng.
```

Module sử dụng:

```txt
overview
financials
risk
valuation
ai
```

---

### 7.2. Liabilities to Assets

```txt
Key: liabilities_to_assets
Tên tiếng Việt: Nợ phải trả / Tổng tài sản
```

Dữ liệu đầu vào:

```txt
total_liabilities
total_assets
```

Công thức:

```txt
Liabilities/Assets = total_liabilities / total_assets
```

Điều kiện tính:

```txt
total_liabilities không null
total_assets không null
total_assets > 0
```

Cách đọc:

```txt
Chỉ số này cho biết bao nhiêu phần tài sản được tài trợ bởi nợ phải trả.
```

Cảnh báo:

```txt
Nợ phải trả bao gồm nhiều loại: nợ vay, phải trả nhà cung cấp, thuế, chi phí phải trả.
Không nên xem toàn bộ nợ phải trả đều giống nợ vay.
```

Module sử dụng:

```txt
financials
risk
overview
ai
```

---

### 7.3. Net Debt

```txt
Key: net_debt
Tên tiếng Việt: Nợ vay ròng
```

Dữ liệu đầu vào:

```txt
total_debt
short_term_debt
long_term_debt
cash_and_equivalents
```

Công thức:

```txt
Net Debt = total_debt - cash_and_equivalents
```

Nếu thiếu total_debt:

```txt
total_debt = short_term_debt + long_term_debt nếu đủ dữ liệu
```

Cách đọc:

```txt
Net Debt cho biết sau khi trừ tiền mặt, doanh nghiệp còn bao nhiêu nợ vay ròng.
```

Cảnh báo:

```txt
Net Debt âm có thể là tín hiệu tốt vì tiền mặt lớn hơn nợ vay.
Nhưng cần kiểm tra tiền mặt có bị hạn chế sử dụng hay không.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 7.4. Current Ratio

```txt
Key: current_ratio
Tên tiếng Việt: Tỷ lệ thanh toán hiện hành
```

Dữ liệu đầu vào:

```txt
current_assets
current_liabilities
company_type
```

Công thức:

```txt
Current Ratio = current_assets / current_liabilities
```

Điều kiện tính:

```txt
current_assets không null
current_liabilities không null
current_liabilities > 0
company_type phù hợp
```

Không áp dụng máy móc cho:

```txt
bank
securities
insurance
```

Cách đọc:

```txt
Current Ratio cho biết tài sản ngắn hạn có đủ để trang trải nợ ngắn hạn không.
```

Cảnh báo:

```txt
Current Ratio cao chưa chắc tốt nếu tài sản ngắn hạn chủ yếu là tồn kho chậm bán hoặc phải thu khó thu.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 7.5. Quick Ratio

```txt
Key: quick_ratio
Tên tiếng Việt: Tỷ lệ thanh toán nhanh
```

Dữ liệu đầu vào:

```txt
current_assets
inventory
current_liabilities
```

Công thức:

```txt
Quick Ratio = (current_assets - inventory) / current_liabilities
```

Cách đọc:

```txt
Quick Ratio loại tồn kho ra khỏi tài sản ngắn hạn để đánh giá khả năng thanh toán thận trọng hơn.
```

Cảnh báo:

```txt
Nếu thiếu inventory, không tính Quick Ratio.
Không dùng Quick Ratio máy móc cho ngân hàng.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 7.6. Interest Coverage

```txt
Key: interest_coverage
Tên tiếng Việt: Khả năng trả lãi
```

Dữ liệu đầu vào:

```txt
ebit
interest_expense
```

Công thức:

```txt
Interest Coverage = ebit / interest_expense
```

Điều kiện tính:

```txt
ebit không null
interest_expense không null
interest_expense > 0
```

Cách đọc:

```txt
Interest Coverage cho biết lợi nhuận hoạt động có đủ để trang trải chi phí lãi vay không.
```

Cảnh báo:

```txt
Nếu Interest Coverage thấp, doanh nghiệp nhạy cảm hơn với lãi suất, suy giảm lợi nhuận hoặc dòng tiền yếu.
```

Module sử dụng:

```txt
financials
risk
overview
ai
```

Level gợi ý:

```txt
good: khả năng trả lãi có dư địa rõ.
neutral: trả lãi được nhưng cần theo dõi.
watch: dư địa mỏng.
risk: EBIT thấp hơn nhiều so với chi phí lãi vay hoặc không đủ trả lãi.
unknown: thiếu ebit hoặc interest_expense.
```

---

### 7.7. Cash to Debt

```txt
Key: cash_to_debt
Tên tiếng Việt: Tiền mặt / Nợ vay
```

Dữ liệu đầu vào:

```txt
cash_and_equivalents
total_debt
```

Công thức:

```txt
Cash to Debt = cash_and_equivalents / total_debt
```

Cách đọc:

```txt
Chỉ số này cho biết tiền mặt hiện có che phủ được bao nhiêu phần nợ vay.
```

Cảnh báo:

```txt
Tiền mặt cao là điểm tích cực, nhưng cần kiểm tra tiền đó có thật sự tự do sử dụng không.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 7.8. Short-term Debt Ratio

```txt
Key: short_term_debt_ratio
Tên tiếng Việt: Tỷ trọng nợ vay ngắn hạn
```

Dữ liệu đầu vào:

```txt
short_term_debt
total_debt
```

Công thức:

```txt
Short-term Debt Ratio = short_term_debt / total_debt
```

Cách đọc:

```txt
Chỉ số này cho biết bao nhiêu phần nợ vay đến hạn trong ngắn hạn.
```

Cảnh báo:

```txt
Tỷ trọng nợ ngắn hạn cao làm tăng áp lực thanh khoản, nhất là khi CFO yếu.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

## 8. Nhóm dòng tiền và chất lượng lợi nhuận

Nhóm này rất quan trọng với người mới vì lợi nhuận kế toán không đồng nghĩa với tiền thật.

---

### 8.1. Operating Cash Flow

```txt
Key: operating_cash_flow
Tên tiếng Việt: Dòng tiền từ hoạt động kinh doanh
```

Dữ liệu đầu vào:

```txt
operating_cash_flow
```

Công thức:

```txt
Không cần công thức nếu lấy trực tiếp từ báo cáo lưu chuyển tiền tệ.
```

Cách đọc:

```txt
Operating Cash Flow cho biết hoạt động kinh doanh chính tạo ra tiền vào hay tiền ra.
```

Cảnh báo:

```txt
CFO âm một kỳ chưa chắc xấu.
Nhưng nếu lợi nhuận dương mà CFO âm nhiều kỳ, cần cảnh báo chất lượng lợi nhuận.
```

Module sử dụng:

```txt
overview
financials
risk
valuation
ai
```

---

### 8.2. CFO to Net Profit

```txt
Key: cfo_to_net_profit
Tên tiếng Việt: CFO / Lợi nhuận sau thuế
```

Dữ liệu đầu vào:

```txt
operating_cash_flow
net_profit
```

Công thức:

```txt
CFO/Net Profit = operating_cash_flow / net_profit
```

Điều kiện tính:

```txt
operating_cash_flow không null
net_profit không null
net_profit > 0
```

Nếu net_profit <= 0:

```txt
Không diễn giải CFO/Net Profit theo cách thông thường.
```

Cách đọc:

```txt
Chỉ số này cho biết lợi nhuận kế toán có chuyển hóa thành tiền kinh doanh không.
```

Cảnh báo:

```txt
Nếu CFO/Net Profit thấp kéo dài, lợi nhuận có thể chưa đi kèm tiền thật.
Cần kiểm tra khoản phải thu, hàng tồn kho và vốn lưu động.
```

Level gợi ý:

```txt
good: CFO bằng hoặc cao hơn lợi nhuận trong bối cảnh bình thường.
neutral: CFO thấp hơn lợi nhuận nhưng chưa kéo dài.
watch: CFO thấp hơn lợi nhuận nhiều kỳ.
risk: lợi nhuận dương nhưng CFO âm nhiều kỳ.
unknown: thiếu operating_cash_flow hoặc net_profit.
```

Module sử dụng:

```txt
overview
financials
valuation
risk
ai
```

---

### 8.3. Free Cash Flow

```txt
Key: free_cash_flow
Tên tiếng Việt: Dòng tiền tự do
```

Dữ liệu đầu vào:

```txt
operating_cash_flow
capital_expenditure
free_cash_flow nếu nguồn đã cung cấp
```

Công thức ưu tiên:

```txt
Nếu có free_cash_flow từ nguồn đáng tin:
Free Cash Flow = free_cash_flow

Nếu không có nhưng đủ CFO và Capex:
Free Cash Flow = operating_cash_flow - capital_expenditure
```

Lưu ý:

```txt
capital_expenditure cần thống nhất dấu.
Nếu Capex được lưu là số dương đại diện tiền chi ra:
FCF = CFO - Capex.

Nếu Capex được lưu là số âm theo báo cáo lưu chuyển tiền tệ:
Cần chuẩn hóa trước khi tính.
```

Cách đọc:

```txt
FCF cho biết sau khi chi đầu tư duy trì/mở rộng, doanh nghiệp còn lại bao nhiêu tiền tự do.
```

Cảnh báo:

```txt
FCF âm không tự động xấu.
Cần phân biệt FCF âm do CFO yếu hay do doanh nghiệp đang đầu tư mở rộng.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 8.4. FCF Margin

```txt
Key: fcf_margin
Tên tiếng Việt: Biên dòng tiền tự do
```

Dữ liệu đầu vào:

```txt
free_cash_flow
revenue
```

Công thức:

```txt
FCF Margin = free_cash_flow / revenue
```

Cách đọc:

```txt
FCF Margin cho biết mỗi đồng doanh thu tạo ra bao nhiêu dòng tiền tự do.
```

Cảnh báo:

```txt
Nếu FCF Margin thấp hoặc âm nhiều kỳ, cần kiểm tra CFO, Capex và vốn lưu động.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 8.5. Capex to Revenue

```txt
Key: capex_to_revenue
Tên tiếng Việt: Capex / Doanh thu
```

Dữ liệu đầu vào:

```txt
capital_expenditure
revenue
```

Công thức:

```txt
Capex/Revenue = capital_expenditure / revenue
```

Cách đọc:

```txt
Chỉ số này cho biết doanh nghiệp cần đầu tư bao nhiêu để tạo ra doanh thu.
```

Cảnh báo:

```txt
Capex cao không tự động xấu.
Với doanh nghiệp mở rộng, Capex cao có thể hợp lý.
Nhưng nếu Capex cao kéo dài mà doanh thu/lợi nhuận không tăng tương ứng, cần cảnh báo.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

### 8.6. Operating Cash Flow Margin

```txt
Key: operating_cash_flow_margin
Tên tiếng Việt: Biên dòng tiền kinh doanh
```

Dữ liệu đầu vào:

```txt
operating_cash_flow
revenue
```

Công thức:

```txt
Operating Cash Flow Margin = operating_cash_flow / revenue
```

Cách đọc:

```txt
Chỉ số này cho biết mỗi đồng doanh thu tạo ra bao nhiêu dòng tiền kinh doanh.
```

Cảnh báo:

```txt
Nếu doanh thu tăng nhưng Operating Cash Flow Margin giảm, cần kiểm tra vốn lưu động và chất lượng doanh thu.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 8.7. FCF to Net Profit

```txt
Key: fcf_to_net_profit
Tên tiếng Việt: FCF / Lợi nhuận sau thuế
```

Dữ liệu đầu vào:

```txt
free_cash_flow
net_profit
```

Công thức:

```txt
FCF/Net Profit = free_cash_flow / net_profit
```

Điều kiện tính:

```txt
net_profit > 0
```

Cách đọc:

```txt
Chỉ số này giúp kiểm tra lợi nhuận sau thuế có chuyển thành dòng tiền tự do không.
```

Cảnh báo:

```txt
Nếu FCF thấp hơn nhiều so với lợi nhuận trong nhiều kỳ, cần kiểm tra Capex, khoản phải thu và tồn kho.
```

Module sử dụng:

```txt
financials
risk
valuation
ai
```

---

## 9. Nhóm vốn lưu động và chất lượng tài sản

Nhóm này quan trọng với các doanh nghiệp bán lẻ, sản xuất, thép, tiêu dùng, bất động sản.

---

### 9.1. Accounts Receivable Growth vs Revenue Growth

```txt
Key: receivables_growth_vs_revenue_growth
Tên tiếng Việt: Tăng trưởng phải thu so với tăng trưởng doanh thu
```

Dữ liệu đầu vào:

```txt
accounts_receivable_current_period
accounts_receivable_previous_period
revenue_current_period
revenue_previous_period
```

Công thức:

```txt
Receivables Growth = accounts_receivable_current / accounts_receivable_previous - 1
Revenue Growth = revenue_current / revenue_previous - 1
Gap = Receivables Growth - Revenue Growth
```

Cách đọc:

```txt
Nếu phải thu tăng nhanh hơn doanh thu, doanh nghiệp có thể đang bán chịu nhiều hơn hoặc thu tiền chậm hơn.
```

Cảnh báo:

```txt
Không kết luận gian lận.
Chỉ cảnh báo cần kiểm tra chất lượng doanh thu và khả năng thu tiền.
```

Module sử dụng:

```txt
financials
risk
ai
```

---

### 9.2. Inventory Growth vs Revenue Growth

```txt
Key: inventory_growth_vs_revenue_growth
Tên tiếng Việt: Tăng trưởng tồn kho so với tăng trưởng doanh thu
```

Dữ liệu đầu vào:

```txt
inventory_current_period
inventory_previous_period
revenue_current_period
revenue_previous_period
```

Công thức:

```txt
Inventory Growth = inventory_current / inventory_previous - 1
Revenue Growth = revenue_current / revenue_previous - 1
Gap = Inventory Growth - Revenue Growth
```

Cách đọc:

```txt
Nếu tồn kho tăng nhanh hơn doanh thu, tiền có thể bị khóa trong hàng tồn và rủi ro giảm giá hàng tồn kho tăng lên.
```

Cảnh báo:

```txt
Với bán lẻ, thép, tiêu dùng và bất động sản, tồn kho cần được đọc rất kỹ.
Tồn kho tăng không tự động xấu nếu doanh nghiệp đang chuẩn bị cho chu kỳ bán hàng hoặc mở rộng.
```

Module sử dụng:

```txt
financials
risk
business
ai
```

---

## 10. Nhóm định giá

Nhóm định giá phải cực kỳ thận trọng vì người mới dễ hiểu sai.

Không được dùng chỉ số định giá để đưa khuyến nghị mua/bán.

---

### 10.1. EPS

```txt
Key: eps
Tên tiếng Việt: Lợi nhuận trên mỗi cổ phiếu
```

Dữ liệu đầu vào ưu tiên:

```txt
eps_basic
eps_diluted
net_profit_parent
shares_outstanding
```

Cách lấy:

```txt
Nếu có eps_basic:
EPS = eps_basic

Nếu có eps_diluted và muốn thận trọng:
EPS = eps_diluted

Nếu không có EPS nhưng có net_profit_parent và shares_outstanding:
EPS = net_profit_parent / shares_outstanding
```

Lưu ý đơn vị:

```txt
net_profit_parent và shares_outstanding phải thống nhất đơn vị.
Nếu net_profit_parent dùng tỷ VND, cần quy đổi đúng trước khi tính EPS VND/cp.
```

Cách đọc:

```txt
EPS cho biết mỗi cổ phiếu tạo ra bao nhiêu lợi nhuận.
EPS là đầu vào chính cho P/E.
```

Cảnh báo:

```txt
EPS có thể bị ảnh hưởng bởi khoản bất thường, phát hành thêm, mua cổ phiếu quỹ hoặc thay đổi số cổ phiếu lưu hành.
```

Module sử dụng:

```txt
financials
valuation
risk
ai
```

---

### 10.2. BVPS

```txt
Key: bvps
Tên tiếng Việt: Giá trị sổ sách trên mỗi cổ phiếu
```

Dữ liệu đầu vào:

```txt
book_value_per_share
total_equity
shares_outstanding
```

Cách lấy:

```txt
Nếu có book_value_per_share:
BVPS = book_value_per_share

Nếu không có nhưng có total_equity và shares_outstanding:
BVPS = total_equity / shares_outstanding
```

Điều kiện tính:

```txt
total_equity > 0
shares_outstanding > 0
```

Cách đọc:

```txt
BVPS cho biết giá trị sổ sách thuộc về mỗi cổ phiếu.
BVPS là đầu vào chính cho P/B.
```

Cảnh báo:

```txt
BVPS không phản ánh đầy đủ chất lượng tài sản.
Nếu vốn chủ âm, không diễn giải P/B thông thường.
```

Module sử dụng:

```txt
valuation
financials
risk
ai
```

---

### 10.3. P/E

```txt
Key: pe_ratio
Tên tiếng Việt: P/E
```

Dữ liệu đầu vào:

```txt
close_price
eps
eps_ttm nếu có
eps_annual nếu có
```

Công thức:

```txt
P/E = close_price / eps
```

Điều kiện tính:

```txt
close_price > 0
eps > 0
```

Nếu EPS âm hoặc bằng 0:

```txt
Không tính P/E theo cách thông thường.
Trả level = not_applicable.
Cảnh báo: "EPS âm hoặc bằng 0 nên P/E không phù hợp để diễn giải rẻ/đắt."
```

Cách đọc:

```txt
P/E cho biết nhà đầu tư đang trả bao nhiêu đồng cho một đồng lợi nhuận.
```

Cảnh báo bắt buộc:

```txt
P/E thấp không đồng nghĩa cổ phiếu rẻ.
P/E cao không đồng nghĩa cổ phiếu đắt.
Cần kiểm tra tăng trưởng, chất lượng lợi nhuận, ngành, chu kỳ và rủi ro.
```

Module sử dụng:

```txt
overview
valuation
risk
watchlist
ai
```

Level gợi ý:

```txt
reasonable: P/E có thể đọc được và không có cảnh báo dữ liệu lớn.
watch: P/E thấp/cao nhưng thiếu so sánh ngành hoặc lịch sử.
risk: P/E bị hiểu nhầm do EPS bất thường, lợi nhuận chu kỳ hoặc chất lượng lợi nhuận yếu.
not_applicable: EPS <= 0.
unknown: thiếu close_price hoặc EPS.
```

---

### 10.4. P/B

```txt
Key: pb_ratio
Tên tiếng Việt: P/B
```

Dữ liệu đầu vào:

```txt
close_price
bvps
book_value_per_share
total_equity
shares_outstanding
```

Công thức:

```txt
P/B = close_price / bvps
```

Điều kiện tính:

```txt
close_price > 0
bvps > 0
```

Cách đọc:

```txt
P/B cho biết thị trường đang trả bao nhiêu lần so với giá trị sổ sách của mỗi cổ phiếu.
```

Cảnh báo:

```txt
P/B thấp không đồng nghĩa cổ phiếu an toàn.
Cần kiểm tra chất lượng tài sản, ROE, triển vọng ngành và minh bạch thông tin.
```

Đặc thù:

```txt
P/B thường hữu ích hơn với ngân hàng, chứng khoán, bảo hiểm và doanh nghiệp tài sản lớn.
Với công ty công nghệ hoặc doanh nghiệp nhẹ tài sản, P/B có thể kém ý nghĩa hơn.
```

Module sử dụng:

```txt
valuation
risk
overview
ai
```

---

### 10.5. P/S

```txt
Key: ps_ratio
Tên tiếng Việt: P/S
```

Dữ liệu đầu vào:

```txt
market_cap
revenue
```

Công thức:

```txt
P/S = market_cap / revenue
```

Điều kiện tính:

```txt
market_cap > 0
revenue > 0
```

Cách đọc:

```txt
P/S cho biết thị trường đang trả bao nhiêu đồng cho một đồng doanh thu.
```

Cảnh báo:

```txt
P/S không phản ánh lợi nhuận.
Doanh nghiệp doanh thu lớn nhưng biên lợi nhuận thấp vẫn có thể kém hấp dẫn.
```

Module sử dụng:

```txt
valuation
screening
risk
ai
```

---

### 10.6. EV/EBITDA

```txt
Key: ev_ebitda
Tên tiếng Việt: EV/EBITDA
```

Dữ liệu đầu vào:

```txt
market_cap
total_debt
cash_and_equivalents
ebitda
```

Công thức:

```txt
Enterprise Value = market_cap + total_debt - cash_and_equivalents
EV/EBITDA = Enterprise Value / EBITDA
```

Điều kiện tính:

```txt
market_cap không null
total_debt không null
cash_and_equivalents không null
ebitda > 0
```

Cách đọc:

```txt
EV/EBITDA giúp so sánh giá trị doanh nghiệp với lợi nhuận trước lãi vay, thuế và khấu hao.
```

Cảnh báo:

```txt
EV/EBITDA không thay thế phân tích dòng tiền.
Không dùng nếu EBITDA âm hoặc thiếu dữ liệu.
```

Module sử dụng:

```txt
valuation
risk
ai
```

---

### 10.7. Earnings Yield

```txt
Key: earnings_yield
Tên tiếng Việt: Tỷ suất lợi nhuận trên giá
```

Dữ liệu đầu vào:

```txt
eps
close_price
```

Công thức:

```txt
Earnings Yield = eps / close_price
```

Điều kiện tính:

```txt
eps > 0
close_price > 0
```

Cách đọc:

```txt
Earnings Yield là nghịch đảo của P/E, giúp nhìn lợi nhuận tương đối so với giá.
```

Cảnh báo:

```txt
Earnings Yield cao không tự động hấp dẫn nếu lợi nhuận không bền vững.
```

Module sử dụng:

```txt
valuation
ai
```

---

### 10.8. Dividend Yield

```txt
Key: dividend_yield
Tên tiếng Việt: Tỷ suất cổ tức
```

Dữ liệu đầu vào:

```txt
dividend_per_share
close_price
```

Công thức:

```txt
Dividend Yield = dividend_per_share / close_price
```

Điều kiện tính:

```txt
dividend_per_share không null
close_price > 0
```

Cách đọc:

```txt
Dividend Yield cho biết cổ tức tiền mặt so với giá cổ phiếu hiện tại.
```

Cảnh báo:

```txt
Cổ tức cao không tự động tốt nếu doanh nghiệp phải vay nợ để trả cổ tức hoặc lợi nhuận suy giảm.
```

Module sử dụng:

```txt
valuation
watchlist
ai
```

---

### 10.9. Market Cap

```txt
Key: market_cap
Tên tiếng Việt: Vốn hóa thị trường
```

Dữ liệu đầu vào:

```txt
close_price
shares_outstanding
market_cap nếu nguồn đã có
```

Công thức:

```txt
Market Cap = close_price * shares_outstanding
```

Cách đọc:

```txt
Market Cap cho biết quy mô thị trường đang định giá doanh nghiệp.
```

Cảnh báo:

```txt
Vốn hóa lớn không đồng nghĩa an toàn.
Vốn hóa nhỏ không đồng nghĩa rẻ.
Cần kiểm tra thanh khoản, chất lượng doanh nghiệp và định giá.
```

Module sử dụng:

```txt
overview
valuation
risk
screening
watchlist
ai
```

---

### 10.10. Enterprise Value

```txt
Key: enterprise_value
Tên tiếng Việt: Giá trị doanh nghiệp
```

Dữ liệu đầu vào:

```txt
market_cap
total_debt
cash_and_equivalents
```

Công thức:

```txt
Enterprise Value = market_cap + total_debt - cash_and_equivalents
```

Cách đọc:

```txt
Enterprise Value phản ánh giá trị doanh nghiệp bao gồm cả vốn chủ thị trường và nợ vay ròng.
```

Cảnh báo:

```txt
Nếu thiếu debt hoặc cash, không tính EV.
```

Module sử dụng:

```txt
valuation
risk
ai
```

---

## 11. Nhóm giá, thanh khoản và thời điểm

Nhóm này phục vụ module Giá - Thanh khoản - Thời điểm, Watchlist, Mô phỏng và Liquidity Risk.

---

### 11.1. Price Change Percent

```txt
Key: price_change_pct
Tên tiếng Việt: Tỷ lệ biến động giá
```

Dữ liệu đầu vào:

```txt
close_price_current
close_price_previous
```

Công thức:

```txt
Price Change % = close_price_current / close_price_previous - 1
```

Cách đọc:

```txt
Chỉ số này cho biết giá cổ phiếu tăng hoặc giảm bao nhiêu so với kỳ trước.
```

Cảnh báo:

```txt
Giá tăng không phải tín hiệu mua.
Giá giảm không tự động nghĩa là doanh nghiệp xấu.
Cần kết hợp với thanh khoản, tin tức, định giá và nền tảng doanh nghiệp.
```

Module sử dụng:

```txt
technical
watchlist
simulation
risk
ai
```

---

### 11.2. Trading Value

```txt
Key: trading_value
Tên tiếng Việt: Giá trị giao dịch
```

Dữ liệu đầu vào:

```txt
close_price
volume
trading_value nếu nguồn đã cung cấp
```

Công thức:

```txt
Trading Value = close_price * volume
```

Cách đọc:

```txt
Trading Value cho biết lượng tiền giao dịch trong phiên.
Chỉ số này thường hữu ích hơn volume khi đánh giá thanh khoản.
```

Cảnh báo:

```txt
Volume cao nhưng giá trị giao dịch thấp có thể xảy ra ở cổ phiếu giá thấp.
Cần ưu tiên trading_value khi đánh giá khả năng mua/bán.
```

Module sử dụng:

```txt
technical
risk
watchlist
simulation
ai
```

---

### 11.3. Average Trading Value 20D

```txt
Key: avg_trading_value_20d
Tên tiếng Việt: Giá trị giao dịch trung bình 20 phiên
```

Dữ liệu đầu vào:

```txt
trading_value trong 20 phiên gần nhất
```

Công thức:

```txt
Avg Trading Value 20D = trung bình trading_value của 20 phiên gần nhất
```

Cách đọc:

```txt
Chỉ số này giúp đánh giá thanh khoản gần đây của cổ phiếu.
```

Cảnh báo:

```txt
Thanh khoản thấp làm tăng rủi ro khó mua/bán và biến động giá mạnh.
```

Module sử dụng:

```txt
technical
risk
watchlist
simulation
ai
```

---

### 11.4. Liquidity Status

```txt
Key: liquidity_status
Tên tiếng Việt: Trạng thái thanh khoản
```

Dữ liệu đầu vào:

```txt
volume
trading_value
avg_volume_20d
avg_trading_value_20d
market_cap
free_float nếu có
```

Logic phân loại:

```txt
high: thanh khoản đủ tốt so với nhu cầu nhà đầu tư cá nhân, dữ liệu ổn định.
medium: thanh khoản có thể chấp nhận nhưng cần theo dõi.
low: thanh khoản thấp, cần cảnh báo khó mua/bán.
unknown: thiếu volume hoặc trading_value.
```

Cách đọc:

```txt
Thanh khoản cho biết cổ phiếu có dễ mua/bán không.
```

Cảnh báo:

```txt
Thanh khoản thấp không tự động nghĩa là doanh nghiệp xấu.
Nhưng thanh khoản thấp làm tăng rủi ro thực thi giao dịch.
```

Module sử dụng:

```txt
technical
risk
watchlist
simulation
ai
```

---

## 12. Trạng thái sức khỏe tài chính tổng hợp

Module Tổng quan và Báo cáo tài chính cần một trạng thái tổng hợp.

```txt
Key: financial_health_status
```

Các trạng thái:

```txt
healthy_preliminary
watch
risk
mixed
insufficient_data
```

Ý nghĩa:

```txt
healthy_preliminary:
Dữ liệu hiện có chưa phát hiện cảnh báo lớn về sức khỏe tài chính, nhưng vẫn cần kiểm tra định giá và rủi ro.

watch:
Có một số điểm cần theo dõi, nhưng chưa đủ để kết luận rủi ro cao.

risk:
Có nhiều cảnh báo tài chính rõ ràng, cần kiểm tra kỹ trước khi đưa vào watchlist hoặc mô phỏng.

mixed:
Dữ liệu trái chiều, ví dụ doanh thu/lợi nhuận tốt nhưng dòng tiền yếu hoặc nợ tăng.

insufficient_data:
Chưa đủ dữ liệu để đánh giá sức khỏe tài chính.
```

Đầu vào gợi ý:

```txt
revenue_growth
net_profit_growth
gross_margin
net_margin
roe
roa
debt_to_equity
liabilities_to_assets
current_ratio
cfo_to_net_profit
free_cash_flow
data_quality_status
```

Nguyên tắc:

```txt
Không tính điểm tổng hợp nếu thiếu quá nhiều dữ liệu lõi.
Không để một chỉ số đơn lẻ quyết định toàn bộ trạng thái.
Dòng tiền và nợ vay phải có trọng số cảnh báo cao hơn với người mới.
```

Output mẫu:

```json
{
  "financial_health_status": "watch",
  "score": 68,
  "summary": "Doanh thu và lợi nhuận có tín hiệu phục hồi, nhưng cần kiểm tra dòng tiền và tồn kho.",
  "supporting_points": [
    "Doanh thu tăng trở lại.",
    "Lợi nhuận sau thuế cải thiện."
  ],
  "warning_points": [
    "CFO chưa đi cùng lợi nhuận qua nhiều kỳ.",
    "Tồn kho tăng nhanh hơn doanh thu."
  ],
  "next_checks": [
    "Kiểm tra CFO/Net Profit.",
    "Kiểm tra tồn kho và khoản phải thu.",
    "Kiểm tra nợ vay và chi phí lãi vay."
  ]
}
```

---

## 13. Readiness để chuyển từ Báo cáo tài chính sang Định giá

Module Báo cáo tài chính cần xác định người dùng đã đủ điều kiện chuyển sang Định giá chưa.

```txt
Key: valuation_readiness_status
```

Trạng thái:

```txt
ready
needs_review
not_ready
```

Điều kiện `ready`:

```txt
Có dữ liệu lợi nhuận.
Có dữ liệu EPS hoặc đủ dữ liệu để tính EPS.
Có dữ liệu vốn chủ và số cổ phiếu nếu dùng P/B.
Chất lượng lợi nhuận không có cảnh báo nghiêm trọng.
Dòng tiền không quá lệch với lợi nhuận.
Nợ vay không có cảnh báo nghiêm trọng chưa xử lý.
```

Điều kiện `needs_review`:

```txt
Có thể định giá sơ bộ nhưng còn thiếu một số dữ liệu hoặc có cảnh báo cần đọc tiếp.
```

Điều kiện `not_ready`:

```txt
Thiếu EPS.
Thiếu giá cổ phiếu.
Thiếu dữ liệu tài chính lõi.
Lợi nhuận âm nhưng module vẫn cố dùng P/E.
Dữ liệu dòng tiền/nợ vay quá thiếu để đánh giá chất lượng lợi nhuận.
```

Output mẫu:

```json
{
  "valuation_readiness_status": "needs_review",
  "completed": 4,
  "total": 6,
  "reason": "Có thể xem định giá sơ bộ, nhưng cần kiểm tra thêm CFO và tồn kho.",
  "missing_or_weak_items": [
    "CFO/Net Profit chưa ổn định.",
    "Tồn kho tăng nhanh hơn doanh thu."
  ],
  "next_step_suggestion": "Kiểm tra dòng tiền và vốn lưu động trước khi tin vào P/E."
}
```

---

## 14. Data Quality Status

```txt
Key: data_quality_status
```

Trạng thái:

```txt
sufficient
partial
missing
stale
low_confidence
```

Logic:

```txt
sufficient:
Có đủ dữ liệu lõi, có nguồn, có kỳ thời gian rõ ràng.

partial:
Có dữ liệu để xem tổng quan nhưng thiếu một số field quan trọng.

missing:
Thiếu dữ liệu lõi nên không tính được chỉ số chính.

stale:
Dữ liệu đã cũ, cần cập nhật.

low_confidence:
Dữ liệu có nguồn chưa rõ, đơn vị chưa chắc, hoặc chỉ có dữ liệu đơn kỳ nên khó kết luận.
```

Dữ liệu lõi bắt buộc:

```txt
ticker
company_name
company_type
fiscal_year
period_type
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

Nếu thiếu nguồn:

```txt
Không chặn hoàn toàn phân tích,
nhưng tăng data_quality_risk
và hiển thị cảnh báo.
```

---

## 15. Quy tắc diễn giải bị cấm

### 15.1. Với tăng trưởng

Không được nói:

```txt
Doanh thu tăng nghĩa là doanh nghiệp tốt.
Lợi nhuận tăng nghĩa là nên mua.
```

Nên nói:

```txt
Doanh thu/lợi nhuận tăng là tín hiệu cần ghi nhận,
nhưng cần kiểm tra biên lợi nhuận, dòng tiền, nợ vay và chất lượng tăng trưởng.
```

---

### 15.2. Với ROE

Không được nói:

```txt
ROE cao nghĩa là doanh nghiệp chắc chắn tốt.
```

Nên nói:

```txt
ROE cao là điểm tích cực,
nhưng cần kiểm tra ROE đến từ hiệu quả thật,
đòn bẩy tài chính,
vốn chủ thấp bất thường
hay lợi nhuận một lần.
```

---

### 15.3. Với dòng tiền

Không được nói:

```txt
Dòng tiền âm nghĩa là doanh nghiệp xấu.
```

Nên nói:

```txt
Dòng tiền âm cần được xem trong bối cảnh.
Nếu doanh nghiệp đang đầu tư mở rộng, FCF âm có thể chấp nhận được.
Nhưng nếu lợi nhuận dương mà CFO âm kéo dài, cần cảnh báo chất lượng lợi nhuận.
```

---

### 15.4. Với P/E

Không được nói:

```txt
P/E thấp nghĩa là cổ phiếu rẻ.
P/E cao nghĩa là cổ phiếu đắt.
```

Nên nói:

```txt
P/E thấp có thể phản ánh định giá thấp hơn,
nhưng cũng có thể do thị trường lo ngại lợi nhuận suy giảm,
chất lượng lợi nhuận thấp,
rủi ro ngành
hoặc doanh nghiệp đang ở cuối chu kỳ.
```

---

### 15.5. Với P/B

Không được nói:

```txt
P/B thấp nghĩa là cổ phiếu an toàn.
```

Nên nói:

```txt
P/B thấp cần được kiểm tra cùng chất lượng tài sản, ROE, triển vọng ngành và rủi ro minh bạch.
```

---

### 15.6. Với risk score

Không được nói:

```txt
Risk thấp nghĩa là nên mua.
Risk cao nghĩa là nên bán.
```

Nên nói:

```txt
Risk thấp nghĩa là hệ thống hiện chưa phát hiện nhiều cảnh báo lớn từ dữ liệu hiện có.
Risk cao nghĩa là có nhiều điểm cần kiểm tra thêm.
Cả hai trường hợp đều không phải khuyến nghị mua/bán.
```

---

## 16. Mapping chỉ số theo module

### 16.1. Overview

```txt
revenue_growth
net_profit_growth
roe
debt_to_equity
cfo_to_net_profit
pe_ratio
pb_ratio
financial_health_status
overall_risk_level
data_quality_status
```

Mục tiêu hiển thị:

```txt
Tóm tắt nhanh.
Cảnh báo chính.
Bước tiếp theo.
Không kết luận đầu tư.
```

---

### 16.2. Financials

```txt
revenue_growth
gross_profit_growth
operating_profit_growth
net_profit_growth
gross_margin
operating_margin
net_margin
roa
roe
debt_to_equity
liabilities_to_assets
net_debt
current_ratio
quick_ratio
interest_coverage
cash_to_debt
short_term_debt_ratio
operating_cash_flow
cfo_to_net_profit
free_cash_flow
fcf_margin
capex_to_revenue
operating_cash_flow_margin
fcf_to_net_profit
accounts_receivable_growth_vs_revenue_growth
inventory_growth_vs_revenue_growth
valuation_readiness_status
```

Mục tiêu hiển thị:

```txt
Đọc sức khỏe tài chính.
Kiểm tra chất lượng lợi nhuận.
Kiểm tra nợ.
Kiểm tra dòng tiền.
Kiểm tra vốn lưu động.
Quyết định có đủ điều kiện sang định giá chưa.
```

---

### 16.3. Valuation

```txt
eps
bvps
pe_ratio
pb_ratio
ps_ratio
ev_ebitda
earnings_yield
dividend_yield
market_cap
enterprise_value
net_profit_growth
roe
cfo_to_net_profit
data_quality_status
```

Mục tiêu hiển thị:

```txt
Dữ liệu đầu vào định giá.
Chỉ số định giá hiện tại.
Cảnh báo phương pháp.
Độ tin cậy.
Không kết luận mua/bán.
```

---

### 16.4. Risk

```txt
debt_to_equity
liabilities_to_assets
net_debt
current_ratio
interest_coverage
cash_to_debt
short_term_debt_ratio
cfo_to_net_profit
free_cash_flow
accounts_receivable_growth_vs_revenue_growth
inventory_growth_vs_revenue_growth
pe_ratio
pb_ratio
liquidity_status
data_quality_status
```

Mục tiêu hiển thị:

```txt
Tách từng nhóm rủi ro.
Giải thích lý do.
Chỉ ra dữ liệu còn thiếu.
Đề xuất điểm cần kiểm tra thêm.
```

---

### 16.5. Technical / Price Volume Time

```txt
close_price
price_change_pct
volume
trading_value
avg_volume_20d
avg_trading_value_20d
liquidity_status
```

Mục tiêu hiển thị:

```txt
Quan sát hành vi giá và thanh khoản.
Tránh FOMO.
Không biến price/volume thành tín hiệu mua/bán tuyệt đối.
```

---

### 16.6. Watchlist

```txt
financial_health_status
valuation_status
overall_risk_level
data_quality_status
missing_fields
next_step_suggestion
last_reviewed_at
```

Mục tiêu hiển thị:

```txt
Quản lý tiến độ phân tích.
Biết mã nào còn thiếu dữ liệu.
Biết mã nào cần đọc tiếp.
Không chỉ là danh sách cổ phiếu.
```

---

### 16.7. AI Assistant

AI cần nhận context:

```txt
ticker
company_name
industry
company_type
selected_module
selected_period
financial_snapshot
ratio_summary
valuation_summary
risk_summary
missing_fields
warnings
source
last_updated
```

AI phải trả lời theo cấu trúc:

```txt
1. Dữ liệu hiện tại cho thấy gì?
2. Ý nghĩa của dữ liệu là gì?
3. Điểm cần cẩn trọng là gì?
4. Dữ liệu nào còn thiếu?
5. Người dùng nên kiểm tra thêm gì?
6. Nhắc rằng đây không phải khuyến nghị mua/bán.
```

---

## 17. Danh sách chỉ số ưu tiên triển khai V1

### 17.1. Bắt buộc có

```txt
revenue_growth
net_profit_growth
gross_margin
net_margin
roa
roe
debt_to_equity
liabilities_to_assets
current_ratio
operating_cash_flow
cfo_to_net_profit
free_cash_flow
eps
bvps
pe_ratio
pb_ratio
market_cap
price_change_pct
trading_value
liquidity_status
data_quality_status
financial_health_status
valuation_readiness_status
```

Nếu chưa có nhóm này, sản phẩm sẽ khó đứng vững vì module Financials, Valuation, Risk và Overview chưa có bộ não chung.

---

### 17.2. Nên có

```txt
operating_margin
operating_profit_growth
gross_profit_growth
eps_growth
asset_growth
equity_growth
net_debt
quick_ratio
interest_coverage
cash_to_debt
short_term_debt_ratio
fcf_margin
capex_to_revenue
operating_cash_flow_margin
fcf_to_net_profit
ps_ratio
earnings_yield
avg_volume_20d
avg_trading_value_20d
```

---

### 17.3. Có thì tốt

```txt
roic
ebitda_margin
ev_ebitda
dividend_yield
enterprise_value
receivables_growth_vs_revenue_growth
inventory_growth_vs_revenue_growth
foreign_buy_value
foreign_sell_value
free_float
```

---

## 18. Test case bắt buộc

### 18.1. EPS âm

Input:

```json
{
  "close_price": 50000,
  "eps": -1200
}
```

Expected:

```json
{
  "pe_ratio": null,
  "level": "not_applicable",
  "warning": "EPS âm nên không diễn giải P/E theo cách thông thường."
}
```

---

### 18.2. Thiếu CFO

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
  "cfo_to_net_profit": null,
  "missing_fields": ["operating_cash_flow"],
  "warning": "Chưa đủ dữ liệu dòng tiền kinh doanh để đánh giá chất lượng lợi nhuận."
}
```

---

### 18.3. ROE cao nhưng nợ cao

Input:

```json
{
  "roe": 0.32,
  "debt_to_equity": 2.1,
  "cfo_to_net_profit": 0.4
}
```

Expected:

```json
{
  "roe_level": "watch",
  "warning": "ROE cao cần được kiểm tra cùng đòn bẩy tài chính và chất lượng dòng tiền."
}
```

---

### 18.4. Doanh thu tăng nhưng biên lợi nhuận giảm

Input:

```json
{
  "revenue_growth": 0.18,
  "gross_margin_current": 0.18,
  "gross_margin_previous": 0.23
}
```

Expected:

```json
{
  "level": "watch",
  "warning": "Doanh thu tăng nhưng biên lợi nhuận giảm, cần kiểm tra giá vốn, cạnh tranh và cơ cấu sản phẩm."
}
```

---

### 18.5. Lợi nhuận dương nhưng CFO âm

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
  "cfo_to_net_profit": -0.32,
  "level": "risk",
  "warning": "Lợi nhuận dương nhưng dòng tiền kinh doanh âm, cần kiểm tra khoản phải thu, tồn kho và chất lượng lợi nhuận."
}
```

---

### 18.6. Thiếu nguồn dữ liệu

Input:

```json
{
  "source_name": null,
  "source_url": null
}
```

Expected:

```json
{
  "data_quality_status": "low_confidence",
  "warning": "Nguồn dữ liệu chưa được xác nhận đầy đủ."
}
```

---

## 19. Gợi ý triển khai code sau file này

Sau khi chốt file này, nên tạo thư mục:

```txt
src/lib/financial-logic/
```

Các file đề xuất:

```txt
types.ts
metrics.ts
valuation-metrics.ts
risk-inputs.ts
financial-health.ts
data-quality.ts
explanations.ts
```

Vai trò:

```txt
types.ts
→ Định nghĩa MetricResult, DataQuality, MetricLevel.

metrics.ts
→ Tính chỉ số tài chính cơ bản.

valuation-metrics.ts
→ Tính EPS, BVPS, P/E, P/B, P/S, EV/EBITDA.

risk-inputs.ts
→ Chuẩn hóa input cho risk score.

financial-health.ts
→ Tổng hợp sức khỏe tài chính.

data-quality.ts
→ Kiểm tra missing_fields, stale data, source.

explanations.ts
→ Lưu câu giải thích chuẩn cho người mới.
```

Nguyên tắc code:

```txt
Không function nào được tự bịa dữ liệu.
Không function nào được trả 0 nếu thiếu dữ liệu.
Không function nào được trả khuyến nghị mua/bán.
Mọi function phải trả missing_fields nếu thiếu input.
Mọi function nên trả warning nếu chỉ số dễ gây hiểu nhầm.
```

---

## 20. Kết luận

`FINANCIAL_METRICS_LOGIC.md` là lớp nằm giữa dữ liệu thô và giao diện phân tích.

Nếu chỉ có dữ liệu thô, người mới vẫn không hiểu.

Nếu chỉ có giao diện đẹp, hệ thống vẫn rỗng.

Nếu chỉ có AI, AI dễ trả lời chung chung hoặc bịa context.

Vì vậy file này phải đảm bảo:

```txt
Dữ liệu → Công thức → Chỉ số → Cảnh báo → Giải thích → Trạng thái module → Context cho AI
```

Nguyên tắc cuối cùng:

```txt
Không tính khi thiếu dữ liệu.
Không kết luận khi thiếu ngữ cảnh.
Không khuyến nghị mua/bán.
Không để người mới hiểu sai chỉ số.
Mỗi chỉ số phải đi kèm ý nghĩa, cảnh báo và bước kiểm tra tiếp theo.
```
