# Macro-to-Industry and Assistant Boundaries

Atelier Finance is an educational platform, not an investment advisory service. As we introduce real macroeconomic data, we must enforce strict guardrails preventing the AI Assistant from generating deterministic investment advice based on macroeconomic conditions.

## 1. Data Ingestion Hierarchy
- **Real Data First**: Macroeconomic data must be verifiably sourced and written to the database with provenance before it can be used in the platform.
- **No Hallucinations**: We never use mock values, hardcoded demo data, or AI-generated estimates for economic indicators in production contexts.

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
