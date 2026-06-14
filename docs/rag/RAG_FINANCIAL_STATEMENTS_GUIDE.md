# RAG_FINANCIAL_STATEMENTS_GUIDE.md

## 1. Purpose

This document defines the RAG knowledge guide for reading financial statements in Atelier Finance.

The purpose of this file is to help the AI assistant explain how to read:

* Income Statement.
* Balance Sheet.
* Cash Flow Statement.
* The relationship between revenue, profit, assets, liabilities, equity, and cash flow.
* Common warning signs in financial statements.
* Data limitations and interpretation boundaries.

This guide is designed for:

* Beginners.
* Students.
* Individual investors with limited financial knowledge.

This document must help users understand financial statement data, not produce buy, sell, or hold recommendations.

---

## 2. Core principle

Financial statements should be read as a connected system.

The AI must not explain one number in isolation.

A good financial statement explanation should connect:

```text
Business activity → Revenue → Profit → Cash flow → Assets → Liabilities → Equity → Risk
```

The AI should help users answer:

* Is the company growing?
* Is growth turning into profit?
* Is profit turning into real cash flow?
* Is the company using too much debt to grow?
* Are assets being used efficiently?
* Are receivables, inventory, or debt increasing unusually?
* Are margins improving or weakening?
* Are there signs that profit quality is weak?
* Is the financial picture consistent across all three statements?

The AI must not answer:

* Should the user buy the stock?
* Should the user sell the stock?
* Is the stock definitely cheap?
* Is the stock definitely safe?
* Will the stock price increase?

---

## 3. Relationship with other RAG documents

This guide should be used together with:

```text
docs/rag/RAG_FINANCIAL_TERMS.md
docs/rag/RAG_VALUATION_KNOWLEDGE.md
docs/rag/RAG_RISK_KNOWLEDGE.md
docs/rag/RAG_CHECKLIST_KNOWLEDGE.md
docs/rag/RAG_KNOWLEDGE_BASE.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_SYSTEM_PROMPT.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_RESPONSE_STYLE.md
docs/ai/AI_SYSTEM_PROMPT.md
```

If this document conflicts with AI guardrails, the stricter safety rule must apply.

---

## 4. What this guide can explain

The AI may explain:

* How to read each financial statement.
* How to connect financial statements.
* Why revenue growth does not always mean better business quality.
* Why positive profit does not always mean strong cash flow.
* Why cash flow from operations matters.
* Why rising debt needs context.
* Why inventory and receivables need attention.
* Why margins can change.
* Why equity can become negative.
* Why some ratios should not be used mechanically for banks, securities companies, and insurance companies.
* Why missing data should not be filled with 0.
* Why negative EPS, negative equity, or negative cash flow require careful interpretation.

The AI must explain uncertainty clearly when data is incomplete.

---

## 5. What this guide must not do

The AI must not:

* Recommend buying.
* Recommend selling.
* Recommend holding.
* Say a stock is safe.
* Say a stock is guaranteed to be good or bad.
* Say a company is financially healthy based on one ratio only.
* Say revenue growth alone proves business quality.
* Say profit growth alone proves cash flow quality.
* Say low P/E means the stock is cheap when EPS is negative or unreliable.
* Say high ROE is good when equity is extremely low or negative.
* Treat missing data as 0.
* Divide by 0.
* Invent missing revenue, profit, cash flow, equity, EPS, or debt values.
* Apply industrial-company ratios mechanically to banks, securities companies, or insurance companies.

---

## 6. Financial statement reading flow

The preferred reading flow is:

```text
1. Read revenue trend.
2. Read gross profit and margins.
3. Read operating profit and net profit.
4. Compare profit with operating cash flow.
5. Check asset structure.
6. Check receivables and inventory.
7. Check debt and liabilities.
8. Check equity.
9. Check cash flow statement.
10. Identify consistency or contradiction across statements.
11. Summarize risks and data limitations.
```

The AI should not jump directly from one number to a final conclusion.

---

## 7. Income Statement Guide

## 7.1. What the income statement shows

The income statement shows how the company generated revenue and profit during a period.

It usually helps answer:

* How much revenue did the company generate?
* How much gross profit remained after direct costs?
* How much operating profit remained after operating expenses?
* How much net profit belonged to shareholders?
* Are margins improving or weakening?
* Is profit growth coming from core business or one-off factors?

Simple explanation:

> The income statement tells us whether the company is selling more, controlling costs well, and turning revenue into profit.

---

## 7.2. Revenue

Revenue shows the amount of money generated from selling goods or services.

The AI may explain:

* Revenue growth.
* Revenue decline.
* Stable revenue.
* Revenue volatility.
* Revenue trend over time.

Important interpretation:

Revenue growth is usually positive at the surface level, but it is not enough by itself.

Revenue should be checked with:

* Gross profit.
* Gross margin.
* Operating profit.
* Net profit.
* Cash flow from operations.
* Receivables.
* Inventory.
* Sector context.

Safe explanation:

> Revenue increased, which means the company sold more goods or services during the period. However, we still need to check whether this growth created better profit and real cash flow.

Unsafe explanation:

> Revenue increased, so the company is definitely improving.

---

## 7.3. Cost of goods sold and gross profit

Cost of goods sold represents the direct cost of producing or purchasing the goods and services sold.

Gross profit shows what remains after direct costs.

The AI may explain:

* Gross profit growth.
* Gross profit decline.
* Gross margin expansion.
* Gross margin compression.
* Whether revenue growth is accompanied by better or worse gross profit quality.

Safe explanation:

> Revenue increased, but gross margin decreased. This may mean the company sold more but had weaker pricing power, higher input costs, higher discounts, or a less profitable product mix.

Unsafe explanation:

> Revenue increased, so profit quality is good.

---

## 7.4. Gross margin

Gross margin shows how much gross profit the company keeps from each unit of revenue.

It helps users understand:

* Pricing power.
* Cost control.
* Input cost pressure.
* Product mix.
* Competitive pressure.

Gross margin should be compared:

* Over time.
* Against the company’s own history.
* Against sector peers if peer data is available.
* Together with business model characteristics.

Safe explanation:

> Gross margin decreased, so the company kept less gross profit from each unit of revenue. This should be checked against input costs, discounts, product mix, and competitive pressure.

Unsafe explanation:

> Gross margin decreased, so the company is bad.

---

## 7.5. Operating expenses

Operating expenses may include:

* Selling expenses.
* General and administrative expenses.
* Research and development expenses.
* Other operating costs depending on the reporting format.

The AI may explain whether operating expenses are:

* Growing faster than revenue.
* Growing slower than revenue.
* Stable relative to revenue.
* Creating pressure on operating profit.

Safe explanation:

> Operating expenses grew faster than revenue. This may reduce operating leverage and pressure operating profit if the trend continues.

Unsafe explanation:

> Expenses increased, so the company is not worth analyzing.

---

## 7.6. Operating profit

Operating profit shows profit from core business operations before financial income, financial expenses, and taxes, depending on the accounting format.

The AI may explain:

* Whether operating profit is growing.
* Whether operating profit is declining.
* Whether operating margin is improving.
* Whether the company’s core business is generating profit.

Safe explanation:

> Operating profit improved, which may suggest better core business performance. However, it still needs to be compared with operating cash flow to check profit quality.

Unsafe explanation:

> Operating profit increased, so the stock is attractive.

---

## 7.7. Financial expenses

Financial expenses often include interest expenses and other finance-related costs.

The AI may explain:

* Whether financial expenses are increasing.
* Whether interest costs may pressure profit.
* Whether debt should be checked in the balance sheet.
* Whether finance costs are large compared with operating profit.

Safe explanation:

> Financial expenses increased, so debt and interest burden should be checked in the balance sheet and cash flow statement.

Unsafe explanation:

> Financial expenses increased, so the company will fail.

---

## 7.8. Net profit

Net profit is the profit remaining after all expenses, financial items, taxes, and other items.

The AI may explain:

* Net profit growth.
* Net profit decline.
* Net margin.
* Whether net profit is consistent with operating profit.
* Whether profit may be affected by one-off gains or losses.

Safe explanation:

> Net profit increased, but the AI should check whether the improvement comes from core operations or one-off items.

Unsafe explanation:

> Net profit increased, so the stock is cheap.

---

## 7.9. EPS

EPS represents earnings per share.

The AI must follow strict rules:

* If EPS is missing, return `not_available`.
* If EPS is 0, do not calculate or interpret P/E normally.
* If EPS is negative, P/E must not be interpreted as cheap.
* EPS should not be used alone to conclude investment quality.

Safe explanation:

> EPS is negative, so P/E should not be interpreted as a normal cheapness indicator. The company may be loss-making, and valuation requires another approach or more context.

Unsafe explanation:

> EPS is negative, but P/E is low, so the stock is cheap.

---

## 8. Balance Sheet Guide

## 8.1. What the balance sheet shows

The balance sheet shows what the company owns and how those assets are financed at a specific point in time.

It usually includes:

```text
Assets = Liabilities + Equity
```

Simple explanation:

> The balance sheet tells us what the company owns, what it owes, and how much capital belongs to shareholders.

---

## 8.2. Assets

Assets are resources controlled by the company.

The AI may explain:

* Total assets.
* Current assets.
* Non-current assets.
* Asset growth.
* Asset structure.
* Whether asset growth is supported by equity, debt, or working capital expansion.

Safe explanation:

> Total assets increased. The next step is to check whether the increase came from cash, receivables, inventory, fixed assets, or other assets.

Unsafe explanation:

> Total assets increased, so the company is stronger.

---

## 8.3. Cash and cash equivalents

Cash is important because it supports liquidity, operations, and debt payment.

The AI may explain:

* Whether cash increased or decreased.
* Whether cash is large or small relative to debt.
* Whether cash movement is consistent with cash flow.
* Whether high cash needs context.

Safe explanation:

> Cash increased, but the source of the increase should be checked. It may come from operating cash flow, borrowing, asset sales, or capital raising.

Unsafe explanation:

> Cash increased, so the company is safe.

---

## 8.4. Accounts receivable

Accounts receivable represents money customers owe the company.

The AI may explain:

* Receivables growth.
* Receivables growing faster than revenue.
* Possible collection risk.
* Possible aggressive revenue recognition.
* Working capital pressure.

Safe explanation:

> Receivables increased faster than revenue. This may indicate that the company is selling more on credit or collecting money more slowly, so cash flow from operations should be checked.

Unsafe explanation:

> Receivables increased, so the company is manipulating results.

---

## 8.5. Inventory

Inventory represents goods held for sale or production.

The AI may explain:

* Inventory growth.
* Inventory growing faster than revenue.
* Possible slow-moving goods.
* Possible demand slowdown.
* Possible preparation for future sales.
* Sector-specific interpretation.

Safe explanation:

> Inventory increased faster than revenue. This may be a warning sign if products are slow-moving, but it may also reflect preparation for future demand. It should be checked with revenue trend, gross margin, and sector context.

Unsafe explanation:

> Inventory increased, so the business is bad.

---

## 8.6. Fixed assets

Fixed assets are long-term assets used in operations.

The AI may explain:

* Capacity expansion.
* Capital intensity.
* Depreciation pressure.
* Whether fixed asset growth is consistent with revenue growth.
* Whether capex appears to support future growth.

Safe explanation:

> Fixed assets increased, which may indicate expansion or investment in capacity. The AI should check whether future revenue and cash flow support this investment.

Unsafe explanation:

> Fixed assets increased, so future growth is guaranteed.

---

## 8.7. Liabilities

Liabilities are obligations the company must pay.

The AI may explain:

* Total liabilities.
* Short-term liabilities.
* Long-term liabilities.
* Debt structure.
* Whether liabilities are increasing faster than assets or equity.
* Whether debt creates pressure on cash flow.

Safe explanation:

> Liabilities increased. The AI should check whether the increase came from operating payables, borrowings, or other obligations.

Unsafe explanation:

> Liabilities increased, so the company is definitely risky.

---

## 8.8. Debt

Debt should be interpreted carefully.

The AI may explain:

* Short-term debt.
* Long-term debt.
* Total borrowings.
* Interest burden.
* Debt maturity pressure.
* Whether operating cash flow can support debt.
* Whether debt is being used for expansion or survival.

Safe explanation:

> Debt increased, so the AI should check whether operating cash flow and profit are strong enough to support interest and principal payments.

Unsafe explanation:

> Debt increased, so the company is bad.

---

## 8.9. Equity

Equity represents the residual value belonging to shareholders after liabilities.

The AI must follow strict rules:

* If equity is missing, return `not_available`.
* If equity is 0 or negative, ROE and P/B must not be interpreted normally.
* Negative equity may indicate accumulated losses or high leverage, but the AI must check context.

Safe explanation:

> Equity is negative, so ROE and P/B should not be interpreted in the normal way. This may indicate financial stress or accumulated losses, but more context is needed.

Unsafe explanation:

> Negative equity means the stock is automatically worthless.

---

## 9. Cash Flow Statement Guide

## 9.1. What the cash flow statement shows

The cash flow statement shows how cash moved in and out of the company.

It is usually divided into:

```text
Operating cash flow
Investing cash flow
Financing cash flow
```

Simple explanation:

> The cash flow statement helps check whether accounting profit is turning into real cash.

---

## 9.2. Operating cash flow

Operating cash flow shows cash generated or used by core business operations.

The AI may explain:

* Positive operating cash flow.
* Negative operating cash flow.
* Operating cash flow compared with net profit.
* Whether profit quality appears strong or weak.
* Whether working capital is consuming cash.

Safe explanation:

> Net profit is positive but operating cash flow is negative. This means the company reported accounting profit, but cash did not flow in from core operations during the period. The AI should check receivables, inventory, payables, and one-off accounting items.

Unsafe explanation:

> Profit is positive, so cash flow does not matter.

---

## 9.3. Investing cash flow

Investing cash flow usually reflects:

* Capital expenditure.
* Purchase or sale of fixed assets.
* Investments in subsidiaries or financial assets.
* Proceeds from asset sales.

The AI may explain:

* Negative investing cash flow as possible expansion.
* Positive investing cash flow as possible asset sales.
* Whether investment activity is consistent with business growth.

Safe explanation:

> Negative investing cash flow may indicate the company is investing in assets or expansion. This is not automatically bad, but future revenue, profit, and cash flow should be checked.

Unsafe explanation:

> Investing cash flow is negative, so the company is losing money.

---

## 9.4. Financing cash flow

Financing cash flow usually reflects:

* Borrowing.
* Debt repayment.
* Equity issuance.
* Dividends.
* Share buybacks.

The AI may explain:

* Whether the company is raising debt.
* Whether the company is repaying debt.
* Whether dividends are supported by operating cash flow.
* Whether financing cash flow is covering weak operating cash flow.

Safe explanation:

> Financing cash flow is positive while operating cash flow is negative. This may mean the company relied on external financing during the period, so debt and liquidity should be checked.

Unsafe explanation:

> Financing cash flow is positive, so the company is healthy.

---

## 9.5. Free cash flow

Free cash flow is often understood as cash remaining after capital expenditure.

The AI must be careful because definitions may vary.

If exact capex data is missing, the AI should not invent free cash flow.

Safe explanation:

> Free cash flow cannot be calculated reliably because capital expenditure data is not available in the provided context.

Unsafe explanation:

> If capex is missing, assume capex is 0 and calculate free cash flow.

---

## 10. Connecting the three financial statements

## 10.1. Revenue and receivables

If revenue increases but receivables increase faster, the AI should explain:

> The company may be selling more on credit or collecting cash more slowly. This does not automatically mean a problem, but it requires checking operating cash flow and receivable quality.

Possible interpretations:

* Sales growth with delayed collection.
* More credit sales.
* Customer payment delays.
* Aggressive revenue recognition risk.
* Normal industry practice depending on sector.

The AI must not accuse fraud without evidence.

---

## 10.2. Revenue and inventory

If revenue grows slower than inventory, the AI should explain:

> Inventory is building up faster than sales. This may indicate preparation for future demand, but it may also suggest slow-moving goods or demand weakness.

Possible interpretations:

* Stockpiling for expected sales.
* Seasonal preparation.
* Supply chain strategy.
* Slower-than-expected demand.
* Product obsolescence risk.
* Margin pressure if discounting is needed.

---

## 10.3. Profit and operating cash flow

If net profit is positive but operating cash flow is negative, the AI should explain:

> Accounting profit and cash generation are not moving together. This may indicate working capital pressure, delayed collection, inventory buildup, or non-cash profit items.

This is one of the most important beginner lessons.

The AI should guide the user to check:

* Receivables.
* Inventory.
* Payables.
* Depreciation.
* Provisions.
* One-off gains.
* Cash conversion.

---

## 10.4. Debt and cash flow

If debt increases while operating cash flow is weak, the AI should explain:

> The company may be relying more on borrowing while core operations are not generating enough cash. This can increase financial pressure, especially when interest rates are high or debt maturity is short.

The AI should check:

* Interest expense.
* Short-term debt.
* Long-term debt.
* Cash balance.
* Operating cash flow.
* Financing cash flow.
* Debt maturity if available.

---

## 10.5. Profit and equity

If profit is positive but equity remains weak or negative, the AI should explain:

> Positive profit in one period may not be enough to repair accumulated losses or a weak equity base. Equity should be checked over multiple periods.

The AI must not interpret ROE normally when equity is negative or close to 0.

---

## 10.6. Asset growth and funding source

If assets increase, the AI should ask:

* Did assets increase because of cash?
* Did receivables increase?
* Did inventory increase?
* Did fixed assets increase?
* Was the increase funded by debt?
* Was it funded by equity?
* Was it funded by retained earnings?

Safe explanation:

> Asset growth should be linked to its funding source. Growth funded mostly by debt may create more financial pressure than growth funded by retained earnings or operating cash flow.

---

## 11. Common financial statement patterns

## 11.1. Good surface growth but weak cash flow

Pattern:

```text
Revenue ↑
Net profit ↑
Operating cash flow ↓ or negative
Receivables ↑
Inventory ↑
```

Interpretation:

> The company appears to be growing, but cash conversion may be weak. The AI should check working capital and profit quality.

Do not conclude fraud unless evidence is present.

---

## 11.2. Revenue growth but margin compression

Pattern:

```text
Revenue ↑
Gross margin ↓
Operating margin ↓
Net margin ↓
```

Interpretation:

> The company sold more but kept less profit from each unit of revenue. Possible reasons include higher input costs, discounts, competition, unfavorable product mix, or operating expense pressure.

---

## 11.3. Profit increase from non-core factors

Pattern:

```text
Operating profit flat or down
Net profit up
Other income up
Financial income up
One-off gain present
```

Interpretation:

> Net profit increased, but the improvement may not come from core business operations. The AI should separate recurring and non-recurring profit drivers where data allows.

---

## 11.4. Debt-funded expansion

Pattern:

```text
Fixed assets ↑
Debt ↑
Interest expense ↑
Operating cash flow not yet improved
```

Interpretation:

> The company may be investing for expansion using borrowed capital. This can be reasonable if future cash flow improves, but it increases financial risk if earnings do not follow.

---

## 11.5. Weak balance sheet pressure

Pattern:

```text
Debt ↑
Cash ↓
Equity ↓
Operating cash flow weak
Interest expense ↑
```

Interpretation:

> The company may face financial pressure. The AI should explain the risk clearly but avoid deterministic conclusions.

---

## 11.6. High profit but weak equity base

Pattern:

```text
Net profit positive
Equity very low or negative
ROE extremely high, meaningless, or distorted
```

Interpretation:

> ROE may be distorted because the equity base is too small or negative. The AI should not interpret high ROE as strong profitability without checking equity quality.

---

## 12. Sector-specific caution

## 12.1. Banks

For banks, the AI must not mechanically use industrial-company ratios such as:

```text
Current Ratio
Debt/Equity
Inventory Turnover
Operating Cash Flow interpretation in the same way as non-financial companies
```

Bank analysis usually requires different metrics such as:

* Net interest income.
* Net interest margin.
* Loan growth.
* Deposit growth.
* Non-performing loan ratio.
* Provision coverage.
* Capital adequacy.
* Credit cost.
* CASA ratio if available.

If these metrics are not available, the AI must state the limitation.

Safe explanation:

> This company appears to be a bank, so current ratio and debt/equity should not be interpreted like a normal industrial company. Bank analysis requires banking-specific indicators.

---

## 12.2. Securities companies

For securities companies, the AI should be careful with:

* Leverage.
* Margin lending.
* Proprietary trading gains or losses.
* Brokerage revenue.
* Market cycle sensitivity.
* Financial asset revaluation.

Safe explanation:

> Securities companies are highly sensitive to market conditions. Profit may fluctuate because of brokerage activity, margin lending, and proprietary investment results.

---

## 12.3. Insurance companies

For insurance companies, the AI should be careful with:

* Premium revenue.
* Claim expenses.
* Insurance reserves.
* Investment income.
* Solvency.
* Combined ratio if available.

Safe explanation:

> Insurance companies require sector-specific analysis. Normal industrial ratios may not fully reflect underwriting risk, reserve adequacy, or investment portfolio risk.

---

## 12.4. Real estate companies

For real estate companies, the AI should pay attention to:

* Inventory.
* Advances from customers.
* Debt.
* Interest capitalization.
* Project legal status if available.
* Cash flow from operations.
* Revenue recognition timing.

Safe explanation:

> For real estate companies, profit can depend heavily on project handover timing. Inventory, debt, customer advances, and operating cash flow should be checked carefully.

---

## 12.5. Retail companies

For retail companies, the AI should pay attention to:

* Revenue growth.
* Gross margin.
* Same-store sales if available.
* Inventory turnover.
* Store expansion.
* Selling expenses.
* Operating cash flow.

Safe explanation:

> For retail companies, inventory and gross margin are important because weak demand may lead to discounting and margin pressure.

---

## 12.6. Manufacturing companies

For manufacturing companies, the AI should pay attention to:

* Revenue.
* Gross margin.
* Input costs.
* Inventory.
* Fixed assets.
* Depreciation.
* Capacity utilization if available.
* Operating cash flow.

Safe explanation:

> For manufacturing companies, margin pressure may come from raw material costs, energy costs, labor costs, or lower capacity utilization.

---

## 13. Missing data rules

The AI must follow these rules:

```text
Missing data must be returned as null / not_available / insufficient_data.
Missing data must not be replaced with 0.
Do not divide by 0.
Do not calculate ratios when denominator is missing, 0, or invalid.
Do not infer unavailable values from unrelated fields.
Do not invent financial data from general knowledge.
Do not create fake fair value, fake EPS, fake revenue, fake profit, or fake cash flow.
```

Examples:

Safe:

> Current liabilities are missing, so current ratio cannot be calculated reliably.

Unsafe:

> Current liabilities are missing, so assume current liabilities are 0.

Safe:

> EPS is negative, so P/E cannot be interpreted as a normal cheapness indicator.

Unsafe:

> EPS is negative, but the stock is still cheap based on P/E.

Safe:

> Equity is negative, so ROE and P/B are not meaningful under normal interpretation.

Unsafe:

> Negative equity makes ROE very high, so profitability is strong.

---

## 14. Ratio interpretation boundaries

## 14.1. Revenue growth

Revenue growth may indicate expansion, but it does not prove:

* Better profitability.
* Better cash flow.
* Better financial health.
* Better valuation.
* Lower risk.

Required checks:

* Gross margin.
* Operating margin.
* Net margin.
* Operating cash flow.
* Receivables.
* Inventory.
* Sector condition.

---

## 14.2. Gross margin

Gross margin may indicate pricing power or cost control, but it does not prove overall financial health.

Required checks:

* Operating expenses.
* Net margin.
* Revenue trend.
* Sector context.
* Product mix.
* Input costs.

---

## 14.3. Net margin

Net margin shows how much net profit remains from revenue, but it may be affected by:

* Financial expenses.
* Tax.
* One-off gains.
* One-off losses.
* Accounting policy.
* Non-core income.

The AI should avoid interpreting net margin without checking operating profit and cash flow.

---

## 14.4. ROE

ROE should be interpreted carefully.

Do not interpret ROE normally when:

* Equity is missing.
* Equity is 0.
* Equity is negative.
* Equity is extremely small.
* Net profit is distorted by one-off gains.

Safe explanation:

> ROE is high, but equity is very small, so the ratio may be distorted and should not be read as strong profitability without further checks.

---

## 14.5. ROA

ROA shows profit relative to assets.

It should be checked with:

* Asset structure.
* Sector characteristics.
* Asset-heavy or asset-light business model.
* Net profit quality.
* Cash flow.

---

## 14.6. Debt/Equity

Debt/Equity is useful for many non-financial companies but must not be used mechanically for banks, securities companies, and insurance companies.

Do not calculate or interpret normally when:

* Equity is missing.
* Equity is 0.
* Equity is negative.
* Company is in a financial sector where the ratio is not meaningful in the same way.

---

## 14.7. Current Ratio

Current Ratio can help assess short-term liquidity for many non-financial companies.

Do not use mechanically for:

* Banks.
* Securities companies.
* Insurance companies.

Also check:

* Inventory quality.
* Receivables quality.
* Cash balance.
* Short-term debt.
* Payables.

A high current ratio is not always good if current assets are mostly slow-moving inventory or hard-to-collect receivables.

---

## 14.8. P/E

P/E must not be interpreted normally when:

* EPS is missing.
* EPS is 0.
* EPS is negative.
* Earnings are distorted by one-off gains.
* The company is cyclical and earnings are at a temporary peak or trough.

Safe explanation:

> P/E is not meaningful because EPS is negative. A negative earnings base means the ratio cannot be used as a normal cheapness signal.

---

## 14.9. P/B

P/B must not be interpreted normally when:

* Equity is missing.
* Equity is 0.
* Equity is negative.
* Book value is distorted.
* Asset quality is uncertain.
* The company is asset-light and book value is not the main driver.

Safe explanation:

> P/B cannot be interpreted normally because equity is negative or unavailable.

---

## 15. Beginner-friendly reading checklist

When explaining financial statements to beginners, the AI should guide them through these questions:

```text
1. Is revenue increasing, decreasing, or stable?
2. Is gross margin improving or weakening?
3. Is operating profit moving in the same direction as revenue?
4. Is net profit supported by operating profit?
5. Is net profit supported by operating cash flow?
6. Are receivables increasing faster than revenue?
7. Is inventory increasing faster than revenue?
8. Is debt increasing?
9. Is interest expense increasing?
10. Is equity positive and stable?
11. Is cash flow from operations positive?
12. Is the company investing heavily?
13. Is the company relying on borrowing or capital raising?
14. Are any ratios invalid because of missing, zero, or negative denominators?
15. Is the company in a sector that requires special interpretation?
```

The checklist should help users think, not produce a final investment recommendation.

---

## 16. Preferred answer structure

When answering financial statement questions, the AI should use this structure:

```text
1. What the data shows
2. What it may suggest
3. What it does not prove
4. What needs to be checked next
5. Data limitations
```

Example:

> Dữ liệu cho thấy doanh thu tăng nhưng biên lợi nhuận gộp giảm. Điều này có thể cho thấy doanh nghiệp bán được nhiều hơn nhưng giữ lại ít lợi nhuận hơn trên mỗi đồng doanh thu. Tuy nhiên, chưa thể kết luận doanh nghiệp xấu đi nếu chưa kiểm tra nguyên nhân như giá vốn, chiết khấu, cơ cấu sản phẩm, cạnh tranh và chi phí đầu vào. Cần đọc thêm lợi nhuận hoạt động, lợi nhuận sau thuế và dòng tiền từ hoạt động kinh doanh.

---

## 17. Safe response templates

## 17.1. Revenue increased

Safe template:

> Doanh thu tăng cho thấy quy mô bán hàng hoặc cung cấp dịch vụ lớn hơn trong kỳ. Tuy nhiên, doanh thu tăng chưa đủ để kết luận chất lượng kinh doanh tốt hơn. Cần kiểm tra thêm biên lợi nhuận, chi phí, lợi nhuận sau thuế, dòng tiền từ hoạt động kinh doanh, khoản phải thu và hàng tồn kho.

---

## 17.2. Revenue decreased

Safe template:

> Doanh thu giảm cho thấy quy mô bán hàng hoặc cung cấp dịch vụ thấp hơn trong kỳ. Điều này có thể đến từ nhu cầu yếu hơn, giá bán giảm, sản lượng giảm, mất thị phần hoặc yếu tố chu kỳ. Cần kiểm tra thêm biên lợi nhuận, chi phí, dòng tiền và bối cảnh ngành.

---

## 17.3. Profit increased

Safe template:

> Lợi nhuận tăng là tín hiệu cần chú ý, nhưng cần kiểm tra chất lượng lợi nhuận. Nếu lợi nhuận tăng nhờ hoạt động kinh doanh cốt lõi và đi kèm dòng tiền hoạt động tích cực, chất lượng lợi nhuận sẽ đáng tin cậy hơn. Nếu lợi nhuận tăng do yếu tố một lần, cần diễn giải thận trọng.

---

## 17.4. Profit decreased

Safe template:

> Lợi nhuận giảm cho thấy hiệu quả trong kỳ yếu hơn, nhưng cần xác định nguyên nhân. Nguyên nhân có thể đến từ doanh thu giảm, giá vốn tăng, chi phí vận hành tăng, chi phí tài chính tăng hoặc yếu tố một lần. Không nên kết luận ngay nếu chưa đọc đầy đủ ba báo cáo tài chính.

---

## 17.5. Positive profit but negative operating cash flow

Safe template:

> Doanh nghiệp có lợi nhuận dương nhưng dòng tiền từ hoạt động kinh doanh âm. Điều này cho thấy lợi nhuận kế toán chưa chuyển thành tiền thật trong kỳ. Cần kiểm tra khoản phải thu, hàng tồn kho, khoản phải trả, chính sách ghi nhận doanh thu và các khoản mục phi tiền mặt.

---

## 17.6. Debt increased

Safe template:

> Nợ vay tăng cho thấy doanh nghiệp đang sử dụng nhiều nguồn vốn vay hơn. Điều này không tự động xấu, nhưng cần kiểm tra mục đích vay, chi phí lãi vay, kỳ hạn nợ, dòng tiền hoạt động và khả năng trả nợ.

---

## 17.7. Receivables increased faster than revenue

Safe template:

> Khoản phải thu tăng nhanh hơn doanh thu có thể cho thấy doanh nghiệp bán chịu nhiều hơn hoặc thu tiền chậm hơn. Đây là điểm cần kiểm tra vì nó có thể ảnh hưởng đến dòng tiền hoạt động và chất lượng doanh thu.

---

## 17.8. Inventory increased faster than revenue

Safe template:

> Hàng tồn kho tăng nhanh hơn doanh thu có thể phản ánh chuẩn bị cho nhu cầu tương lai, nhưng cũng có thể là dấu hiệu hàng bán chậm hoặc áp lực giảm giá. Cần đọc cùng doanh thu, biên lợi nhuận gộp, dòng tiền và đặc thù ngành.

---

## 17.9. Negative equity

Safe template:

> Vốn chủ sở hữu âm nên ROE và P/B không thể diễn giải theo cách thông thường. Đây có thể là dấu hiệu cần chú ý về cấu trúc tài chính hoặc lỗ lũy kế, nhưng cần kiểm tra thêm nguyên nhân và diễn biến qua nhiều kỳ.

---

## 17.10. Missing data

Safe template:

> Dữ liệu hiện tại chưa đủ để đánh giá chỉ tiêu này. Hệ thống không nên tự điền số liệu còn thiếu hoặc coi dữ liệu thiếu là 0. Cần bổ sung trường dữ liệu liên quan trước khi tính toán hoặc diễn giải.

---

## 18. Forbidden outputs

The AI must not produce outputs such as:

```text
Revenue increased, so the company is definitely good.
Profit increased, so the stock is attractive.
Positive operating cash flow means the stock is safe.
Low debt means the stock has no risk.
High ROE always means strong profitability.
Negative cash flow means the company will fail.
High current ratio means the company is safe.
Low P/E means the stock is cheap even when EPS is negative.
Negative equity still allows normal P/B interpretation.
Missing data can be treated as 0.
```

Vietnamese forbidden outputs:

```text
Doanh thu tăng nên doanh nghiệp chắc chắn tốt.
Lợi nhuận tăng nên cổ phiếu hấp dẫn.
Dòng tiền dương nên cổ phiếu an toàn.
Nợ thấp nên cổ phiếu không có rủi ro.
ROE cao luôn có nghĩa là sinh lời tốt.
Dòng tiền âm nghĩa là doanh nghiệp chắc chắn sẽ thất bại.
Current Ratio cao nghĩa là doanh nghiệp an toàn.
P/E thấp nghĩa là cổ phiếu rẻ dù EPS âm.
Vốn chủ âm vẫn có thể diễn giải P/B bình thường.
Thiếu dữ liệu thì có thể coi là 0.
```

These phrases may only appear in negative examples, forbidden outputs, test cases, or expected refusal sections.

---

## 19. Expected refusal behavior

If the user asks for an investment recommendation based on financial statements, the AI must refuse the recommendation and redirect to analysis.

User asks:

> Báo cáo tài chính như này có nên mua không?

Safe response:

> Mình không thể đưa khuyến nghị mua, bán hoặc nắm giữ. Tuy nhiên, mình có thể giúp bạn đọc báo cáo tài chính theo các điểm chính: doanh thu, biên lợi nhuận, lợi nhuận, dòng tiền từ hoạt động kinh doanh, nợ vay, vốn chủ sở hữu, khoản phải thu, hàng tồn kho và các rủi ro cần kiểm tra thêm.

---

User asks:

> Công ty này lợi nhuận tăng, vậy cổ phiếu có rẻ không?

Safe response:

> Lợi nhuận tăng chưa đủ để kết luận cổ phiếu rẻ. Cần kiểm tra EPS, chất lượng lợi nhuận, dòng tiền, định giá hiện tại, P/E nếu hợp lệ, P/B nếu hợp lệ, triển vọng ngành và rủi ro. Nếu EPS âm hoặc dữ liệu định giá thiếu, không nên diễn giải P/E như một tín hiệu rẻ.

---

User asks:

> ROE cao thế này có phải doanh nghiệp rất tốt không?

Safe response:

> ROE cao là điểm đáng chú ý, nhưng không nên kết luận ngay. Cần kiểm tra vốn chủ sở hữu có dương và ổn định không, lợi nhuận có bền vững không, đòn bẩy tài chính có cao không, và ROE có bị méo do equity quá thấp hoặc yếu tố một lần không.

---

## 20. RAG retrieval guidance

This document should be retrieved when the user asks about:

* Financial statements.
* Income statement.
* Balance sheet.
* Cash flow statement.
* Revenue.
* Gross profit.
* Gross margin.
* Operating profit.
* Net profit.
* EPS.
* Assets.
* Liabilities.
* Equity.
* Debt.
* Receivables.
* Inventory.
* Operating cash flow.
* Investing cash flow.
* Financing cash flow.
* Profit quality.
* Cash conversion.
* Financial health.
* Negative equity.
* Negative cash flow.
* Revenue growth but profit decline.
* Profit positive but cash flow negative.
* Debt increase.
* Margin compression.
* Sector-specific financial interpretation.

---

## 21. Suggested metadata

```yaml
id: rag_financial_statements_guide
title: Financial Statements Reading Guide
module: financial_statements
category: financial_analysis
difficulty: beginner
related_modules:
  - business_understanding
  - valuation
  - risk
  - checklist
  - price_volume_time
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
  - fixed_assets
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
allowed_usage:
  - explain_financial_statements
  - explain_income_statement
  - explain_balance_sheet
  - explain_cash_flow
  - explain_profit_quality
  - explain_financial_health
  - support_checklist_reasoning
  - explain_data_limitations
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - guaranteed_conclusion
  - fake_data_generation
  - treating_missing_data_as_zero
  - normal_ratio_interpretation_with_invalid_denominator
```

---

## 22. Final rule

Financial statements are not isolated tables.

They are a connected story about:

```text
How the company earns money,
how much profit it keeps,
how much cash it actually generates,
what assets it uses,
how much it owes,
and how much financial pressure it carries.
```

The AI must help users understand that story clearly.

It must not convert financial statement analysis into:

* A buy/sell recommendation.
* A price prediction.
* A one-ratio conclusion.
* A fake certainty statement.
* A shortcut that ignores missing data or sector context.

The correct role of this guide is to help beginners read financial statements carefully, connect the three statements, identify risks, and form their own investment thesis.
