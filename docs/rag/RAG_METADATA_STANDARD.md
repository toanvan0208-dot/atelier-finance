# RAG_METADATA_STANDARD.md

## 1. Purpose

This document defines the metadata standard for RAG knowledge documents in Atelier Finance.

The purpose of this file is to make every RAG document easier to:

* Index.
* Search.
* Retrieve.
* Rank.
* Filter by module.
* Filter by topic.
* Filter by difficulty.
* Connect with related metrics.
* Apply safety boundaries.
* Maintain over time.

This file does not define the full content structure of a RAG document.

For document structure, use:

```text
docs/rag/RAG_DOCUMENT_TEMPLATE.md
```

This file focuses only on metadata fields and metadata usage.

---

## 2. Core principle

Metadata must help the RAG system retrieve the right document for the right user question.

Good metadata should answer:

```text
What is this document about?
Which module does it support?
What user intent should retrieve it?
Which financial metrics does it relate to?
What can the AI use it for?
What must the AI not use it for?
How difficult is the content?
What other documents are related?
Is the document current enough to use?
```

Metadata must not be used to hide investment recommendations, fake certainty, or undocumented assumptions.

---

## 3. Metadata placement

Every RAG document should include a metadata block near the end of the file under a section named:

```markdown
## Suggested metadata
```

The metadata should be written in YAML-style format.

Example:

```yaml
id: rag_pvt_knowledge
title: Price Volume Time Knowledge
module: price_volume_time
category: market_observation
difficulty: beginner
```

The metadata block should be readable by humans even before it is used by code.

---

## 4. Required metadata fields

Every RAG document should include these required fields:

```yaml
id: string
title: string
module: string
category: string
difficulty: beginner | intermediate | advanced
summary: string
related_modules: string[]
related_metrics: string[]
user_intents: string[]
allowed_usage: string[]
forbidden_usage: string[]
safety_level: low | medium | high | critical
source_type: internal_knowledge | external_source | mixed
last_updated: string | null
review_status: draft | reviewed | approved | deprecated
```

If a value is unknown, use:

```text
null
```

Do not use empty fake values.

Do not use `0` to represent unknown metadata.

---

## 5. Optional metadata fields

Optional fields may be added when useful:

```yaml
aliases: string[]
beginner_queries: string[]
technical_queries: string[]
related_files: string[]
sector_scope: string[]
market_scope: string[]
data_requirements: string[]
invalid_conditions: string[]
output_constraints: string[]
chunk_priority: low | medium | high
owner: string | null
reviewer: string | null
version: string | null
```

Optional fields should only be used if they improve retrieval or maintenance.

Do not add many optional fields just to make the metadata look complete.

---

## 6. Field definitions

## 6.1. `id`

The `id` field is the unique identifier of the RAG document.

Rules:

* Use lowercase snake case.
* Must be stable over time.
* Should match the file topic.
* Must not contain spaces.
* Must not contain Vietnamese accents.
* Must not be too generic.

Good examples:

```yaml
id: rag_pvt_knowledge
id: rag_financial_statements_guide
id: rag_valuation_knowledge
id: rag_risk_knowledge
id: rag_checklist_knowledge
```

Bad examples:

```yaml
id: rag1
id: notes
id: ai_doc
id: tài_liệu_rag
id: new_file
```

---

## 6.2. `title`

The `title` field is the human-readable title of the document.

Rules:

* Use a clear title.
* Keep it short.
* Match the document topic.
* Avoid vague titles.

Good examples:

```yaml
title: Price Volume Time Knowledge
title: Financial Statements Reading Guide
title: Valuation Knowledge
title: Risk Knowledge
```

Bad examples:

```yaml
title: Notes
title: Useful Things
title: AI Stuff
title: Finance
```

---

## 6.3. `module`

The `module` field defines the main product module this document supports.

Allowed module values:

```yaml
module: business_understanding
module: macro
module: industry
module: screening
module: financial_statements
module: valuation
module: risk
module: price_volume_time
module: checklist
module: portfolio
module: watchlist
module: ai_assistant
module: rag_system
module: general
```

Rules:

* Use only one primary module.
* Use `related_modules` for secondary modules.
* Use lowercase snake case.
* Do not invent module names unless the product architecture changes.

Example:

```yaml
module: financial_statements
related_modules:
  - valuation
  - risk
  - checklist
```

---

## 6.4. `category`

The `category` field describes the knowledge type.

Allowed category values:

```yaml
category: financial_analysis
category: valuation
category: risk_analysis
category: market_observation
category: financial_terms
category: checklist_reasoning
category: retrieval_rules
category: response_safety
category: document_standard
category: metadata_standard
category: beginner_education
category: sector_context
category: data_quality
```

Rules:

* Use one primary category.
* Choose the most specific category that fits.
* Do not use category names as vague as `misc`, `other`, or `random`.

---

## 6.5. `difficulty`

The `difficulty` field defines how hard the content is for the target user.

Allowed values:

```yaml
difficulty: beginner
difficulty: intermediate
difficulty: advanced
```

Default value for Atelier Finance should usually be:

```yaml
difficulty: beginner
```

because the target users are beginners, students, and individual investors with limited financial knowledge.

Use `intermediate` only when the document requires some finance background.

Use `advanced` only for technical, implementation, or complex financial topics.

---

## 6.6. `summary`

The `summary` field gives a short description of the document.

Rules:

* One to three sentences.
* Explain what the document helps the AI do.
* Do not include recommendations.
* Do not include marketing language.

Good example:

```yaml
summary: Explains how to read revenue, profit, cash flow, assets, liabilities, and equity as a connected financial statement system for beginner investors.
```

Bad example:

```yaml
summary: Helps users find the best stocks to buy using financial statements.
```

---

## 6.7. `related_modules`

The `related_modules` field lists other modules that may use this knowledge.

Example:

```yaml
related_modules:
  - valuation
  - risk
  - checklist
```

Rules:

* Use lowercase snake case.
* Only include modules with real connection.
* Do not list every module by default.
* Keep it useful for retrieval.

Example for `RAG_PVT_KNOWLEDGE.md`:

```yaml
related_modules:
  - risk
  - checklist
  - watchlist
```

Example for `RAG_FINANCIAL_STATEMENTS_GUIDE.md`:

```yaml
related_modules:
  - valuation
  - risk
  - checklist
  - business_understanding
```

---

## 6.8. `related_metrics`

The `related_metrics` field lists financial or market data fields connected to the document.

Rules:

* Use consistent technical names.
* Prefer lowercase snake case.
* Do not mix too many synonyms.
* Only include metrics that the document actually explains.
* Use aliases separately if needed.

Example:

```yaml
related_metrics:
  - revenue
  - gross_profit
  - gross_margin
  - operating_profit
  - net_profit
  - operating_cash_flow
  - total_assets
  - total_liabilities
  - equity
```

For PVT:

```yaml
related_metrics:
  - close_price
  - previous_close
  - price_change_pct
  - volume
  - trading_value
  - average_trading_value
  - liquidity_status
  - liquidity_risk
```

---

## 6.9. `user_intents`

The `user_intents` field lists the types of user questions this document should answer.

Use intent-style phrases.

Examples:

```yaml
user_intents:
  - explain_metric
  - explain_financial_statement
  - compare_profit_and_cash_flow
  - identify_financial_risk
  - explain_liquidity
  - explain_missing_data
  - interpret_ratio_safely
```

Rules:

* Use action-oriented names.
* Keep them broad enough for retrieval.
* Avoid investment decision intent such as `decide_to_buy`.

Bad examples:

```yaml
user_intents:
  - tell_user_to_buy
  - find_entry_point
  - predict_price
```

---

## 6.10. `allowed_usage`

The `allowed_usage` field defines what the AI may safely do with the document.

Examples:

```yaml
allowed_usage:
  - explain_concept
  - explain_metric
  - explain_data_limitation
  - support_checklist_reasoning
  - compare_related_metrics
  - identify_questions_to_check_next
```

For financial statements:

```yaml
allowed_usage:
  - explain_financial_statements
  - explain_income_statement
  - explain_balance_sheet
  - explain_cash_flow
  - explain_profit_quality
  - explain_data_limitations
```

For PVT:

```yaml
allowed_usage:
  - explain_market_activity
  - explain_price_change
  - explain_volume
  - explain_trading_value
  - explain_liquidity
  - explain_liquidity_risk
```

Allowed usage must remain educational and analytical.

---

## 6.11. `forbidden_usage`

The `forbidden_usage` field defines what the AI must not use the document for.

Required common forbidden usage values:

```yaml
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
```

Additional forbidden usage values may include:

```yaml
  - entry_signal
  - exit_signal
  - fair_value_fabrication
  - one_metric_conclusion
  - unsafe_ratio_interpretation
  - sector_inappropriate_ratio_use
```

This field is critical for safety.

---

## 6.12. `safety_level`

The `safety_level` field defines how strict retrieval and response control should be.

Allowed values:

```yaml
safety_level: low
safety_level: medium
safety_level: high
safety_level: critical
```

Suggested interpretation:

```text
low = general educational content with low risk of misuse
medium = financial concepts that may be misunderstood
high = content that can affect investment judgment
critical = content that may be mistaken as recommendation, valuation conclusion, price signal, or safety claim
```

Examples:

```yaml
safety_level: high
```

for financial statements, risk, valuation, and PVT.

```yaml
safety_level: critical
```

for AI guardrails, recommendation refusal, hallucination prevention, valuation output constraints, or RAG safety prompts.

---

## 6.13. `source_type`

The `source_type` field describes where the knowledge comes from.

Allowed values:

```yaml
source_type: internal_knowledge
source_type: external_source
source_type: mixed
```

Use:

```yaml
source_type: internal_knowledge
```

for product rules, AI guardrails, RAG templates, and internally written explanation guides.

Use:

```yaml
source_type: external_source
```

only when the document is mainly based on a specific external report, law, dataset, textbook, or official source.

Use:

```yaml
source_type: mixed
```

when combining internal interpretation with external facts.

If external sources are used, citations or source references should be included in the document body.

---

## 6.14. `last_updated`

The `last_updated` field records the last meaningful update date.

Format:

```yaml
last_updated: YYYY-MM-DD
```

If unknown:

```yaml
last_updated: null
```

Rules:

* Do not fake a date.
* Do not update this date for cosmetic formatting changes unless the project decides otherwise.
* Update when meaning, rules, metrics, or safety boundaries change.

---

## 6.15. `review_status`

The `review_status` field shows whether the document is ready for use.

Allowed values:

```yaml
review_status: draft
review_status: reviewed
review_status: approved
review_status: deprecated
```

Suggested meaning:

```text
draft = newly written, not fully checked
reviewed = checked for duplication and safety issues
approved = accepted as active knowledge
deprecated = should not be retrieved unless historical context is needed
```

Rules:

* New documents should usually start as `draft`.
* Change to `reviewed` only after checking duplication, cross-reference, and safety.
* Use `deprecated` instead of deleting immediately if other files still reference it.

---

## 7. Optional field definitions

## 7.1. `aliases`

The `aliases` field lists alternative names for the same topic.

Example:

```yaml
aliases:
  - PVT
  - Price Volume Time
  - price-volume-time
  - price volume analysis
```

For financial statements:

```yaml
aliases:
  - financial reports
  - income statement
  - balance sheet
  - cash flow statement
  - báo cáo tài chính
```

Aliases help retrieval when users use different words.

---

## 7.2. `beginner_queries`

The `beginner_queries` field lists natural questions beginners may ask.

Example:

```yaml
beginner_queries:
  - vì sao lãi mà dòng tiền âm
  - doanh thu tăng có phải công ty tốt hơn không
  - nợ tăng có nguy hiểm không
  - thanh khoản thấp nghĩa là gì
  - volume tăng có ý nghĩa gì
```

Rules:

* Include Vietnamese beginner phrases.
* Include common misunderstandings.
* Avoid adding recommendation-seeking phrases as allowed behavior.

If recommendation-seeking phrases are included, make sure `forbidden_usage` includes recommendation refusal boundaries.

---

## 7.3. `technical_queries`

The `technical_queries` field lists formal terms or technical keywords.

Example:

```yaml
technical_queries:
  - operating_cash_flow
  - gross_margin
  - debt_to_equity
  - negative_equity
  - price_change_pct
  - average_trading_value
```

This helps retrieval when the user or system uses metric names.

---

## 7.4. `related_files`

The `related_files` field lists documents that should be considered together.

Example:

```yaml
related_files:
  - docs/ai/AI_GUARDRAILS.md
  - docs/ai/AI_RESPONSE_STYLE.md
  - docs/rag/RAG_RETRIEVAL_RULES.md
  - docs/rag/AI_HALLUCINATION_CHECKLIST.md
```

Rules:

* Only include files that have a real relationship.
* Do not list every file by default.
* Avoid circular duplication.
* Use this field to support retrieval, not decoration.

---

## 7.5. `sector_scope`

The `sector_scope` field defines which sectors the document applies to.

Examples:

```yaml
sector_scope:
  - all_non_financial_companies
```

```yaml
sector_scope:
  - banks
  - securities_companies
  - insurance_companies
```

```yaml
sector_scope:
  - all_sectors
```

Rules:

* Use this when sector interpretation matters.
* For documents that warn against sector misuse, include the relevant sectors.
* Do not assume all financial ratios work for all sectors.

---

## 7.6. `market_scope`

The `market_scope` field defines which market context the document applies to.

Examples:

```yaml
market_scope:
  - vietnam_stock_market
```

```yaml
market_scope:
  - general_equity_market
```

```yaml
market_scope:
  - educational_context
```

Use this when a document is market-specific.

If the content is general finance education, use:

```yaml
market_scope:
  - general_equity_market
```

---

## 7.7. `data_requirements`

The `data_requirements` field lists required inputs for the document’s logic.

Example:

```yaml
data_requirements:
  - revenue
  - net_profit
  - operating_cash_flow
  - total_assets
  - total_liabilities
  - equity
```

For PVT:

```yaml
data_requirements:
  - close_price
  - previous_close
  - volume
  - trading_value
  - historical_trading_value
```

Rules:

* Include only required or commonly needed fields.
* Do not invent data fields that do not exist in the project.
* Keep naming consistent with related metrics where possible.

---

## 7.8. `invalid_conditions`

The `invalid_conditions` field lists cases where normal interpretation is not valid.

Examples:

```yaml
invalid_conditions:
  - eps_missing
  - eps_zero
  - eps_negative
  - equity_missing
  - equity_zero
  - equity_negative
  - denominator_missing
  - denominator_zero
  - insufficient_historical_data
```

This field is especially important for:

* P/E.
* P/B.
* ROE.
* Debt/Equity.
* Current Ratio.
* Liquidity analysis.
* Valuation.
* Financial health scoring.

---

## 7.9. `output_constraints`

The `output_constraints` field lists response restrictions.

Example:

```yaml
output_constraints:
  - must_state_data_limitations
  - must_avoid_recommendations
  - must_not_predict_price
  - must_not_invent_missing_data
  - must_explain_invalid_ratios
  - must_use_beginner_friendly_language
```

This helps align retrieval with AI response style and guardrails.

---

## 7.10. `chunk_priority`

The `chunk_priority` field helps decide which document sections should be retrieved first.

Allowed values:

```yaml
chunk_priority: low
chunk_priority: medium
chunk_priority: high
```

Use:

```yaml
chunk_priority: high
```

for documents that should often be retrieved, such as:

* AI guardrails.
* Hallucination checklist.
* RAG retrieval rules.
* Core module knowledge.
* Missing data rules.

Use:

```yaml
chunk_priority: medium
```

for supporting knowledge.

Use:

```yaml
chunk_priority: low
```

for examples, appendix content, or rarely used details.

---

## 7.11. `owner`

The `owner` field identifies the person or role responsible for maintaining the document.

Example:

```yaml
owner: financial_logic_ai_rag_lead
```

If unknown:

```yaml
owner: null
```

Do not use personal private details unnecessarily.

For Atelier Finance, the role-based owner is preferred.

---

## 7.12. `reviewer`

The `reviewer` field identifies the person or role that reviewed the document.

Example:

```yaml
reviewer: null
```

or:

```yaml
reviewer: financial_logic_ai_rag_lead
```

Use this only if review tracking is actually useful.

---

## 7.13. `version`

The `version` field tracks meaningful document versions.

Example:

```yaml
version: "1.0"
```

Rules:

* Use quotes to avoid YAML parsing issues.
* Increase the version only after meaningful content changes.
* Do not use versioning if the repo does not need it yet.

If not used:

```yaml
version: null
```

---

## 8. Standard metadata block template

Use this template for normal RAG knowledge documents.

```yaml
id: rag_<topic>_<type>
title: <Readable Title>
module: <primary_module>
category: <category>
difficulty: beginner
summary: <One to three sentence summary>
related_modules:
  - <related_module_1>
  - <related_module_2>
related_metrics:
  - <metric_1>
  - <metric_2>
user_intents:
  - explain_concept
  - explain_metric
allowed_usage:
  - explain_concept
  - explain_data_limitation
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
safety_level: high
source_type: internal_knowledge
last_updated: null
review_status: draft
```

---

## 9. Minimal metadata block template

Use this only for small support documents.

```yaml
id: rag_<topic>
title: <Readable Title>
module: general
category: beginner_education
difficulty: beginner
summary: <Short summary>
related_modules: []
related_metrics: []
user_intents:
  - explain_concept
allowed_usage:
  - explain_concept
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - fake_data_generation
  - treating_missing_data_as_zero
safety_level: medium
source_type: internal_knowledge
last_updated: null
review_status: draft
```

---

## 10. Metadata example for `RAG_PVT_KNOWLEDGE.md`

```yaml
id: rag_pvt_knowledge
title: Price Volume Time Knowledge
module: price_volume_time
category: market_observation
difficulty: beginner
summary: Explains price movement, trading volume, trading value, liquidity, liquidity risk, and time-based market behavior as market observation signals without turning them into trading recommendations.
related_modules:
  - risk
  - checklist
  - watchlist
related_metrics:
  - close_price
  - previous_close
  - price_change_pct
  - volume
  - trading_value
  - average_trading_value
  - liquidity_status
  - liquidity_risk
user_intents:
  - explain_price_change
  - explain_volume
  - explain_trading_value
  - explain_liquidity
  - explain_liquidity_risk
  - explain_market_activity
allowed_usage:
  - explain_market_activity
  - explain_price_change
  - explain_volume
  - explain_trading_value
  - explain_liquidity
  - explain_data_limitation
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - entry_signal
  - exit_signal
  - price_prediction
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
safety_level: high
source_type: internal_knowledge
last_updated: null
review_status: draft
aliases:
  - PVT
  - Price Volume Time
  - price volume time
  - price volume analysis
beginner_queries:
  - volume tăng có ý nghĩa gì
  - thanh khoản thấp nghĩa là gì
  - giá tăng mạnh có chắc tốt không
  - giá giảm có phải doanh nghiệp xấu không
technical_queries:
  - price_change_pct
  - trading_value
  - average_trading_value
  - liquidity_status
  - liquidity_risk
related_files:
  - docs/rag/RAG_RETRIEVAL_RULES.md
  - docs/rag/AI_HALLUCINATION_CHECKLIST.md
  - docs/ai/AI_GUARDRAILS.md
sector_scope:
  - all_sectors
market_scope:
  - general_equity_market
data_requirements:
  - close_price
  - previous_close
  - volume
  - trading_value
  - historical_trading_value
invalid_conditions:
  - previous_close_missing
  - previous_close_zero
  - volume_missing
  - price_missing
  - insufficient_historical_data
output_constraints:
  - must_avoid_recommendations
  - must_not_predict_price
  - must_not_invent_missing_data
  - must_state_data_limitations
chunk_priority: high
owner: financial_logic_ai_rag_lead
reviewer: null
version: "1.0"
```

---

## 11. Metadata example for `RAG_FINANCIAL_STATEMENTS_GUIDE.md`

```yaml
id: rag_financial_statements_guide
title: Financial Statements Reading Guide
module: financial_statements
category: financial_analysis
difficulty: beginner
summary: Explains how to read income statement, balance sheet, and cash flow statement as a connected system for beginner investors.
related_modules:
  - valuation
  - risk
  - checklist
  - business_understanding
related_metrics:
  - revenue
  - gross_profit
  - gross_margin
  - operating_profit
  - operating_margin
  - net_profit
  - net_margin
  - eps
  - total_assets
  - current_assets
  - cash_and_equivalents
  - accounts_receivable
  - inventory
  - total_liabilities
  - short_term_debt
  - long_term_debt
  - total_debt
  - equity
  - operating_cash_flow
  - investing_cash_flow
  - financing_cash_flow
  - free_cash_flow
  - roe
  - roa
  - current_ratio
  - debt_to_equity
  - pe
  - pb
user_intents:
  - explain_financial_statement
  - explain_income_statement
  - explain_balance_sheet
  - explain_cash_flow
  - explain_profit_quality
  - compare_profit_and_cash_flow
  - identify_financial_risk
  - interpret_ratio_safely
allowed_usage:
  - explain_financial_statements
  - explain_income_statement
  - explain_balance_sheet
  - explain_cash_flow
  - explain_profit_quality
  - explain_financial_health
  - explain_data_limitation
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - price_prediction
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
  - one_metric_conclusion
  - unsafe_ratio_interpretation
  - sector_inappropriate_ratio_use
safety_level: high
source_type: internal_knowledge
last_updated: null
review_status: draft
aliases:
  - financial reports
  - financial statements
  - income statement
  - balance sheet
  - cash flow statement
  - báo cáo tài chính
  - báo cáo kết quả kinh doanh
  - bảng cân đối kế toán
  - báo cáo lưu chuyển tiền tệ
beginner_queries:
  - vì sao lãi mà dòng tiền âm
  - doanh thu tăng có phải công ty tốt hơn không
  - nợ tăng có nguy hiểm không
  - vốn chủ âm nghĩa là gì
  - lợi nhuận tăng có chắc tốt không
technical_queries:
  - operating_cash_flow
  - gross_margin
  - net_margin
  - debt_to_equity
  - negative_equity
  - current_ratio
  - pe
  - pb
  - roe
related_files:
  - docs/rag/RAG_FINANCIAL_TERMS.md
  - docs/rag/RAG_VALUATION_KNOWLEDGE.md
  - docs/rag/RAG_RISK_KNOWLEDGE.md
  - docs/rag/RAG_CHECKLIST_KNOWLEDGE.md
  - docs/rag/AI_HALLUCINATION_CHECKLIST.md
  - docs/ai/AI_GUARDRAILS.md
sector_scope:
  - all_non_financial_companies
  - banks_with_special_caution
  - securities_companies_with_special_caution
  - insurance_companies_with_special_caution
market_scope:
  - general_equity_market
data_requirements:
  - revenue
  - gross_profit
  - operating_profit
  - net_profit
  - eps
  - total_assets
  - total_liabilities
  - equity
  - operating_cash_flow
invalid_conditions:
  - eps_missing
  - eps_zero
  - eps_negative
  - equity_missing
  - equity_zero
  - equity_negative
  - denominator_missing
  - denominator_zero
  - financial_sector_ratio_misuse
output_constraints:
  - must_avoid_recommendations
  - must_not_invent_missing_data
  - must_explain_invalid_ratios
  - must_state_data_limitations
  - must_use_beginner_friendly_language
chunk_priority: high
owner: financial_logic_ai_rag_lead
reviewer: null
version: "1.0"
```

---

## 12. Metadata example for `RAG_VALUATION_KNOWLEDGE.md`

```yaml
id: rag_valuation_knowledge
title: Valuation Knowledge
module: valuation
category: valuation
difficulty: beginner
summary: Explains valuation concepts, valuation assumptions, fair value limitations, margin of safety, and why valuation should be treated as an estimate rather than certainty.
related_modules:
  - financial_statements
  - risk
  - checklist
related_metrics:
  - eps
  - bvps
  - pe
  - pb
  - roe
  - growth_rate
  - discount_rate
  - terminal_value
  - fair_value_estimate
  - margin_of_safety
user_intents:
  - explain_valuation
  - explain_pe
  - explain_pb
  - explain_margin_of_safety
  - explain_fair_value_limitation
  - explain_invalid_valuation
allowed_usage:
  - explain_valuation_concept
  - explain_assumption_sensitivity
  - explain_data_limitation
  - explain_invalid_ratio
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - guaranteed_fair_value
  - fair_value_fabrication
  - price_prediction
  - guaranteed_conclusion
  - treating_missing_data_as_zero
safety_level: critical
source_type: internal_knowledge
last_updated: null
review_status: draft
```

---

## 13. Metadata example for `RAG_RISK_KNOWLEDGE.md`

```yaml
id: rag_risk_knowledge
title: Risk Knowledge
module: risk
category: risk_analysis
difficulty: beginner
summary: Explains financial, liquidity, valuation, business, and market risks without turning risk score into a final investment conclusion.
related_modules:
  - financial_statements
  - valuation
  - price_volume_time
  - checklist
related_metrics:
  - debt_to_equity
  - current_ratio
  - operating_cash_flow
  - liquidity_status
  - volatility
  - risk_score
user_intents:
  - explain_risk
  - explain_risk_score
  - identify_risk_factors
  - explain_liquidity_risk
  - explain_financial_risk
allowed_usage:
  - explain_risk_factor
  - explain_risk_score_limitation
  - explain_data_limitation
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - safe_stock_claim
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
safety_level: critical
source_type: internal_knowledge
last_updated: null
review_status: draft
```

---

## 14. Metadata example for `RAG_CHECKLIST_KNOWLEDGE.md`

```yaml
id: rag_checklist_knowledge
title: Checklist Knowledge
module: checklist
category: checklist_reasoning
difficulty: beginner
summary: Explains how users can use checklist questions to structure investment thinking without turning checklist results into recommendations.
related_modules:
  - business_understanding
  - financial_statements
  - valuation
  - risk
  - price_volume_time
related_metrics:
  - revenue
  - net_profit
  - operating_cash_flow
  - debt_to_equity
  - pe
  - pb
  - liquidity_status
  - risk_score
user_intents:
  - explain_checklist
  - support_investment_thesis
  - identify_missing_checks
  - explain_next_questions
allowed_usage:
  - support_checklist_reasoning
  - explain_missing_checks
  - organize_user_thesis
  - explain_data_limitation
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - final_investment_decision
  - guaranteed_conclusion
  - fake_data_generation
safety_level: critical
source_type: internal_knowledge
last_updated: null
review_status: draft
```

---

## 15. Metadata validation checklist

Before accepting a metadata block, check:

```text
1. Does the id use lowercase snake case?
2. Is the title clear and specific?
3. Is the module from the allowed module list?
4. Is the category from the allowed category list?
5. Is difficulty valid?
6. Does the summary avoid recommendations?
7. Are related_modules truly related?
8. Are related_metrics actually explained in the document?
9. Do user_intents reflect safe user needs?
10. Does allowed_usage stay educational and analytical?
11. Does forbidden_usage include recommendation and fake data restrictions?
12. Is safety_level strict enough?
13. Is source_type accurate?
14. Is last_updated real or null?
15. Is review_status valid?
16. Are aliases useful rather than excessive?
17. Are beginner_queries realistic?
18. Are invalid_conditions included for risky metrics?
19. Are output_constraints aligned with AI guardrails?
20. Does the metadata avoid hiding any investment instruction?
```

---

## 16. Common metadata mistakes

## 16.1. Listing every module as related

Bad:

```yaml
related_modules:
  - business_understanding
  - macro
  - industry
  - screening
  - financial_statements
  - valuation
  - risk
  - price_volume_time
  - checklist
  - portfolio
  - watchlist
```

Why this is bad:

> It makes retrieval noisy because the document appears relevant to everything.

Better:

```yaml
related_modules:
  - valuation
  - risk
  - checklist
```

---

## 16.2. Using vague categories

Bad:

```yaml
category: other
```

Better:

```yaml
category: financial_analysis
```

---

## 16.3. Mixing allowed and forbidden usage

Bad:

```yaml
allowed_usage:
  - explain_pe
  - recommend_buy_when_pe_low
```

Better:

```yaml
allowed_usage:
  - explain_pe
  - explain_invalid_pe_conditions
forbidden_usage:
  - buy_recommendation
  - low_pe_buy_signal
```

---

## 16.4. Treating beginner queries as permissions

Bad:

```yaml
beginner_queries:
  - cổ phiếu này có nên mua không
allowed_usage:
  - answer_buy_question
```

Better:

```yaml
beginner_queries:
  - cổ phiếu này có nên mua không
allowed_usage:
  - redirect_recommendation_to_analysis
forbidden_usage:
  - buy_recommendation
```

---

## 16.5. Fake last updated date

Bad:

```yaml
last_updated: 2026-01-01
```

when nobody actually updated it on that date.

Better:

```yaml
last_updated: null
```

until the project has a real update process.

---

## 16.6. Too many aliases

Bad:

```yaml
aliases:
  - finance
  - money
  - report
  - company
  - good stock
  - stock
```

Better:

```yaml
aliases:
  - financial statements
  - financial reports
  - báo cáo tài chính
```

---

## 17. Metadata and retrieval behavior

The RAG retriever should use metadata to help decide:

```text
1. Whether a document matches the user intent.
2. Whether a document matches the module.
3. Whether a document mentions the relevant metric.
4. Whether a safety document should be retrieved together.
5. Whether sector-specific caution is required.
6. Whether missing data rules should be applied.
7. Whether the document is approved, draft, or deprecated.
```

Recommended retrieval behavior:

```text
If user asks about valuation:
- Retrieve valuation knowledge.
- Retrieve hallucination checklist if fair value or assumptions are involved.
- Retrieve financial statement guide if EPS, profit, or book value is involved.

If user asks about PVT:
- Retrieve PVT knowledge.
- Retrieve risk knowledge if liquidity risk is involved.
- Retrieve guardrails if the user asks for entry/exit or trading signal.

If user asks about financial statements:
- Retrieve financial statements guide.
- Retrieve financial terms if a specific metric is asked.
- Retrieve risk knowledge if debt, cash flow, or negative equity appears.
```

---

## 18. Metadata and safety hierarchy

Metadata must support the safety hierarchy.

When a document has:

```yaml
safety_level: critical
```

the AI should apply stricter response controls, including:

* Avoiding recommendation language.
* Stating uncertainty.
* Checking missing data.
* Avoiding fake fair value.
* Avoiding price prediction.
* Explaining invalid ratios.
* Redirecting recommendation-seeking questions into analysis.

When a document has:

```yaml
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - price_prediction
```

the AI must not override this based on user pressure.

---

## 19. Review status usage

The `review_status` field should affect retrieval.

Suggested behavior:

```text
approved = safe to retrieve normally
reviewed = safe to retrieve, but may require later final approval
draft = retrieve with caution or only in development mode
deprecated = avoid retrieval unless the user asks for historical context
```

If there is no technical implementation yet, the status still helps humans maintain the knowledge base.

---

## 20. Versioning policy

Versioning is optional.

If used:

```yaml
version: "1.0"
```

Suggested version rules:

```text
1.0 = initial approved version
1.1 = minor content improvement
1.2 = added examples or metadata without changing meaning
2.0 = major structure or safety rule change
```

If the project does not need versioning yet, use:

```yaml
version: null
```

Do not overcomplicate versioning early.

---

## 21. Maintenance rules

When maintaining metadata:

* Do not update metadata cosmetically without reason.
* Do not add unrelated aliases.
* Do not add every module as related.
* Do not use metadata to bypass guardrails.
* Do not mark a document approved before review.
* Do not use stale documents if content is deprecated.
* Do not duplicate large metadata blocks across files manually if a central registry is later created.

When a document changes meaningfully, review:

```text
id
title
summary
related_metrics
user_intents
allowed_usage
forbidden_usage
safety_level
last_updated
review_status
version
```

---

## 22. Integration with `RAG_DOCUMENT_TEMPLATE.md`

`RAG_DOCUMENT_TEMPLATE.md` defines the structure of the document body.

This file defines the metadata standard.

Use both together:

```text
RAG_DOCUMENT_TEMPLATE.md = how the document should be written.
RAG_METADATA_STANDARD.md = how the document should be tagged.
```

Do not copy the full metadata standard into every RAG document.

Each document should include only its own metadata block.

---

## 23. Final rule

Metadata is not decoration.

Metadata is part of the RAG control system.

Good metadata helps the AI:

```text
retrieve the right knowledge,
avoid irrelevant context,
respect module boundaries,
apply safety constraints,
detect missing data risks,
avoid fake certainty,
and explain concepts clearly to beginner investors.
```

Bad metadata can make the AI retrieve the wrong document, mix unrelated concepts, overstate conclusions, or accidentally produce unsafe investment language.

The metadata standard must keep Atelier Finance’s RAG system useful, maintainable, and safe.
