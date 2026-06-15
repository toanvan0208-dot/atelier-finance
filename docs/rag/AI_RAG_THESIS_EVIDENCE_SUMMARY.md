# AI_RAG_THESIS_EVIDENCE_SUMMARY.md

## 1. Mục tiêu của module AI/RAG trong Atelier Finance

Module AI/RAG trong Atelier Finance được xây dựng để hỗ trợ người dùng mới hiểu dữ liệu tài chính, định giá, rủi ro, Price Volume Time và checklist phân tích một cách có kiểm soát.

Mục tiêu chính của module không phải là đưa ra quyết định đầu tư thay người dùng. Hệ thống đóng vai trò trợ giảng phân tích dữ liệu:

- Giải thích ý nghĩa dữ liệu đang có.
- Chỉ ra dữ liệu còn thiếu.
- Nêu giới hạn của từng loại chỉ số.
- Gợi ý các điểm cần kiểm tra thêm.
- Ngăn các diễn giải vượt quá dữ liệu hoặc biến thành khuyến nghị hành động.

Atelier Finance vì vậy định vị AI/RAG như một lớp hỗ trợ hiểu dữ liệu và kiểm soát rủi ro diễn giải, không phải một công cụ khuyến nghị mua, bán hoặc nắm giữ.

## 2. Sơ đồ pipeline hệ thống

Pipeline AI/RAG hiện tại có thể mô tả bằng text như sau:

```text
UI RightAssistantPanel
  → /api/assistant
  → runAssistant
  → buildAssistantRuntime
  → selectRagDocuments
  → selectRetrievedChunks
  → buildAssistantPrompt
  → provider
  → validateAssistantOutput
  → UI Evidence Panel
```

Ý nghĩa từng bước:

| Bước | Vai trò |
|---|---|
| UI RightAssistantPanel | Nhận câu hỏi của người dùng và hiển thị phản hồi/evidence |
| `/api/assistant` | API nội bộ tiếp nhận request từ UI |
| `runAssistant` | Service điều phối runtime, provider và guardrail validation |
| `buildAssistantRuntime` | Chuẩn bị toàn bộ ngữ cảnh runtime cho AI |
| `selectRagDocuments` | Chọn tài liệu RAG/AI phù hợp theo intent |
| `selectRetrievedChunks` | Đọc và chọn các đoạn Markdown phù hợp từ tài liệu đã chọn |
| `buildAssistantPrompt` | Tạo prompt/messages có context và guardrails |
| provider | Lớp gọi provider theo mode `none`, `mock`, hoặc `openai` |
| `validateAssistantOutput` | Kiểm tra output trước khi trả về UI |
| UI Evidence Panel | Hiển thị trạng thái, tài liệu, chunks, warnings và violations |

## 3. Vì sao hệ thống không chỉ là “gọi ChatGPT API”

Hệ thống AI/RAG của Atelier Finance không được thiết kế như một wrapper đơn giản quanh ChatGPT API. Điểm khác biệt nằm ở các lớp xử lý trước và sau provider.

Trước khi provider có thể tạo câu trả lời, hệ thống đã:

- Phân loại intent của câu hỏi.
- Chọn tài liệu RAG phù hợp.
- Đọc tài liệu Markdown nội bộ.
- Chunk tài liệu theo heading.
- Loại bỏ negative examples, forbidden examples và test cases khỏi positive context.
- Tạo prompt có guardrails bắt buộc.
- Gắn data quality, missing fields và module context nếu có.

Sau khi provider trả candidate answer, hệ thống vẫn không tin ngay vào output đó. Candidate answer phải đi qua `validateAssistantOutput`. Nếu vi phạm luật sản phẩm, câu trả lời bị chặn và UI không hiển thị nội dung chưa an toàn.

Như vậy, provider chỉ là một thành phần trong pipeline. Giá trị kỹ thuật chính nằm ở orchestration, retrieval, prompt construction, output validation và UI evidence.

## 4. Các lớp kiểm soát an toàn

Atelier Finance áp dụng nhiều lớp guardrails để giới hạn hành vi AI trong phạm vi hỗ trợ phân tích dữ liệu.

### 4.1. Không khuyến nghị mua/bán/nắm giữ

AI không được nói người dùng nên mua, bán hoặc nắm giữ cổ phiếu. Khi người dùng đặt câu hỏi theo hướng hành động đầu tư, hệ thống phải chuyển hướng sang giải thích dữ liệu, rủi ro, dữ liệu thiếu và các điểm cần tự kiểm tra.

### 4.2. Không bịa dữ liệu ngoài context

AI không được tự tạo doanh thu, lợi nhuận, EPS, equity, CFO, trading value, fair value hoặc bất kỳ số liệu nào không có trong context.

Nếu dữ liệu thiếu, hệ thống phải dùng các trạng thái như:

- `null`
- `not_available`
- `insufficient_data`

Hệ thống không được tự điền dữ liệu thiếu bằng `0`.

### 4.3. Không tự tạo fair value hoặc target price

Fair value và target price là các kết quả nhạy cảm vì có thể bị hiểu thành định hướng hành động. AI chỉ được nhắc tới các giá trị này nếu chúng đã có trong context hợp lệ. Nếu thiếu dữ liệu, AI phải nói rõ là chưa đủ cơ sở.

### 4.4. Không diễn giải P/E khi EPS âm hoặc bằng 0

P/E phụ thuộc vào EPS. Khi EPS âm hoặc bằng 0, AI không được diễn giải P/E là thấp, rẻ hoặc hấp dẫn theo cách thông thường. Hệ thống phải cảnh báo rằng mẫu số không hợp lệ hoặc không phù hợp để diễn giải.

### 4.5. Không biến risk score, checklist hoặc PVT thành kết luận đầu tư

Các module sau có giới hạn rõ:

- Risk score chỉ là công cụ cảnh báo rủi ro, không phải kết luận cổ phiếu an toàn hoặc xấu.
- Checklist là công cụ kiểm tra luận điểm, không phải khuyến nghị đầu tư.
- Price Volume Time chỉ là quan sát thị trường, không phải tín hiệu giao dịch.

## 5. Vai trò của RAG

RAG trong Atelier Finance giúp AI trả lời dựa trên tài liệu nội bộ thay vì chỉ dựa vào kiến thức chung của mô hình.

### 5.1. selectedDocuments

`selectedDocuments` là danh sách tài liệu được chọn theo intent của câu hỏi.

Ví dụ:

- Câu hỏi về volume, thanh khoản, PVT → chọn `RAG_PVT_KNOWLEDGE.md`.
- Câu hỏi về báo cáo tài chính, CFO, lợi nhuận → chọn `RAG_FINANCIAL_STATEMENTS_GUIDE.md`.
- Câu hỏi về P/E, EPS, fair value → chọn `RAG_VALUATION_KNOWLEDGE.md`.
- Câu hỏi về risk score → chọn `RAG_RISK_KNOWLEDGE.md`.
- Câu hỏi về checklist → chọn `RAG_CHECKLIST_KNOWLEDGE.md`.

### 5.2. retrievedChunks

`retrievedChunks` là các đoạn Markdown cụ thể được đọc từ tài liệu đã chọn. Các chunk này được tạo theo heading của Markdown và có metadata như:

- `chunkId`
- `documentId`
- `filePath`
- `sectionPath`
- `text`
- `sectionType`
- `tokenEstimate`
- cờ đánh dấu forbidden/negative/test/maintainer-only

Runtime truyền các chunks này vào prompt builder để prompt có context thật.

### 5.3. Markdown knowledge docs

Các tài liệu Markdown trong `docs/rag` và `docs/ai` là nguồn tri thức chính của hệ thống. Chúng chứa:

- Knowledge về PVT.
- Hướng dẫn đọc báo cáo tài chính.
- Kiến thức định giá.
- Kiến thức rủi ro.
- Checklist phân tích.
- Financial terms.
- Guardrails và hallucination checklist.

Điều này giúp hệ thống có thể giải thích theo quy tắc sản phẩm của Atelier Finance, không chỉ theo tri thức chung.

### 5.4. Maintainer docs không đưa sai intent

Hai tài liệu:

- `RAG_DOCUMENT_TEMPLATE.md`
- `RAG_METADATA_STANDARD.md`

chỉ dành cho maintainer intent. Chúng phục vụ tạo, sửa, tổ chức và quản trị tài liệu RAG. Hệ thống không dùng hai tài liệu này để trả lời câu hỏi tài chính của end-user nếu intent không phù hợp.

## 6. Vai trò của provider modes

Provider layer được tách riêng để hệ thống không phụ thuộc cứng vào một nhà cung cấp AI.

### 6.1. none

Mode `none` là mặc định an toàn.

Đặc điểm:

- Không gọi LLM.
- Không phát sinh chi phí API.
- Vẫn build runtime, selected documents, retrieved chunks và prompt.
- Trả `answer: null`.
- Trả `llmStatus: "not_configured"`.

Mode này phù hợp cho demo, kiểm thử UI evidence và kiểm thử pipeline không tốn chi phí.

### 6.2. mock

Mode `mock` dùng cho dev/test.

Đặc điểm:

- Không gọi network.
- Trả candidate answer deterministic.
- Candidate answer vẫn phải qua `validateAssistantOutput`.
- Có thể kiểm thử cả safe answer và unsafe answer.

Mode này giúp chứng minh provider output không được trả trực tiếp ra UI nếu vi phạm guardrails.

### 6.3. openai

Mode `openai` là adapter thật cho OpenAI provider.

Đặc điểm:

- Chỉ bật khi `AI_ASSISTANT_PROVIDER=openai`.
- Đọc API key từ `OPENAI_API_KEY`.
- Đọc model từ `OPENAI_MODEL`, fallback `gpt-4o-mini`.
- Không hardcode API key.
- Nếu thiếu key, trả trạng thái an toàn và không gọi network.
- Output vẫn đi qua `validateAssistantOutput`.

## 7. Vai trò của UI Evidence Panel với XAI/minh bạch

UI Evidence Panel giúp người dùng hiểu hệ thống đang hoạt động dựa trên cơ sở nào. Đây là một thành phần quan trọng theo hướng explainable AI ở mức sản phẩm.

Evidence Panel hiển thị:

- Trạng thái AI:
  - `not_configured`
  - `completed`
  - `blocked_by_guardrails`
  - `provider_error`
- Tài liệu đã được chọn.
- Số lượng retrieved chunks.
- Warnings nếu có.
- Violations nếu câu trả lời bị chặn.

Panel này không hiển thị raw prompt dài cho end-user. Thay vào đó, nó cung cấp mức minh bạch vừa đủ để người dùng thấy AI đang dựa vào tài liệu nào và vì sao câu trả lời có thể bị chặn.

Điều này giúp tránh cảm giác AI là “hộp đen” và làm rõ rằng hệ thống đang hỗ trợ hiểu dữ liệu, không đưa quyết định đầu tư.

## 8. Các bằng chứng đã có

### 8.1. Automated tests

Hệ thống đã có test cho các phần chính:

- Guardrail validator.
- Prompt builder.
- Retrieval document selection.
- Runtime orchestrator.
- API route.
- Provider adapter.
- Provider resolver.
- OpenAI provider với mocked fetch.
- RAG ingestion/chunking.
- RAG evaluation runner.

Kết quả gần nhất đã ghi nhận:

```text
npm test
23 files passed
153 tests passed
```

### 8.2. Lint

Codebase đã được kiểm tra lint:

```text
npm run lint
pass
```

### 8.3. Manual verification

Tài liệu local verification đã mô tả cách kiểm tra thủ công:

- Provider `none`.
- Provider `mock`.
- Provider `openai`.
- Câu hỏi safe.
- Câu hỏi unsafe.
- Kỳ vọng khi output bị chặn.

Tài liệu liên quan:

```text
docs/rag/AI_RAG_LOCAL_VERIFICATION.md
```

### 8.4. Acceptance checklist

Checklist acceptance end-to-end đã được tạo để xác nhận toàn bộ pipeline:

```text
docs/rag/AI_RAG_ACCEPTANCE_CHECKLIST.md
```

Checklist này bao gồm các test cases cho:

- PVT signal-risk question.
- Valuation P/E question.
- Financials CFO question.
- Risk score question.
- Missing data.
- Provider not configured.
- Mock unsafe answer.

## 9. Giới hạn hiện tại

Hệ thống hiện tại vẫn có một số giới hạn cần nêu rõ trong báo cáo.

### 9.1. Chưa bật OpenAI mặc định

Provider mặc định là `none`, nên hệ thống không gọi LLM nếu chưa cấu hình env. Đây là lựa chọn an toàn để tránh chi phí và tránh vô tình gọi provider thật.

### 9.2. Chưa dùng vector database hoặc embedding

Retrieval hiện chưa dùng vector database, embedding hoặc BM25. Hệ thống đang dùng scoring rule-based trên Markdown chunks.

Ưu điểm:

- Dễ kiểm soát.
- Dễ debug.
- Phù hợp MVP.
- Tránh phụ thuộc hạ tầng phức tạp.

Giới hạn:

- Chưa có semantic search thực sự.
- Có thể bỏ sót chunk nếu wording khác nhiều so với keyword.
- Cần tiếp tục cải thiện scoring hoặc bổ sung retrieval engine trong các phase sau.

### 9.3. Chưa kiểm thử đầy đủ với người dùng thật

Hệ thống đã có automated tests và acceptance checklist, nhưng vẫn cần kiểm thử thêm với người dùng thật để đánh giá:

- Câu trả lời có dễ hiểu với người mới không.
- Evidence Panel có đủ rõ không.
- Người dùng có hiểu đúng giới hạn của AI không.
- Các cảnh báo có quá nhiều hoặc quá ít không.

### 9.4. Chưa hoàn thiện dữ liệu module context thật cho mọi màn hình

Runtime đã hỗ trợ `moduleContext`, `dataQuality`, `missingFields`, `allowedNumericValues`, nhưng mức độ đầy đủ phụ thuộc vào từng module UI/data layer. Đây là điểm cần tiếp tục hoàn thiện để AI giải thích bám sát dữ liệu màn hình hơn.

## 10. Kết luận phục vụ báo cáo đồ án

Module AI/RAG của Atelier Finance đã có kiến trúc nhiều lớp, không phải chỉ là gọi ChatGPT API.

Các điểm kỹ thuật có thể dùng làm bằng chứng trong báo cáo:

- Có UI assistant tích hợp API nội bộ.
- Có assistant service điều phối pipeline.
- Có runtime chọn tài liệu và chunks.
- Có RAG ingestion từ Markdown docs.
- Có prompt builder với context và guardrails.
- Có provider layer tách biệt, hỗ trợ `none`, `mock`, `openai`.
- Có output guardrail validator.
- Có UI Evidence Panel phục vụ minh bạch.
- Có automated tests và acceptance checklist.

Hệ thống hiện tại phù hợp với vai trò trợ lý giải thích dữ liệu cho người mới, giúp người dùng hiểu dữ liệu và nhận diện giới hạn phân tích. Hệ thống không đưa quyết định đầu tư và không thay thế trách nhiệm tự đánh giá của người dùng.
