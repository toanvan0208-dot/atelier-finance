# Survey Demo Mode

## Purpose

Survey Demo Mode provides a controlled public path for Survey Form 2 respondents to view representative Atelier Finance workflows without creating an account or entering personal data.

Atelier Finance remains a real product-oriented capstone project. This mode is not a separate fake prototype; it is a limited route inside the existing product.

## Why It Exists

Survey Form 2 is a short post-experience evaluation. Respondents need one link, clear instructions, and a small set of modules to inspect. The goal is to measure initial user perception after viewing representative functions, not long-term full-system usage.

Survey Demo Mode is designed to support a short post-experience survey. It represents the core user flow through selected representative modules, but it does not replace a long-term usability test or a full production evaluation of all modules.

## Scope

The public entry route is:

```text
/survey-demo
```

The guided flow links into existing workspace modules with `survey=1`:

```text
/workspace?module=overview&survey=1
/workspace?module=financials&survey=1
/workspace?module=risk&survey=1
/workspace?module=checklist&survey=1
```

When `survey=1` is present, the workspace shows a persistent Survey Demo Mode banner with a link back to `/survey-demo`. A survey form link can be enabled with `NEXT_PUBLIC_SURVEY_FORM_URL`.

## Included Modules

- Overview: orientation and workspace framing.
- Financial Statements: financial statement interpretation, ratios, and data quality context.
- Risk and Transparency: risk factors, missing information, and transparency cues.
- Checklist and Reasoning Check: assumptions, evidence gaps, and reasoning quality.

## Modules Not Required

The survey flow intentionally does not require every product module. Macro, industry, screening, business, valuation, technical, simulation, watchlist, learning, and route configuration remain available in the product but are not required for Survey Form 2.

The AI assistant panel is optional. Respondents may observe its explanation style and safety behavior if it is stable in the current environment, but it is not a required survey step.

## Data Limitations

Displayed data may be demo, seed, or sample data. It is used only to evaluate product experience and should not be interpreted as verified real-time investment data.

Respondents should not be asked to search for their own ticker, upload files, provide account details, or enter personal financial information.

## AI Limitations

If the AI provider is not configured, the demo should still render. AI behavior must remain explanation-oriented and must not provide investment decisions for the user.

AI output should mention uncertainty or missing context where appropriate and should rely only on the available product context.

## Safety Rules

- The demo is not investment advice.
- The demo must not provide trading or holding instructions.
- The demo must not request securities account details.
- The demo must not request bank account details.
- The demo must not request phone number, OTP, or personal financial data.
- The demo should be read-only for respondents.
- The demo should prefer stable demo, seed, or sample data.
- The demo must label limitations clearly.

## Authentication And Writes

The `/survey-demo` route is public. The linked workspace modules already render without a login gate in the current app.

Survey Demo Mode should not introduce database writes from respondents. It should not persist watchlist changes, simulated trades, personal data, or survey interactions unless a future change explicitly designs a safe anonymous flow.

## Local Run

Install dependencies if needed:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/survey-demo
```

Then open one of the guided module links and verify that the Survey Demo Mode banner appears.

## Deployment Verification

After deployment, verify:

- `/survey-demo` renders.
- Guided links include `survey=1`.
- `/workspace?module=overview&survey=1` shows the survey banner.
- The banner links back to `/survey-demo`.
- No login, account, OTP, or personal financial data is required for the guided path.
- If `NEXT_PUBLIC_SURVEY_FORM_URL` is configured, the survey form link appears.

## Interpreting Survey Results

Survey Form 2 results should be interpreted as feedback on initial comprehension, perceived usefulness, trust, safety, and clarity after viewing selected representative modules. They should not be treated as evidence of full production readiness, long-term retention, or complete system usability across every module.
