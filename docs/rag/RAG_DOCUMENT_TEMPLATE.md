# RAG_DOCUMENT_TEMPLATE.md

## 1. Purpose

This document defines the standard template for writing RAG knowledge documents in Atelier Finance.

The purpose of this template is to make every RAG document:

* Consistent.
* Easy to retrieve.
* Easy to maintain.
* Easy for the AI assistant to use.
* Safe for beginner investors.
* Aligned with Atelier Finance guardrails.

This template should be used when creating new RAG knowledge files such as:

```text
RAG_PVT_KNOWLEDGE.md
RAG_FINANCIAL_STATEMENTS_GUIDE.md
RAG_VALUATION_KNOWLEDGE.md
RAG_RISK_KNOWLEDGE.md
RAG_CHECKLIST_KNOWLEDGE.md
RAG_FINANCIAL_TERMS.md
```

This file is a structure guide. It should not replace the actual knowledge content of each module.

---

## 2. Core principle

Every RAG document must help the AI assistant explain information clearly without creating fake certainty.

A RAG document should answer:

```text
What does this concept mean?
When should this knowledge be used?
What can the AI safely explain?
What must the AI avoid?
What data is required?
What should happen if data is missing?
How should the AI explain this to beginners?
What other documents should be cross-referenced?
```

A RAG document must not become:

* A hidden recommendation engine.
* A place to store unsupported assumptions.
* A duplicate of another document.
* A collection of vague advice.
* A source of fake financial conclusions.
* A replacement for financial logic code.

---

## 3. Required file naming convention

RAG document filenames should use uppercase snake case.

Preferred format:

```text
RAG_<MODULE_OR_TOPIC>_<DOCUMENT_TYPE>.md
```

Examples:

```text
RAG_PVT_KNOWLEDGE.md
RAG_FINANCIAL_STATEMENTS_GUIDE.md
RAG_VALUATION_KNOWLEDGE.md
RAG_RISK_KNOWLEDGE.md
RAG_DOCUMENT_TEMPLATE.md
RAG_METADATA_STANDARD.md
```

Avoid unclear names such as:

```text
RAG_NOTES.md
RAG_EXTRA.md
RAG_GUIDE_2.md
RAG_MISC.md
RAG_AI_THINGS.md
```

---

## 4. Required top-level structure

Every RAG knowledge document should follow this structure unless there is a strong reason not to.

```text
# DOCUMENT_TITLE

## 1. Purpose
## 2. Core principle
## 3. Scope
## 4. What the AI can explain
## 5. What the AI must not do
## 6. Required data and missing data rules
## 7. Concept explanations
## 8. Beginner-friendly explanations
## 9. Interpretation boundaries
## 10. Safe response templates
## 11. Unsafe response examples
## 12. RAG retrieval guidance
## 13. Suggested metadata
## 14. Related documents
## 15. Final rule
```

If a section is not relevant, it may be shortened, but the document should still preserve the same logic.

---

## 5. Section guide

## 5.1. Title

The title must be clear and match the file topic.

Example:

```markdown
# RAG_PVT_KNOWLEDGE.md
```

Do not use vague titles such as:

```markdown
# Notes
# AI Guide
# RAG Info
```

---

## 5.2. Purpose

The purpose section should explain why the document exists.

It should answer:

* What topic does this file cover?
* Which module does it support?
* What type of user is it designed for?
* What should the AI use it for?
* What should the AI not use it for?

Template:

```markdown
## 1. Purpose

This document defines the RAG knowledge base for the [module/topic] in Atelier Finance.

The purpose of this file is to help the AI assistant explain [topic] in a way that is:

- Educational.
- Beginner-friendly.
- Data-grounded.
- Risk-aware.
- Non-recommendational.

This document must not be used to generate buy, sell, hold, entry, exit, or price prediction recommendations.
```

---

## 5.3. Core principle

The core principle section should define the main interpretation rule of the document.

Example for Price Volume Time:

```markdown
Price Volume Time analysis is a market observation framework. It helps users understand market behavior, but it must not become a trading signal generator.
```

Example for Financial Statements:

```markdown
Financial statements should be read as a connected system. The AI must not explain one number in isolation.
```

Example for Valuation:

```markdown
Valuation is an estimate based on assumptions, not a certain prediction of fair price.
```

---

## 5.4. Scope

The scope section should clearly define what the document covers and what it does not cover.

Template:

```markdown
## 3. Scope

This document covers:

- [Topic 1]
- [Topic 2]
- [Topic 3]

This document does not cover:

- [Out of scope topic 1]
- [Out of scope topic 2]
- [Out of scope topic 3]
```

Example:

```markdown
This document covers revenue, profit, cash flow, assets, liabilities, equity, and financial statement interpretation.

This document does not cover direct stock recommendations, price prediction, or trade timing.
```

---

## 5.5. What the AI can explain

This section should list safe explanation areas.

Template:

```markdown
## 4. What the AI can explain

The AI may explain:

- Meaning of [concept].
- Why [concept] matters.
- How [concept] should be interpreted.
- What data is required.
- What limitations apply.
- What should be checked next.
```

The AI can explain meaning, context, risk, uncertainty, and next checks.

The AI must not convert explanation into a decision instruction.

---

## 5.6. What the AI must not do

This section should define hard boundaries.

Template:

```markdown
## 5. What the AI must not do

The AI must not:

- Recommend buying.
- Recommend selling.
- Recommend holding.
- Predict future price with certainty.
- Treat missing data as 0.
- Invent unavailable data.
- Present one metric as a complete conclusion.
- Ignore sector-specific interpretation.
```

Every RAG document must include this section.

---

## 5.7. Required data and missing data rules

This section should define the required input data and what to do when data is missing.

Template:

````markdown
## 6. Required data and missing data rules

The AI must follow these rules:

```text
Missing data must be returned as null / not_available / insufficient_data.
Missing data must not be replaced with 0.
Do not divide by 0.
Do not calculate ratios when the denominator is missing, 0, or invalid.
Do not infer unavailable values from unrelated fields.
Do not invent financial data from general knowledge.
````

If data is missing, the AI should say:

> The available data is not enough to assess this item reliably.

````

Required data should be listed clearly.

Example:

```markdown
Required data for P/E:

- Market price.
- EPS.
- EPS must be greater than 0 for normal P/E interpretation.
````

---

## 5.8. Concept explanations

This section should explain the main concepts in the file.

Each concept should follow this mini-format:

```markdown
### [Concept name]

Definition:

> [Simple definition]

Why it matters:

- [Reason 1]
- [Reason 2]

How to interpret:

- [Safe interpretation 1]
- [Safe interpretation 2]

Common mistake:

> [Beginner misunderstanding]

Safety rule:

> [Boundary or warning]
```

Example:

```markdown
### Operating cash flow

Definition:

> Operating cash flow shows cash generated or used by core business operations.

Why it matters:

- It helps check whether accounting profit turns into real cash.
- It helps identify working capital pressure.

Common mistake:

> Positive profit does not always mean strong cash flow.

Safety rule:

> Do not conclude financial quality from net profit alone.
```

---

## 5.9. Beginner-friendly explanations

This section should provide simple explanations for non-expert users.

Use short and direct language.

Good example:

```markdown
Revenue tells us how much the company sold during a period.
```

Weak example:

```markdown
Revenue is the gross inflow of economic benefits arising from ordinary operating activities measured under applicable accounting standards.
```

The second explanation may be technically correct, but it is not suitable for Atelier Finance’s target users.

Preferred style:

* Simple.
* Practical.
* Not childish.
* Not overconfident.
* Avoid unnecessary English terms when Vietnamese explanation is clearer.
* Explain why the metric matters.
* Explain what it does not prove.

---

## 5.10. Interpretation boundaries

This section should prevent over-interpretation.

Template:

```markdown
## 9. Interpretation boundaries

The AI must not interpret [concept] as proof of:

- [Invalid conclusion 1]
- [Invalid conclusion 2]
- [Invalid conclusion 3]

The AI should connect [concept] with:

- [Related check 1]
- [Related check 2]
- [Related check 3]
```

Example:

```markdown
Revenue growth does not prove business quality. It should be checked with margins, profit, operating cash flow, receivables, inventory, and sector context.
```

---

## 5.11. Safe response templates

This section should provide safe reusable answer patterns.

Template:

```markdown
## 10. Safe response templates

### [Scenario]

Safe template:

> [Safe explanation]

Why this is safe:

- It explains the data.
- It avoids recommendation.
- It states limitations.
- It suggests what to check next.
```

Example:

```markdown
### Revenue increased

Safe template:

> Doanh thu tăng cho thấy quy mô bán hàng hoặc cung cấp dịch vụ lớn hơn trong kỳ. Tuy nhiên, doanh thu tăng chưa đủ để kết luận chất lượng kinh doanh tốt hơn. Cần kiểm tra thêm biên lợi nhuận, chi phí, lợi nhuận sau thuế, dòng tiền từ hoạt động kinh doanh, khoản phải thu và hàng tồn kho.
```

---

## 5.12. Unsafe response examples

This section should include negative examples.

Important:

Forbidden phrases may appear here only because this is a negative example section.

Template:

````markdown
## 11. Unsafe response examples

The AI must not produce outputs such as:

```text
[Unsafe output 1]
[Unsafe output 2]
[Unsafe output 3]
````

These phrases may only appear in negative examples, forbidden outputs, test cases, or expected refusal sections.

````

Examples:

```text
Revenue increased, so the company is definitely good.
This is a buy signal.
The stock is safe.
Missing data can be treated as 0.
````

---

## 5.13. RAG retrieval guidance

This section should define when the retriever should use the document.

Template:

```markdown
## 12. RAG retrieval guidance

This document should be retrieved when the user asks about:

- [Query intent 1]
- [Query intent 2]
- [Metric 1]
- [Metric 2]
- [Module name]
- [Common beginner question]
```

Example:

```markdown
This document should be retrieved when the user asks about:

- Financial statements.
- Revenue.
- Profit.
- Cash flow.
- Balance sheet.
- Operating cash flow.
- Profit positive but cash flow negative.
- Debt increase.
- Negative equity.
```

The retrieval guidance should include both technical terms and beginner phrases.

---

## 5.14. Suggested metadata

This section should provide metadata that can be used for indexing and retrieval.

Template:

```yaml
id: rag_<topic>_<type>
title: <Readable Title>
module: <module_name>
category: <category_name>
difficulty: beginner
related_modules:
  - <module_1>
  - <module_2>
related_metrics:
  - <metric_1>
  - <metric_2>
allowed_usage:
  - <safe_usage_1>
  - <safe_usage_2>
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - fake_data_generation
  - treating_missing_data_as_zero
last_updated: null
```

Metadata should be consistent with `RAG_METADATA_STANDARD.md`.

If `RAG_METADATA_STANDARD.md` is updated later, this template should be updated to match it.

---

## 5.15. Related documents

This section should list related files.

Template:

````markdown
## 14. Related documents

This document should be used together with:

```text
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_RESPONSE_STYLE.md
docs/ai/AI_SYSTEM_PROMPT.md
docs/rag/RAG_KNOWLEDGE_BASE.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_SYSTEM_PROMPT.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
````

If this document conflicts with AI guardrails, the stricter safety rule must apply.

````

Only include documents that are truly related.

Do not add cross-references just to make the file look complete.

---

## 5.16. Final rule

The final rule section should summarize the safest interpretation boundary of the document.

Template:

```markdown
## 15. Final rule

The AI must help users understand [topic].

It must not convert [topic] into:

- A buy/sell recommendation.
- A price prediction.
- A one-metric conclusion.
- A fake certainty statement.
- A shortcut that ignores missing data or context.

The correct role of this document is to help users read, question, and understand data before forming their own investment thesis.
````

---

## 6. Recommended writing style

RAG documents should be written in clear and practical language.

Preferred style:

```text
Clear
Direct
Beginner-friendly
Risk-aware
Specific
Data-grounded
Non-recommendational
```

Avoid:

```text
Overly academic language
Overly promotional language
Trading-signal language
Certainty language
Vague motivational language
Long duplicated explanations
Unnecessary formulas
```

Good sentence:

> Revenue increased, but the AI should check whether the growth also improved profit and operating cash flow.

Bad sentence:

> Revenue increased, so the company is performing well and may be a strong opportunity.

---

## 7. Language convention

RAG documents may include English section titles and Vietnamese safe response templates.

Recommended approach:

* Use English for structural headings if the repo already follows English documentation style.
* Use Vietnamese for examples that are shown to users.
* Keep financial terms consistent across documents.
* Avoid mixing too many synonyms for the same metric.

Example:

Use one preferred metric name:

```text
operating_cash_flow
```

Avoid inconsistent names:

```text
cash from operations
cashflow operating
business cash
money from business
```

Vietnamese user-facing explanation may say:

```text
dòng tiền từ hoạt động kinh doanh
```

But metadata should keep a consistent technical key.

---

## 8. Formula policy

RAG documents may explain formulas conceptually, but they should not become the source of implementation logic.

Detailed calculations should live in:

```text
src/lib/financial-logic/
docs/financial-logic/
```

RAG documents may include simple formula explanations when useful.

Example:

```text
Trading value = price × volume
```

But RAG documents should not duplicate long calculation logic if that logic already exists elsewhere.

If a formula has safety rules, include the safety rules.

Example:

```text
P/E should not be interpreted normally when EPS is missing, 0, or negative.
```

---

## 9. Duplication policy

Before creating a new RAG document, check whether the content already exists in:

```text
docs/ai/
docs/rag/
docs/financial-logic/
src/lib/financial-logic/
```

Do not create a new file if the same purpose is already covered by an existing file.

If related content already exists, use cross-reference instead of copying.

Acceptable:

```markdown
For general AI safety rules, see docs/ai/AI_GUARDRAILS.md.
```

Not acceptable:

```markdown
Copying the entire AI_GUARDRAILS.md content into every RAG document.
```

Each RAG document should have a clear unique purpose.

---

## 10. Cross-reference policy

Use cross-references when another document already defines:

* General AI safety rules.
* Response style rules.
* Retrieval logic.
* Hallucination prevention.
* Detailed financial formulas.
* Module-specific knowledge.

Cross-references should be short and purposeful.

Example:

```markdown
For general missing data and hallucination rules, use docs/rag/AI_HALLUCINATION_CHECKLIST.md.
```

Do not overuse cross-references.

A document with too many cross-references but little original content is not useful for RAG.

---

## 11. Chunking and retrieval policy

RAG documents should be structured so that sections can be retrieved independently.

Good chunk structure:

```text
Short heading
Definition
Interpretation
Safety rule
Example
```

Avoid long unstructured paragraphs.

Each important concept should have its own heading.

Good:

```markdown
### Receivables growing faster than revenue

[Explanation]
```

Bad:

```markdown
### Other notes

[Many unrelated ideas in one long section]
```

A retrieved chunk should still make sense even if the AI only receives that section.

---

## 12. User intent coverage

A good RAG document should include both formal and beginner-friendly query forms.

Example for cash flow:

Formal query forms:

```text
operating cash flow
cash flow from operations
CFO
free cash flow
```

Beginner query forms:

```text
lợi nhuận có ra tiền thật không
công ty có dòng tiền thật không
vì sao lãi mà tiền âm
lợi nhuận dương nhưng dòng tiền âm
```

This improves retrieval for users who do not know the correct financial term.

---

## 13. Safety hierarchy

When writing a RAG document, apply this safety hierarchy:

```text
1. AI_GUARDRAILS.md
2. AI_RAG_SYSTEM_PROMPT.md
3. AI_HALLUCINATION_CHECKLIST.md
4. RAG_RETRIEVAL_RULES.md
5. Module-specific RAG document
6. Safe response templates
```

If a module-specific document appears to allow something that the guardrails forbid, the guardrails win.

Example:

If a valuation document explains fair value, the AI still must not create a fake fair value when required data is missing.

---

## 14. Required safety phrases

Every RAG document should include safety wording appropriate to the topic.

Common safe phrases:

```text
This does not prove investment quality.
This is not a buy/sell/hold recommendation.
More context is needed.
The available data is not enough to conclude.
This should be checked with related metrics.
Missing data must not be replaced with 0.
This ratio is not meaningful when the denominator is missing, 0, or invalid.
```

Vietnamese equivalents:

```text
Điều này chưa đủ để kết luận chất lượng đầu tư.
Đây không phải khuyến nghị mua, bán hoặc nắm giữ.
Cần thêm bối cảnh để diễn giải.
Dữ liệu hiện tại chưa đủ để kết luận.
Cần đọc cùng các chỉ số liên quan.
Không được thay dữ liệu thiếu bằng 0.
Chỉ số này không có ý nghĩa khi mẫu số bị thiếu, bằng 0 hoặc không hợp lệ.
```

---

## 15. Forbidden wording policy

Forbidden wording may appear only in:

```text
Forbidden outputs
Unsafe examples
Negative examples
Test cases
Expected refusal
```

Forbidden wording must not appear as normal AI behavior.

Examples of forbidden wording:

```text
buy
sell
hold
recommendation
safe stock
good entry point
confirmed signal
guaranteed upside
should buy
should sell
```

Vietnamese examples:

```text
nên mua
nên bán
nên nắm giữ
khuyến nghị
cổ phiếu an toàn
điểm mua tốt
tín hiệu xác nhận
chắc chắn tăng
chắc chắn rẻ
```

When these phrases are included, clearly mark them as unsafe or forbidden examples.

---

## 16. Review checklist before adding a new RAG file

Before adding a new RAG document, check:

```text
1. Does this file have a unique purpose?
2. Is this content already covered elsewhere?
3. Does it cross-reference related documents instead of copying them?
4. Does it include missing data rules?
5. Does it avoid investment recommendations?
6. Does it include safe and unsafe examples?
7. Does it include retrieval guidance?
8. Does it include suggested metadata?
9. Does it explain concepts for beginners?
10. Does it avoid pretending that one metric is enough?
11. Does it avoid creating fake certainty?
12. Does it avoid duplicating financial logic code?
13. Does it handle sector-specific caution if relevant?
14. Does it include final safety boundaries?
15. Are forbidden phrases only inside forbidden/negative/test sections?
```

---

## 17. Example mini-template

Use this shorter mini-template when creating small RAG documents.

````markdown
# RAG_<TOPIC>.md

## 1. Purpose

This document helps the AI explain [topic] safely and clearly for beginner investors.

## 2. Core principle

[Main interpretation principle.]

## 3. What the AI can explain

- [Safe explanation area 1]
- [Safe explanation area 2]
- [Safe explanation area 3]

## 4. What the AI must not do

- Do not recommend buying, selling, or holding.
- Do not predict price with certainty.
- Do not invent missing data.
- Do not treat missing data as 0.
- Do not turn one metric into a final conclusion.

## 5. Missing data rules

Use `null`, `not_available`, or `insufficient_data` when required data is missing.

Do not calculate ratios when the denominator is missing, 0, or invalid.

## 6. Beginner explanation

[Simple explanation.]

## 7. Safe template

> [Safe response template.]

## 8. Unsafe examples

```text
[Unsafe example]
````

## 9. Retrieval guidance

Retrieve this document when the user asks about:

* [Query 1]
* [Query 2]
* [Query 3]

## 10. Metadata

```yaml
id: rag_<topic>
title: <Title>
module: <module>
category: <category>
difficulty: beginner
allowed_usage:
  - explain_<topic>
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - price_prediction
```

## 11. Related documents

* docs/ai/AI_GUARDRAILS.md
* docs/rag/RAG_RETRIEVAL_RULES.md

## 12. Final rule

[Final boundary.]

````

---

## 18. Example full document skeleton

Use this skeleton for larger RAG knowledge files.

```markdown
# RAG_<MODULE>_<TOPIC>.md

## 1. Purpose

[Explain the purpose.]

## 2. Core principle

[State the core interpretation rule.]

## 3. Scope

This document covers:

- [Item 1]
- [Item 2]
- [Item 3]

This document does not cover:

- [Item 1]
- [Item 2]

## 4. What the AI can explain

The AI may explain:

- [Safe item 1]
- [Safe item 2]
- [Safe item 3]

## 5. What the AI must not do

The AI must not:

- Recommend buying.
- Recommend selling.
- Recommend holding.
- Predict future price with certainty.
- Invent missing data.
- Treat missing data as 0.

## 6. Required data and missing data rules

Required data:

- [Data field 1]
- [Data field 2]

Missing data rules:

```text
Missing data = null / not_available / insufficient_data.
Do not replace missing data with 0.
Do not divide by 0.
````

## 7. Concept explanations

### [Concept 1]

Definition:

> [Definition]

How to interpret:

* [Point 1]
* [Point 2]

Safety rule:

> [Safety rule]

### [Concept 2]

Definition:

> [Definition]

How to interpret:

* [Point 1]
* [Point 2]

Safety rule:

> [Safety rule]

## 8. Beginner-friendly explanations

[Simple explanations.]

## 9. Interpretation boundaries

The AI must not interpret this topic as proof of:

* [Invalid conclusion 1]
* [Invalid conclusion 2]

## 10. Safe response templates

### [Scenario 1]

Safe template:

> [Template]

### [Scenario 2]

Safe template:

> [Template]

## 11. Unsafe response examples

```text
[Unsafe output 1]
[Unsafe output 2]
```

These phrases may only appear in negative examples, forbidden outputs, test cases, or expected refusal sections.

## 12. RAG retrieval guidance

This document should be retrieved when the user asks about:

* [Query 1]
* [Query 2]
* [Query 3]

## 13. Suggested metadata

```yaml
id: rag_<module>_<topic>
title: <Title>
module: <module>
category: <category>
difficulty: beginner
related_modules:
  - <module>
related_metrics:
  - <metric>
allowed_usage:
  - <usage>
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - fake_data_generation
  - treating_missing_data_as_zero
```

## 14. Related documents

This document should be used together with:

```text
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_RESPONSE_STYLE.md
docs/rag/RAG_KNOWLEDGE_BASE.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_SYSTEM_PROMPT.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
```

## 15. Final rule

[Final safety rule.]

````

---

## 19. Maintenance rule

When updating this template:

- Do not rewrite all RAG documents immediately unless necessary.
- Update new documents first.
- Only refactor old documents if there is clear duplication, inconsistency, or safety risk.
- Avoid cosmetic-only rewrites.
- Keep the template practical rather than academic.

---

## 20. Final rule

A RAG document in Atelier Finance should make the AI assistant more useful, safer, and easier to control.

It should help the AI:

```text
retrieve the right knowledge,
explain the right concept,
respect missing data,
avoid fake certainty,
avoid investment recommendations,
and guide beginner users toward better understanding.
````

A RAG document should never become a place where unsupported assumptions, duplicated rules, or hidden buy/sell logic are stored.
