# Financial Logic Test Cases

Repo hiện chưa có unit test runner riêng cho pure TypeScript logic, nên tài liệu này ghi các case tối thiểu cần chuyển thành unit test khi bổ sung Vitest/Jest.

| Case | Input chính | Kỳ vọng |
| --- | --- | --- |
| 1. Thiếu dữ liệu | `revenue: null`, `netProfit: undefined` | Metric trả `value: null`, `dataQuality: missing/partial`, không throw. |
| 2. Growth với kỳ gốc âm | `netProfit: 10`, `previousNetProfit: -5` | `calculateNetProfitGrowth` trả `value: null`, `level: unknown`, có warning về kỳ gốc không dương. |
| 3. Doanh thu tăng nhưng lợi nhuận giảm | `revenue > previousRevenue`, `netProfit < previousNetProfit` | `calculateRevenueGrowth` không trả `level: good`, có warning kiểm tra biên và chi phí. |
| 4. ROE cao do đòn bẩy | ROE cao, `totalDebt / totalEquity > 1`, CFO yếu | `calculateRoe` có warning đọc cùng nợ vay và dòng tiền. |
| 5. P/E với EPS âm | `closePrice > 0`, `eps <= 0` | `calculatePeRatio` trả `value: null`, `level: not_applicable`, không diễn giải mức định giá. |
| 6. Công ty tài chính | `companyType: bank` | `calculateCurrentRatio`, `calculateQuickRatio`, `calculateDebtToEquity` trả `not_applicable` hoặc cảnh báo không đọc máy móc. |
| 7. Dữ liệu cũ/thiếu nguồn | `collectedAt` cũ hơn 180 ngày, thiếu `sourceName` | `assessDataQuality` trả `stale` hoặc cảnh báo nguồn thiếu; overall risk không được hạ thấp về `low` chỉ vì thiếu dữ liệu. |

Các case này cần giữ nguyên nguyên tắc: không sinh trường hoặc text mang nghĩa khuyến nghị hành động.
