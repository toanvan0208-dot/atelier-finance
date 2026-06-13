# VALUATION_LOGIC.md

# Logic định giá cho Atelier Finance

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa logic định giá cổ phiếu trong hệ thống Atelier Finance.

Mục tiêu không phải là đưa ra khuyến nghị mua/bán/nắm giữ, mà là giúp người dùng hiểu:

```txt
Cổ phiếu đang được thị trường định giá như thế nào?
Phương pháp định giá nào phù hợp?
Dữ liệu đầu vào có đủ tin cậy không?
Kết quả định giá có những giới hạn nào?
Cần kiểm tra thêm điều gì trước khi tin vào kết quả định giá?
```

File này được dùng cho:

```txt
Module Định giá
Module Tổng quan
Module Rủi ro
Module Watchlist
AI Assistant
RAG Knowledge Base
Test case định giá
```

File này không thay thế:

```txt
FINANCIAL_DATA_REQUIREMENTS.md
→ Quy định dữ liệu đầu vào cần có.

FINANCIAL_METRICS_LOGIC.md
→ Quy định cách tính các chỉ số tài chính.

RISK_SCORE_LOGIC.md
→ Quy định cách chấm rủi ro.

AI_EXPLANATION_RULES.md
→ Quy định AI được nói gì và không được nói gì.
```

---

## 2. Nguyên tắc định giá cốt lõi

### 2.1. Định giá là vùng ước lượng, không phải con số chắc chắn

Hệ thống không được hiển thị định giá như một “giá trị đúng tuyệt đối”.

Không nên nói:

```txt
Giá trị hợp lý của cổ phiếu là 45.000đ.
```

Nên nói:

```txt
Theo giả định hiện tại, vùng giá trị hợp lý ước lượng nằm khoảng 40.000–48.000đ.
Kết quả này phụ thuộc vào lợi nhuận, dòng tiền, tăng trưởng, rủi ro và giả định định giá.
```

---

### 2.2. Không dùng định giá để đưa khuyến nghị mua/bán

Hệ thống không được nói:

```txt
Cổ phiếu đang rẻ nên mua.
Cổ phiếu đang đắt nên bán.
Đây là vùng mua tốt.
Đây là điểm mua an toàn.
```

Hệ thống chỉ được nói:

```txt
Cổ phiếu đang có mức định giá thấp/cao hơn so với một số tham chiếu.
Cần kiểm tra thêm chất lượng lợi nhuận, dòng tiền, rủi ro và bối cảnh ngành.
Đây không phải khuyến nghị mua/bán.
```

---

### 2.3. Thiếu dữ liệu thì không cố tính

Nếu thiếu dữ liệu đầu vào quan trọng, hệ thống phải trả:

```txt
value = null
status = not_ready hoặc insufficient_data
missing_fields = [...]
warning = "Chưa đủ dữ liệu để định giá theo phương pháp này."
```

Không được:

```txt
Tự điền 0.
Tự giả định EPS.
Tự giả định WACC.
Tự giả định tăng trưởng dài hạn.
Tự giả định P/E ngành.
Tự bịa dữ liệu so sánh.
```

---

### 2.4. Mỗi kết quả định giá phải có độ tin cậy

Mọi kết quả định giá cần đi kèm:

```txt
valuation_method
input_data
assumptions
fair_value_range
confidence_level
warnings
missing_fields
not_financial_advice
```

Không được chỉ trả một con số định giá đơn lẻ.

---

## 3. Phạm vi phương pháp định giá

Hệ thống chia phương pháp định giá thành 2 lớp.

---

## 3.1. Lớp 1: Relative Valuation, triển khai trước

Đây là nhóm phương pháp định giá tương đối, phù hợp với V1 vì dễ giải thích cho người mới và ít phụ thuộc vào giả định dài hạn.

Các phương pháp:

```txt
P/E
P/B
P/S
EV/EBITDA nếu đủ dữ liệu
Dividend Yield nếu có dữ liệu cổ tức
Earnings Yield nếu có EPS và giá
```

Trạng thái:

```txt
Active in V1
```

---

## 3.2. Lớp 2: Intrinsic Valuation, định nghĩa nhưng chỉ chạy khi đủ dữ liệu

Đây là nhóm phương pháp định giá nội tại, cần nhiều giả định hơn.

Các phương pháp:

```txt
DCF
FCFF
FCFE
WACC
Terminal Value
Terminal Growth
```

Trạng thái:

```txt
Defined but gated
```

Nghĩa là:

```txt
Có định nghĩa logic.
Có quy tắc dữ liệu đầu vào.
Có quy tắc cảnh báo.
Có quy tắc không được tính khi thiếu dữ liệu.
Nhưng không bắt buộc chạy thật nếu hệ thống chưa đủ dữ liệu.
```

---

## 4. Chuẩn output chung cho module định giá

Mọi phương pháp định giá nên trả về format thống nhất.

```ts
type ValuationMethodStatus =
  | "active"
  | "not_ready"
  | "not_applicable"
  | "low_confidence"
  | "insufficient_data";

type ValuationConfidence =
  | "high"
  | "medium"
  | "low"
  | "unknown";

type ValuationMethodResult = {
  method_key: string;
  method_name: string;
  status: ValuationMethodStatus;

  current_price: number | null;
  fair_value: number | null;
  fair_value_low: number | null;
  fair_value_high: number | null;

  valuation_gap_pct: number | null;
  margin_of_safety_pct: number | null;

  confidence: ValuationConfidence;

  input_fields: string[];
  missing_fields: string[];

  assumptions: Record<string, number | string | null>;

  explanation: string;
  warning: string | null;
  beginner_interpretation: string;
  common_misread: string;

  not_financial_advice: true;
};
```

Ví dụ output:

```json
{
  "method_key": "pe_relative",
  "method_name": "Định giá theo P/E",
  "status": "active",
  "current_price": 50000,
  "fair_value": 54000,
  "fair_value_low": 48000,
  "fair_value_high": 60000,
  "valuation_gap_pct": 0.08,
  "margin_of_safety_pct": 0.074,
  "confidence": "medium",
  "input_fields": ["close_price", "eps", "target_pe"],
  "missing_fields": [],
  "assumptions": {
    "eps": 4000,
    "target_pe": 13.5
  },
  "explanation": "Phương pháp P/E ước tính giá trị dựa trên lợi nhuận trên mỗi cổ phiếu và mức P/E tham chiếu.",
  "warning": "P/E thấp hoặc cao cần được đọc cùng tăng trưởng, chất lượng lợi nhuận và bối cảnh ngành.",
  "beginner_interpretation": "Đây là cách ước lượng xem thị trường đang trả bao nhiêu cho một đồng lợi nhuận.",
  "common_misread": "Không được hiểu P/E thấp là cổ phiếu chắc chắn rẻ.",
  "not_financial_advice": true
}
```

---

## 5. Valuation Readiness

Trước khi định giá, hệ thống phải kiểm tra xem dữ liệu đã đủ chưa.

```txt
Key: valuation_readiness
```

### 5.1. Trạng thái

```txt
ready
needs_review
not_ready
```

---

### 5.2. Điều kiện ready

Trạng thái `ready` khi:

```txt
Có close_price.
Có EPS hoặc đủ dữ liệu để tính EPS.
Có BVPS hoặc đủ dữ liệu để tính BVPS nếu dùng P/B.
Có revenue nếu dùng P/S.
Có market_cap nếu dùng P/S hoặc EV/EBITDA.
Có dữ liệu nợ vay và tiền mặt nếu dùng Enterprise Value.
Có operating_cash_flow để kiểm tra chất lượng lợi nhuận.
Có nguồn dữ liệu rõ ràng.
Không có cảnh báo nghiêm trọng về dữ liệu thiếu.
```

---

### 5.3. Điều kiện needs_review

Trạng thái `needs_review` khi:

```txt
Có thể tính một số phương pháp cơ bản,
nhưng còn thiếu dữ liệu so sánh ngành,
thiếu dữ liệu lịch sử,
thiếu CFO,
thiếu nguồn dữ liệu,
hoặc có cảnh báo về lợi nhuận/dòng tiền.
```

Ví dụ:

```txt
Có EPS và giá nên tính được P/E,
nhưng thiếu CFO nên chưa đánh giá được chất lượng lợi nhuận.
```

---

### 5.4. Điều kiện not_ready

Trạng thái `not_ready` khi:

```txt
Thiếu close_price.
Thiếu EPS và không đủ dữ liệu để tính EPS.
EPS âm nhưng module vẫn cố dùng P/E.
Thiếu total_equity/BVPS khi muốn dùng P/B.
Thiếu revenue/market_cap khi muốn dùng P/S.
Thiếu quá nhiều dữ liệu lõi.
```

---

### 5.5. Output mẫu

```json
{
  "status": "needs_review",
  "completed": 5,
  "total": 7,
  "reason": "Có thể định giá sơ bộ bằng P/E và P/B, nhưng cần kiểm tra thêm dòng tiền và dữ liệu ngành.",
  "missing_or_weak_items": [
    "Thiếu dữ liệu P/E ngành",
    "Thiếu dữ liệu CFO/Net Profit",
    "Chưa có dữ liệu lịch sử P/E"
  ],
  "next_step_suggestion": "Kiểm tra chất lượng lợi nhuận và so sánh ngành trước khi tin vào kết quả định giá."
}
```

---

## 6. Valuation Confidence

```txt
Key: valuation_confidence
```

Valuation Confidence cho biết mức độ đáng tin cậy của kết quả định giá.

Nó không phải khuyến nghị đầu tư.

---

### 6.1. High Confidence

Điều kiện:

```txt
Có đủ dữ liệu giá, EPS/BVPS, revenue, market_cap.
Lợi nhuận dương.
Dòng tiền kinh doanh không quá lệch với lợi nhuận.
Không có cảnh báo dữ liệu thiếu nghiêm trọng.
Có dữ liệu so sánh ngành hoặc lịch sử.
Có nguồn dữ liệu rõ ràng.
```

Cách diễn giải:

```txt
Kết quả định giá có độ tin cậy tương đối tốt trong phạm vi dữ liệu hiện tại,
nhưng vẫn phụ thuộc vào giả định và bối cảnh thị trường.
```

---

### 6.2. Medium Confidence

Điều kiện:

```txt
Có dữ liệu cơ bản để tính.
Thiếu một phần dữ liệu ngành hoặc dữ liệu lịch sử.
Có một số cảnh báo nhẹ về dòng tiền hoặc dữ liệu.
```

Cách diễn giải:

```txt
Kết quả có thể dùng để tham khảo sơ bộ,
nhưng cần kiểm tra thêm trước khi đưa vào luận điểm đầu tư.
```

---

### 6.3. Low Confidence

Điều kiện:

```txt
Thiếu dữ liệu quan trọng.
Lợi nhuận biến động mạnh.
CFO yếu hoặc âm.
Nguồn dữ liệu chưa rõ.
Chỉ có dữ liệu một kỳ.
Không có dữ liệu so sánh.
```

Cách diễn giải:

```txt
Kết quả định giá có độ tin cậy thấp và không nên được dùng riêng lẻ.
```

---

### 6.4. Unknown

Điều kiện:

```txt
Không đủ dữ liệu để đánh giá độ tin cậy.
```

Cách diễn giải:

```txt
Chưa đủ dữ liệu để đánh giá độ tin cậy của định giá.
```

---

## 7. P/E Valuation

```txt
Key: pe_valuation
Trạng thái: Active in V1
```

---

### 7.1. Ý nghĩa

P/E cho biết nhà đầu tư đang trả bao nhiêu đồng cho một đồng lợi nhuận của doanh nghiệp.

P/E thường phù hợp hơn với doanh nghiệp:

```txt
Có lợi nhuận dương.
Lợi nhuận tương đối ổn định.
Không bị ảnh hưởng quá mạnh bởi khoản bất thường.
Có thể so sánh với ngành hoặc lịch sử.
```

---

### 7.2. Dữ liệu đầu vào

```txt
close_price
eps
eps_ttm nếu có
eps_annual nếu có
net_profit
shares_outstanding
historical_pe nếu có
industry_pe nếu có
target_pe nếu có
```

---

### 7.3. Công thức

```txt
P/E = close_price / eps
```

Giá trị hợp lý theo P/E:

```txt
Fair Value = EPS * Target P/E
```

Vùng giá trị hợp lý:

```txt
Fair Value Low = EPS * Bear P/E
Fair Value Base = EPS * Base P/E
Fair Value High = EPS * Bull P/E
```

---

### 7.4. Điều kiện được tính

Chỉ tính P/E khi:

```txt
close_price > 0
eps > 0
EPS không phải lợi nhuận bất thường
Dữ liệu EPS có nguồn rõ ràng
```

Nếu EPS được tự tính:

```txt
EPS = net_profit_parent / shares_outstanding
```

Phải kiểm tra đơn vị dữ liệu.

---

### 7.5. Không được tính hoặc không được diễn giải thông thường khi

```txt
EPS <= 0
close_price thiếu
EPS thiếu
shares_outstanding thiếu khi cần tự tính EPS
lợi nhuận có khoản bất thường lớn
doanh nghiệp đang ở đỉnh/đáy chu kỳ lợi nhuận
```

---

### 7.6. Cảnh báo bắt buộc

P/E thấp không đồng nghĩa cổ phiếu rẻ.

P/E thấp có thể do:

```txt
Thị trường kỳ vọng lợi nhuận giảm.
Doanh nghiệp có rủi ro tài chính.
Lợi nhuận hiện tại không bền vững.
Doanh nghiệp đang ở đỉnh chu kỳ.
Thanh khoản thấp.
Rủi ro ngành hoặc rủi ro quản trị.
```

P/E cao không đồng nghĩa cổ phiếu đắt.

P/E cao có thể do:

```txt
Doanh nghiệp có tăng trưởng cao.
Biên lợi nhuận tốt.
Chất lượng lợi nhuận tốt.
ROE cao và bền vững.
Thị trường kỳ vọng dài hạn tích cực.
```

---

### 7.7. Output khi EPS âm

```json
{
  "method_key": "pe_valuation",
  "status": "not_applicable",
  "fair_value": null,
  "confidence": "unknown",
  "missing_fields": [],
  "warning": "EPS âm hoặc bằng 0 nên không thể diễn giải P/E theo cách thông thường.",
  "beginner_interpretation": "Khi doanh nghiệp không có lợi nhuận dương, P/E không còn là thước đo phù hợp để nói cổ phiếu rẻ hay đắt.",
  "not_financial_advice": true
}
```

---

## 8. P/B Valuation

```txt
Key: pb_valuation
Trạng thái: Active in V1
```

---

### 8.1. Ý nghĩa

P/B cho biết thị trường đang trả bao nhiêu lần so với giá trị sổ sách của mỗi cổ phiếu.

P/B thường hữu ích hơn với:

```txt
Ngân hàng
Chứng khoán
Bảo hiểm
Doanh nghiệp tài sản lớn
Doanh nghiệp có tài sản hữu hình quan trọng
```

P/B có thể kém ý nghĩa hơn với:

```txt
Doanh nghiệp công nghệ
Doanh nghiệp thương hiệu mạnh nhưng ít tài sản hữu hình
Doanh nghiệp dịch vụ nhẹ tài sản
```

---

### 8.2. Dữ liệu đầu vào

```txt
close_price
bvps
book_value_per_share
total_equity
shares_outstanding
roe
historical_pb nếu có
industry_pb nếu có
target_pb nếu có
```

---

### 8.3. Công thức

```txt
P/B = close_price / BVPS
```

Giá trị hợp lý theo P/B:

```txt
Fair Value = BVPS * Target P/B
```

Vùng giá trị hợp lý:

```txt
Fair Value Low = BVPS * Bear P/B
Fair Value Base = BVPS * Base P/B
Fair Value High = BVPS * Bull P/B
```

---

### 8.4. Điều kiện được tính

Chỉ tính P/B khi:

```txt
close_price > 0
BVPS > 0
total_equity > 0
shares_outstanding > 0 nếu cần tự tính BVPS
```

---

### 8.5. Không được tính hoặc không được diễn giải thông thường khi

```txt
BVPS <= 0
total_equity <= 0
close_price thiếu
total_equity thiếu
shares_outstanding thiếu khi cần tự tính BVPS
```

---

### 8.6. Cảnh báo bắt buộc

P/B thấp không đồng nghĩa cổ phiếu an toàn.

P/B thấp có thể do:

```txt
Chất lượng tài sản kém.
ROE thấp.
Lợi nhuận suy giảm.
Nợ xấu hoặc dự phòng tăng với nhóm tài chính.
Tài sản ghi sổ không phản ánh giá trị thực.
Rủi ro minh bạch hoặc quản trị.
```

P/B cao không đồng nghĩa cổ phiếu đắt tuyệt đối.

P/B cao có thể hợp lý nếu:

```txt
ROE cao.
Tăng trưởng tốt.
Chất lượng tài sản tốt.
Lợi thế cạnh tranh mạnh.
Khả năng sinh lời trên vốn chủ tốt.
```

---

### 8.7. Liên hệ giữa P/B và ROE

P/B cần đọc cùng ROE.

```txt
P/B cao + ROE cao và bền vững
→ có thể hợp lý hơn.

P/B cao + ROE thấp
→ cần cảnh báo định giá.

P/B thấp + ROE thấp
→ không tự động rẻ.

P/B thấp + vốn chủ có vấn đề
→ cần cảnh báo chất lượng tài sản.
```

---

## 9. P/S Valuation

```txt
Key: ps_valuation
Trạng thái: Optional in V1
```

---

### 9.1. Ý nghĩa

P/S cho biết thị trường đang trả bao nhiêu đồng cho một đồng doanh thu.

P/S có thể dùng khi:

```txt
Doanh nghiệp có doanh thu ổn định.
Lợi nhuận ngắn hạn chưa phản ánh đúng tiềm năng.
Cần so sánh các doanh nghiệp cùng ngành.
```

---

### 9.2. Dữ liệu đầu vào

```txt
market_cap
revenue
close_price
shares_outstanding
industry_ps nếu có
historical_ps nếu có
target_ps nếu có
```

---

### 9.3. Công thức

```txt
P/S = market_cap / revenue
```

Giá trị hợp lý theo P/S:

```txt
Fair Market Cap = Revenue * Target P/S
Fair Value Per Share = Fair Market Cap / Shares Outstanding
```

---

### 9.4. Điều kiện được tính

```txt
market_cap > 0
revenue > 0
shares_outstanding > 0 nếu cần tính fair value per share
```

---

### 9.5. Cảnh báo bắt buộc

P/S không phản ánh lợi nhuận.

Doanh nghiệp có doanh thu lớn nhưng:

```txt
Biên lợi nhuận thấp
Chi phí cao
Dòng tiền yếu
Nợ vay cao
```

thì P/S thấp chưa chắc là hấp dẫn.

Không được dùng P/S để kết luận cổ phiếu rẻ nếu chưa kiểm tra lợi nhuận và dòng tiền.

---

## 10. EV/EBITDA Valuation

```txt
Key: ev_ebitda_valuation
Trạng thái: Optional in V1
```

---

### 10.1. Ý nghĩa

EV/EBITDA so sánh giá trị doanh nghiệp với lợi nhuận trước lãi vay, thuế và khấu hao.

Chỉ số này hữu ích khi muốn so sánh doanh nghiệp có cấu trúc vốn khác nhau.

---

### 10.2. Dữ liệu đầu vào

```txt
market_cap
total_debt
cash_and_equivalents
ebitda
shares_outstanding
historical_ev_ebitda nếu có
industry_ev_ebitda nếu có
target_ev_ebitda nếu có
```

---

### 10.3. Công thức

```txt
Enterprise Value = Market Cap + Total Debt - Cash and Equivalents
EV/EBITDA = Enterprise Value / EBITDA
```

Giá trị hợp lý:

```txt
Fair Enterprise Value = EBITDA * Target EV/EBITDA
Fair Equity Value = Fair Enterprise Value - Total Debt + Cash and Equivalents
Fair Value Per Share = Fair Equity Value / Shares Outstanding
```

---

### 10.4. Điều kiện được tính

```txt
market_cap > 0
ebitda > 0
total_debt không null
cash_and_equivalents không null
shares_outstanding > 0 nếu cần tính giá trị mỗi cổ phiếu
```

---

### 10.5. Cảnh báo bắt buộc

EV/EBITDA không thay thế phân tích dòng tiền.

EBITDA không phản ánh:

```txt
Capex
Thay đổi vốn lưu động
Thuế
Chi phí lãi vay
Dòng tiền thật
```

Không được nói EV/EBITDA thấp là chắc chắn rẻ.

---

## 11. Dividend Yield Valuation

```txt
Key: dividend_yield_valuation
Trạng thái: Optional in V1
```

---

### 11.1. Ý nghĩa

Dividend Yield cho biết cổ tức tiền mặt nhận được so với giá cổ phiếu hiện tại.

---

### 11.2. Dữ liệu đầu vào

```txt
dividend_per_share
close_price
dividend_history nếu có
payout_ratio nếu có
free_cash_flow nếu có
net_profit nếu có
```

---

### 11.3. Công thức

```txt
Dividend Yield = Dividend Per Share / Close Price
```

---

### 11.4. Cảnh báo bắt buộc

Cổ tức cao không tự động tốt.

Cần kiểm tra:

```txt
Doanh nghiệp có đủ dòng tiền trả cổ tức không?
Cổ tức có bền vững không?
Payout ratio có quá cao không?
Doanh nghiệp có phải vay nợ để trả cổ tức không?
```

---

## 12. Earnings Yield

```txt
Key: earnings_yield
Trạng thái: Optional in V1
```

---

### 12.1. Ý nghĩa

Earnings Yield là nghịch đảo của P/E.

```txt
Earnings Yield = EPS / Close Price
```

Nó giúp người dùng nhìn lợi nhuận trên mỗi đồng giá cổ phiếu.

---

### 12.2. Điều kiện được tính

```txt
EPS > 0
Close Price > 0
```

---

### 12.3. Cảnh báo

Earnings Yield cao không tự động hấp dẫn nếu:

```txt
Lợi nhuận không bền vững.
Dòng tiền yếu.
Doanh nghiệp có rủi ro tài chính.
Ngành đang suy giảm.
```

---

## 13. DCF Valuation

```txt
Key: dcf_valuation
Trạng thái: Defined but gated
```

---

### 13.1. Ý nghĩa

DCF định giá doanh nghiệp dựa trên dòng tiền tương lai được chiết khấu về hiện tại.

DCF phù hợp khi:

```txt
Doanh nghiệp có dòng tiền tương đối ổn định.
Có thể dự phóng doanh thu, biên lợi nhuận, Capex và vốn lưu động.
Có đủ giả định về tỷ lệ chiết khấu và tăng trưởng dài hạn.
```

---

### 13.2. Lý do phải gated

DCF rất nhạy với giả định.

Một thay đổi nhỏ trong:

```txt
WACC
Terminal Growth
Biên lợi nhuận
Capex
Tăng trưởng doanh thu
```

có thể làm thay đổi mạnh kết quả định giá.

Vì vậy DCF không được tính nếu hệ thống không có đủ dữ liệu và giả định rõ ràng.

---

### 13.3. Dữ liệu đầu vào bắt buộc

```txt
historical_revenue
historical_operating_profit
historical_net_profit
historical_operating_cash_flow
capital_expenditure
working_capital
tax_rate
revenue_growth_assumptions
operating_margin_assumptions
capex_assumptions
working_capital_assumptions
discount_rate
terminal_growth_rate
net_debt
shares_outstanding
```

---

### 13.4. Công thức tổng quát

```txt
Enterprise Value = Sum of Present Value of Future Free Cash Flows + Present Value of Terminal Value
Equity Value = Enterprise Value - Net Debt
Fair Value Per Share = Equity Value / Shares Outstanding
```

---

### 13.5. Điều kiện được tính

Chỉ tính DCF khi:

```txt
Có đủ dữ liệu lịch sử dòng tiền.
Có giả định tăng trưởng rõ ràng.
Có discount_rate hoặc đủ dữ liệu để tính WACC.
Có terminal_growth_rate hợp lý.
Có net_debt.
Có shares_outstanding.
Có cảnh báo rõ về độ nhạy giả định.
```

---

### 13.6. Không được tính DCF khi

```txt
Thiếu free_cash_flow hoặc dữ liệu để tính FCFF/FCFE.
Thiếu discount_rate.
Thiếu terminal_growth_rate.
Thiếu shares_outstanding.
Dữ liệu dòng tiền quá biến động.
Doanh nghiệp không có dòng tiền ổn định và không có giả định hợp lý.
```

---

### 13.7. Output khi chưa đủ dữ liệu

```json
{
  "method_key": "dcf_valuation",
  "status": "not_ready",
  "fair_value": null,
  "confidence": "unknown",
  "missing_fields": [
    "free_cash_flow",
    "discount_rate",
    "terminal_growth_rate",
    "working_capital_assumptions"
  ],
  "warning": "Chưa đủ dữ liệu và giả định để tính DCF một cách có trách nhiệm.",
  "beginner_interpretation": "DCF cần nhiều giả định về tương lai. Nếu thiếu dữ liệu, kết quả có thể gây hiểu nhầm.",
  "not_financial_advice": true
}
```

---

## 14. FCFF

```txt
Key: fcff
Trạng thái: Defined but gated
```

---

### 14.1. Ý nghĩa

FCFF là dòng tiền tự do cho toàn bộ doanh nghiệp, bao gồm cả chủ nợ và cổ đông.

FCFF thường dùng trong DCF để định giá Enterprise Value.

---

### 14.2. Công thức tham khảo

```txt
FCFF = EBIT * (1 - Tax Rate) + Depreciation & Amortization - Capex - Change in Working Capital
```

Hoặc nếu dữ liệu đơn giản hơn:

```txt
FCFF ≈ Operating Cash Flow - Capex + After-tax Interest Expense
```

---

### 14.3. Dữ liệu đầu vào

```txt
ebit
tax_rate
depreciation_and_amortization
capital_expenditure
change_in_working_capital
operating_cash_flow
interest_expense
```

---

### 14.4. Điều kiện tính

```txt
Có EBIT hoặc operating_cash_flow.
Có Capex.
Có tax_rate nếu dùng công thức EBIT.
Có dữ liệu vốn lưu động nếu muốn tính đầy đủ.
```

---

### 14.5. Cảnh báo

FCFF cần chuẩn hóa dấu của Capex và vốn lưu động.

Không được tự giả định tax_rate hoặc working capital nếu thiếu dữ liệu.

---

## 15. FCFE

```txt
Key: fcfe
Trạng thái: Defined but gated
```

---

### 15.1. Ý nghĩa

FCFE là dòng tiền tự do thuộc về cổ đông sau khi tính đến nợ vay.

FCFE thường dùng để định giá Equity Value trực tiếp.

---

### 15.2. Công thức tham khảo

```txt
FCFE = Net Income + Depreciation & Amortization - Capex - Change in Working Capital + Net Borrowing
```

Hoặc:

```txt
FCFE = FCFF - Interest Expense * (1 - Tax Rate) + Net Borrowing
```

---

### 15.3. Dữ liệu đầu vào

```txt
net_income
depreciation_and_amortization
capital_expenditure
change_in_working_capital
net_borrowing
interest_expense
tax_rate
```

---

### 15.4. Điều kiện tính

```txt
Có net_income.
Có Capex.
Có dữ liệu vay nợ ròng.
Có dữ liệu vốn lưu động nếu muốn tính đầy đủ.
```

---

### 15.5. Cảnh báo

FCFE nhạy với thay đổi nợ vay.

Nếu doanh nghiệp tăng vay nợ mạnh, FCFE có thể nhìn đẹp hơn nhưng rủi ro tài chính cũng tăng.

Không được dùng FCFE đơn lẻ mà bỏ qua Debt Risk.

---

## 16. WACC

```txt
Key: wacc
Trạng thái: Defined but gated
```

---

### 16.1. Ý nghĩa

WACC là chi phí vốn bình quân gia quyền, dùng làm tỷ lệ chiết khấu trong DCF theo FCFF.

---

### 16.2. Công thức

```txt
WACC = E / (D + E) * Cost of Equity + D / (D + E) * Cost of Debt * (1 - Tax Rate)
```

Trong đó:

```txt
E = Market Value of Equity
D = Market Value of Debt hoặc proxy hợp lý
Cost of Equity = chi phí vốn chủ
Cost of Debt = chi phí nợ vay
Tax Rate = thuế suất
```

---

### 16.3. Dữ liệu đầu vào

```txt
market_value_of_equity
market_value_of_debt
cost_of_equity
cost_of_debt
tax_rate
risk_free_rate nếu tự tính cost_of_equity
beta nếu tự tính cost_of_equity
equity_risk_premium nếu tự tính cost_of_equity
```

---

### 16.4. Không được tự bịa

Hệ thống không được tự bịa:

```txt
beta
risk_free_rate
equity_risk_premium
cost_of_debt
tax_rate
terminal_growth_rate
```

Nếu thiếu, trả:

```txt
status = not_ready
confidence = unknown
```

---

### 16.5. Cảnh báo

WACC càng cao thì giá trị DCF càng thấp.

WACC càng thấp thì giá trị DCF càng cao.

Vì vậy WACC là giả định rất nhạy, cần giải thích rõ cho người mới.

---

## 17. Terminal Value

```txt
Key: terminal_value
Trạng thái: Defined but gated
```

---

### 17.1. Ý nghĩa

Terminal Value đại diện cho giá trị doanh nghiệp sau giai đoạn dự phóng chi tiết.

Trong DCF, Terminal Value thường chiếm tỷ trọng lớn trong giá trị doanh nghiệp.

---

### 17.2. Công thức Gordon Growth

```txt
Terminal Value = Final Year FCF * (1 + Terminal Growth Rate) / (Discount Rate - Terminal Growth Rate)
```

Điều kiện:

```txt
discount_rate > terminal_growth_rate
```

---

### 17.3. Cảnh báo

Terminal Growth Rate không được đặt quá cao.

Nếu terminal_growth_rate gần bằng discount_rate, kết quả định giá có thể bị phóng đại.

Không được tự giả định terminal_growth_rate nếu chưa có quy tắc.

---

## 18. Bear / Base / Bull Case

```txt
Key: valuation_scenarios
Trạng thái: Active in V1
```

---

### 18.1. Ý nghĩa

Bear/Base/Bull giúp người dùng hiểu rằng định giá phụ thuộc vào giả định.

Không có một con số định giá duy nhất.

---

### 18.2. Bear Case

Bear Case là kịch bản thận trọng.

Có thể dùng khi:

```txt
Tăng trưởng thấp hơn kỳ vọng.
Biên lợi nhuận giảm.
P/E hoặc P/B mục tiêu thấp hơn.
Dòng tiền yếu.
Rủi ro ngành tăng.
```

Output:

```txt
fair_value_low
```

---

### 18.3. Base Case

Base Case là kịch bản trung tính.

Có thể dùng khi:

```txt
Dữ liệu hiện tại tương đối ổn.
Không giả định quá lạc quan.
Không bỏ qua rủi ro.
```

Output:

```txt
fair_value_base
```

---

### 18.4. Bull Case

Bull Case là kịch bản tích cực.

Chỉ dùng khi:

```txt
Doanh nghiệp có tăng trưởng tốt.
Biên lợi nhuận ổn định hoặc cải thiện.
Dòng tiền hỗ trợ lợi nhuận.
Rủi ro tài chính không quá cao.
```

Output:

```txt
fair_value_high
```

---

### 18.5. Cảnh báo bắt buộc

Bull Case không phải dự báo chắc chắn.

Bear Case không phải dự báo chắc chắn.

Kịch bản chỉ giúp người dùng hiểu độ nhạy của định giá.

---

## 19. Margin of Safety

```txt
Key: margin_of_safety
Trạng thái: Active in V1
```

---

### 19.1. Ý nghĩa

Margin of Safety là khoảng cách an toàn giữa giá trị hợp lý ước lượng và giá hiện tại.

---

### 19.2. Công thức

Nếu có fair value:

```txt
Margin of Safety = (Fair Value - Current Price) / Fair Value
```

Hoặc nhìn theo upside/downside:

```txt
Valuation Gap = (Fair Value - Current Price) / Current Price
```

---

### 19.3. Điều kiện tính

```txt
fair_value > 0
current_price > 0
valuation_confidence không phải unknown
```

---

### 19.4. Không được tính khi

```txt
fair_value null
current_price null
confidence unknown
valuation method not_ready
```

---

### 19.5. Cảnh báo

Margin of Safety cao không đồng nghĩa nên mua.

Margin of Safety chỉ có ý nghĩa nếu fair value được tính từ dữ liệu và giả định đáng tin cậy.

Nếu confidence thấp, margin of safety cũng phải bị cảnh báo.

---

## 20. Valuation Status

Module định giá nên có trạng thái tổng hợp.

```txt
Key: valuation_status
```

Các trạng thái:

```txt
undervalued_candidate
fairly_valued_range
overvalued_candidate
mixed
not_ready
low_confidence
```

---

### 20.1. undervalued_candidate

Chỉ dùng khi:

```txt
Giá hiện tại thấp hơn vùng fair value.
Valuation confidence ít nhất medium.
Không có cảnh báo nghiêm trọng về chất lượng lợi nhuận.
Không có cảnh báo dữ liệu thiếu nghiêm trọng.
```

Không được diễn giải là “nên mua”.

Cách nói:

```txt
Cổ phiếu có dấu hiệu đang thấp hơn vùng định giá ước lượng, nhưng cần kiểm tra thêm rủi ro và giả định.
```

---

### 20.2. fairly_valued_range

Dùng khi:

```txt
Giá hiện tại nằm gần vùng fair value.
Không có khoảng chênh lệch đủ lớn.
```

Cách nói:

```txt
Giá hiện tại đang nằm gần vùng định giá ước lượng theo giả định hiện tại.
```

---

### 20.3. overvalued_candidate

Dùng khi:

```txt
Giá hiện tại cao hơn đáng kể so với vùng fair value.
Valuation confidence đủ để tham khảo.
```

Không được diễn giải là “nên bán”.

Cách nói:

```txt
Giá hiện tại cao hơn vùng định giá ước lượng, cần kiểm tra liệu tăng trưởng và chất lượng doanh nghiệp có đủ hỗ trợ mức định giá này không.
```

---

### 20.4. mixed

Dùng khi:

```txt
P/E cho tín hiệu khác P/B.
Relative valuation khác DCF.
Dữ liệu lợi nhuận tốt nhưng dòng tiền yếu.
Có kết quả trái chiều giữa các phương pháp.
```

---

### 20.5. not_ready

Dùng khi:

```txt
Thiếu dữ liệu đầu vào quan trọng.
Không thể định giá có trách nhiệm.
```

---

### 20.6. low_confidence

Dùng khi:

```txt
Có kết quả định giá nhưng thiếu nguồn, thiếu dữ liệu so sánh, hoặc giả định yếu.
```

---

## 21. Tổng hợp kết quả định giá

Module định giá nên trả summary như sau:

```ts
type ValuationOverallSummary = {
  ticker: string;
  company_name: string;

  current_price: number | null;

  valuation_status:
    | "undervalued_candidate"
    | "fairly_valued_range"
    | "overvalued_candidate"
    | "mixed"
    | "not_ready"
    | "low_confidence";

  fair_value_low: number | null;
  fair_value_base: number | null;
  fair_value_high: number | null;

  confidence: "high" | "medium" | "low" | "unknown";

  active_methods: string[];
  blocked_methods: string[];

  main_points: string[];
  warning_points: string[];
  missing_fields: string[];

  next_checks: string[];

  not_financial_advice: true;
};
```

---

## 22. Quy tắc tổng hợp nhiều phương pháp

Nếu nhiều phương pháp cùng chạy, không được lấy trung bình máy móc nếu độ tin cậy khác nhau.

Ví dụ:

```txt
P/E có confidence high
P/B có confidence medium
DCF có confidence low
```

Không nên lấy trung bình đơn giản của cả 3.

Cách xử lý:

```txt
Ưu tiên phương pháp phù hợp hơn với loại doanh nghiệp.
Phương pháp confidence thấp chỉ dùng tham khảo phụ.
Nếu phương pháp mâu thuẫn nhau, trạng thái = mixed.
Nếu dữ liệu thiếu nhiều, trạng thái = low_confidence hoặc not_ready.
```

---

## 23. Mapping phương pháp theo loại doanh nghiệp

### 23.1. Doanh nghiệp phi tài chính

Ưu tiên:

```txt
P/E
P/B nếu tài sản quan trọng
P/S nếu lợi nhuận biến động nhưng doanh thu có ý nghĩa
EV/EBITDA nếu đủ dữ liệu
DCF nếu dòng tiền ổn định và đủ giả định
```

---

### 23.2. Ngân hàng

Ưu tiên:

```txt
P/B
ROE
Cost of Equity nếu có
Dividend Yield nếu có
```

Cẩn trọng với:

```txt
Current Ratio
Debt/Equity
EV/EBITDA
FCFF
```

Vì ngân hàng có cấu trúc tài chính khác doanh nghiệp sản xuất.

---

### 23.3. Chứng khoán

Ưu tiên:

```txt
P/B
ROE
Earnings cycle
Market condition
```

Cần cảnh báo:

```txt
Lợi nhuận ngành chứng khoán nhạy với chu kỳ thị trường.
P/E ở đỉnh chu kỳ có thể gây hiểu nhầm.
```

---

### 23.4. Bảo hiểm

Ưu tiên:

```txt
P/B
ROE
Investment income
Book value quality
```

Cần cảnh báo:

```txt
Cần hiểu chất lượng danh mục đầu tư và dự phòng bảo hiểm.
```

---

### 23.5. Công nghệ/phần mềm

Ưu tiên:

```txt
P/E
P/S nếu tăng trưởng cao
Gross Margin
Net Margin
FCF nếu có
```

Cần cảnh báo:

```txt
P/B có thể ít ý nghĩa nếu doanh nghiệp nhẹ tài sản.
```

---

### 23.6. Bán lẻ/sản xuất/thép/tiêu dùng

Ưu tiên:

```txt
P/E
EV/EBITDA nếu đủ dữ liệu
P/B phụ trợ
DCF nếu dòng tiền ổn định
```

Cần kiểm tra:

```txt
Biên lợi nhuận
Tồn kho
Phải thu
CFO/Net Profit
Chu kỳ ngành
```

---

## 24. Mapping module sử dụng

### 24.1. Overview

Overview chỉ hiển thị:

```txt
valuation_status
fair_value_range nếu có
confidence
main_warning
next_step
```

Không hiển thị toàn bộ chi tiết định giá.

---

### 24.2. Valuation

Valuation hiển thị chi tiết:

```txt
P/E
P/B
P/S
EV/EBITDA
Bear/Base/Bull
Margin of Safety
Valuation Confidence
Readiness
Missing Data
Warnings
```

---

### 24.3. Risk

Risk dùng:

```txt
valuation_risk
pe_warning
pb_warning
low_confidence_warning
overvaluation_warning
data_quality_warning
```

---

### 24.4. Watchlist

Watchlist dùng:

```txt
valuation_status
confidence
last_valuation_update
next_check
missing_fields
```

---

### 24.5. AI Assistant

AI dùng:

```txt
selected_method
current_price
fair_value_range
confidence
assumptions
warnings
missing_fields
module_context
```

---

## 25. AI Explanation Rules cho định giá

AI được phép:

```txt
Giải thích P/E, P/B, P/S, EV/EBITDA.
Giải thích vì sao chưa đủ dữ liệu định giá.
Giải thích vì sao confidence thấp.
Giải thích vì sao P/E thấp chưa chắc rẻ.
Giải thích vì sao kết quả định giá chỉ là vùng ước lượng.
Giải thích Bear/Base/Bull.
Giải thích Margin of Safety.
```

AI không được phép:

```txt
Khuyên mua.
Khuyên bán.
Khuyên nắm giữ.
Nói đây là điểm mua tốt.
Nói cổ phiếu chắc chắn rẻ.
Nói cổ phiếu chắc chắn đắt.
Nói định giá chắc chắn đúng.
Tự bịa EPS, P/E, WACC, tăng trưởng, terminal growth.
```

---

## 26. Response template của AI khi trả lời về định giá

AI nên trả lời theo cấu trúc:

```txt
1. Dữ liệu định giá hiện tại cho thấy gì?
2. Phương pháp nào đang được dùng?
3. Kết quả này phụ thuộc vào giả định nào?
4. Độ tin cậy của kết quả là gì?
5. Điểm cần cẩn trọng là gì?
6. Dữ liệu nào còn thiếu?
7. Người dùng nên kiểm tra thêm gì?
8. Nhắc rằng đây không phải khuyến nghị mua/bán.
```

Ví dụ:

```txt
Dữ liệu hiện tại cho thấy cổ phiếu đang có P/E thấp hơn mức tham chiếu.
Tuy nhiên, P/E thấp chưa đủ để kết luận cổ phiếu rẻ.
Cần kiểm tra thêm chất lượng lợi nhuận, dòng tiền kinh doanh, tăng trưởng và rủi ro ngành.
Hiện hệ thống chưa có dữ liệu P/E ngành nên độ tin cậy của so sánh còn ở mức trung bình.
Đây không phải khuyến nghị mua/bán.
```

---

## 27. Test case bắt buộc

### Test 1: EPS âm

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
  "method_key": "pe_valuation",
  "status": "not_applicable",
  "fair_value": null,
  "confidence": "unknown",
  "warning": "EPS âm hoặc bằng 0 nên không thể diễn giải P/E theo cách thông thường."
}
```

---

### Test 2: Thiếu close_price

Input:

```json
{
  "eps": 4000
}
```

Expected:

```json
{
  "method_key": "pe_valuation",
  "status": "not_ready",
  "fair_value": null,
  "missing_fields": ["close_price"]
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
  "valuation_risk": "watch",
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
  "valuation_status": "mixed",
  "warning": "P/B thấp chưa chắc là rẻ nếu ROE thấp và hiệu quả sử dụng vốn yếu."
}
```

---

### Test 5: DCF thiếu WACC

Input:

```json
{
  "free_cash_flow": 1000,
  "terminal_growth_rate": 0.03,
  "discount_rate": null
}
```

Expected:

```json
{
  "method_key": "dcf_valuation",
  "status": "not_ready",
  "fair_value": null,
  "missing_fields": ["discount_rate"],
  "warning": "Chưa đủ dữ liệu tỷ lệ chiết khấu để tính DCF."
}
```

---

### Test 6: Margin of Safety với confidence thấp

Input:

```json
{
  "fair_value": 60000,
  "current_price": 40000,
  "confidence": "low"
}
```

Expected:

```json
{
  "margin_of_safety_pct": 0.3333,
  "warning": "Margin of Safety cao nhưng độ tin cậy định giá thấp, không nên diễn giải như tín hiệu mua."
}
```

---

### Test 7: Thiếu dữ liệu ngành

Input:

```json
{
  "pe_ratio": 12,
  "industry_pe": null
}
```

Expected:

```json
{
  "confidence": "medium",
  "warning": "Thiếu dữ liệu P/E ngành nên khả năng so sánh còn hạn chế."
}
```

---

## 28. Definition of Done

File `VALUATION_LOGIC.md` được coi là hoàn thành khi:

```txt
Có nguyên tắc định giá rõ ràng.
Có phân biệt Relative Valuation và Intrinsic Valuation.
Có P/E, P/B, P/S, EV/EBITDA.
Có DCF, FCFF, FCFE, WACC ở trạng thái defined but gated.
Có Bear/Base/Bull.
Có Margin of Safety.
Có Valuation Confidence.
Có Valuation Readiness.
Có Missing Data Rules.
Có AI Explanation Rules.
Có Test Cases.
Không có khuyến nghị mua/bán.
Không có ngôn ngữ chắc chắn tuyệt đối.
Có thể làm nền cho code trong src/lib/financial-logic/valuation.
```

---

## 29. Kết luận

Định giá trong Atelier Finance phải giúp người dùng hiểu:

```txt
Giá hiện tại đang nằm ở đâu so với các phương pháp tham chiếu?
Phương pháp nào phù hợp?
Dữ liệu nào đang thiếu?
Giả định nào đang ảnh hưởng đến kết quả?
Kết quả có đáng tin đến mức nào?
Cần kiểm tra thêm rủi ro gì?
```

Nguyên tắc cuối cùng:

```txt
Định giá là công cụ tư duy, không phải mệnh lệnh giao dịch.
Định giá là vùng ước lượng, không phải chân lý.
Thiếu dữ liệu thì không cố tính.
Kết quả phải đi kèm cảnh báo và độ tin cậy.
Không đưa khuyến nghị mua/bán.
```
