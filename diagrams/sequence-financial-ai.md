---
title: Sequence diagram — Luồng xem dữ liệu tài chính và hỏi AI Assistant
---

```mermaid
sequenceDiagram
    participant User as "Người dùng"
    participant FE as "Frontend Workspace"
    participant BE as "Backend/API Routes"
    participant DL as "Data Layer"
    participant PR as "Prisma ORM"
    participant DB as "PostgreSQL Database"
    participant AIA as "AI Assistant API"
    participant LLM as "AI Provider / LLM"

    User->>FE: Chọn mã cổ phiếu (ticker) và module (Financials/Valuation/Risk)
    FE->>BE: GET /api/financial?ticker=...&module=...&period=...
    BE-->>BE: Kiểm tra params: ticker, module, period
    BE->>DL: Yêu cầu dữ liệu phù hợp (ticker, module, period)
    DL->>PR: Truy vấn dữ liệu qua Prisma
    PR->>DB: SQL queries (financials, market prices, sources, quality)
    DB-->>PR: Trả về dữ liệu doanh nghiệp, báo cáo, giá, nguồn, dataQuality
    PR-->>DL: Trả dữ liệu thô
    DL-->>DL: Kiểm tra dữ liệu: missingFields, đơn vị, nguồn, điều kiện diễn giải
    DL-->>BE: Trả dữ liệu đã kiểm soát
    BE-->>FE: HTTP 200 + {data, dataQuality, missingFields, warnings, allowedNumericValues}
    FE-->>FE: Hiển thị dữ liệu tài chính, định giá/rủi ro và cảnh báo dữ liệu thiếu

    User->>FE: Đặt câu hỏi cho AI Assistant
    FE->>AIA: POST /api/ai-explain {context: {question, ticker, activeModule, moduleContext, dataQuality, missingFields, allowedNumericValues, constraints}}
    AIA-->>AIA: Kiểm tra constraints (guardrails):
    note right of AIA: - Không khuyến nghị mua/bán/nắm giữ\n- Không bịa số liệu\n- Không dùng số ngoài allowedNumericValues\n- Không diễn giải khi dữ liệu thiếu\n- Không đưa target price/fair value/upside/downside
    AIA->>LLM: Gọi AI Provider/LLM với context đã kiểm soát
    LLM-->>AIA: Trả phản hồi giải thích dữ liệu
    AIA-->>AIA: Phủ lại guardrails / sanitize response nếu cần
    AIA-->>FE: Trả explanation (+ warnings nếu dữ liệu chưa đủ)
    FE-->>User: Hiển thị câu trả lời cho người dùng kèm cảnh báo khi cần

``` 

Chú thích (Tiếng Việt): Hình 3.x mô tả luồng chính khi người dùng chọn mã cổ phiếu, hệ thống truy xuất dữ liệu có kiểm soát (kiểm tra missingFields, units, nguồn và dataQuality), rồi người dùng hỏi AI Assistant. AI Assistant nhận context đã được kiểm soát, áp dụng guardrails (không khuyến nghị giao dịch, không bịa số liệu, không sử dụng số ngoài `allowedNumericValues`, không diễn giải khi thiếu dữ liệu) trước khi gọi LLM và trả lời.
