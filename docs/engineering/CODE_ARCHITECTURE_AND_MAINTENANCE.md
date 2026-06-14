# CODE_ARCHITECTURE_AND_MAINTENANCE.md

# Quy hoạch kiến trúc và nguyên tắc bảo trì code

Tài liệu này là bộ quy tắc kỹ thuật nội bộ cho dự án **Atelier Finance**.

Mục tiêu của tài liệu là giúp dự án không bị loạn khi mở rộng nhiều module, nhiều mock data, nhiều lớp logic và nhiều lần chỉnh sửa bằng AI/Codex.

Tài liệu này phải được đọc trước khi:

* Thêm module mới.
* Sửa module cũ.
* Nối logic tài chính vào UI.
* Dọn legacy data.
* Refactor component.
* Thêm test.
* Thêm AI/RAG feature.
* Chỉnh navigation hoặc data flow.

---

## 1. Mục tiêu sản phẩm

Atelier Finance là hệ thống hỗ trợ phân tích đầu tư cho:

* Người mới.
* Sinh viên.
* Nhà đầu tư cá nhân có mức hiểu biết tài chính thấp.

Sản phẩm không có mục tiêu thay người dùng ra quyết định đầu tư.

Hệ thống chỉ giúp người dùng:

* Đọc dữ liệu tài chính.
* Hiểu chỉ số.
* Nhận diện rủi ro.
* Kiểm tra định giá.
* Quan sát giá, khối lượng, thanh khoản.
* Tự hình thành luận điểm đầu tư.

Hệ thống không được đưa ra kết luận kiểu:

* Nên mua.
* Nên bán.
* Nắm giữ.
* Cổ phiếu này an toàn.
* Đây là điểm mua tốt.
* Cổ phiếu này chắc chắn rẻ.
* Cổ phiếu này chắc chắn xấu.

---

## 2. Nguyên tắc sản phẩm bắt buộc

Mọi module phải tuân thủ các nguyên tắc sau:

### 2.1. Không đưa khuyến nghị mua/bán/nắm giữ

Không được dùng các trường dữ liệu hoặc text render ra UI như:

```txt
recommendation: "buy"
recommendation: "sell"
recommendation: "hold"
nên mua
nên bán
nắm giữ
khuyến nghị mua
khuyến nghị bán
khuyến nghị giao dịch
khuyến nghị đầu tư
điểm mua tốt
cổ phiếu an toàn
đáng mua
chắc chắn rẻ
chắc chắn đắt
chắc chắn xấu
```

Các cách diễn đạt được phép dùng:

```txt
Cần kiểm tra thêm.
Chưa đủ dữ liệu.
Không phải tín hiệu giao dịch.
Chỉ là dữ liệu tham khảo.
Cần đọc cùng bối cảnh ngành và thị trường.
Kết quả này không thay thế quyết định của người dùng.
Có thể xem phân tích sơ bộ, nhưng cần kiểm tra thêm.
```

---

### 2.2. Không bịa dữ liệu

Nếu thiếu dữ liệu, hệ thống phải nói rõ thiếu dữ liệu.

Không được:

* Tự điền số.
* Tự giả định EPS.
* Tự giả định WACC.
* Tự giả định tăng trưởng dài hạn.
* Tự tạo fair value nếu chưa đủ dữ liệu.
* Tự tạo dòng tiền nếu không có dữ liệu đầu vào.

Nếu thiếu dữ liệu, output phải có:

```txt
value: null
displayValue: "Chưa đủ dữ liệu"
missingFields: [...]
warning hoặc explanation phù hợp
```

---

### 2.3. Không dùng 0 để thay cho dữ liệu thiếu

Dữ liệu thiếu phải là:

```ts
null
undefined
```

Không được dùng:

```ts
0
"0%"
"0x"
```

để đại diện cho dữ liệu thiếu.

Ví dụ sai:

```ts
const roe = input.netProfit / (input.totalEquity || 1);
const pe = input.eps ? input.closePrice / input.eps : 0;
```

Ví dụ đúng:

```ts
if (isMissing(input.netProfit) || !hasPositiveNumber(input.totalEquity)) {
  return null;
}
```

---

### 2.4. Không chia cho 0

Mọi phép chia phải dùng helper an toàn, ví dụ:

```ts
safeDivide(numerator, denominator)
```

Nếu mẫu số thiếu, bằng 0 hoặc không hợp lệ, kết quả phải là `null`.

---

### 2.5. EPS âm thì P/E không diễn giải thông thường

Nếu:

```txt
eps <= 0
```

thì P/E phải:

```txt
value: null
level: not_applicable hoặc unknown
warning: EPS âm hoặc không dương nên P/E không phù hợp để diễn giải thông thường.
```

Không được nói:

```txt
P/E thấp nên rẻ.
P/E âm nên hấp dẫn.
```

---

### 2.6. Vốn chủ âm thì ROE/PB không diễn giải thông thường

Nếu:

```txt
totalEquity <= 0
bvps <= 0
```

thì ROE/PB phải trả trạng thái không phù hợp để diễn giải thông thường.

Không được nói:

```txt
ROE cao là tốt.
P/B thấp là rẻ.
```

trong trường hợp vốn chủ âm hoặc BVPS không hợp lệ.

---

### 2.7. Công ty tài chính không đọc chỉ số như doanh nghiệp phi tài chính

Với:

```ts
companyType: "bank" | "securities" | "insurance"
```

không được áp dụng máy móc:

* Current Ratio.
* Quick Ratio.
* Debt/Equity theo kiểu doanh nghiệp sản xuất/thương mại thông thường.

Các chỉ số này phải trả:

```txt
not_applicable
```

hoặc có warning rõ.

---

## 3. Quy hoạch thư mục tổng thể

Cấu trúc chính của dự án nên được hiểu như sau:

```txt
src/
  app/
  components/
  config/
  features/
  lib/
docs/
```

Ý nghĩa:

```txt
src/app
→ route/page cấp app

src/components
→ component layout hoặc component dùng chung

src/config
→ cấu hình navigation, AI tutor, app-level config

src/features
→ từng module nghiệp vụ riêng

src/lib
→ logic dùng chung, không phụ thuộc UI

docs
→ tài liệu kỹ thuật, logic, AI, RAG, API contract, audit
```

---

## 4. Quy hoạch `src/lib`

`src/lib` chứa logic dùng chung.

Logic ở đây không được phụ thuộc vào React component, UI state hoặc mock UI.

Hiện tại phần quan trọng nhất là:

```txt
src/lib/financial-logic/
```

Thư mục này là lõi tài chính của hệ thống.

Nó chứa:

```txt
types.ts
utils.ts
explanations.ts
thresholds.ts

metrics/
valuation/
risk/
health/
data-quality/
```

Nguyên tắc:

* Tất cả công thức tài chính nằm ở đây.
* Tất cả xử lý thiếu dữ liệu nằm ở đây.
* Tất cả warning tài chính nền tảng nằm ở đây.
* UI không được tự viết lại công thức tài chính.
* Module chỉ gọi function từ đây thông qua builder.

---

## 5. Quy hoạch module trong `src/features`

Mỗi module nên có cấu trúc gần giống sau:

```txt
src/features/<module>/
  components/
  data/
  lib/
  types.ts
```

Ý nghĩa:

```txt
components
→ React components, chỉ render UI

data
→ mock data hoặc data tĩnh của module

lib
→ adapter, builder, helper riêng của module

types.ts
→ type riêng của module
```

Ví dụ:

```txt
src/features/financials/
  components/
  data/
  lib/
    map-financials-to-logic-input.ts
    build-financial-reading-desk-data.ts
  types.ts
```

---

## 6. Quy tắc Adapter

Adapter là file có nhiệm vụ map dữ liệu của module sang input chuẩn.

Ví dụ:

```txt
map-financials-to-logic-input.ts
map-valuation-to-logic-input.ts
map-risk-to-logic-input.ts
map-overview-to-logic-input.ts
map-watchlist-to-logic-input.ts
map-checklist-to-logic-input.ts
map-technical-to-logic-input.ts
```

Adapter được phép:

* Đọc mock data hoặc data module.
* Map field sang `FinancialStatementInput`.
* Chuẩn hóa tên field.
* Giữ `null` nếu thiếu dữ liệu.
* Gắn `sourceName`, `sourceUrl`, `collectedAt` nếu có.

Adapter không được:

* Tính ROE.
* Tính ROA.
* Tính P/E.
* Tính P/B.
* Tính risk score.
* Tính health score.
* Tính valuation readiness.
* Biến missing data thành 0.
* Tạo warning tài chính.
* Tạo fair value.

Ví dụ đúng:

```ts
export function mapFinancialsToLogicInput(data): FinancialStatementInput {
  return {
    revenue: data.revenue ?? null,
    netProfit: data.netProfit ?? null,
    totalAssets: data.totalAssets ?? null,
    totalEquity: data.totalEquity ?? null,
    operatingCashFlow: data.operatingCashFlow ?? null,
    closePrice: data.closePrice ?? null,
    eps: data.eps ?? null,
    sourceName: data.sourceName ?? null,
    collectedAt: data.collectedAt ?? null,
  };
}
```

Ví dụ sai:

```ts
export function mapFinancialsToLogicInput(data) {
  return {
    roe: data.netProfit / data.totalEquity,
    pe: data.closePrice / data.eps,
  };
}
```

---

## 7. Quy tắc Builder

Builder là lớp trung gian giữa adapter và UI.

Ví dụ:

```txt
build-financial-reading-desk-data.ts
build-valuation-desk-data.ts
build-risk-desk-data.ts
build-overview-desk-data.ts
build-watchlist-desk-data.ts
build-checklist-desk-data.ts
build-technical-desk-data.ts
```

Builder được phép:

* Gọi financial logic core.
* Gom nhiều metric thành group.
* Chuẩn bị data cho component render.
* Tạo `warnings`.
* Tạo `missingFields`.
* Tạo `nextChecks`.
* Tạo trạng thái UI như `canContinue`, `isDisabled`, `caption`.
* Sắp xếp thứ tự hiển thị.

Builder không được:

* Tự viết lại công thức tài chính nếu core đã có.
* Tự tạo P/E, P/B, ROE, ROA bằng phép chia trực tiếp.
* Tự tạo tín hiệu mua/bán.
* Tự tạo fair value giả.
* Biến thiếu dữ liệu thành 0.
* Đưa ra kết luận đầu tư.

Ví dụ đúng:

```ts
const revenueGrowth = calculateRevenueGrowth(input);
const roe = calculateRoe(input);
const valuationReadiness = calculateValuationReadiness(input);
```

Ví dụ sai:

```ts
const roe = input.netProfit / input.totalEquity;
const isCheap = input.pe < 10;
const recommendation = isCheap ? "buy" : "hold";
```

---

## 8. Quy tắc Component

Component chỉ chịu trách nhiệm render.

Component được phép:

* Hiển thị data.
* Hiển thị warning.
* Hiển thị missing fields.
* Gọi `onNavigate`.
* Disable button nếu data không đủ.
* Render loading/empty/error state.
* Render chart, card, table, layout.

Component không được:

* Tính công thức tài chính.
* Tính risk score.
* Tính valuation status.
* Tự quyết định cổ phiếu tốt/xấu.
* Tự tạo warning tài chính sâu.
* Tạo khuyến nghị mua/bán.
* Gọi trực tiếp nhiều financial logic nếu đã có builder của module.

Ví dụ sai trong component:

```tsx
const pe = closePrice / eps;
const roe = netProfit / totalEquity;
const debtToEquity = totalDebt / totalEquity;
```

Ví dụ đúng:

```tsx
<MetricCard
  label={metric.label}
  value={metric.displayValue}
  warning={metric.warning}
/>
```

---

## 9. Quy tắc Mock Data

Mock data vẫn được dùng trong giai đoạn hiện tại.

Nhưng cần phân biệt:

```txt
mock chính
→ đang được page chính render

legacy mock
→ còn trong repo nhưng không còn dùng ở page chính

demo/placeholder mock
→ chỉ phục vụ component cũ hoặc tài liệu
```

Nguyên tắc:

* Không xóa mock legacy nếu chưa chắc không còn import.
* Mock chính phải đi qua adapter/builder.
* Không để page chính render trực tiếp mock cũ nếu module đã có builder.
* Không viết công thức tài chính trong mock data.
* Không hardcode kết luận như “cổ phiếu tốt”, “đáng mua”.
* Mock data thiếu gì thì để `null`, không điền 0 giả.

Khi dọn legacy data:

1. Tìm import.
2. Kiểm tra page chính có dùng không.
3. Kiểm tra test có dùng không.
4. Nếu không dùng, có thể xóa trong commit riêng.
5. Không dọn nhiều module trong một commit lớn.

---

## 10. Quy tắc Navigation

App chính hiện dùng:

```txt
/workspace?module=<moduleKey>
```

Không tạo route riêng theo tên module. Dùng quy ước workspace query:

```txt
/workspace?module=overview
/workspace?module=financials
/workspace?module=valuation
/workspace?module=risk
```

Route riêng theo từng module hiện không được hỗ trợ.

Nguyên tắc:

* Sidebar/mobile navigation dùng `onNavigate(moduleKey)`.
* CTA liên module cũng dùng `onNavigate(moduleKey)`.
* Không dùng root route query cho module; fallback URL phải trỏ vào `/workspace`.
* Nếu cần fallback URL, dùng:

```txt
/workspace?module=<moduleKey>
```

* Nếu module key không hợp lệ, app fallback về overview và normalize URL thành `/workspace?module=overview`.

Ví dụ đúng:

```ts
onNavigate("valuation");
```

Ví dụ fallback chấp nhận được:

```ts
window.location.href = `/workspace?module=${targetModule}`;
```

Ví dụ sai:

```ts
window.location.href = `/${targetModule}`;
```

---

## 11. Quy tắc CTA và Button

Không để button trông như CTA chính nhưng bấm không làm gì.

Nếu chức năng chưa có thật:

* Disable button.
* Thêm `title="Sắp có"`.
* Thêm `aria-label` rõ.
* Hoặc đổi text thành “Sắp có”.
* Không tạo alert giả nếu không cần.

Ví dụ:

```tsx
<button disabled title="Sắp có" aria-label="Tìm kiếm, sắp có">
  Tìm kiếm
</button>
```

CTA liên module phải:

* Có handler thật.
* Gọi `onNavigate`.
* Nếu chưa đủ dữ liệu thì disable và giải thích lý do.
* Không điều hướng sang route không tồn tại.

---

## 12. Quy tắc Missing Data trong UI

Nếu thiếu dữ liệu, UI nên hiển thị:

```txt
Chưa đủ dữ liệu
Không phù hợp để diễn giải
Cần bổ sung dữ liệu
Cần kiểm tra thêm
```

Không hiển thị:

```txt
0%
0x
0 điểm
Tốt
Rẻ
An toàn
```

nếu dữ liệu thực tế đang thiếu.

UI nên có ít nhất một trong các thông tin:

* `missingFields`
* `warning`
* `reason`
* `nextStepSuggestion`
* `dataQuality`

---

## 13. Quy tắc Valuation

Valuation phải cực kỳ cẩn thận.

Không được:

* Tạo fair value nếu thiếu dữ liệu.
* Tự giả định WACC.
* Tự giả định terminal growth.
* Nói P/E thấp là rẻ.
* Nói P/B thấp là an toàn.
* Nói cổ phiếu đang undervalued nếu chưa đủ mô hình.
* Đưa ra target price giả.

Được phép:

* Hiển thị P/E nếu EPS > 0.
* Hiển thị P/B nếu BVPS > 0.
* Hiển thị P/S nếu revenue > 0.
* Hiển thị EV/EBITDA nếu EBITDA > 0.
* Hiển thị valuation readiness.
* Hiển thị valuation confidence.
* Nói “cần so sánh thêm với ngành, lịch sử và chất lượng lợi nhuận”.

---

## 14. Quy tắc Risk

Risk score là cảnh báo phân tích, không phải kết luận đầu tư.

Không được:

* Nói risk thấp là an toàn.
* Nói risk cao là chắc chắn xấu.
* Nói nợ cao là doanh nghiệp xấu tuyệt đối.
* Kết luận gian lận.

Được phép:

* Nói “cần kiểm tra thêm”.
* Nói “rủi ro dữ liệu cao”.
* Nói “dòng tiền yếu so với lợi nhuận”.
* Nói “thanh khoản thấp có thể làm khó mua/bán”.
* Nói “chưa đủ dữ liệu để đánh giá”.

Nếu data quality risk high:

* Overall risk không được là low.
* Checklist không được đánh dấu final readiness là tốt.
* AI/frontend phải nói rõ thiếu dữ liệu.

---

## 15. Quy tắc Technical / Price Volume Time

Technical không được biến thành hệ thống tín hiệu giao dịch.

Technical chỉ dùng để quan sát:

* Biến động giá.
* Khối lượng.
* Giá trị giao dịch.
* Thanh khoản.
* Biến động sau sự kiện.
* Bối cảnh dòng tiền.
* Data quality.

Không được nói:

```txt
tín hiệu mua
tín hiệu bán
điểm mua
điểm bán
nên mua
nên bán
sell the news
```

Nếu gặp cụm “sell the news”, đổi thành:

```txt
áp lực chốt lời sau tin tức
phản ứng giá sau tin tức
biến động sau sự kiện
```

Technical nên dùng các function core:

```txt
calculatePriceChangePct
calculateTradingValue
calculateAvgTradingValue20d
calculateLiquidityStatus
calculateLiquidityRisk
calculateDataQualityRisk
assessDataQuality
```

Component Technical không được tự tính:

```txt
closePrice / previousClosePrice - 1
closePrice * volume
liquidity status
```

---

## 16. Quy tắc AI/RAG

AI/RAG phải tuân thủ:

* Không bịa dữ liệu.
* Không đưa khuyến nghị mua/bán/nắm giữ.
* Không thay người dùng quyết định.
* Khi thiếu dữ liệu phải nói thiếu.
* Khi dữ liệu yếu phải giảm độ tự tin.
* Khi có negative example phải hiểu đó là ví dụ cấm.

RAG docs nếu chứa câu cấm phải có nhãn rõ:

```md
### Negative Example
AI không được trả lời theo mẫu này:
> ...

### Safer Rewrite
AI nên trả lời:
> ...
```

Không để câu cấm đứng một mình trong chunk RAG mà không có ngữ cảnh.

---

## 17. Quy tắc Test

Khi thêm adapter/builder mới, nên có test.

Test tối thiểu nên kiểm tra:

* Missing data không thành 0.
* EPS âm làm P/E not_applicable.
* Vốn chủ âm làm ROE/PB không diễn giải thường.
* Thiếu CFO không làm earnings quality risk thành low.
* Data quality kém không cho overall risk thấp.
* Financial company không bị áp Current Ratio máy móc.
* UI output/builder output không chứa khuyến nghị mua/bán.
* Mock chính đi qua adapter/builder.

Khi sửa module, phải chạy:

```bash
npm run test
npm run lint
npm run build
```

Nếu fail, không commit.

---

## 18. Quy tắc Commit

Mỗi commit chỉ nên làm một việc rõ ràng.

Ví dụ commit tốt:

```txt
feat: connect financial logic to technical module
fix: derive financials valuation CTA from readiness
docs: add architecture maintenance guide
chore: clean logs and harden AI/RAG guardrails
```

Không nên commit kiểu:

```txt
update
fix all
misc
final
```

Không dùng:

```bash
git add .
```

Trừ khi đã kiểm tra rất kỹ toàn bộ diff. Mặc định không dùng.

Nên add cụ thể:

```bash
git add docs/engineering/CODE_ARCHITECTURE_AND_MAINTENANCE.md
git commit -m "docs: add code architecture and maintenance guide"
```

Không dùng:

```bash
git push --force
npm audit fix --force
git reset --hard
```

nếu chưa có lý do rất rõ.

---

## 19. Quy tắc khi làm việc với Codex/AI

Mỗi prompt cho Codex nên có:

1. Bối cảnh.
2. Phạm vi được sửa.
3. Phạm vi không được sửa.
4. File cần đọc trước.
5. Yêu cầu cụ thể.
6. Test/lint/build bắt buộc.
7. Commit message nếu pass.
8. Cấm `git add .`.
9. Cấm `git push --force`.
10. Format báo cáo cuối.

Codex không được tự ý:

* Redesign UI.
* Nối API/database.
* Xóa mock legacy hàng loạt.
* Tạo recommendation buy/sell/hold.
* Tạo fair value giả.
* Sửa nhiều module ngoài phạm vi.
* Commit file log.
* Chạy lệnh force nguy hiểm.

---

## 20. Quy trình thêm module mới vào financial logic

Khi muốn nối một module vào financial logic, làm theo thứ tự:

```txt
1. Audit module hiện tại
2. Xác định mock chính và legacy mock
3. Tạo adapter
4. Tạo builder
5. Cho mock chính đi qua builder
6. Component render data đã build
7. Thêm test
8. Chạy test/lint/build
9. Commit riêng
10. Push
```

Không làm ngược bằng cách sửa component trước rồi nhét công thức vào UI.

---

## 21. Quy trình dọn legacy data

Không xóa legacy data vội.

Quy trình:

```txt
1. Tìm tất cả import của file legacy
2. Xác định file đó có render page chính không
3. Nếu không dùng, xóa trong commit riêng
4. Chạy test/lint/build
5. Nếu có lỗi import, rollback hoặc sửa đúng phạm vi
6. Commit riêng từng module
```

Không dọn nhiều module trong một commit lớn.

---

## 22. Quy trình sửa navigation

Khi sửa navigation:

* Kiểm tra AppShell.
* Kiểm tra navigation config.
* Kiểm tra sidebar.
* Kiểm tra mobile navigation.
* Kiểm tra CTA liên module.
* Kiểm tra fallback URL.
* Không tạo route mới nếu chưa có thiết kế route.
* Không dùng route riêng theo tên module nếu app đang dùng `/workspace?module=...`.

Sau khi sửa navigation, nên test:

```txt
/ 
/workspace
/workspace?module=overview
/workspace?module=financials
/workspace?module=valuation
/workspace?module=risk
/workspace?module=watchlist
/workspace?module=checklist
/workspace?module=sai
```

---

## 23. Quy trình sửa wording

Khi sửa wording, tìm các cụm nguy hiểm:

```txt
nên mua
nên bán
nắm giữ
buy
sell
hold
recommendation
khuyến nghị giao dịch
khuyến nghị đầu tư
cổ phiếu an toàn
điểm mua tốt
đáng mua
chắc chắn rẻ
chắc chắn đắt
chắc chắn xấu
gian lận
sell the news
```

Phân loại match:

```txt
1. UI chính render cho người dùng
2. Test/sanitize
3. Docs negative example
4. Legacy không render
5. Comment/code internal
```

Chỉ cần sửa ngay nếu match thuộc UI chính hoặc builder output chính.

Nếu nằm trong docs negative example, phải có nhãn rõ là ví dụ cấm.

---

## 24. Quy tắc về docs

Docs phải phản ánh đúng code hiện tại.

Không ghi:

* Module đã hoàn chỉnh nếu code chưa làm.
* AI có thể phân tích chắc chắn nếu thiếu dữ liệu.
* RAG có thể thay chuyên gia.
* Hệ thống đưa ra quyết định đầu tư.

Docs nên ghi rõ:

* Đây là hệ thống hỗ trợ phân tích.
* Dữ liệu thiếu thì phải cảnh báo.
* Kết quả chỉ là tham khảo.
* Người dùng tự chịu trách nhiệm quyết định.
* Cần kiểm tra thêm nguồn dữ liệu.

---

## 25. Checklist trước khi commit

Trước mỗi commit, kiểm tra:

```txt
1. Có sửa đúng phạm vi không?
2. Có vô tình sửa module khác không?
3. Có file log không?
4. Có mock legacy bị xóa nhầm không?
5. Có công thức tài chính trong component không?
6. Có missing data bị biến thành 0 không?
7. Có wording mua/bán/nắm giữ không?
8. Có test mới nếu thêm adapter/builder không?
9. npm run test pass chưa?
10. npm run lint pass chưa?
11. npm run build pass chưa?
12. git status có đúng các file cần commit không?
```

---

## 26. Checklist sau khi commit

Sau khi commit:

```bash
git status
git log --oneline -5
```

Nếu ổn thì push:

```bash
git push origin main
```

Không push force.

Sau khi push:

```bash
git status
```

Kỳ vọng:

```txt
main up to date with origin/main
working tree clean
```

---

## 27. Những việc không được làm nếu chưa có yêu cầu rõ

Không được tự ý:

* Redesign toàn bộ UI.
* Đổi architecture lớn.
* Chuyển routing system.
* Xóa hàng loạt legacy data.
* Thêm backend/API route.
* Nối Supabase/database.
* Thêm package lớn.
* Chạy audit fix force.
* Tạo hệ thống recommendation.
* Tạo fair value giả.
* Dùng TradingView widget nếu chưa được yêu cầu.
* Đổi mục tiêu sản phẩm thành app trading signal.

---

## 28. Trạng thái mong muốn của codebase

Codebase tốt là codebase có các đặc điểm:

```txt
Logic tài chính nằm trong src/lib/financial-logic
Module có adapter/builder rõ ràng
Component chỉ render
Mock chính đi qua builder
Missing data là null
Warning rõ ràng
Không có khuyến nghị mua/bán
Test/lint/build pass
Commit nhỏ, rõ nghĩa
Docs khớp với code
Navigation không có route chết
Button chưa làm thì disabled/Sắp có
```

---

## 29. Ghi nhớ ngắn cho Codex

Khi sửa repo này, luôn nhớ:

```txt
Đây là sản phẩm hỗ trợ phân tích đầu tư cho người mới.
Không phải app phím hàng.
Không phải app tín hiệu mua/bán.
Không được bịa dữ liệu.
Không được biến thiếu dữ liệu thành 0.
Không được nhét công thức tài chính vào component.
Không được tạo fair value giả.
Không được dùng git add .
Không được sửa ngoài phạm vi.
Mọi thay đổi phải test/lint/build pass.
```

---

## 30. File này dùng như thế nào?

Trước khi làm task mới, prompt cho Codex nên có câu:

```txt
Trước khi sửa code, hãy đọc:
docs/engineering/CODE_ARCHITECTURE_AND_MAINTENANCE.md
```

Nếu task liên quan financial logic, đọc thêm:

```txt
docs/financial-logic/FINANCIAL_DATA_REQUIREMENTS.md
docs/financial-logic/FINANCIAL_METRICS_LOGIC.md
docs/financial-logic/VALUATION_LOGIC.md
docs/financial-logic/RISK_SCORE_LOGIC.md
```

Nếu task liên quan AI/RAG, đọc thêm:

```txt
docs/financial-logic/AI_EXPLANATION_RULES.md
docs/ai/
docs/rag/
```

Nếu task liên quan route/navigation, đọc thêm:

```txt
src/app
src/components/layout
src/config/navigation.config.ts
```

---

## 31. Kết luận

Tài liệu này là guardrail để giữ codebase Atelier Finance dễ bảo trì, dễ mở rộng và không đi lệch mục tiêu sản phẩm.

Mọi thay đổi mới nên ưu tiên:

```txt
rõ ràng hơn
dễ test hơn
dễ bảo trì hơn
ít trùng logic hơn
ít rủi ro bịa dữ liệu hơn
an toàn hơn cho người dùng mới
```

Không ưu tiên code “thông minh” nếu làm hệ thống khó hiểu hoặc khó sửa về sau.

