# API_CONTRACT_REVIEW.md

# Review hợp đồng API giữa Frontend, Backend và Financial Logic

## 1. Mục tiêu tài liệu

Tài liệu này dùng để review và thống nhất contract giữa:

* Frontend mới của Atelier Finance.
* Backend/API do Người 3 triển khai.
* Financial Logic, Valuation Logic, Risk Score và AI/RAG do Người 1 định nghĩa.
* Dữ liệu thật do Người 2 thu thập và chuẩn hóa.

Mục tiêu của file này không phải là yêu cầu làm lại backend từ đầu.

Mục tiêu chính là:

1. Xác định API hiện tại đã có gì.
2. Xác định frontend mới cần thêm gì.
3. Xác định field nào đang thiếu.
4. Xác định field nào có nhưng chưa rõ công thức.
5. Xác định response nào cần bổ sung `missing_fields`, `warnings`, `explanation`, `source`, `last_updated`.
6. Đảm bảo backend không tự quyết định công thức tài chính, định giá hoặc risk score nếu chưa có logic từ Người 1.
7. Đảm bảo API phục vụ được mục tiêu của hệ thống: hỗ trợ người mới hiểu dữ liệu, không đưa khuyến nghị mua/bán.

Nguyên tắc quan trọng:

> Backend có thể triển khai kỹ thuật trước.
> Nhưng công thức tài chính, định giá, risk score và nguyên tắc AI phải bám theo tài liệu nghiệp vụ của Người 1.

---

## 2. Bối cảnh hiện tại

Backend hiện tại đã có các nhóm API chính:

```txt id="k4n0ia"
GET /api/stocks
GET /api/stocks/[ticker]
GET /api/stocks/[ticker]/prices
GET /api/stocks/[ticker]/financials
GET /api/stocks/[ticker]/ratios
GET /api/stocks/[ticker]/valuation
GET /api/stocks/[ticker]/risk
```

Đây là nền tảng tốt và nên được giữ lại.

Tuy nhiên, vì backend được làm trước khi Người 1 hoàn thiện các file logic tài chính, nên cần review lại:

* API đã đủ dữ liệu cho frontend mới chưa?
* API đã đủ dữ liệu cho financial logic chưa?
* Các chỉ số trong API được tính theo công thức nào?
* Risk score được chấm theo tiêu chí nào?
* Valuation được tạo theo giả định nào?
* Khi thiếu dữ liệu, API có trả `null`, `missing_fields` và `warnings` không?
* API có đang dùng dữ liệu mẫu hay dữ liệu thật?
* API có đủ context cho AI Assistant giải thích không?

---

## 3. Nguyên tắc contract chung

### 3.1. API không chỉ trả số, mà phải trả ngữ cảnh

Với hệ thống Atelier Finance, API không nên chỉ trả dữ liệu dạng:

```json id="xmaz4g"
{
  "roe": 0.25,
  "pe_ratio": 9.5
}
```

Vì người dùng mới có thể hiểu sai số liệu.

API nên trả thêm:

```json id="og2s0c"
{
  "roe": 0.25,
  "warnings": [
    "ROE cao cần được kiểm tra cùng nợ vay và chất lượng lợi nhuận."
  ],
  "missing_fields": [],
  "explanation": "ROE cho biết doanh nghiệp tạo ra bao nhiêu lợi nhuận trên vốn chủ sở hữu."
}
```

### 3.2. Khi thiếu dữ liệu phải trả `null`, không trả số 0 giả

Nếu thiếu dữ liệu, API không được trả `0` nếu bản chất là không có dữ liệu.

Ví dụ sai:

```json id="jmgd32"
{
  "pe_ratio": 0
}
```

Ví dụ đúng:

```json id="10xcpz"
{
  "pe_ratio": null,
  "missing_fields": ["eps_ttm"],
  "warnings": [
    "Chưa đủ dữ liệu EPS để tính P/E."
  ]
}
```

### 3.3. API phải trả nguồn dữ liệu

Mỗi response liên quan đến dữ liệu tài chính nên có:

```txt id="xka9af"
source_name
source_url
last_updated
collected_at
data_quality_status
```

Nếu không có nguồn, AI và frontend phải cảnh báo:

```txt id="wakkgt"
Nguồn dữ liệu chưa được xác nhận đầy đủ.
```

### 3.4. API không được tự kết luận mua/bán

Không được trả các field kiểu:

```txt id="1wugka"
recommendation: buy
recommendation: sell
signal: strong_buy
signal: strong_sell
```

Nếu cần gợi ý, chỉ dùng:

```txt id="5k4jow"
next_step_suggestion
checklist_prompt
risk_warning
```

Ví dụ:

```json id="6tn396"
{
  "next_step_suggestion": "Nên kiểm tra thêm dòng tiền kinh doanh và nợ vay trước khi kết luận."
}
```

---

## 4. Review API hiện tại

## 4.1. GET /api/stocks

### Mục đích hiện tại

API này lấy danh sách cổ phiếu để frontend hiển thị danh sách hoặc bảng tổng quan.

### Response hiện tại dự kiến

```json id="8jw0e0"
{
  "data": [
    {
      "ticker": "VCB",
      "company_name": "Ngân hàng TMCP Ngoại thương Việt Nam",
      "exchange": "HOSE",
      "industry_name": "Ngân hàng",
      "close_price": 92000,
      "latest_price_date": "2024-12-27"
    }
  ],
  "error": null
}
```

### Đánh giá

API này đủ cho danh sách cơ bản, nhưng chưa đủ cho frontend mới nếu muốn hiển thị theo hướng hỗ trợ người mới.

### Cần bổ sung

| Field cần bổ sung         | Lý do                                                               |
| ------------------------- | ------------------------------------------------------------------- |
| `company_type`            | Để biết cổ phiếu là ngân hàng, phi tài chính, chứng khoán, bảo hiểm |
| `sector`                  | Để gom nhóm ngành lớn                                               |
| `market_cap`              | Để phân loại quy mô doanh nghiệp                                    |
| `data_quality_status`     | Để biết dữ liệu đáng tin cậy tới đâu                                |
| `latest_financial_period` | Để biết BCTC mới nhất là kỳ nào                                     |
| `overall_risk_level`      | Hiển thị cảnh báo nhanh nếu có                                      |
| `valuation_status`        | Biết định giá đã đủ dữ liệu chưa                                    |

### Response đề xuất

```json id="fdqf55"
{
  "data": [
    {
      "ticker": "FPT",
      "company_name": "CTCP FPT",
      "exchange": "HOSE",
      "industry": "Công nghệ",
      "sector": "Công nghệ thông tin",
      "company_type": "non_financial",
      "close_price": 98000,
      "latest_price_date": "2024-12-27",
      "market_cap": 145000000000000,
      "latest_financial_period": "2024-Q4",
      "overall_risk_level": "medium",
      "valuation_status": "available",
      "data_quality_status": "partial",
      "warnings": [
        "Dữ liệu định giá cần được kiểm tra cùng EPS và lợi nhuận TTM."
      ]
    }
  ],
  "meta": {
    "count": 1,
    "last_updated": "2026-06-12"
  },
  "error": null
}
```

---

## 4.2. GET /api/stocks/[ticker]

### Mục đích hiện tại

API này lấy thông tin tổng quan của một mã cổ phiếu.

### Response hiện tại dự kiến

```json id="1cyehj"
{
  "data": {
    "ticker": "VCB",
    "company_name": "Ngân hàng TMCP Ngoại thương Việt Nam",
    "exchange": "HOSE",
    "industry_name": "Ngân hàng",
    "close_price": 92000,
    "latest_price_date": "2024-12-27",
    "revenue": 180000000000,
    "net_profit": 95000000000
  },
  "error": null
}
```

### Đánh giá

API này đang thiên về tổng quan kỹ thuật. Frontend mới cần thêm bối cảnh để hiển thị đúng tinh thần “không kết luận vội”.

### Cần bổ sung

| Field cần bổ sung         | Lý do                               |
| ------------------------- | ----------------------------------- |
| `company_type`            | Tránh áp dụng sai công thức         |
| `business_summary`        | AI giải thích doanh nghiệp làm gì   |
| `sector`                  | Liên kết module ngành               |
| `latest_financial_period` | Biết số liệu tài chính thuộc kỳ nào |
| `available_modules`       | Biết module nào đủ dữ liệu          |
| `missing_modules`         | Biết module nào chưa đủ dữ liệu     |
| `main_warnings`           | Cảnh báo tổng quan                  |
| `source`                  | Nguồn dữ liệu                       |

### Response đề xuất

```json id="0p8c69"
{
  "data": {
    "ticker": "FPT",
    "company_name": "CTCP FPT",
    "exchange": "HOSE",
    "industry": "Công nghệ",
    "sector": "Công nghệ thông tin",
    "company_type": "non_financial",
    "business_summary": "Doanh nghiệp hoạt động trong lĩnh vực công nghệ, viễn thông và giáo dục.",
    "close_price": 98000,
    "latest_price_date": "2024-12-27",
    "latest_financial_period": "2024-Q4",
    "revenue": 62000000000000,
    "net_profit": 7400000000000,
    "available_modules": [
      "financials",
      "ratios",
      "valuation",
      "risk"
    ],
    "missing_modules": [
      "rag_context"
    ],
    "main_warnings": [
      "Không nên kết luận doanh nghiệp tốt chỉ từ tăng trưởng lợi nhuận. Cần kiểm tra thêm dòng tiền và định giá."
    ],
    "source": {
      "source_name": "Tên nguồn dữ liệu",
      "source_url": "https://example.com",
      "last_updated": "2026-06-12"
    }
  },
  "error": null
}
```

---

## 4.3. GET /api/stocks/[ticker]/prices

### Mục đích hiện tại

API này lấy dữ liệu giá và khối lượng giao dịch.

### Response hiện tại dự kiến

```json id="47sgt7"
{
  "data": [
    {
      "trading_date": "2024-12-27",
      "open_price": 91000,
      "high_price": 92500,
      "low_price": 90500,
      "close_price": 92000,
      "adjusted_close_price": 92000,
      "volume": 1200000
    }
  ],
  "error": null
}
```

### Đánh giá

API này đủ cho dữ liệu giá cơ bản, nhưng chưa đủ cho module Price - Volume - Time, thanh khoản, mô phỏng và cảnh báo người mới.

### Cần bổ sung

| Field cần bổ sung       | Lý do                                  |
| ----------------------- | -------------------------------------- |
| `trading_value`         | Đánh giá thanh khoản tốt hơn volume    |
| `price_change_pct`      | Frontend hiển thị biến động            |
| `avg_volume_20d`        | So sánh volume hiện tại với trung bình |
| `avg_trading_value_20d` | Đánh giá thanh khoản gần đây           |
| `liquidity_warning`     | Cảnh báo thanh khoản thấp              |
| `data_adjustment_note`  | Ghi chú giá đã điều chỉnh hay chưa     |

### Response đề xuất

```json id="5y4xrb"
{
  "data": [
    {
      "trading_date": "2024-12-27",
      "open_price": 91000,
      "high_price": 92500,
      "low_price": 90500,
      "close_price": 92000,
      "adjusted_close_price": 92000,
      "volume": 1200000,
      "trading_value": 110400000000,
      "price_change_pct": 0.018,
      "avg_volume_20d": 950000,
      "avg_trading_value_20d": 87000000000,
      "liquidity_warning": null
    }
  ],
  "meta": {
    "ticker": "VCB",
    "from": "2024-01-01",
    "to": "2024-12-27",
    "limit": 200,
    "data_adjustment_note": "Ưu tiên adjusted_close_price khi phân tích lịch sử dài hạn."
  },
  "error": null
}
```

---

## 4.4. GET /api/stocks/[ticker]/financials

### Mục đích hiện tại

API này lấy báo cáo tài chính của một mã cổ phiếu.

### Response hiện tại dự kiến

```json id="kpz5co"
{
  "data": [
    {
      "fiscal_year": 2024,
      "fiscal_quarter": 4,
      "period_type": "quarter",
      "revenue": 180000000000,
      "net_profit": 95000000000,
      "eps": 5200,
      "total_assets": 1900000000000000,
      "total_equity": 200000000000000
    }
  ],
  "error": null
}
```

### Đánh giá

API này đang thiếu nhiều field quan trọng để tính đủ các nhóm chỉ số trong `FINANCIAL_DATA_REQUIREMENTS.md`.

### Cần bổ sung theo nhóm

#### Báo cáo kết quả kinh doanh

```txt id="3jo57i"
gross_profit
operating_profit
profit_before_tax
net_profit_parent
eps_basic
eps_diluted
interest_expense
ebit
ebitda
```

#### Bảng cân đối kế toán

```txt id="9eqge9"
total_liabilities
cash_and_equivalents
short_term_debt
long_term_debt
total_debt
current_assets
current_liabilities
inventory
accounts_receivable
shares_outstanding
book_value_per_share
```

#### Lưu chuyển tiền tệ

```txt id="wulvvv"
operating_cash_flow
investing_cash_flow
financing_cash_flow
capital_expenditure
free_cash_flow
dividends_paid
```

#### Metadata

```txt id="1xsxyg"
source_name
source_url
collected_at
unit
currency
is_audited
report_type
```

### Response đề xuất

```json id="fv82la"
{
  "data": [
    {
      "ticker": "FPT",
      "fiscal_year": 2024,
      "fiscal_quarter": 4,
      "period_type": "quarter",
      "report_type": "consolidated",
      "currency": "VND",
      "unit": "billion_vnd",

      "income_statement": {
        "revenue": 16000,
        "gross_profit": 6200,
        "operating_profit": 2800,
        "profit_before_tax": 2600,
        "net_profit": 2100,
        "net_profit_parent": 2000,
        "eps_basic": 1450,
        "eps_diluted": null,
        "interest_expense": 120,
        "ebit": 2720,
        "ebitda": null
      },

      "balance_sheet": {
        "total_assets": 78000,
        "total_liabilities": 42000,
        "total_equity": 36000,
        "cash_and_equivalents": 12000,
        "short_term_debt": 5000,
        "long_term_debt": 8000,
        "total_debt": 13000,
        "current_assets": 39000,
        "current_liabilities": 25000,
        "inventory": 3000,
        "accounts_receivable": 9000,
        "shares_outstanding": 1470000000,
        "book_value_per_share": 24490
      },

      "cash_flow_statement": {
        "operating_cash_flow": 2500,
        "investing_cash_flow": -1800,
        "financing_cash_flow": -500,
        "capital_expenditure": 1200,
        "free_cash_flow": 1300,
        "dividends_paid": 600
      },

      "missing_fields": [
        "eps_diluted",
        "ebitda"
      ],
      "warnings": [
        "EBITDA chưa có dữ liệu nên chưa thể tính EV/EBITDA."
      ],
      "source": {
        "source_name": "Tên nguồn dữ liệu",
        "source_url": "https://example.com",
        "collected_at": "2026-06-12"
      }
    }
  ],
  "error": null
}
```

---

## 4.5. GET /api/stocks/[ticker]/ratios

### Mục đích hiện tại

API này lấy các chỉ số tài chính đã tính.

### Response hiện tại dự kiến

```json id="v066w3"
{
  "data": [
    {
      "fiscal_year": 2024,
      "fiscal_quarter": 4,
      "period_type": "quarter",
      "revenue_growth": 0.12,
      "net_profit_growth": 0.15,
      "net_margin": 0.53,
      "roa": 0.012,
      "roe": 0.18,
      "pe_ratio": 12.5,
      "pb_ratio": 2.1
    }
  ],
  "error": null
}
```

### Đánh giá

API này đang có nhóm chỉ số cơ bản, nhưng thiếu:

* Công thức dùng để tính.
* Dữ liệu đầu vào.
* Cảnh báo khi chỉ số có thể gây hiểu nhầm.
* `missing_fields`.
* Trạng thái độ tin cậy.
* Giải thích cho người mới.

### Cần bổ sung

| Nhóm        | Field nên có                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tăng trưởng | `revenue_growth`, `gross_profit_growth`, `operating_profit_growth`, `net_profit_growth`, `eps_growth`, `asset_growth`, `equity_growth`, `operating_cash_flow_growth` |
| Sinh lời    | `gross_margin`, `operating_margin`, `net_margin`, `roa`, `roe`, `roic`, `ebitda_margin`                                                                              |
| Đòn bẩy     | `debt_to_equity`, `liabilities_to_assets`, `net_debt`, `current_ratio`, `quick_ratio`, `interest_coverage`, `cash_to_debt`, `short_term_debt_ratio`                  |
| Dòng tiền   | `cfo_to_net_profit`, `free_cash_flow`, `fcf_margin`, `capex_to_revenue`, `operating_cash_flow_margin`, `fcf_to_net_profit`                                           |
| Định giá    | `eps`, `bvps`, `pe_ratio`, `pb_ratio`, `ps_ratio`, `ev_ebitda`, `earnings_yield`, `dividend_yield`, `market_cap`, `enterprise_value`                                 |

### Response đề xuất

```json id="jt9aqa"
{
  "data": [
    {
      "ticker": "FPT",
      "fiscal_year": 2024,
      "fiscal_quarter": 4,
      "period_type": "quarter",

      "growth": {
        "revenue_growth": 0.12,
        "gross_profit_growth": 0.1,
        "operating_profit_growth": 0.14,
        "net_profit_growth": 0.15,
        "eps_growth": 0.13,
        "asset_growth": 0.08,
        "equity_growth": 0.09,
        "operating_cash_flow_growth": 0.18
      },

      "profitability": {
        "gross_margin": 0.39,
        "operating_margin": 0.17,
        "net_margin": 0.13,
        "roa": 0.11,
        "roe": 0.25,
        "roic": null,
        "ebitda_margin": null
      },

      "leverage_liquidity": {
        "debt_to_equity": 0.36,
        "liabilities_to_assets": 0.54,
        "net_debt": 1000,
        "current_ratio": 1.56,
        "quick_ratio": 1.44,
        "interest_coverage": 22.6,
        "cash_to_debt": 0.92,
        "short_term_debt_ratio": 0.38
      },

      "cash_flow": {
        "cfo_to_net_profit": 1.19,
        "free_cash_flow": 1300,
        "fcf_margin": 0.081,
        "capex_to_revenue": 0.075,
        "operating_cash_flow_margin": 0.156,
        "fcf_to_net_profit": 0.62
      },

      "valuation": {
        "eps": 5400,
        "bvps": 24490,
        "pe_ratio": 18.1,
        "pb_ratio": 4.0,
        "ps_ratio": 2.3,
        "ev_ebitda": null,
        "earnings_yield": 0.055,
        "dividend_yield": null,
        "market_cap": 145000,
        "enterprise_value": 146000
      },

      "calculation_notes": [
        "ROE sử dụng vốn chủ sở hữu bình quân nếu có đủ dữ liệu đầu kỳ và cuối kỳ.",
        "P/E chỉ được diễn giải khi EPS dương."
      ],
      "missing_fields": [
        "ebitda",
        "dividend_per_share"
      ],
      "warnings": [
        "Không nên kết luận cổ phiếu rẻ chỉ vì P/E thấp.",
        "ROE cao cần kiểm tra cùng đòn bẩy tài chính và chất lượng lợi nhuận."
      ],
      "source": {
        "source_name": "Tên nguồn dữ liệu",
        "last_updated": "2026-06-12"
      }
    }
  ],
  "error": null
}
```

---

## 4.6. GET /api/stocks/[ticker]/valuation

### Mục đích hiện tại

API này lấy kết quả định giá của một mã cổ phiếu.

### Response hiện tại dự kiến

```json id="3xoj6t"
{
  "data": [
    {
      "valuation_date": "2024-12-27",
      "method": "pe_historical",
      "scenario": "base",
      "fair_value_low": 85000,
      "fair_value_base": 95000,
      "fair_value_high": 105000,
      "market_price": 92000,
      "margin_of_safety": 0.0326,
      "confidence_level": "medium",
      "explanation": "Dữ liệu mẫu dùng để kiểm thử API định giá."
    }
  ],
  "error": null
}
```

### Đánh giá

API này có khung tốt, nhưng cần làm rõ:

* Fair value tính theo công thức nào?
* `method` dùng P/E, P/B hay phương pháp nào?
* `scenario` có giả định gì?
* `confidence_level` dựa vào đâu?
* Dữ liệu có phải dữ liệu mẫu không?
* Khi thiếu EPS hoặc BVPS thì API xử lý thế nào?
* Có cảnh báo không đưa khuyến nghị mua/bán chưa?

### Cần bổ sung

| Field                | Lý do                                            |
| -------------------- | ------------------------------------------------ |
| `input_assumptions`  | Ghi rõ giả định định giá                         |
| `input_metrics`      | Ghi rõ EPS, BVPS, P/E target, P/B target         |
| `method_limitations` | Nói rõ hạn chế phương pháp                       |
| `valuation_status`   | available, partial, unavailable                  |
| `confidence_reason`  | Giải thích vì sao confidence thấp/trung bình/cao |
| `missing_fields`     | Field thiếu                                      |
| `warnings`           | Cảnh báo diễn giải                               |
| `is_demo_data`       | Đánh dấu dữ liệu mẫu nếu có                      |

### Response đề xuất

```json id="gsxx8y"
{
  "data": [
    {
      "ticker": "FPT",
      "valuation_date": "2024-12-27",
      "method": "pe_historical",
      "scenario": "base",
      "valuation_status": "partial",

      "input_metrics": {
        "market_price": 98000,
        "eps_ttm": 5400,
        "current_pe": 18.1,
        "historical_pe_avg": 17.5,
        "industry_pe_avg": 16.8
      },

      "input_assumptions": {
        "target_pe": 17.5,
        "earnings_growth_assumption": 0.12,
        "margin_of_safety_required": 0.15
      },

      "fair_value": {
        "fair_value_low": 85000,
        "fair_value_base": 94500,
        "fair_value_high": 105000
      },

      "market_comparison": {
        "market_price": 98000,
        "margin_of_safety": -0.036,
        "valuation_gap_label": "near_fair_value"
      },

      "confidence": {
        "confidence_level": "medium",
        "confidence_reason": "Có dữ liệu EPS và P/E lịch sử, nhưng thiếu so sánh ngành đầy đủ."
      },

      "method_limitations": [
        "P/E không phù hợp nếu EPS âm hoặc lợi nhuận bất thường.",
        "Định giá là vùng ước lượng, không phải con số chắc chắn."
      ],

      "missing_fields": [
        "industry_pe_avg_full_sample"
      ],

      "warnings": [
        "Kết quả định giá không phải khuyến nghị mua/bán.",
        "Cần kiểm tra thêm chất lượng lợi nhuận và triển vọng ngành."
      ],

      "source": {
        "source_name": "Tên nguồn dữ liệu",
        "last_updated": "2026-06-12"
      },

      "is_demo_data": false
    }
  ],
  "error": null
}
```

### Quy tắc bắt buộc

Nếu thiếu EPS:

```json id="v19xbx"
{
  "valuation_status": "unavailable",
  "fair_value": null,
  "missing_fields": ["eps_ttm"],
  "warnings": [
    "Chưa đủ dữ liệu EPS để định giá theo P/E."
  ]
}
```

Nếu EPS âm:

```json id="j24zos"
{
  "valuation_status": "not_applicable",
  "method": "pe_historical",
  "fair_value": null,
  "warnings": [
    "EPS đang âm nên không nên diễn giải P/E theo cách thông thường."
  ]
}
```

---

## 4.7. GET /api/stocks/[ticker]/risk

### Mục đích hiện tại

API này lấy dữ liệu đánh giá rủi ro và minh bạch.

### Response hiện tại dự kiến

```json id="yyx9v2"
{
  "data": [
    {
      "assessment_date": "2024-12-27",
      "overall_risk_score": 55,
      "overall_risk_level": "medium",
      "price_volatility_score": 45,
      "liquidity_risk_score": 35,
      "leverage_risk_score": 60,
      "profitability_risk_score": 40,
      "cash_flow_risk_score": 50,
      "governance_risk_score": 55,
      "disclosure_risk_score": 45,
      "warning_notes": "Cần theo dõi thêm biến động giá và dòng tiền.",
      "explanation": "Dữ liệu mẫu phục vụ kiểm thử API rủi ro."
    }
  ],
  "error": null
}
```

### Đánh giá

API hiện có khung điểm rủi ro, nhưng cần bổ sung nền tảng giải thích để tránh biến risk score thành điểm cảm tính.

Các điểm cần làm rõ:

* Mỗi điểm rủi ro được chấm theo tiêu chí nào?
* Ngưỡng thấp/trung bình/cao/rất cao là gì?
* Dữ liệu đầu vào nào tạo ra từng điểm?
* Có thiếu dữ liệu nào không?
* Có ngành nào không áp dụng không?
* Risk score có bị hiểu nhầm thành khuyến nghị mua/bán không?

### Cần bổ sung

| Field                    | Lý do                                      |
| ------------------------ | ------------------------------------------ |
| `risk_components`        | Tách từng nhóm rủi ro                      |
| `score_scale`            | Giải thích thang điểm                      |
| `level_definitions`      | Định nghĩa low, medium, high, very_high    |
| `input_metrics`          | Dữ liệu đầu vào tạo ra điểm                |
| `risk_reasons`           | Lý do chấm điểm                            |
| `check_next`             | Người dùng cần kiểm tra tiếp gì            |
| `not_applicable_metrics` | Chỉ số không phù hợp với loại doanh nghiệp |
| `missing_fields`         | Dữ liệu thiếu                              |
| `warnings`               | Cảnh báo không khuyến nghị mua/bán         |

### Response đề xuất

```json id="9f7k99"
{
  "data": {
    "ticker": "HPG",
    "assessment_date": "2024-12-27",

    "overall": {
      "overall_risk_score": 62,
      "overall_risk_level": "high",
      "summary": "Có một số rủi ro cần kiểm tra thêm, đặc biệt là nợ vay và chất lượng dòng tiền."
    },

    "score_scale": {
      "min": 0,
      "max": 100,
      "meaning": "Điểm càng cao thể hiện càng nhiều cảnh báo rủi ro từ dữ liệu hiện có."
    },

    "level_definitions": {
      "low": "0-30",
      "medium": "31-60",
      "high": "61-80",
      "very_high": "81-100"
    },

    "risk_components": {
      "financial_risk": {
        "score": 55,
        "level": "medium",
        "input_metrics": {
          "liabilities_to_assets": 0.52,
          "current_ratio": 1.2,
          "total_equity": 56000
        },
        "risk_reasons": [
          "Tỷ lệ nợ trên tài sản ở mức cần theo dõi.",
          "Current Ratio không quá dư địa."
        ],
        "check_next": [
          "Kiểm tra dòng tiền kinh doanh.",
          "Kiểm tra cơ cấu nợ ngắn hạn và dài hạn."
        ]
      },

      "debt_risk": {
        "score": 72,
        "level": "high",
        "input_metrics": {
          "debt_to_equity": 1.4,
          "interest_coverage": 2.3,
          "cash_to_debt": 0.18
        },
        "risk_reasons": [
          "Debt/Equity ở mức cao đối với doanh nghiệp phi tài chính.",
          "Interest Coverage chưa có biên an toàn lớn."
        ],
        "check_next": [
          "Kiểm tra lịch trả nợ.",
          "Kiểm tra khả năng tạo CFO trong các kỳ gần nhất."
        ]
      },

      "earnings_quality_risk": {
        "score": 68,
        "level": "high",
        "input_metrics": {
          "cfo_to_net_profit": 0.45,
          "accounts_receivable_growth": 0.3,
          "revenue_growth": 0.1
        },
        "risk_reasons": [
          "CFO/Net Profit thấp cho thấy lợi nhuận chưa chuyển hóa tốt thành tiền.",
          "Phải thu tăng nhanh hơn doanh thu."
        ],
        "check_next": [
          "Kiểm tra khoản phải thu.",
          "Kiểm tra hàng tồn kho.",
          "Đọc thuyết minh báo cáo tài chính nếu có."
        ]
      },

      "valuation_risk": {
        "score": 50,
        "level": "medium",
        "input_metrics": {
          "pe_ratio": 12.5,
          "pb_ratio": 1.8,
          "industry_average_pe": null
        },
        "risk_reasons": [
          "Chưa có dữ liệu trung bình ngành đầy đủ để so sánh định giá."
        ],
        "check_next": [
          "So sánh với lịch sử P/E của chính doanh nghiệp.",
          "So sánh với doanh nghiệp cùng ngành."
        ]
      },

      "liquidity_risk": {
        "score": 35,
        "level": "medium",
        "input_metrics": {
          "avg_trading_value_20d": 80000000000,
          "volume": 1200000
        },
        "risk_reasons": [
          "Thanh khoản ở mức có thể theo dõi, chưa phải cảnh báo lớn."
        ],
        "check_next": [
          "Kiểm tra thanh khoản trong các phiên giảm mạnh."
        ]
      },

      "data_quality_risk": {
        "score": 40,
        "level": "medium",
        "input_metrics": {
          "missing_fields_count": 2,
          "available_periods": 8,
          "last_updated": "2026-06-12"
        },
        "risk_reasons": [
          "Thiếu một số field định giá ngành.",
          "Dữ liệu báo cáo tài chính đủ cho phân tích cơ bản."
        ],
        "check_next": [
          "Bổ sung dữ liệu trung bình ngành.",
          "Bổ sung dữ liệu P/E và P/B lịch sử."
        ]
      }
    },

    "not_applicable_metrics": [],

    "missing_fields": [
      "industry_average_pe",
      "industry_average_pb"
    ],

    "warnings": [
      "Risk score là công cụ cảnh báo, không phải khuyến nghị mua/bán.",
      "Không nên kết luận cổ phiếu tốt/xấu chỉ từ một điểm rủi ro tổng thể."
    ],

    "source": {
      "source_name": "Tên nguồn dữ liệu",
      "last_updated": "2026-06-12"
    }
  },
  "error": null
}
```

### Quy tắc bắt buộc

Nếu không đủ dữ liệu để chấm risk:

```json id="uztar9"
{
  "overall": {
    "overall_risk_score": null,
    "overall_risk_level": "unknown",
    "summary": "Chưa đủ dữ liệu để đánh giá rủi ro tổng thể."
  },
  "missing_fields": [
    "operating_cash_flow",
    "total_debt",
    "interest_expense"
  ],
  "warnings": [
    "Không nên chấm risk score khi thiếu các dữ liệu tài chính quan trọng."
  ]
}
```

---

## 5. API còn thiếu cho frontend mới

Frontend mới có thể cần thêm một số endpoint sau.

## 5.1. GET /api/stocks/[ticker]/analysis-summary

### Mục đích

Trả về bản tóm tắt cho người mới, dùng ở header hoặc dashboard cổ phiếu.

### Response đề xuất

```json id="3v0k3y"
{
  "data": {
    "ticker": "FPT",
    "summary": {
      "business": "Doanh nghiệp công nghệ có tăng trưởng doanh thu và lợi nhuận ổn định.",
      "financial_health": "Sức khỏe tài chính ở mức tương đối tốt, nhưng vẫn cần kiểm tra dòng tiền.",
      "valuation": "Định giá hiện gần vùng hợp lý theo dữ liệu hiện có.",
      "risk": "Rủi ro tổng thể ở mức trung bình."
    },
    "key_points": [
      "Doanh thu tăng trưởng tích cực.",
      "ROE cao nhưng cần kiểm tra cùng đòn bẩy.",
      "Dòng tiền kinh doanh hỗ trợ lợi nhuận."
    ],
    "check_next": [
      "So sánh với ngành.",
      "Kiểm tra chất lượng lợi nhuận.",
      "Xem định giá theo kịch bản."
    ],
    "warnings": [
      "Đây không phải khuyến nghị mua/bán."
    ]
  },
  "error": null
}
```

---

## 5.2. GET /api/stocks/[ticker]/ai-context

### Mục đích

Trả context có cấu trúc cho AI Assistant.

### Response đề xuất

```json id="o4fgjw"
{
  "data": {
    "ticker": "FPT",
    "company_profile": {
      "company_name": "CTCP FPT",
      "industry": "Công nghệ",
      "company_type": "non_financial"
    },
    "current_context": {
      "selected_module": "financials",
      "selected_period": "2024-Q4"
    },
    "financial_snapshot": {
      "revenue": 16000,
      "net_profit": 2100,
      "operating_cash_flow": 2500,
      "roe": 0.25,
      "pe_ratio": 18.1
    },
    "risk_context": {
      "overall_risk_level": "medium",
      "main_risk_reasons": [
        "Cần kiểm tra chất lượng dòng tiền.",
        "Định giá cần so sánh thêm với ngành."
      ]
    },
    "valuation_context": {
      "valuation_status": "partial",
      "confidence_level": "medium"
    },
    "missing_fields": [
      "industry_average_pe"
    ],
    "ai_guardrails": [
      "Không đưa khuyến nghị mua bán.",
      "Không bịa số liệu ngoài context.",
      "Nếu thiếu dữ liệu thì nói chưa đủ dữ liệu."
    ]
  },
  "error": null
}
```

---

## 5.3. POST /api/ai

### Mục đích

Nhận câu hỏi người dùng và trả lời bằng AI theo guardrails.

### Request đề xuất

```json id="8qvs5q"
{
  "ticker": "FPT",
  "module": "financials",
  "question": "ROE cao có chắc là doanh nghiệp tốt không?",
  "context_ids": [
    "financials_2024_q4",
    "risk_2024_q4"
  ]
}
```

### Response đề xuất

```json id="7psvsl"
{
  "data": {
    "answer": "ROE cao là điểm tích cực, nhưng chưa đủ để kết luận doanh nghiệp chắc chắn tốt. Cần kiểm tra thêm nợ vay, vốn chủ sở hữu có thấp bất thường không và lợi nhuận có chuyển hóa thành dòng tiền hay không.",
    "used_context": [
      "financials_2024_q4",
      "risk_2024_q4"
    ],
    "missing_context": [],
    "warnings": [
      "Đây không phải khuyến nghị mua/bán."
    ]
  },
  "error": null
}
```

---

## 5.4. POST /api/rag/search

### Mục đích

Tìm tài liệu RAG phù hợp với câu hỏi.

### Request đề xuất

```json id="10g8gn"
{
  "query": "P/E thấp có phải là rẻ không?",
  "module": "valuation",
  "ticker": "FPT"
}
```

### Response đề xuất

```json id="kltg6i"
{
  "data": {
    "documents": [
      {
        "id": "valuation_pe_basic",
        "title": "P/E là gì?",
        "module": "valuation",
        "tags": [
          "pe",
          "valuation",
          "beginner"
        ],
        "content_snippet": "P/E thấp không đồng nghĩa cổ phiếu chắc chắn rẻ...",
        "warning_notes": [
          "Không diễn giải P/E thấp là tín hiệu mua."
        ]
      }
    ]
  },
  "error": null
}
```

---

## 6. Những điểm cần Người 3 kiểm tra lại

Người 3 cần review các điểm sau:

```txt id="dka35w"
[ ] API hiện có đủ field bắt buộc trong FINANCIAL_DATA_REQUIREMENTS.md chưa?
[ ] API /financials đã có đủ 3 báo cáo: KQKD, CĐKT, LCTT chưa?
[ ] API /ratios có trả đủ nhóm tăng trưởng, sinh lời, đòn bẩy, dòng tiền, định giá chưa?
[ ] API /valuation có ghi rõ input_assumptions chưa?
[ ] API /valuation có phân biệt dữ liệu mẫu và dữ liệu thật chưa?
[ ] API /risk có giải thích cách chấm score chưa?
[ ] API /risk có level_definitions chưa?
[ ] API có trả missing_fields không?
[ ] API có trả warnings không?
[ ] API có trả source và last_updated không?
[ ] API có trả null khi thiếu dữ liệu không?
[ ] API có tránh trả recommendation mua/bán không?
[ ] API có phục vụ được AI context không?
```

---

## 7. Những điểm cần Người 1 cung cấp thêm

Người 1 cần hoàn thiện các file sau để Người 3 bám vào:

```txt id="6jv3yn"
docs/financial-logic/FINANCIAL_DATA_REQUIREMENTS.md
docs/financial-logic/FINANCIAL_RATIOS.md
docs/financial-logic/VALUATION_LOGIC.md
docs/financial-logic/RISK_SCORE_LOGIC.md
docs/financial-logic/RISK_LEVEL_DEFINITIONS.md
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_SYSTEM_PROMPTS.md
docs/rag/RAG_DOCUMENT_TEMPLATE.md
docs/rag/RAG_RETRIEVAL_RULES.md
```

Trong đó ưu tiên trước:

```txt id="x7s7tc"
1. FINANCIAL_DATA_REQUIREMENTS.md
2. FINANCIAL_RATIOS.md
3. VALUATION_LOGIC.md
4. RISK_SCORE_LOGIC.md
5. RISK_LEVEL_DEFINITIONS.md
```

---

## 8. Những điểm cần Người 2 cung cấp thêm

Người 2 cần cung cấp dữ liệu thật theo các file:

```txt id="xwafjm"
DATA_SCOPE_V1.md
DATA_SOURCES.md
DATA_DICTIONARY.md
DATA_QUALITY_RULES.md
stocks.csv
industries.csv
stock_prices.csv
financial_reports.csv
macro_indicators.csv
```

Đặc biệt cần làm rõ:

```txt id="1rcvyw"
[ ] Dữ liệu là thật hay demo?
[ ] Nguồn dữ liệu là gì?
[ ] Đơn vị dữ liệu là gì?
[ ] Field nào thiếu?
[ ] Field nào không thu thập được?
[ ] Có phân biệt ngân hàng và phi tài chính không?
[ ] Có đủ dữ liệu cho các công thức Người 1 yêu cầu không?
```

---

## 9. Quy tắc khi tích hợp frontend mới

Frontend mới không nên phụ thuộc cứng vào dữ liệu luôn có.

Mỗi module cần xử lý các trạng thái:

```txt id="9qpapy"
loading
available
partial
unavailable
error
```

### 9.1. Trạng thái available

Dữ liệu đủ để hiển thị và giải thích.

```json id="ks2kx7"
{
  "status": "available",
  "message": "Dữ liệu đã đủ cho phân tích cơ bản."
}
```

### 9.2. Trạng thái partial

Dữ liệu có một phần, vẫn hiển thị được nhưng cần cảnh báo.

```json id="8sf3k9"
{
  "status": "partial",
  "message": "Dữ liệu hiện có đủ để xem tổng quan, nhưng chưa đủ để định giá đầy đủ."
}
```

### 9.3. Trạng thái unavailable

Dữ liệu chưa đủ để hiển thị kết quả.

```json id="hdwsas"
{
  "status": "unavailable",
  "message": "Chưa đủ dữ liệu để tính chỉ số này."
}
```

### 9.4. Trạng thái error

Có lỗi kỹ thuật hoặc lỗi truy vấn.

```json id="cxokqu"
{
  "status": "error",
  "message": "Không thể tải dữ liệu. Vui lòng thử lại sau."
}
```

---

## 10. Chuẩn response chung đề xuất

Tất cả API nên có format chung:

```json id="t2t9o9"
{
  "data": {},
  "meta": {
    "ticker": "FPT",
    "period": "2024-Q4",
    "status": "available",
    "missing_fields": [],
    "warnings": [],
    "source": {
      "source_name": "Tên nguồn dữ liệu",
      "source_url": "https://example.com",
      "last_updated": "2026-06-12"
    }
  },
  "error": null
}
```

Nếu lỗi:

```json id="m5jyt6"
{
  "data": null,
  "meta": {
    "status": "error"
  },
  "error": {
    "code": "DATA_NOT_FOUND",
    "message": "Không tìm thấy dữ liệu cho mã cổ phiếu này."
  }
}
```

Nếu thiếu dữ liệu:

```json id="5zh8fd"
{
  "data": null,
  "meta": {
    "status": "unavailable",
    "missing_fields": [
      "eps_ttm",
      "shares_outstanding"
    ],
    "warnings": [
      "Chưa đủ dữ liệu để tính P/E và P/B."
    ]
  },
  "error": null
}
```

---

## 11. Quy tắc đặt tên field

### 11.1. Dùng tiếng Anh cho field trong API

Nên dùng:

```txt id="9vayh2"
ticker
company_name
close_price
net_profit
operating_cash_flow
total_equity
missing_fields
warnings
```

Không nên dùng field tiếng Việt trong API:

```txt id="fb4gjv"
ma_co_phieu
ten_doanh_nghiep
loi_nhuan_sau_thue
```

### 11.2. Dùng snake_case

Nên dùng:

```txt id="1fme5k"
close_price
net_profit
operating_cash_flow
risk_level
```

Không nên trộn:

```txt id="wd2vw0"
closePrice
netProfit
operating_cashFlow
```

### 11.3. Level nên dùng enum

Đề xuất:

```txt id="a0grb7"
low
medium
high
very_high
unknown
```

Không nên dùng lẫn lộn:

```txt id="ks06mu"
cao
Cao
high_risk
red
danger
```

---

## 12. Các quyết định cần thống nhất với Người 3

Các điểm cần chốt:

```txt id="52bgpj"
[ ] API hiện tại giữ nguyên route hay đổi route?
[ ] Có bổ sung /analysis-summary không?
[ ] Có bổ sung /ai-context không?
[ ] Financial ratios tính ở database, backend hay frontend?
[ ] Risk score tính sẵn trong database hay tính động qua API?
[ ] Valuation result lưu bảng riêng hay tính khi request?
[ ] missing_fields và warnings sinh ở backend hay từ calculation functions?
[ ] Có đánh dấu is_demo_data không?
[ ] Có hỗ trợ ngân hàng khác phi tài chính không?
[ ] Có cần versioning API không?
```

Khuyến nghị:

```txt id="o5x3y9"
Giữ route hiện tại.
Bổ sung field còn thiếu.
Thêm meta, warnings, missing_fields, source.
Thêm /analysis-summary và /ai-context nếu cần AI.
Không làm lại toàn bộ backend.
```

---

## 13. Mức ưu tiên chỉnh sửa API

### Ưu tiên cao

```txt id="kdi8td"
[ ] Bổ sung missing_fields cho /financials, /ratios, /valuation, /risk
[ ] Bổ sung warnings cho /ratios, /valuation, /risk
[ ] Bổ sung source và last_updated
[ ] Bổ sung dữ liệu dòng tiền cho /financials
[ ] Bổ sung input_assumptions cho /valuation
[ ] Bổ sung risk_reasons và level_definitions cho /risk
```

### Ưu tiên trung bình

```txt id="8haq6v"
[ ] Bổ sung /analysis-summary
[ ] Bổ sung /ai-context
[ ] Bổ sung trading_value, avg_volume_20d cho /prices
[ ] Bổ sung market_cap, sector, company_type cho /stocks
```

### Ưu tiên sau

```txt id="crksdt"
[ ] Bổ sung /api/ai
[ ] Bổ sung /api/rag/search
[ ] Bổ sung /api/rag/answer
[ ] Bổ sung dữ liệu khối ngoại, sự kiện doanh nghiệp, corporate actions
```

---

## 14. Kết luận review

Backend hiện tại có thể giữ làm nền vì đã có các route cơ bản cho cổ phiếu, giá, báo cáo tài chính, chỉ số, định giá và rủi ro.

Tuy nhiên, để phù hợp với frontend mới và mục tiêu đồ án, API cần được mở rộng theo hướng:

1. Không chỉ trả số liệu, mà trả thêm giải thích và cảnh báo.
2. Có `missing_fields` khi thiếu dữ liệu.
3. Có `warnings` để tránh người mới hiểu sai.
4. Có `source` và `last_updated` để kiểm soát chất lượng dữ liệu.
5. Có `input_assumptions` cho định giá.
6. Có `risk_reasons`, `level_definitions` và `score_scale` cho risk score.
7. Không trả khuyến nghị mua/bán.
8. Không tự giả định công thức khi Người 1 chưa chốt logic.
9. Không hiển thị dữ liệu mẫu như dữ liệu thật.
10. Phục vụ được frontend mới và AI Assistant.

Nguyên tắc cuối cùng:

```txt id="3az3so"
Backend chạy được là tốt.
Nhưng backend phải chạy đúng logic nghiệp vụ.
Logic nghiệp vụ phải do Người 1 chốt.
Dữ liệu thật phải do Người 2 xác nhận.
Người 3 triển khai kỹ thuật theo contract đã thống nhất.
```
