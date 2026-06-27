# Phase 144F: Learning Module Content & Read-Path Audit

## Objectives
Audit the Learning module to evaluate content completeness, suitability for low financial literacy users, and establish a safe integration plan.

## Inventory of Current Learning Module
- **UI Components:** `LearningPage.tsx`, `LearningRoadmapView.tsx`, `LessonWorkspace.tsx`, and 7 other components.
- **Data Source:** Exclusively relies on `src/features/learning/data/learning.data.ts`.
- **Content:** Contains predefined learning stages ("Mất gốc tài chính", "Hiểu bản thân", "Đọc bối cảnh", "Đọc doanh nghiệp", "Đọc báo cáo & định giá", "Vận hành như quỹ nhỏ") and predefined lessons. It also contains an AI mistakes mapping matrix.
- **Backend/Read-Path:** None. There is no API route, no DB schema, and no dedicated runtime helper. The UI currently reads directly from the mock `.ts` file.

## Learning Topic Coverage Matrix

| Learning topic | Current content source | Completeness | Suitable for low financial literacy? | Guardrail risk | Gap |
| --- | --- | --- | --- | --- | --- |
| Cổ phiếu là gì | `stock-basics` | Good | Yes | Low | None |
| Rủi ro đầu tư cổ phiếu | `risk-appetite`, `fomo` | Good | Yes | Low | None |
| EPS | N/A | Missing | N/A | Low | Needs basic explanation |
| P/E | `cyclical-pe`, `value-trap` | Good | Yes | Low | None |
| P/B | N/A | Missing | N/A | Low | Needs basic explanation |
| ROE | N/A | Missing | N/A | Low | Needs basic explanation |
| Nợ vay / totalDebt | `value-trap`, `profit-cashflow` | Good | Yes | Low | None |
| Thanh khoản / MarketPrice | Mentioned | Good | Yes | Low | None |
| Báo cáo tài chính | `business-model`, `profit-cashflow` | Good | Yes | Low | None |
| Định giá cơ bản | `value-trap`, `cyclical-pe` | Good | Yes | Low | None |
| Rủi ro dữ liệu thiếu | N/A | Missing | N/A | Low | Needs explicit lesson |
| Không coi AI là lời khuyên | `header`, AI Coach persona | Good | Yes | Low | None |
| Dùng hệ thống an toàn | `process-vs-luck`, `watchlist-purpose` | Good | Yes | Low | None |

## Guardrail Observations
- The content is exceptionally well-aligned with product guardrails. It actively discourages FOMO, emphasizes understanding the business over stock prices, warns against "value traps", and focuses heavily on risk ("risk-appetite").
- It does not contain any "buy/sell/hold" wording or "đáng mua" phrasing.
- It is highly suitable for low financial literacy individuals, using simple terms instead of jargon (e.g. "Doanh nghiệp kiếm tiền bằng cách nào" instead of "Phân tích mô hình kinh doanh").

## Decision
**B. Can integrate with a local read-path/helper without DB schema.**
Since the Learning module consists of highly stable educational content (a fixed syllabus), it does not strictly require a Database Schema (`LearningContent`) at this time. However, to decouple the UI from raw mock `.ts` files and align with the rest of the application's architecture, we should create a structured runtime loader (e.g., `load-learning-runtime-data.ts`). This loader can serve the static content securely and can later be extended to track user progress in the DB (via a `UserProgress` schema) if needed.

## Current UI Smoke Result
Not run (no browser test driver environment available locally for interacting with the `/workspace?symbol=FPT&module=learning` UI in real-time).

## Validation Results
- `npm run lint` and `npm run typecheck`: Pass
- `npx prisma validate` / `generate`: Pass
- DB write / Data seed / Schema migration / Deploy: No.

## Recommended Next Phase
Move on to Phase 144F.1 to implement the structured read-path helper (`load-learning-runtime-data.ts`) and integrate it into `LearningPage.tsx`, maintaining the content as static educational material.

### readyForNextPhase
**Yes.**
