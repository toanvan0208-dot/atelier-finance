# Macro-to-Industry and Assistant Boundaries

Atelier Finance is an educational platform, not an investment advisory service. As we introduce real macroeconomic data, we must enforce strict guardrails preventing the AI Assistant from generating deterministic investment advice based on macroeconomic conditions.

## 1. Data Ingestion Hierarchy
- **Real Data First**: Macroeconomic data must be verifiably sourced and written to the database with provenance before it can be used in the platform.
- **No Hallucinations**: We never use mock values, hardcoded demo data, or AI-generated estimates for economic indicators in production contexts.
- **Phase 148A**: Defined `db_backed` versus `planned` or `source_assessment_needed` indicators to prevent hallucinating data for newly added macro indicators.
- **Phase 148B**: Locked provider expansion to the 14 indicators currently in the Macro frontend. Added strict stale data policy.
- **Phase 148C**: Verified sources for frontend indicators, strictly enforcing `machine_readable_api` and `providerFetchEligible` to avoid dangerous scraping or unverified manual parses. Assistant explicitly knows which metrics need manual review vs which are candidate/DB-backed.
- **Phase 148D**: Developed a parser strategy indicating which sources have `api_ready` vs `manual_review_only` feasibility. The Assistant is strictly instructed that *parser strategy/feasibility is not data*, preventing it from hallucinating numbers just because a parser is planned.
- **Phase 148E**: Executed parser dry-runs on real sources. Confirmed that candidate preview data generated from these dry-runs does not pollute the DB and the Assistant handles blocked fetches (due to missing/unstable sources) gracefully without inventing data.

### Strict Data Provenance and Guardrails
- **No Fake Data Rule**: Absolutely no fallback, mock, or hardcoded macro values may be used or passed to the LLM. 
- **Missing Data Fallback**: If `observationDate` or `value` is missing, the Assistant must respond that the system does not yet have data for that indicator.
- **Source Assessment Guardrail**: If an indicator is `html_table_manual_review` or `blocked`, the Assistant knows the data is intentionally withheld pending manual review or data vendor integration.

## 2. Macro-to-Industry Mapping Boundaries
- Any mapping between a macroeconomic indicator (e.g., Interest Rate) and an industry (e.g., Real Estate) is considered an **educational rule**, not a market truth.
- **Prohibited**: The system must NOT map indicators to industries in a way that suggests guaranteed outcomes (e.g., "Interest rates are down, therefore Real Estate will go up").
- **Allowed**: The system MAY map indicators to industries for the purpose of highlighting theoretical relationships (e.g., "Interest rates often affect the cost of borrowing, which is a key driver for the Real Estate sector").
- Mapping logic must be transparent, hardcoded as educational content or explicitly defined by human editors, rather than generated dynamically by AI based on current data.

## 3. Assistant Prompt Wording Guardrails
The Assistant's system prompt must enforce the following wording constraints when discussing macro data:

### Required Phrasing
When answering user questions regarding the macro environment, the Assistant MUST use non-deterministic, educational language:
- "Theo dữ liệu hệ thống..." (According to the system data...)
- "Yếu tố vĩ mô này có thể liên quan đến..." (This macroeconomic factor may relate to...)
- "Cần kiểm tra thêm dữ liệu ngành và doanh nghiệp..." (Further checking of industry and company data is required...)

### Prohibited Phrasing and Concepts
The Assistant is strictly FORBIDDEN from generating:
- Absolute conclusions: "Lãi suất giảm nên ngành X chắc chắn hưởng lợi." (Interest rates dropped so Industry X will definitely benefit.)
- Investment recommendations: "Ngành Y đáng chú ý." (Industry Y is worth paying attention to / buying.)
- Stock picks: "Cổ phiếu Z hấp dẫn." (Stock Z is attractive.)
- Trading signals, buy/sell/hold ratings, or target prices derived from macro data.
- Any wording that replaces the user's decision-making process.

## 4. Enforcement
These boundaries are enforced through:
1. **Schema Separation**: Keeping structured `MacroObservation` data separate from the qualitative `MacroContext`.
2. **Prompt Engineering**: Hardcoding the required and prohibited phrasing directly into the Assistant's system instructions.
3. **Readiness Gates**: Blocking production deployment of any macro module that fails to implement these guardrails.
