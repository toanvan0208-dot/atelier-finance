# FINANCIAL_DATA_REQUIREMENTS.md

# Yêu cầu dữ liệu tài chính cho Atelier Finance

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa các dữ liệu tài chính tối thiểu cần có để hệ thống Atelier Finance có thể:

1. Tính các chỉ số tài chính cơ bản.
2. Đánh giá sức khỏe tài chính doanh nghiệp.
3. Xây dựng logic định giá.
4. Xây dựng risk score.
5. Hỗ trợ AI Assistant giải thích dữ liệu cho người dùng mới.
6. Hỗ trợ RAG truy xuất đúng kiến thức và đúng dữ liệu.
7. Giúp frontend hiển thị dữ liệu có giải thích, cảnh báo và trạng thái thiếu dữ liệu.

Tài liệu này không phải là file công thức chi tiết.
Tài liệu này là tài liệu yêu cầu dữ liệu đầu vào để Người 2 và Người 3 bám vào triển khai.

Cụ thể:

* Người 1 dùng tài liệu này để xác định dữ liệu cần cho công thức, định giá, risk score và AI.
* Người 2 dùng tài liệu này để thu thập, chuẩn hóa và kiểm tra dữ liệu thật.
* Người 3 dùng tài liệu này để thiết kế database, API, import dữ liệu và trả dữ liệu cho frontend/AI.

Nguyên tắc quan trọng nhất:

> Không có dữ liệu thì không được tự giả định.
> Không đủ dữ liệu thì không được cố tính.
> Không có ngữ cảnh thì không được kết luận chắc chắn.

---

## 2. Phạm vi dữ liệu cho phiên bản V1

Phiên bản V1 của hệ thống chưa cần bao phủ toàn bộ thị trường chứng khoán Việt Nam.

Phạm vi đề xuất:

* 10 đến 20 mã cổ phiếu.
* 3 đến 5 năm dữ liệu báo cáo tài chính.
* 8 đến 12 quý gần nhất nếu có dữ liệu quý.
* 3 đến 5 năm dữ liệu giá và khối lượng giao dịch.
* Một số ngành đại diện như ngân hàng, công nghệ, thép, bán lẻ, tiêu dùng, bất động sản.
* Một số chỉ tiêu vĩ mô cơ bản nếu có: GDP, CPI, lãi suất, tỷ giá, PMI.

Mục tiêu của V1 không phải là dữ liệu thật hoàn hảo, mà là dữ liệu đủ để demo được luồng:

> Dữ liệu thật → tính chỉ số → đánh giá rủi ro → giải thích dễ hiểu → cảnh báo điểm cần kiểm tra thêm.

---

## 3. Nguyên tắc dữ liệu chung

### 3.1. Không dùng số 0 thay cho dữ liệu thiếu

Nếu dữ liệu không có, hệ thống phải lưu là `null`.

Không được dùng số 0 để thay thế dữ liệu thiếu, vì số 0 có ý nghĩa tài chính riêng và có thể làm sai kết quả tính toán.

Ví dụ:

* Không có dữ liệu dòng tiền kinh doanh thì để `null`, không ghi `0`.
* Không có dữ liệu chi phí lãi vay thì để `null`, không ghi `0`.
* Không có dữ liệu EPS thì để `null`, không ghi `0`.

Cách hiển thị cho người dùng:

```txt
Chưa đủ dữ liệu để tính chỉ số này.
```

Không hiển thị:

```txt
0
```

nếu bản chất là thiếu dữ liệu.

---

### 3.2. Mỗi dữ liệu phải có kỳ thời gian rõ ràng

Mỗi dữ liệu tài chính cần xác định rõ:

* Mã cổ phiếu.
* Năm tài chính.
* Quý tài chính nếu có.
* Loại kỳ dữ liệu: quý, năm, hoặc trailing 12 months.
* Ngày công bố hoặc ngày cập nhật nếu có.
* Nguồn dữ liệu.

Các field thời gian nên dùng:

| Field            | Ý nghĩa               | Ví dụ                |
| ---------------- | --------------------- | -------------------- |
| `fiscal_year`    | Năm tài chính         | 2024                 |
| `fiscal_quarter` | Quý tài chính         | Q1, Q2, Q3, Q4       |
| `period_type`    | Loại kỳ               | annual, quarter, ttm |
| `report_date`    | Ngày báo cáo          | 2024-12-31           |
| `published_date` | Ngày công bố          | 2025-01-25           |
| `collected_at`   | Ngày thu thập dữ liệu | 2026-06-12           |

---

### 3.3. Đơn vị dữ liệu phải thống nhất

Dữ liệu tài chính cần thống nhất đơn vị.

Khuyến nghị dùng:

```txt
Triệu VND
```

hoặc

```txt
Tỷ VND
```

Nhưng toàn bộ hệ thống phải thống nhất một đơn vị trong database.

Không được để tình trạng:

* Doanh thu dùng tỷ VND.
* Lợi nhuận dùng triệu VND.
* Tổng tài sản dùng VND.
* Dòng tiền dùng tỷ VND.

Nếu dữ liệu đến từ nhiều nguồn khác nhau, Người 2 phải chuẩn hóa trước khi import.

Cần có field ghi chú đơn vị nếu cần:

| Field      | Ý nghĩa                                    |
| ---------- | ------------------------------------------ |
| `currency` | Loại tiền tệ, ví dụ VND                    |
| `unit`     | Đơn vị, ví dụ million_vnd hoặc billion_vnd |

---

### 3.4. Mỗi dữ liệu cần có nguồn

Mỗi nhóm dữ liệu phải có nguồn rõ ràng.

Các field nên có:

| Field          | Ý nghĩa                                          |
| -------------- | ------------------------------------------------ |
| `source_name`  | Tên nguồn dữ liệu                                |
| `source_url`   | Link nguồn dữ liệu nếu có                        |
| `collected_at` | Ngày thu thập                                    |
| `source_type`  | Loại nguồn: official, exchange, provider, manual |
| `source_note`  | Ghi chú về nguồn                                 |

Ví dụ:

```txt
source_name: Vietstock
source_url: https://...
collected_at: 2026-06-12
source_type: provider
source_note: Dữ liệu dùng cho demo học thuật, cần kiểm tra quyền sử dụng nếu thương mại hóa.
```

---

### 3.5. Không áp dụng công thức máy móc cho mọi loại doanh nghiệp

Một số chỉ số phù hợp với doanh nghiệp phi tài chính nhưng không phù hợp với ngân hàng, chứng khoán hoặc bảo hiểm.

Ví dụ:

* Debt/Equity không nên áp dụng máy móc cho ngân hàng.
* Current Ratio không nên áp dụng máy móc cho ngân hàng.
* P/B thường quan trọng hơn với ngân hàng so với P/E.
* Dòng tiền của ngân hàng có đặc thù riêng, không nên diễn giải giống doanh nghiệp sản xuất.

Do đó cần có field:

```txt
company_type
```

Các giá trị đề xuất:

| Giá trị         | Ý nghĩa                    |
| --------------- | -------------------------- |
| `non_financial` | Doanh nghiệp phi tài chính |
| `bank`          | Ngân hàng                  |
| `securities`    | Công ty chứng khoán        |
| `insurance`     | Bảo hiểm                   |
| `real_estate`   | Bất động sản               |
| `other`         | Khác                       |

---

## 4. Nhóm dữ liệu định danh cổ phiếu

Nhóm dữ liệu này dùng để nhận diện doanh nghiệp, phân loại ngành và liên kết dữ liệu giữa các bảng.

### 4.1. Field bắt buộc

| Field          | Tên tiếng Việt    | Bắt buộc | Ghi chú                            |
| -------------- | ----------------- | -------: | ---------------------------------- |
| `ticker`       | Mã cổ phiếu       |       Có | Ví dụ: FPT, HPG, VNM               |
| `company_name` | Tên doanh nghiệp  |       Có | Tên đầy đủ                         |
| `exchange`     | Sàn giao dịch     |       Có | HOSE, HNX, UPCOM                   |
| `industry`     | Ngành             |       Có | Ví dụ: Công nghệ, Thép, Ngân hàng  |
| `company_type` | Loại doanh nghiệp |       Có | non_financial, bank, securities... |

### 4.2. Field nên có

| Field                  | Tên tiếng Việt             | Ghi chú                                  |
| ---------------------- | -------------------------- | ---------------------------------------- |
| `sector`               | Nhóm ngành lớn             | Ví dụ: Tài chính, Tiêu dùng, Công nghiệp |
| `listing_date`         | Ngày niêm yết              | Dùng để biết độ dài dữ liệu lịch sử      |
| `business_description` | Mô tả hoạt động kinh doanh | Hỗ trợ AI giải thích                     |
| `website`              | Website doanh nghiệp       | Nếu có                                   |
| `stock_status`         | Trạng thái cổ phiếu        | active, delisted, suspended              |

### 4.3. Lý do cần nhóm dữ liệu này

Nhóm dữ liệu này giúp hệ thống:

* Biết cổ phiếu thuộc ngành nào.
* Biết có nên áp dụng một công thức nhất định hay không.
* Giúp AI giải thích theo bối cảnh doanh nghiệp.
* Giúp risk score tránh đánh giá sai ngành.

Ví dụ:

```txt
Nếu company_type = bank, hệ thống không nên dùng Current Ratio như doanh nghiệp sản xuất.
```

---

## 5. Nhóm dữ liệu giá và thanh khoản

Nhóm dữ liệu này dùng cho:

* P/E.
* P/B.
* P/S.
* Market cap.
* Thanh khoản giao dịch.
* Price Volume Time.
* Liquidity Risk.
* Watchlist.
* Mô phỏng giao dịch.

### 5.1. Field bắt buộc

| Field          | Tên tiếng Việt       | Bắt buộc | Ghi chú                  |
| -------------- | -------------------- | -------: | ------------------------ |
| `ticker`       | Mã cổ phiếu          |       Có | Liên kết với bảng stocks |
| `trading_date` | Ngày giao dịch       |       Có | Format YYYY-MM-DD        |
| `close_price`  | Giá đóng cửa         |       Có | Dùng cho định giá        |
| `volume`       | Khối lượng giao dịch |       Có | Dùng cho thanh khoản     |

### 5.2. Field nên có

| Field                  | Tên tiếng Việt             | Ghi chú                                 |
| ---------------------- | -------------------------- | --------------------------------------- |
| `open_price`           | Giá mở cửa                 | Dùng cho biểu đồ giá                    |
| `high_price`           | Giá cao nhất               | Dùng kiểm tra dữ liệu                   |
| `low_price`            | Giá thấp nhất              | Dùng kiểm tra dữ liệu                   |
| `adjusted_close_price` | Giá điều chỉnh             | Tốt cho phân tích lịch sử               |
| `trading_value`        | Giá trị giao dịch          | Tốt hơn volume khi đánh giá thanh khoản |
| `market_cap`           | Vốn hóa thị trường         | Có thể tính nếu có giá và số cổ phiếu   |
| `foreign_buy_value`    | Giá trị mua của khối ngoại | Nếu có                                  |
| `foreign_sell_value`   | Giá trị bán của khối ngoại | Nếu có                                  |

### 5.3. Rule kiểm tra dữ liệu

* Giá không được âm.
* Volume không được âm.
* `high_price` phải lớn hơn hoặc bằng `low_price`.
* `close_price` nên nằm trong khoảng từ `low_price` đến `high_price`.
* Một mã cổ phiếu không được có hai dòng dữ liệu cùng một ngày.
* Nếu dùng dữ liệu để định giá, nên dùng giá đóng cửa gần nhất.
* Nếu cổ phiếu bị chia tách/cổ tức bằng cổ phiếu, cần ưu tiên giá điều chỉnh nếu phân tích lịch sử dài hạn.

### 5.4. Cách xử lý khi thiếu dữ liệu

| Trường hợp thiếu      | Cách xử lý                                                           |
| --------------------- | -------------------------------------------------------------------- |
| Thiếu `close_price`   | Không tính P/E, P/B, P/S tại ngày đó                                 |
| Thiếu `volume`        | Không tính liquidity risk dựa trên volume                            |
| Thiếu `trading_value` | Có thể dùng volume thay thế, nhưng cần ghi chú                       |
| Thiếu `market_cap`    | Có thể tính từ `close_price * shares_outstanding` nếu có số cổ phiếu |

---

## 6. Nhóm dữ liệu báo cáo kết quả kinh doanh

Nhóm này dùng để phân tích:

* Doanh thu.
* Lợi nhuận.
* Biên lợi nhuận.
* Tăng trưởng.
* EPS.
* P/E.
* Chất lượng lợi nhuận.
* Khả năng trả lãi.

### 6.1. Field bắt buộc

| Field         | Tên tiếng Việt     | Bắt buộc | Dùng cho                         |
| ------------- | ------------------ | -------: | -------------------------------- |
| `ticker`      | Mã cổ phiếu        |       Có | Liên kết dữ liệu                 |
| `fiscal_year` | Năm tài chính      |       Có | Xác định kỳ                      |
| `period_type` | Loại kỳ            |       Có | annual, quarter, ttm             |
| `revenue`     | Doanh thu thuần    |       Có | Tăng trưởng, biên lợi nhuận, P/S |
| `net_profit`  | Lợi nhuận sau thuế |       Có | ROE, ROA, EPS, P/E               |

### 6.2. Field nên có

| Field               | Tên tiếng Việt                  | Dùng cho                               |
| ------------------- | ------------------------------- | -------------------------------------- |
| `fiscal_quarter`    | Quý tài chính                   | Phân tích theo quý                     |
| `gross_profit`      | Lợi nhuận gộp                   | Gross margin                           |
| `operating_profit`  | Lợi nhuận hoạt động             | Operating margin                       |
| `profit_before_tax` | Lợi nhuận trước thuế            | Phân tích lợi nhuận                    |
| `net_profit_parent` | LNST cổ đông công ty mẹ         | EPS, lợi nhuận thuộc cổ đông phổ thông |
| `eps_basic`         | EPS cơ bản                      | P/E                                    |
| `eps_diluted`       | EPS pha loãng                   | P/E thận trọng hơn                     |
| `interest_expense`  | Chi phí lãi vay                 | Interest coverage                      |
| `ebit`              | Lợi nhuận trước lãi vay và thuế | Interest coverage                      |
| `ebitda`            | EBITDA                          | EV/EBITDA nếu có                       |

### 6.3. Cảnh báo diễn giải

Không được kết luận:

```txt
Doanh thu tăng nghĩa là doanh nghiệp tốt.
```

Cần diễn giải:

```txt
Doanh thu tăng là tín hiệu doanh nghiệp mở rộng quy mô bán hàng, nhưng cần kiểm tra biên lợi nhuận, dòng tiền kinh doanh và nợ vay để đánh giá chất lượng tăng trưởng.
```

Không được kết luận:

```txt
Lợi nhuận tăng nghĩa là cổ phiếu nên mua.
```

Cần diễn giải:

```txt
Lợi nhuận tăng là điểm tích cực, nhưng cần kiểm tra lợi nhuận đó có chuyển hóa thành dòng tiền hay không.
```

---

## 7. Nhóm dữ liệu bảng cân đối kế toán

Nhóm này dùng để đánh giá:

* Quy mô tài sản.
* Cơ cấu nợ.
* Vốn chủ sở hữu.
* Đòn bẩy tài chính.
* Thanh khoản ngắn hạn.
* Chất lượng tài sản.
* Rủi ro tài chính.

### 7.1. Field bắt buộc

| Field               | Tên tiếng Việt   | Bắt buộc | Dùng cho          |
| ------------------- | ---------------- | -------: | ----------------- |
| `ticker`            | Mã cổ phiếu      |       Có | Liên kết dữ liệu  |
| `fiscal_year`       | Năm tài chính    |       Có | Xác định kỳ       |
| `period_type`       | Loại kỳ          |       Có | annual, quarter   |
| `total_assets`      | Tổng tài sản     |       Có | ROA, asset growth |
| `total_liabilities` | Tổng nợ phải trả |       Có | Leverage risk     |
| `total_equity`      | Vốn chủ sở hữu   |       Có | ROE, P/B          |

### 7.2. Field nên có

| Field                  | Tên tiếng Việt              | Dùng cho              |
| ---------------------- | --------------------------- | --------------------- |
| `fiscal_quarter`       | Quý tài chính               | Phân tích theo quý    |
| `cash_and_equivalents` | Tiền và tương đương tiền    | Cash to Debt          |
| `short_term_debt`      | Nợ vay ngắn hạn             | Debt risk             |
| `long_term_debt`       | Nợ vay dài hạn              | Debt risk             |
| `total_debt`           | Tổng nợ vay                 | Debt/Equity, Net Debt |
| `current_assets`       | Tài sản ngắn hạn            | Current Ratio         |
| `current_liabilities`  | Nợ ngắn hạn                 | Current Ratio         |
| `inventory`            | Hàng tồn kho                | Chất lượng tài sản    |
| `accounts_receivable`  | Phải thu khách hàng         | Earnings Quality Risk |
| `shares_outstanding`   | Số cổ phiếu lưu hành        | EPS, BVPS, market cap |
| `book_value_per_share` | Giá trị sổ sách mỗi cổ phần | P/B                   |

### 7.3. Rule kiểm tra dữ liệu

* `total_assets` nên xấp xỉ `total_liabilities + total_equity`.
* `total_assets` không nên âm.
* `total_equity` âm cần bật cảnh báo.
* Nếu `total_debt` không có, có thể tính bằng `short_term_debt + long_term_debt` nếu hai trường này có.
* Nếu `shares_outstanding` thiếu, không tính được BVPS và market cap theo cách nội bộ.
* Nếu `accounts_receivable` tăng nhanh hơn doanh thu, cần đưa vào cảnh báo chất lượng lợi nhuận.
* Nếu `inventory` tăng nhanh trong khi doanh thu không tăng tương ứng, cần cảnh báo rủi ro tồn kho.

---

## 8. Nhóm dữ liệu lưu chuyển tiền tệ

Nhóm này dùng để đánh giá chất lượng lợi nhuận và khả năng tạo tiền thật của doanh nghiệp.

### 8.1. Field bắt buộc

| Field                 | Tên tiếng Việt                    | Bắt buộc | Dùng cho                            |
| --------------------- | --------------------------------- | -------: | ----------------------------------- |
| `ticker`              | Mã cổ phiếu                       |       Có | Liên kết dữ liệu                    |
| `fiscal_year`         | Năm tài chính                     |       Có | Xác định kỳ                         |
| `period_type`         | Loại kỳ                           |       Có | annual, quarter                     |
| `operating_cash_flow` | Dòng tiền từ hoạt động kinh doanh |       Có | CFO/Net Profit, quality of earnings |

### 8.2. Field nên có

| Field                 | Tên tiếng Việt                   | Dùng cho                   |
| --------------------- | -------------------------------- | -------------------------- |
| `fiscal_quarter`      | Quý tài chính                    | Phân tích theo quý         |
| `investing_cash_flow` | Dòng tiền từ hoạt động đầu tư    | Phân tích đầu tư           |
| `financing_cash_flow` | Dòng tiền từ hoạt động tài chính | Phân tích vay nợ, cổ tức   |
| `capital_expenditure` | Chi phí đầu tư tài sản cố định   | Free Cash Flow             |
| `free_cash_flow`      | Dòng tiền tự do                  | Có thể tính từ CFO - Capex |
| `dividends_paid`      | Cổ tức đã trả                    | Cổ tức, dòng tiền ra       |

### 8.3. Cảnh báo diễn giải

Không được kết luận:

```txt
Dòng tiền âm nghĩa là doanh nghiệp xấu.
```

Cần diễn giải:

```txt
Dòng tiền âm cần được xem trong bối cảnh. Nếu doanh nghiệp đang đầu tư mở rộng thì FCF âm có thể chấp nhận được. Nhưng nếu lợi nhuận dương trong khi dòng tiền kinh doanh âm kéo dài, đây là điểm cần kiểm tra kỹ.
```

### 8.4. Rule kiểm tra dữ liệu

* Nếu `net_profit > 0` nhưng `operating_cash_flow < 0`, bật cảnh báo chất lượng lợi nhuận.
* Nếu tình trạng này kéo dài nhiều kỳ, tăng mức rủi ro.
* Nếu `free_cash_flow` âm, cần kiểm tra nguyên nhân: do CFO yếu hay do Capex cao.
* Nếu thiếu `capital_expenditure`, không nên tự tính FCF trừ khi nguồn dữ liệu đủ rõ.

---

## 9. Dữ liệu cần cho nhóm chỉ số tăng trưởng

### 9.1. Các chỉ số tăng trưởng dự kiến

| Chỉ số                     | Dữ liệu cần                             |
| -------------------------- | --------------------------------------- |
| Revenue Growth             | `revenue` nhiều kỳ                      |
| Gross Profit Growth        | `gross_profit` nhiều kỳ                 |
| Operating Profit Growth    | `operating_profit` nhiều kỳ             |
| Net Profit Growth          | `net_profit` nhiều kỳ                   |
| EPS Growth                 | `eps_basic` hoặc `eps_diluted` nhiều kỳ |
| Equity Growth              | `total_equity` nhiều kỳ                 |
| Asset Growth               | `total_assets` nhiều kỳ                 |
| Operating Cash Flow Growth | `operating_cash_flow` nhiều kỳ          |

### 9.2. Yêu cầu dữ liệu

* Cần ít nhất 2 kỳ liên tiếp để tính tăng trưởng.
* Nếu có 3 đến 5 năm dữ liệu thì tốt hơn.
* Nếu kỳ trước bằng 0, không tính tỷ lệ tăng trưởng thông thường.
* Nếu kỳ trước âm, cần cảnh báo vì tỷ lệ tăng trưởng có thể gây hiểu nhầm.
* Nếu thiếu kỳ trước, trả về `null`.

### 9.3. Cách hiển thị khi không đủ dữ liệu

```txt
Chưa đủ dữ liệu kỳ trước để tính tăng trưởng.
```

Không hiển thị:

```txt
0%
```

nếu thực tế là thiếu dữ liệu.

---

## 10. Dữ liệu cần cho nhóm chỉ số sinh lời

### 10.1. Các chỉ số sinh lời dự kiến

| Chỉ số            | Dữ liệu cần                        |
| ----------------- | ---------------------------------- |
| Gross Margin      | `gross_profit`, `revenue`          |
| Operating Margin  | `operating_profit`, `revenue`      |
| Net Profit Margin | `net_profit`, `revenue`            |
| ROA               | `net_profit`, `total_assets`       |
| ROE               | `net_profit`, `total_equity`       |
| ROIC              | `nopat`, `invested_capital` nếu có |
| EBITDA Margin     | `ebitda`, `revenue`                |

### 10.2. Yêu cầu dữ liệu

* ROA nên dùng tài sản bình quân nếu có dữ liệu đầu kỳ và cuối kỳ.
* ROE nên dùng vốn chủ bình quân nếu có dữ liệu đầu kỳ và cuối kỳ.
* Nếu chỉ có số cuối kỳ, cần ghi chú là công thức đơn giản hóa.
* Nếu `total_equity <= 0`, không diễn giải ROE theo cách thông thường.
* Nếu `revenue <= 0`, không tính các loại margin thông thường.

### 10.3. Cảnh báo diễn giải

ROE cao không phải lúc nào cũng tốt.

Cần kiểm tra:

* Doanh nghiệp có dùng nhiều nợ không?
* Vốn chủ có thấp bất thường không?
* Lợi nhuận có bền vững không?
* Dòng tiền kinh doanh có hỗ trợ lợi nhuận không?

---

## 11. Dữ liệu cần cho nhóm đòn bẩy và thanh khoản

### 11.1. Các chỉ số dự kiến

| Chỉ số                | Dữ liệu cần                                          |
| --------------------- | ---------------------------------------------------- |
| Debt/Equity           | `total_debt`, `total_equity`                         |
| Liabilities/Assets    | `total_liabilities`, `total_assets`                  |
| Net Debt              | `total_debt`, `cash_and_equivalents`                 |
| Current Ratio         | `current_assets`, `current_liabilities`              |
| Quick Ratio           | `current_assets`, `inventory`, `current_liabilities` |
| Interest Coverage     | `ebit`, `interest_expense`                           |
| Cash/Total Debt       | `cash_and_equivalents`, `total_debt`                 |
| Short-term Debt Ratio | `short_term_debt`, `total_debt`                      |

### 11.2. Yêu cầu dữ liệu

* Không áp dụng máy móc các chỉ số này cho ngân hàng.
* Nếu thiếu `interest_expense`, không tính Interest Coverage.
* Nếu `current_liabilities <= 0`, không tính Current Ratio.
* Nếu `total_equity <= 0`, Debt/Equity cần cảnh báo hoặc không hiển thị theo cách thông thường.
* Nếu `total_debt` thiếu, có thể tính từ `short_term_debt + long_term_debt` nếu đủ dữ liệu.

### 11.3. Cảnh báo diễn giải

Nợ cao không tự động xấu.
Cần xem cùng:

* Dòng tiền kinh doanh.
* Lãi vay.
* Khả năng trả lãi.
* Ngành nghề.
* Chu kỳ kinh doanh.
* Cấu trúc nợ ngắn hạn/dài hạn.

---

## 12. Dữ liệu cần cho nhóm dòng tiền

### 12.1. Các chỉ số dự kiến

| Chỉ số                     | Dữ liệu cần                                  |
| -------------------------- | -------------------------------------------- |
| CFO/Net Profit             | `operating_cash_flow`, `net_profit`          |
| Free Cash Flow             | `operating_cash_flow`, `capital_expenditure` |
| FCF Margin                 | `free_cash_flow`, `revenue`                  |
| Capex/Revenue              | `capital_expenditure`, `revenue`             |
| Operating Cash Flow Margin | `operating_cash_flow`, `revenue`             |
| FCF/Net Profit             | `free_cash_flow`, `net_profit`               |
| Cash Conversion            | `operating_cash_flow`, `net_profit`          |

### 12.2. Yêu cầu dữ liệu

* Cần dữ liệu nhiều kỳ để xác định vấn đề kéo dài hay chỉ xuất hiện một kỳ.
* Nếu `net_profit <= 0`, CFO/Net Profit không nên diễn giải theo cách thông thường.
* Nếu `capital_expenditure` thiếu, không tính FCF.
* Nếu FCF âm, cần phân biệt do CFO yếu hay do Capex cao.
* Nếu CFO âm nhiều kỳ trong khi lợi nhuận dương, bật cảnh báo mạnh.

### 12.3. Cảnh báo diễn giải

Lợi nhuận là con số kế toán.
Dòng tiền kinh doanh cho biết doanh nghiệp có thật sự thu được tiền từ hoạt động kinh doanh hay không.

Do đó, nhóm dòng tiền cần được ưu tiên trong phần cảnh báo cho người mới.

---

## 13. Dữ liệu cần cho nhóm định giá

### 13.1. Các chỉ số định giá dự kiến

| Chỉ số           | Dữ liệu cần                                                  |
| ---------------- | ------------------------------------------------------------ |
| EPS              | `net_profit_parent`, `shares_outstanding` hoặc `eps_basic`   |
| BVPS             | `total_equity`, `shares_outstanding`                         |
| P/E              | `close_price`, `eps_basic` hoặc `eps_ttm`                    |
| P/B              | `close_price`, `book_value_per_share`                        |
| P/S              | `market_cap`, `revenue`                                      |
| EV/EBITDA        | `market_cap`, `total_debt`, `cash_and_equivalents`, `ebitda` |
| Earnings Yield   | `eps`, `close_price`                                         |
| Dividend Yield   | `dividend_per_share`, `close_price`                          |
| Market Cap       | `close_price`, `shares_outstanding`                          |
| Enterprise Value | `market_cap`, `total_debt`, `cash_and_equivalents`           |

### 13.2. Yêu cầu dữ liệu

* P/E chỉ nên tính khi EPS dương.
* Nếu EPS âm, không diễn giải P/E là rẻ/đắt theo cách thông thường.
* P/B cần vốn chủ và số cổ phiếu lưu hành.
* Nếu vốn chủ âm, không diễn giải P/B thông thường.
* P/S cần market cap và doanh thu.
* EV/EBITDA chỉ tính khi đủ dữ liệu về market cap, debt, cash và EBITDA.
* Dividend Yield chỉ tính nếu có dữ liệu cổ tức.

### 13.3. Cảnh báo diễn giải

Không được diễn giải:

```txt
P/E thấp nghĩa là cổ phiếu rẻ.
```

Cần diễn giải:

```txt
P/E thấp có thể phản ánh định giá thấp, nhưng cũng có thể do thị trường lo ngại lợi nhuận suy giảm, chất lượng lợi nhuận thấp hoặc ngành đang ở cuối chu kỳ.
```

Không được diễn giải:

```txt
P/B thấp nghĩa là cổ phiếu an toàn.
```

Cần diễn giải:

```txt
P/B thấp cần được kiểm tra cùng chất lượng tài sản, ROE, triển vọng ngành và rủi ro minh bạch.
```

---

## 14. Dữ liệu cần cho logic định giá

### 14.1. Định giá theo P/E

Dữ liệu cần:

* `close_price`
* `eps_ttm` hoặc `eps_annual`
* `pe_ratio`
* `pe_history` nếu có
* `industry_average_pe` nếu có
* `net_profit_growth`
* `earnings_quality_warning`

Yêu cầu:

* Nếu thiếu EPS thì không tính P/E.
* Nếu EPS âm thì trả về trạng thái không phù hợp.
* Nếu không có trung bình ngành hoặc lịch sử P/E, chỉ hiển thị P/E hiện tại và cảnh báo hạn chế dữ liệu.

### 14.2. Định giá theo P/B

Dữ liệu cần:

* `close_price`
* `total_equity`
* `shares_outstanding`
* `book_value_per_share`
* `pb_ratio`
* `pb_history` nếu có
* `industry_average_pb` nếu có
* `roe`

Yêu cầu:

* Nếu thiếu vốn chủ hoặc số cổ phiếu thì không tính BVPS.
* Nếu vốn chủ âm thì không diễn giải P/B thông thường.
* Với ngân hàng, P/B cần xem cùng ROE và chất lượng tài sản.

### 14.3. Định giá theo kịch bản Bear/Base/Bull

Dữ liệu cần:

* `current_price`
* `current_eps`
* `current_bvps`
* `expected_growth_rate`
* `target_pe`
* `target_pb`
* `margin_of_safety`
* `valuation_confidence_level`

Yêu cầu:

* Nếu chưa có giả định tăng trưởng và target multiple, không đưa ra giá trị định giá cuối cùng.
* Hệ thống có thể hiển thị khung kịch bản mẫu, nhưng phải ghi rõ là chưa đủ dữ liệu để kết luận.
* Định giá phải được trình bày là vùng ước lượng, không phải con số chắc chắn.

---

## 15. Dữ liệu cần cho risk score

Risk score không phải để khuyến nghị mua bán.
Risk score dùng để cảnh báo người dùng mới về các điểm cần kiểm tra trước khi kết luận.

### 15.1. Financial Risk

Dữ liệu cần:

| Field                  | Ý nghĩa                  |
| ---------------------- | ------------------------ |
| `total_assets`         | Tổng tài sản             |
| `total_liabilities`    | Tổng nợ phải trả         |
| `total_equity`         | Vốn chủ sở hữu           |
| `current_assets`       | Tài sản ngắn hạn         |
| `current_liabilities`  | Nợ ngắn hạn              |
| `cash_and_equivalents` | Tiền và tương đương tiền |

Dùng để đánh giá:

* Tỷ lệ nợ trên tài sản.
* Tình trạng vốn chủ.
* Thanh khoản ngắn hạn.
* Cân đối tài chính cơ bản.

---

### 15.2. Debt Risk

Dữ liệu cần:

| Field                  | Ý nghĩa                         |
| ---------------------- | ------------------------------- |
| `short_term_debt`      | Nợ vay ngắn hạn                 |
| `long_term_debt`       | Nợ vay dài hạn                  |
| `total_debt`           | Tổng nợ vay                     |
| `cash_and_equivalents` | Tiền mặt                        |
| `interest_expense`     | Chi phí lãi vay                 |
| `ebit`                 | Lợi nhuận trước lãi vay và thuế |
| `operating_cash_flow`  | Dòng tiền kinh doanh            |

Dùng để đánh giá:

* Doanh nghiệp dùng nợ nhiều hay ít.
* Nợ ngắn hạn có chiếm tỷ trọng lớn không.
* Tiền mặt có đủ đệm so với nợ vay không.
* Lợi nhuận hoạt động có đủ trả lãi không.
* Dòng tiền có hỗ trợ trả nợ không.

---

### 15.3. Earnings Quality Risk

Dữ liệu cần:

| Field                 | Ý nghĩa              |
| --------------------- | -------------------- |
| `net_profit`          | Lợi nhuận sau thuế   |
| `operating_cash_flow` | Dòng tiền kinh doanh |
| `accounts_receivable` | Phải thu khách hàng  |
| `inventory`           | Hàng tồn kho         |
| `revenue`             | Doanh thu            |
| `gross_profit`        | Lợi nhuận gộp        |

Dùng để đánh giá:

* Lợi nhuận có chuyển hóa thành tiền không.
* Phải thu có tăng nhanh bất thường không.
* Hàng tồn kho có tăng nhanh không.
* Biên lợi nhuận có suy giảm không.

---

### 15.4. Valuation Risk

Dữ liệu cần:

| Field                  | Ý nghĩa                     |
| ---------------------- | --------------------------- |
| `close_price`          | Giá cổ phiếu                |
| `eps`                  | Lợi nhuận trên mỗi cổ phiếu |
| `book_value_per_share` | Giá trị sổ sách mỗi cổ phần |
| `pe_ratio`             | P/E                         |
| `pb_ratio`             | P/B                         |
| `pe_history`           | Lịch sử P/E                 |
| `pb_history`           | Lịch sử P/B                 |
| `industry_average_pe`  | P/E trung bình ngành        |
| `industry_average_pb`  | P/B trung bình ngành        |

Dùng để đánh giá:

* Cổ phiếu đang được định giá cao/thấp so với chính nó trong quá khứ.
* Cổ phiếu đang được định giá cao/thấp so với ngành.
* Định giá hiện tại có phụ thuộc quá nhiều vào kỳ vọng tăng trưởng không.

---

### 15.5. Liquidity Risk

Dữ liệu cần:

| Field           | Ý nghĩa                                   |
| --------------- | ----------------------------------------- |
| `volume`        | Khối lượng giao dịch                      |
| `trading_value` | Giá trị giao dịch                         |
| `market_cap`    | Vốn hóa thị trường                        |
| `free_float`    | Tỷ lệ cổ phiếu tự do chuyển nhượng nếu có |

Dùng để đánh giá:

* Cổ phiếu có dễ mua/bán không.
* Thanh khoản có đủ cho nhà đầu tư cá nhân không.
* Giá có dễ bị biến động mạnh do thanh khoản thấp không.

---

### 15.6. Data Quality Risk

Dữ liệu cần:

| Field                  | Ý nghĩa                  |
| ---------------------- | ------------------------ |
| `missing_fields_count` | Số field bị thiếu        |
| `missing_fields`       | Danh sách field bị thiếu |
| `last_updated`         | Lần cập nhật gần nhất    |
| `source_name`          | Nguồn dữ liệu            |
| `source_reliability`   | Độ tin cậy nguồn         |
| `available_periods`    | Số kỳ dữ liệu hiện có    |
| `stale_data_flag`      | Cờ dữ liệu cũ            |

Dùng để đánh giá:

* Dữ liệu có đủ để tính không.
* Dữ liệu có quá cũ không.
* Nguồn dữ liệu có rõ ràng không.
* Có nên tin vào kết quả phân tích hiện tại không.

---

## 16. Dữ liệu cần cho AI Assistant

AI Assistant cần context có cấu trúc rõ ràng.

### 16.1. Context tối thiểu cần gửi cho AI

| Nhóm context       | Dữ liệu cần                                  |
| ------------------ | -------------------------------------------- |
| Thông tin cổ phiếu | ticker, company_name, industry, company_type |
| Kỳ dữ liệu         | fiscal_year, fiscal_quarter, period_type     |
| Chỉ số tài chính   | ratios đã tính                               |
| Cảnh báo           | warnings                                     |
| Dữ liệu thiếu      | missing_fields                               |
| Risk score         | risk_level, risk_reasons                     |
| Định giá           | valuation_summary nếu có                     |
| Nguồn dữ liệu      | source_name, last_updated                    |
| Guardrails         | Không khuyến nghị mua/bán                    |

### 16.2. AI không được làm

AI không được:

* Bịa số liệu ngoài context.
* Nói nên mua hoặc nên bán.
* Nói cổ phiếu chắc chắn tăng hoặc chắc chắn giảm.
* Kết luận doanh nghiệp tốt/xấu chỉ từ một chỉ số.
* Diễn giải P/E thấp là chắc chắn rẻ.
* Diễn giải ROE cao là chắc chắn tốt.

### 16.3. AI phải làm

AI phải:

* Nói rõ dữ liệu hiện tại cho thấy gì.
* Nói rõ điểm cần kiểm tra thêm.
* Nói rõ khi chưa đủ dữ liệu.
* Giải thích dễ hiểu cho người mới.
* Phân biệt dữ liệu, diễn giải và cảnh báo.
* Nhắc rằng đây không phải khuyến nghị mua/bán.

---

## 17. Output mong muốn từ API

Người 3 cần đảm bảo API trả dữ liệu theo format phục vụ frontend và AI.

### 17.1. Output cho financial ratios

Ví dụ:

```json
{
  "ticker": "FPT",
  "period": "2024",
  "period_type": "annual",
  "ratios": {
    "revenue_growth": 0.18,
    "net_profit_growth": 0.21,
    "gross_margin": 0.39,
    "net_margin": 0.16,
    "roe": 0.25,
    "roa": 0.11,
    "debt_to_equity": 0.8,
    "current_ratio": 1.6,
    "cfo_to_net_profit": 1.1
  },
  "missing_fields": [],
  "warnings": [
    "ROE cần được so sánh với nợ vay và chất lượng lợi nhuận."
  ],
  "source": {
    "source_name": "Tên nguồn dữ liệu",
    "source_url": "https://example.com",
    "last_updated": "2026-06-12"
  }
}
```

### 17.2. Output khi thiếu dữ liệu

Ví dụ:

```json
{
  "ticker": "FPT",
  "period": "2024",
  "period_type": "annual",
  "ratios": {
    "roe": null
  },
  "missing_fields": [
    "total_equity_beginning",
    "total_equity_ending"
  ],
  "warnings": [
    "Chưa đủ dữ liệu để tính ROE theo vốn chủ bình quân."
  ],
  "source": {
    "source_name": "Tên nguồn dữ liệu",
    "last_updated": "2026-06-12"
  }
}
```

### 17.3. Output cho risk score

Ví dụ:

```json
{
  "ticker": "HPG",
  "period": "2024",
  "risk_summary": {
    "overall_risk_level": "medium",
    "financial_risk": {
      "level": "medium",
      "score": 55,
      "reasons": [
        "Tỷ lệ nợ ở mức cần theo dõi.",
        "Cần kiểm tra thêm dòng tiền kinh doanh."
      ]
    },
    "debt_risk": {
      "level": "high",
      "score": 72,
      "reasons": [
        "Nợ vay tăng nhanh hơn vốn chủ.",
        "Interest Coverage thấp hơn mức an toàn."
      ]
    },
    "earnings_quality_risk": {
      "level": "medium",
      "score": 58,
      "reasons": [
        "Lợi nhuận tăng nhưng CFO chưa tăng tương ứng."
      ]
    },
    "data_quality_risk": {
      "level": "low",
      "score": 20,
      "reasons": [
        "Dữ liệu đủ cho các chỉ số chính."
      ]
    }
  },
  "missing_fields": [],
  "warnings": [
    "Risk score là công cụ cảnh báo, không phải khuyến nghị mua bán."
  ]
}
```

---

## 18. Danh sách dữ liệu ưu tiên cho bản demo V1

### 18.1. Bắt buộc có

Nhóm dữ liệu bắt buộc:

```txt
ticker
company_name
exchange
industry
company_type
trading_date
close_price
volume
fiscal_year
period_type
revenue
net_profit
total_assets
total_liabilities
total_equity
operating_cash_flow
source_name
collected_at
```

Nếu thiếu các dữ liệu này, hệ thống khó demo được logic tài chính cơ bản.

---

### 18.2. Nên có

Nhóm dữ liệu nên có:

```txt
gross_profit
operating_profit
current_assets
current_liabilities
short_term_debt
long_term_debt
total_debt
cash_and_equivalents
accounts_receivable
inventory
shares_outstanding
eps_basic
interest_expense
ebit
capital_expenditure
trading_value
market_cap
```

Các dữ liệu này giúp hệ thống tính được nhiều chỉ số quan trọng hơn và giải thích rủi ro tốt hơn.

---

### 18.3. Có thì tốt

Nhóm dữ liệu có thì tốt:

```txt
ebitda
eps_diluted
dividends_paid
dividend_per_share
free_float
pe_history
pb_history
industry_average_pe
industry_average_pb
foreign_buy_value
foreign_sell_value
news_events
corporate_actions
```

Các dữ liệu này giúp hệ thống định giá, phân tích thanh khoản, PVT và AI giải thích sâu hơn.

---

## 19. Các trường hợp phải trả về “chưa đủ dữ liệu”

Hệ thống phải trả về trạng thái chưa đủ dữ liệu trong các trường hợp sau:

| Trường hợp                   | Cách xử lý                                        |
| ---------------------------- | ------------------------------------------------- |
| Thiếu EPS                    | Không tính P/E                                    |
| EPS âm                       | Không diễn giải P/E thông thường                  |
| Thiếu vốn chủ                | Không tính ROE, P/B                               |
| Vốn chủ âm                   | Cảnh báo, không diễn giải ROE/P/B thông thường    |
| Thiếu CFO                    | Không đánh giá chất lượng lợi nhuận qua dòng tiền |
| Thiếu giá đóng cửa           | Không tính định giá thị trường                    |
| Thiếu volume                 | Không đánh giá thanh khoản giao dịch              |
| Thiếu interest expense       | Không tính Interest Coverage                      |
| Thiếu nhiều kỳ dữ liệu       | Không tính tăng trưởng                            |
| Thiếu source_url/source_name | Tăng Data Quality Risk                            |

Thông báo mẫu:

```txt
Chưa đủ dữ liệu để tính chỉ số này một cách đáng tin cậy.
```

---

## 20. Những diễn giải bị cấm

Để tránh gây hiểu nhầm cho người mới, hệ thống không được diễn giải như sau:

### 20.1. P/E thấp

Không được nói:

```txt
P/E thấp nghĩa là cổ phiếu rẻ.
```

Nên nói:

```txt
P/E thấp có thể cho thấy định giá thấp hơn, nhưng cần kiểm tra chất lượng lợi nhuận, triển vọng tăng trưởng, rủi ro ngành và bối cảnh thị trường.
```

### 20.2. ROE cao

Không được nói:

```txt
ROE cao nghĩa là doanh nghiệp chắc chắn tốt.
```

Nên nói:

```txt
ROE cao là điểm tích cực, nhưng cần kiểm tra xem ROE cao đến từ hiệu quả kinh doanh thật hay do đòn bẩy tài chính cao hoặc vốn chủ thấp bất thường.
```

### 20.3. Dòng tiền âm

Không được nói:

```txt
Dòng tiền âm nghĩa là doanh nghiệp xấu.
```

Nên nói:

```txt
Dòng tiền âm cần được xem trong bối cảnh. Nếu doanh nghiệp đang mở rộng đầu tư thì FCF âm có thể chấp nhận được. Nhưng nếu lợi nhuận dương mà dòng tiền kinh doanh âm kéo dài thì cần cảnh báo.
```

### 20.4. Risk score thấp

Không được nói:

```txt
Risk thấp nghĩa là nên mua.
```

Nên nói:

```txt
Risk thấp nghĩa là hệ thống hiện chưa phát hiện nhiều cảnh báo lớn từ dữ liệu hiện có, nhưng người dùng vẫn cần kiểm tra định giá, ngành và mục tiêu đầu tư cá nhân.
```

### 20.5. Risk score cao

Không được nói:

```txt
Risk cao nghĩa là nên bán.
```

Nên nói:

```txt
Risk cao nghĩa là có nhiều điểm cần kiểm tra thêm trước khi đưa ra quyết định cá nhân. Đây không phải khuyến nghị mua bán.
```

---

## 21. Gợi ý cấu trúc database liên quan

Người 3 có thể tham khảo các bảng sau:

```txt
stocks
stock_prices
financial_reports
financial_ratios
valuation_results
risk_assessments
data_sources
macro_indicators
rag_documents
rag_chunks
```

Trong đó:

* `stocks`: lưu thông tin định danh cổ phiếu.
* `stock_prices`: lưu giá và thanh khoản.
* `financial_reports`: lưu báo cáo tài chính gốc.
* `financial_ratios`: lưu chỉ số đã tính.
* `valuation_results`: lưu kết quả định giá.
* `risk_assessments`: lưu kết quả risk score.
* `data_sources`: lưu nguồn dữ liệu.
* `macro_indicators`: lưu dữ liệu vĩ mô nếu có.
* `rag_documents`: lưu tài liệu tri thức cho AI/RAG.
* `rag_chunks`: lưu các đoạn tri thức đã chia nhỏ cho RAG.

---

## 22. Checklist cho Người 2

Người 2 cần kiểm tra:

```txt
[ ] Dữ liệu có nguồn rõ ràng không?
[ ] Đơn vị dữ liệu đã thống nhất chưa?
[ ] Có đủ dữ liệu cho 10-20 mã cổ phiếu demo chưa?
[ ] Có đủ dữ liệu giá và volume chưa?
[ ] Có đủ báo cáo tài chính 3-5 năm chưa?
[ ] Có đủ dữ liệu để tính revenue, net profit, assets, liabilities, equity, CFO chưa?
[ ] Dữ liệu thiếu có để null thay vì 0 không?
[ ] Có source_name và collected_at không?
[ ] Có phân biệt doanh nghiệp ngân hàng và phi tài chính không?
[ ] Có phát hiện dữ liệu bất thường không?
```

---

## 23. Checklist cho Người 3

Người 3 cần kiểm tra:

```txt
[ ] Database có đủ bảng cần thiết chưa?
[ ] Schema có đủ field bắt buộc chưa?
[ ] API có trả missing_fields không?
[ ] API có trả warnings không?
[ ] API có trả source và last_updated không?
[ ] API có trả null khi thiếu dữ liệu không?
[ ] API có tránh tự tính khi thiếu field không?
[ ] API có phân biệt company_type không?
[ ] API có phục vụ được frontend mới không?
[ ] API có phục vụ được AI context không?
```

---

## 24. Kết luận

`FINANCIAL_DATA_REQUIREMENTS.md` là tài liệu nền để cả nhóm thống nhất dữ liệu cần có.

Nếu không có tài liệu này, Người 2 có thể thu thập thiếu dữ liệu, Người 3 có thể thiết kế database/API không đúng nhu cầu, còn Người 1 sẽ khó triển khai công thức, định giá, risk score và AI một cách nhất quán.

Nguyên tắc cuối cùng:

```txt
Dữ liệu thiếu → trả null.
Công thức thiếu đầu vào → không tính.
Kết quả thiếu ngữ cảnh → không kết luận.
AI thiếu context → nói chưa đủ dữ liệu.
Risk score → chỉ cảnh báo, không khuyến nghị mua bán.
```

