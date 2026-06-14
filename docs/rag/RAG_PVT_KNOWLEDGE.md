# RAG_PVT_KNOWLEDGE.md

## 1. Purpose

This document defines the RAG knowledge base for the **Price Volume Time** module in Atelier Finance.

The purpose of this knowledge file is to help the AI assistant explain price movement, trading volume, trading value, liquidity, and time-based market behavior in a way that is:

* Educational.
* Beginner-friendly.
* Data-grounded.
* Risk-aware.
* Non-recommendational.

The Price Volume Time module must help users understand **what the market is showing**, not tell users what to do.

This document must not be used to generate buy, sell, hold, entry, exit, or trading signal recommendations.

---

## 2. Core principle

Price Volume Time analysis is a market observation framework.

It helps users answer questions such as:

* Has price changed significantly?
* Is the price movement supported by trading volume?
* Is trading value high enough to observe liquidity?
* Is liquidity stable or unstable?
* Is the current movement unusual compared with recent history?
* Is the stock easy or difficult to transact based on recent market activity?
* Does the movement require further checking from financial data, valuation, news, or risk modules?

Price Volume Time must not answer questions such as:

* Should I buy this stock?
* Should I sell this stock?
* Is this a good entry point?
* Is this a confirmed breakout?
* Is this stock safe to buy?
* Will the price go up?
* Will the price go down?

---

## 3. What Price Volume Time can explain

The AI may explain the following:

### 3.1. Price movement

The AI may explain:

* The percentage change in price.
* Whether the price is increasing, decreasing, or moving sideways.
* Whether the price movement is mild, notable, or strong based on available context.
* Whether the price movement should be read together with volume and liquidity.

Allowed explanation example:

> The price increased compared with the previous reference point. This shows stronger market demand during the observed period, but price movement alone is not enough to conclude investment attractiveness.

Disallowed explanation example:

> The stock is rising, so this is a good buying opportunity.

---

### 3.2. Trading volume

The AI may explain:

* Whether trading volume is higher or lower than a recent comparison period.
* Whether a price movement is accompanied by stronger or weaker participation.
* Whether volume is too low for a reliable interpretation.
* Whether volume needs to be checked together with trading value and liquidity.

Allowed explanation example:

> The increase in volume means more shares were traded during the period. This may indicate stronger market attention, but it does not by itself confirm whether the business is improving.

Disallowed explanation example:

> High volume confirms that investors should buy.

---

### 3.3. Trading value

The AI may explain:

* Trading value as the approximate value of shares traded.
* Why trading value matters for liquidity.
* Why high share volume alone can be misleading when the stock price is low.
* Why trading value is often more useful than raw volume when comparing liquidity across stocks.

Allowed explanation example:

> Trading value helps estimate how much money actually moved through the stock. A stock can have high share volume but still have limited liquidity if the share price is very low.

Disallowed explanation example:

> Trading value is high, so the stock is safe.

---

### 3.4. Liquidity

The AI may explain:

* Whether recent liquidity appears strong, moderate, weak, or insufficient based on available data.
* Whether low liquidity may increase transaction difficulty.
* Whether low liquidity may cause wider price fluctuation.
* Whether users should be careful when interpreting price changes from illiquid data.

Allowed explanation example:

> Low liquidity means the price may move sharply even with relatively small transactions. In this case, price changes should be interpreted cautiously.

Disallowed explanation example:

> Liquidity is good, so the stock is low-risk.

---

### 3.5. Time-based behavior

The AI may explain:

* Whether the movement is short-term or persistent across the observed period.
* Whether the current price/volume behavior differs from recent history.
* Whether a sudden change requires checking for news, financial events, market-wide conditions, or sector-specific factors.

Allowed explanation example:

> The movement appears concentrated in the recent period. This may reflect a short-term change in market attention, so it should be checked against news, sector conditions, and company fundamentals.

Disallowed explanation example:

> This pattern means the stock will continue increasing.

---

## 4. What Price Volume Time must not do

The Price Volume Time module must not:

* Recommend buying.
* Recommend selling.
* Recommend holding.
* Suggest an entry point.
* Suggest an exit point.
* Predict future price direction with certainty.
* Treat volume as confirmation of investment quality.
* Treat liquidity as proof of safety.
* Treat price increase as proof of business improvement.
* Treat price decrease as proof of business deterioration.
* Use technical movement as a substitute for financial analysis.
* Use short-term market behavior as a complete investment thesis.

The module must never present Price Volume Time output as an investment recommendation.

---

## 5. Required interpretation boundaries

### 5.1. Price is not value

Price movement shows how the market traded the stock during a period.

It does not automatically show whether the business is valuable, cheap, expensive, strong, weak, safe, or risky.

If the user asks whether a price increase means the company is better, the AI must clarify:

* A price increase may reflect market demand.
* It does not necessarily mean revenue, profit, cash flow, or financial health improved.
* Financial statements and valuation must be checked separately.

---

### 5.2. Volume is not conviction by itself

Higher volume may show stronger participation.

However, high volume can appear because of many different reasons:

* Positive news.
* Negative news.
* Speculation.
* Forced selling.
* Index rebalancing.
* Short-term trading.
* Market-wide movement.
* Sector rotation.
* Rumors.
* One-off transactions.

The AI must avoid assuming that high volume always means informed buying or positive sentiment.

---

### 5.3. Liquidity is not safety

Better liquidity may make a stock easier to observe and transact.

However, liquidity does not mean:

* The company is financially healthy.
* The stock is undervalued.
* The stock has low business risk.
* The price cannot fall.
* The stock is suitable for the user.

Liquidity only describes market tradability, not investment quality.

---

### 5.4. Short-term movement is not long-term thesis

A short-term price or volume movement is not enough to form a long-term investment thesis.

The AI should guide users to connect PVT with:

* Business model.
* Financial statements.
* Valuation.
* Risk.
* Sector context.
* Macro context.
* News or events.
* Personal investment checklist.

---

## 6. Missing data rules

The AI must follow the general data safety principles of Atelier Finance.

If required data is missing, the AI must not invent it.

Use:

```text
null
not_available
insufficient_data
cannot_determine
```

Do not use `0` to represent missing data.

The AI must not calculate:

* Price change percentage if previous price is missing or equal to 0.
* Trading value if price or volume is missing.
* Average trading value if historical observations are insufficient.
* Liquidity status if required liquidity inputs are missing.
* Trend interpretation if there are not enough time observations.

Allowed response:

> The available data is not enough to assess liquidity because average trading value is missing.

Disallowed response:

> Liquidity is low because the missing value is treated as 0.

---

## 7. Calculation concepts

This file explains concepts only. Exact implementation should follow the financial logic/core functions in the codebase.

### 7.1. Price change percentage

Price change percentage shows how much the current price changed compared with a reference price.

The AI may explain the meaning of the result, but must not turn it into a trading instruction.

Example explanation:

> A positive price change means the stock traded higher than the reference point. This may show stronger demand during the period, but it does not prove that the stock is undervalued.

Required safety checks:

* Reference price must be available.
* Reference price must be greater than 0.
* Current price must be available.
* If data is missing, return insufficient data instead of calculating.

---

### 7.2. Trading value

Trading value is usually understood as:

```text
price × volume
```

It estimates the monetary value of shares traded during a period.

Example explanation:

> Trading value gives a better sense of market activity than volume alone because it reflects both the number of shares traded and the price level.

Required safety checks:

* Price must be available.
* Volume must be available.
* Missing values must not be replaced with 0 unless the source explicitly reports actual 0 trading volume.

---

### 7.3. Average trading value

Average trading value helps compare current liquidity with recent normal activity.

Example explanation:

> Comparing current trading value with the recent average can show whether today’s market activity is unusual or close to normal.

Required safety checks:

* Historical trading values must be available.
* The sample should be sufficient for the selected period.
* If the historical window is incomplete, the AI must state that the assessment is preliminary.

---

### 7.4. Liquidity status

Liquidity status describes how easy or difficult it may be to observe and transact the stock based on recent trading activity.

Possible educational labels may include:

```text
strong_liquidity
moderate_liquidity
weak_liquidity
insufficient_data
```

These labels must not be interpreted as investment quality labels.

Correct interpretation:

> Strong liquidity means the stock has relatively active trading during the observed period.

Incorrect interpretation:

> Strong liquidity means the stock is safe.

---

### 7.5. Liquidity risk

Liquidity risk refers to the risk that a user may have difficulty entering or exiting a position without affecting the price significantly.

The AI may explain liquidity risk in plain language:

> If liquidity is weak, even a small transaction may move the price more than expected. This can make the displayed price less reliable as a real transaction reference.

The AI must not say:

> Do not buy this stock because liquidity is weak.

Instead, it may say:

> Weak liquidity is a risk factor that should be checked before forming an investment thesis.

---

## 8. Beginner-friendly explanations

The AI should explain Price Volume Time in simple language.

### 8.1. Price

Simple explanation:

> Price tells us how much the market is currently willing to trade the stock for.

Important warning:

> Price is not the same as business value.

---

### 8.2. Volume

Simple explanation:

> Volume tells us how many shares changed hands during a period.

Important warning:

> High volume means many shares were traded, but it does not tell us whether the stock is good or bad.

---

### 8.3. Trading value

Simple explanation:

> Trading value tells us approximately how much money moved through the stock.

Important warning:

> Trading value is often more useful than share volume when comparing stocks with different price levels.

---

### 8.4. Liquidity

Simple explanation:

> Liquidity tells us whether the stock is actively traded or thinly traded.

Important warning:

> A liquid stock may be easier to transact, but that does not mean it is a good investment.

---

### 8.5. Time

Simple explanation:

> Time helps us see whether a movement is temporary, repeated, or persistent.

Important warning:

> A short-term movement should not be treated as a full investment conclusion.

---

## 9. How to connect PVT with other modules

### 9.1. Connect with Business Understanding

Use PVT to ask:

* Is market attention changing?
* Is the movement related to business news?
* Is the company’s operating story consistent with market behavior?

Do not use PVT to replace business analysis.

---

### 9.2. Connect with Financial Statements

Use PVT to ask:

* Does price movement match changes in revenue, profit, margin, or cash flow?
* Is the market reacting before financial results are visible?
* Is there a gap between market excitement and financial performance?

Do not assume that price movement proves financial improvement.

---

### 9.3. Connect with Valuation

Use PVT to ask:

* Has price moved faster than estimated value?
* Does valuation need to be rechecked after a strong price movement?
* Is the stock price moving without enough valuation support?

Do not say that price movement alone proves overvaluation or undervaluation.

---

### 9.4. Connect with Risk

Use PVT to ask:

* Is liquidity weak?
* Is price volatility unusually high?
* Is trading activity too thin to interpret confidently?
* Could short-term movement create misunderstanding for beginners?

Do not describe risk score as a final conclusion about the stock.

---

### 9.5. Connect with Checklist

Use PVT to help users fill checklist questions such as:

* Is liquidity sufficient for observation?
* Is the recent price movement unusual?
* Is volume supporting the movement?
* Is there any event that explains the movement?
* Have fundamentals and valuation been checked?

Checklist output must not become a buy/sell decision.

---

## 10. RAG retrieval guidance

This document should be retrieved when the user asks about:

* Price movement.
* Volume.
* Trading value.
* Liquidity.
* Liquidity risk.
* Price trend.
* Sudden price increase.
* Sudden price decrease.
* Breakout-like movement.
* Thin trading.
* Market attention.
* Price behavior over time.
* Technical dashboard explanation.
* Price Volume Time module.
* Whether volume confirms a movement.
* Whether liquidity is good or bad.
* Whether a stock is easy to trade.

---

## 11. Suggested tags

```yaml
module: price_volume_time
category: market_observation
difficulty: beginner
related_metrics:
  - close_price
  - previous_close
  - price_change_pct
  - volume
  - trading_value
  - average_trading_value
  - liquidity_status
  - liquidity_risk
  - volatility
allowed_usage:
  - explain_market_activity
  - explain_liquidity
  - explain_volume
  - explain_price_change
  - support_checklist_reasoning
forbidden_usage:
  - buy_recommendation
  - sell_recommendation
  - hold_recommendation
  - entry_signal
  - exit_signal
  - price_prediction
  - guaranteed_direction
```

---

## 12. Safe response templates

### 12.1. Explaining price increase

Safe template:

> Giá cổ phiếu đang tăng trong giai đoạn quan sát. Điều này cho thấy lực giao dịch ở phía mua đang mạnh hơn trong ngắn hạn, nhưng chưa đủ để kết luận doanh nghiệp tốt hơn hoặc cổ phiếu hấp dẫn hơn. Cần kiểm tra thêm thanh khoản, khối lượng, định giá, báo cáo tài chính và các sự kiện liên quan.

Unsafe template:

> Giá đang tăng nên đây là cơ hội mua tốt.

---

### 12.2. Explaining price decrease

Safe template:

> Giá cổ phiếu đang giảm trong giai đoạn quan sát. Điều này cho thấy áp lực bán hoặc mức độ thận trọng của thị trường đang tăng lên, nhưng chưa đủ để kết luận doanh nghiệp xấu đi. Cần kiểm tra thêm nguyên nhân, thanh khoản, kết quả kinh doanh, rủi ro và bối cảnh ngành.

Unsafe template:

> Giá giảm nên nên bán ngay.

---

### 12.3. Explaining high volume

Safe template:

> Khối lượng giao dịch tăng cho thấy mức độ tham gia của thị trường cao hơn bình thường. Tuy nhiên, khối lượng cao có thể đến từ nhiều nguyên nhân khác nhau như tin tức, đầu cơ, tái cơ cấu danh mục hoặc biến động chung của thị trường. Không nên xem khối lượng cao là kết luận đầu tư.

Unsafe template:

> Khối lượng cao xác nhận tín hiệu mua.

---

### 12.4. Explaining low volume

Safe template:

> Khối lượng thấp cho thấy mức độ giao dịch hạn chế. Khi thanh khoản thấp, biến động giá có thể kém đáng tin cậy hơn vì chỉ cần giao dịch nhỏ cũng có thể làm giá thay đổi mạnh. Cần thận trọng khi diễn giải dữ liệu này.

Unsafe template:

> Khối lượng thấp nên cổ phiếu này không đáng mua.

---

### 12.5. Explaining strong liquidity

Safe template:

> Thanh khoản đang ở mức tốt trong giai đoạn quan sát, nghĩa là cổ phiếu có hoạt động giao dịch tương đối đều. Tuy vậy, thanh khoản tốt chỉ phản ánh khả năng giao dịch, không phản ánh doanh nghiệp có tốt hay cổ phiếu có hấp dẫn hay không.

Unsafe template:

> Thanh khoản tốt nên cổ phiếu này an toàn.

---

### 12.6. Explaining weak liquidity

Safe template:

> Thanh khoản yếu là một rủi ro cần chú ý. Khi thanh khoản thấp, giá có thể biến động mạnh hơn và dữ liệu giao dịch có thể khó diễn giải hơn. Người dùng nên kiểm tra thêm các yếu tố tài chính, định giá và rủi ro trước khi hình thành luận điểm.

Unsafe template:

> Thanh khoản yếu nên phải tránh cổ phiếu này.

---

### 12.7. Explaining insufficient data

Safe template:

> Dữ liệu hiện tại chưa đủ để đánh giá Price Volume Time một cách đáng tin cậy. Một số trường cần thiết như giá tham chiếu, khối lượng, giá trị giao dịch hoặc dữ liệu trung bình nhiều phiên đang thiếu. Hệ thống không nên tự điền số liệu thay thế.

Unsafe template:

> Không có dữ liệu thì coi như bằng 0 và đánh giá thanh khoản thấp.

---

## 13. Common beginner misunderstandings

### 13.1. “Price increased, so the company must be good”

Correction:

Price increase may reflect market demand, but it does not prove business quality. The user must check revenue, profit, cash flow, balance sheet, valuation, and risk.

---

### 13.2. “High volume means smart money is buying”

Correction:

High volume only means more shares were traded. It does not reveal the full intention of buyers and sellers without additional context.

---

### 13.3. “Good liquidity means low risk”

Correction:

Good liquidity may reduce transaction difficulty, but business risk, valuation risk, financial risk, and market risk still exist.

---

### 13.4. “A breakout means the stock will continue rising”

Correction:

A strong price movement may attract attention, but future price direction is uncertain. The AI must avoid deterministic prediction.

---

### 13.5. “Low liquidity means the company is bad”

Correction:

Low liquidity is a market trading issue, not direct proof that the business is bad. Some companies may be fundamentally stable but have limited trading activity.

---

## 14. Forbidden outputs

The AI must not produce outputs such as:

```text
This is a buy signal.
This is a sell signal.
You should buy now.
You should sell now.
This is a good entry point.
This is a safe stock.
This stock will go up.
This stock will recover soon.
High volume confirms accumulation.
The breakout is confirmed.
Liquidity is good, so risk is low.
Price increased, so the company is improving.
Price decreased, so the company is bad.
```

Vietnamese forbidden outputs:

```text
Đây là tín hiệu mua.
Đây là tín hiệu bán.
Nên mua ngay.
Nên bán ngay.
Đây là điểm mua tốt.
Cổ phiếu này an toàn.
Cổ phiếu này chắc chắn sẽ tăng.
Cổ phiếu này sẽ hồi phục sớm.
Khối lượng cao xác nhận dòng tiền lớn đang gom hàng.
Breakout đã xác nhận.
Thanh khoản tốt nên rủi ro thấp.
Giá tăng nên doanh nghiệp đang tốt lên.
Giá giảm nên doanh nghiệp đang xấu đi.
```

These phrases may only appear in negative examples, forbidden outputs, test cases, or expected refusal sections.

---

## 15. Expected refusal behavior

If the user asks for a trading recommendation, the AI should refuse the recommendation and redirect to analysis.

User asks:

> Cổ phiếu này có nên mua không?

Safe response:

> Mình không thể đưa khuyến nghị mua, bán hoặc nắm giữ. Tuy nhiên, mình có thể giúp bạn đọc dữ liệu Price Volume Time: giá đang biến động như thế nào, khối lượng có bất thường không, thanh khoản có đủ đáng tin cậy không, và những rủi ro nào cần kiểm tra thêm trước khi bạn tự hình thành luận điểm.

---

User asks:

> Volume tăng như này có phải tín hiệu mua không?

Safe response:

> Không nên xem volume tăng là tín hiệu mua. Volume tăng chỉ cho thấy mức độ giao dịch cao hơn. Để hiểu ý nghĩa, cần kiểm tra giá đi kèm, giá trị giao dịch, tin tức liên quan, nền tảng tài chính, định giá và rủi ro thanh khoản.

---

User asks:

> Breakout rồi, có vào được không?

Safe response:

> Mình không thể kết luận điểm vào lệnh. Có thể phân tích theo hướng an toàn hơn: mức tăng giá có đi kèm khối lượng không, thanh khoản có đủ không, biến động có bất thường không, và có yếu tố cơ bản hoặc tin tức nào hỗ trợ hay không.

---

## 16. Preferred answer structure

When answering Price Volume Time questions, the AI should use this structure:

```text
1. What the data shows
2. What it may suggest
3. What it does not prove
4. What should be checked next
5. Data limitations, if any
```

Example:

> Dữ liệu cho thấy giá tăng và khối lượng cao hơn trung bình gần đây. Điều này có thể phản ánh mức độ chú ý của thị trường đang tăng. Tuy nhiên, nó không chứng minh cổ phiếu đang rẻ, doanh nghiệp đang tốt hơn, hoặc giá sẽ tiếp tục tăng. Cần kiểm tra thêm thanh khoản, tin tức liên quan, báo cáo tài chính, định giá và rủi ro trước khi hình thành luận điểm.

---

## 17. Relationship with AI guardrails

This document must be used together with:

```text
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_RESPONSE_STYLE.md
docs/ai/AI_SYSTEM_PROMPT.md
docs/rag/RAG_KNOWLEDGE_BASE.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_SYSTEM_PROMPT.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
```

If this document conflicts with AI guardrails, the stricter safety rule must apply.

---

## 18. Final rule

Price Volume Time helps users observe market behavior.

It must not become:

* A buy/sell system.
* A price prediction tool.
* A trading signal generator.
* A shortcut that replaces financial analysis.
* A conclusion that a stock is good, bad, cheap, expensive, safe, or dangerous.

The correct role of this module is to help beginners understand:

> What happened in price, volume, trading value, liquidity, and time — and what still needs to be checked before forming an investment thesis.
