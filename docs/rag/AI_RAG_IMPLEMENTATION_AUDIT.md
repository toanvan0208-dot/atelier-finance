# AI_RAG_IMPLEMENTATION_AUDIT.md

## 1. Tổng quan hiện trạng AI/RAG

Atelier Finance hiện có nền tảng tài liệu AI/RAG khá đầy đủ trong `docs/ai`, `docs/rag`, `docs/financial-logic`, và `docs/api-contract`. Tuy nhiên, phần code runtime hiện tại chưa triển khai hệ thống AI/RAG thật.

Hiện trạng chính:

- UI có `AI Trợ giảng` ở panel bên phải.
- Tab `Hỏi AI` hiện phản hồi bằng local state và template string hardcoded trong React client.
- Chưa có API route `/api/rag/search`, `/api/rag/answer`, `/api/assistant`, hoặc endpoint chat tương đương trong `src/app`.
- Chưa có dependency LLM/vector DB trong `package.json`.
- Chưa có prompt builder, retrieval engine, chunker, embedding pipeline, vector store, context packing runtime, hoặc LLM call.
- Các file `docs/rag/*` và `docs/ai/*` hiện là tài liệu thiết kế/knowledge base, chưa được code import hoặc đọc để tạo response.

Kết luận ngắn: AI/RAG đang ở mức **docs/design + UI prototype**, chưa phải implementation chạy thật.

## 2. Danh sách file/code liên quan đã tìm thấy

### UI assistant và app shell

- `src/components/layout/RightAssistantPanel.tsx`
  - Có panel `AI Trợ giảng`.
  - Có tab `Hướng dẫn`, `Hỏi AI`, `Học nhanh`.
  - `AITutorAskTab` tạo câu trả lời bằng `setAnswer(...)` ngay trong client.
  - Không gọi API, không gọi prompt builder, không dùng RAG context.

- `src/components/layout/AppShell.tsx`
  - Render `RightAssistantPanel` cho mọi module.
  - Truyền `activeModule` và `onNavigate` vào assistant panel.
  - Điều hướng module bằng URL/local state, không liên quan đến retrieval.

- `src/app/workspace/page.tsx`
  - Entry page render `AppShell`.

### Config assistant/prototype

- `src/config/aiTutor.config.ts`
  - Chứa config tĩnh cho từng module: mục tiêu hiện tại, câu hỏi gợi ý, lỗi thường gặp, bài học đề xuất, next actions, warning.
  - Đây là nội dung static, không phải prompt runtime.

### Data/mock liên quan AI hoặc module

- `src/features/learning/components/LearningPage.tsx`
  - Có card “Vì sao AI gợi ý bài này?”.
  - Ghi rõ logic hiện tại dùng `mock/local state`.

- `src/features/overview/data/overviewCase.data.ts`
  - Dùng `Mock financial statement snapshot`.

- `src/features/financials/data/financials.data.ts`
  - Nhiều field `source: "Mock data"`.

- `src/features/technical/data/pvtObservation.data.ts`
  - Dữ liệu PVT mẫu nội bộ.
  - Có nhiều câu chữ dạng scenario/confirmation/invalidation được viết sẵn.

- `src/features/risk/data/riskRedesign.data.ts`
  - Có `Mock financial statement snapshot`.

- `src/features/watchlist/data/watchlist.data.ts`
  - Có nhiều `Mock financial statements`.

- `src/features/simulation/*`
  - Có nhiều UI mô phỏng, local state, prompt field, mock market board/scenario.

### Financial logic có thật nhưng không phải AI/RAG

- `src/lib/financial-logic/**`
  - Có logic tính toán chỉ số, data quality, valuation readiness, risk, PVT liquidity.
  - Đây là deterministic logic, không phải LLM/RAG.

- `src/features/financials/lib/build-financial-reading-desk-data.ts`
  - Dùng financial logic để build UI data cho financials.
  - Có xử lý thiếu dữ liệu ở mức metric/result.

- `src/features/technical/lib/build-technical-desk-data.ts`
  - Dùng financial logic để tính price change, trading value, avg trading value 20d, liquidity status/risk.
  - Có cảnh báo PVT không phải tín hiệu giao dịch.

- Các builder tương tự:
  - `src/features/overview/lib/build-overview-desk-data.ts`
  - `src/features/valuation/lib/build-valuation-desk-data.ts`
  - `src/features/risk/lib/build-risk-desk-data.ts`
  - `src/features/checklist/lib/build-checklist-desk-data.ts`
  - `src/features/watchlist/lib/build-watchlist-desk-data.ts`

### Docs AI/RAG hiện có

- `docs/ai/AI_GUARDRAILS.md`
- `docs/ai/AI_SYSTEM_PROMPT.md`
- `docs/ai/AI_MODULE_PROMPTS.md`
- `docs/ai/AI_RESPONSE_STYLE.md`
- `docs/ai/AI_RESPONSE_TEST_CASES.md`
- `docs/ai/AI_USE_CASES.md`
- `docs/rag/RAG_KNOWLEDGE_BASE.md`
- `docs/rag/RAG_RETRIEVAL_RULES.md`
- `docs/rag/RAG_FINANCIAL_TERMS.md`
- `docs/rag/RAG_VALUATION_KNOWLEDGE.md`
- `docs/rag/RAG_RISK_KNOWLEDGE.md`
- `docs/rag/RAG_CHECKLIST_KNOWLEDGE.md`
- `docs/rag/RAG_PVT_KNOWLEDGE.md`
- `docs/rag/RAG_FINANCIAL_STATEMENTS_GUIDE.md`
- `docs/rag/RAG_DOCUMENT_TEMPLATE.md`
- `docs/rag/RAG_METADATA_STANDARD.md`
- `docs/rag/AI_RAG_SYSTEM_PROMPT.md`
- `docs/rag/AI_RAG_TEST_CASES.md`
- `docs/rag/AI_HALLUCINATION_CHECKLIST.md`

### API contract liên quan nhưng chưa có code runtime

- `docs/api-contract/API_CONTRACT_REVIEW.md`
  - Có đề xuất `POST /api/rag/search`.
  - Checklist vẫn ghi cần bổ sung `/api/rag/search` và `/api/rag/answer`.

## 3. Những phần đã có

- Có shell UI hoàn chỉnh với assistant panel bên phải.
- Có module-aware assistant config tĩnh theo `activeModule`.
- Có tab nhập câu hỏi trong assistant.
- Có warning nhất quán rằng AI không đưa tín hiệu giao dịch.
- Có nhiều docs guardrails/prompt/RAG/test case ở mức thiết kế.
- Có financial logic deterministic khá rõ:
  - Missing data trả về trạng thái không đủ dữ liệu thay vì tự điền 0.
  - PVT có tính price change, trading value, avg trading value, liquidity status/risk.
  - Financials có revenue growth, margins, ROE, ROA, Debt/Equity, Current Ratio, CFO/net profit, FCF, data quality, valuation readiness.
- Có unit tests cho financial logic/builders trong nhiều module.

## 4. Những phần chưa có

- Chưa có backend API route cho assistant/chat.
- Chưa có `/api/rag/search`.
- Chưa có `/api/rag/answer`.
- Chưa có prompt builder runtime đọc `AI_SYSTEM_PROMPT.md`, `AI_MODULE_PROMPTS.md`, hoặc `AI_RAG_SYSTEM_PROMPT.md`.
- Chưa có retrieval runtime đọc/chunk docs trong `docs/rag`.
- Chưa có vector database hoặc BM25 index.
- Chưa có embedding generation.
- Chưa có context packing thực tế.
- Chưa có LLM provider integration.
- Chưa có source attribution cho RAG chunks trong response.
- Chưa có guardrail enforcement ở output layer.
- Chưa có test runner cho `AI_RAG_TEST_CASES.md`.
- Chưa có ingestion pipeline để nhận biết negative examples/forbidden sections trong docs.
- Chưa có cơ chế đảm bảo `RAG_DOCUMENT_TEMPLATE.md` và `RAG_METADATA_STANDARD.md` chỉ dùng cho maintainer intent.

## 5. Những phần đang là mock/hardcode

- `RightAssistantPanel.tsx`
  - `AITutorAskTab` trả lời bằng:
    - `Cách đọc an toàn: "..."`
    - `Gợi ý trả lời: ...`
  - Đây là hardcoded response, không phải AI response.

- `aiTutor.config.ts`
  - Toàn bộ nội dung hướng dẫn, câu hỏi gợi ý, bài học đề xuất, warning, next actions là config tĩnh.

- `LearningPage.tsx`
  - Ghi rõ logic AI gợi ý hiện tại dùng `mock/local state`.

- `overviewCase.data.ts`, `financials.data.ts`, `riskRedesign.data.ts`, `watchlist.data.ts`
  - Dùng mock financial snapshots hoặc mock financial statements.

- `pvtObservation.data.ts`
  - Dữ liệu PVT là dữ liệu mẫu nội bộ.
  - Một số câu base copy có wording dễ gây hiểu nhầm như “xác nhận”, “tín hiệu cải thiện”, “kịch bản tích cực/tiêu cực”. Builder có bổ sung guardrails, nhưng nếu dùng trực tiếp trong AI/RAG sau này cần rà lại để tránh biến PVT thành tín hiệu giao dịch.

## 6. Rủi ro nếu triển khai tiếp

- Nếu nối LLM trực tiếp vào tab `Hỏi AI` mà không có prompt builder và retrieval guardrails, AI có thể trả lời vượt context hoặc bịa dữ liệu.
- Nếu đưa toàn bộ docs RAG vào context không chunk/label đúng, negative examples có thể bị copy thành câu trả lời thật.
- Nếu retrieval không phân intent, `RAG_DOCUMENT_TEMPLATE.md` và `RAG_METADATA_STANDARD.md` có thể bị dùng nhầm cho câu hỏi tài chính của người dùng cuối.
- Nếu PVT docs hoặc PVT UI copy được dùng thiếu kiểm soát, AI có thể diễn giải price/volume như tín hiệu giao dịch.
- Nếu risk score được đưa vào prompt thiếu boundary, AI có thể biến risk thấp thành “cổ phiếu an toàn” hoặc risk cao thành “cổ phiếu xấu”.
- Nếu checklist output được đưa vào prompt thiếu boundary, AI có thể biến checklist thành khuyến nghị đầu tư.
- Nếu mock financial snapshots không được đánh dấu rõ trong runtime context, AI có thể trình bày mock data như dữ liệu thật.
- Nếu thiếu output validation, các cụm khuyến nghị mua/bán/nắm giữ có thể lọt ra UI.

## 7. Thứ tự việc cần làm tiếp theo

1. Định nghĩa runtime contract cho assistant:
   - Input: user question, active module, ticker, module data, data quality, source/timestamp.
   - Output: answer, missing_context, cited_docs/chunks, warnings, refusal flag.

2. Tạo prompt builder:
   - Đọc system prompt, module prompt, guardrails, retrieved context.
   - Luôn áp dụng luật:
     - Không khuyến nghị mua/bán/nắm giữ.
     - Không bịa dữ liệu ngoài context.
     - Thiếu dữ liệu dùng `null`/`not_available`, không tự điền 0.
     - PVT không phải tín hiệu giao dịch.
     - Risk score không phải kết luận cổ phiếu an toàn/xấu.
     - Checklist không phải khuyến nghị đầu tư.

3. Tạo RAG ingestion pipeline:
   - Chunk docs theo heading.
   - Gắn metadata, section type, negative/forbidden/test labels.
   - Không index negative examples như positive knowledge.

4. Tạo retrieval layer:
   - Implement intent detection theo `RAG_RETRIEVAL_RULES.md`.
   - Route PVT, financial statements, valuation, risk, checklist, maintainer docs đúng ngữ cảnh.
   - Chặn template/metadata docs khỏi end-user financial answer.

5. Tạo API endpoints:
   - `POST /api/rag/search`
   - `POST /api/rag/answer` hoặc `POST /api/assistant`
   - Có response schema ổn định, source attribution, warnings.

6. Tạo output guardrail validator:
   - Chặn buy/sell/hold.
   - Chặn price prediction.
   - Chặn fake fair value/target price.
   - Chặn PVT signal wording.
   - Chặn missing data = 0.

7. Nối UI assistant với API:
   - Thay hardcoded `setAnswer(...)` trong `AITutorAskTab`.
   - Hiển thị loading/error/source/warnings.
   - Phân biệt mock data và dữ liệu thật.

8. Tạo test runner cho AI/RAG:
   - Chạy các case trong `AI_RAG_TEST_CASES.md`.
   - Test retrieval required docs.
   - Test forbidden phrases.
   - Test hallucination/missing data behavior.

9. Rà lại static UI copy:
   - Đặc biệt PVT, risk, checklist, valuation.
   - Loại wording có thể bị hiểu là signal/recommendation nếu sau này đưa vào RAG context.

## 8. Kết luận mức độ triển khai

Hiện tại AI/RAG của Atelier Finance đang ở mức:

```text
Docs/design: Có
UI prototype: Có
Deterministic financial logic: Có
Mock/local assistant behavior: Có
Prompt builder runtime: Chưa có
RAG retrieval runtime: Chưa có
Vector/BM25 index: Chưa có
LLM API integration: Chưa có
Production AI assistant implementation: Chưa có
```

Phân loại cuối cùng: **docs/design + prototype**, chưa phải AI/RAG implementation chạy thật.

