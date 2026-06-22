# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> module navigation >> entry page shows account actions and both enter the system
- Location: tests\e2e\navigation.spec.ts:30:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Hỗ trợ đầu tư').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Hỗ trợ đầu tư').first()

```

```yaml
- main:
  - text: AF
  - paragraph: Atelier Finance
  - paragraph: Cửa vào hệ thống phân tích
  - paragraph: Dành cho người mới học phân tích cổ phiếu
  - heading "Phân tích cổ phiếu theo quy trình, không theo cảm tính." [level=1]
  - paragraph: Atelier Finance giúp người mới đi từng bước từ vĩ mô, ngành, doanh nghiệp, báo cáo tài chính, định giá đến rủi ro trước khi mô phỏng quyết định đầu tư.
  - article:
    - heading "Có lộ trình rõ ràng" [level=2]
    - paragraph: Biết mình đang ở bước nào và cần phân tích gì tiếp theo.
  - article:
    - heading "Dữ liệu được giải thích dễ hiểu" [level=2]
    - paragraph: Không chỉ hiển thị số liệu, mà còn giúp người dùng hiểu ý nghĩa.
  - article:
    - heading "Không khuyến nghị mua bán" [level=2]
    - paragraph: Hệ thống hỗ trợ tư duy phân tích, không thay bạn ra quyết định.
  - paragraph: Lộ trình phân tích rút gọn
  - text: 1. Vĩ mô 2. Ngành 3. Lọc cổ phiếu 4. Doanh nghiệp 5. Tài chính 6. Định giá 7. Rủi ro 8. Mô phỏng
  - complementary:
    - paragraph: Đăng nhập
    - heading "Đăng nhập vào không gian phân tích" [level=2]
    - paragraph: Tiếp tục lộ trình của bạn hoặc dùng bản demo để khám phá hệ thống.
    - text: Email
    - textbox "Email":
      - /placeholder: you@example.com
    - text: Mật khẩu
    - textbox "Mật khẩu":
      - /placeholder: ••••••••
    - link "Đăng nhập":
      - /url: /workspace
    - link "Dùng bản demo":
      - /url: /workspace
    - paragraph: Chưa có tài khoản? Tạo hồ sơ học đầu tư
    - strong: "Lưu ý:"
    - text: Hệ thống không đưa ra khuyến nghị mua, bán hoặc nắm giữ cổ phiếu. Nội dung chỉ phục vụ học tập, phân tích và tham khảo.
- alert
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | const moduleKeys = [
  4   |   "overview",
  5   |   "learning",
  6   |   "macro",
  7   |   "industry",
  8   |   "screening",
  9   |   "business",
  10  |   "financials",
  11  |   "valuation",
  12  |   "risk",
  13  |   "technical",
  14  |   "checklist",
  15  |   "simulation",
  16  |   "watchlist",
  17  | ] as const;
  18  | 
  19  | const workspacePath = "/workspace";
  20  | 
  21  | async function expectActiveModule(page: import("@playwright/test").Page, moduleKey: string) {
  22  |   await expect(page.getByTestId("app-shell")).toHaveAttribute("data-active-module", moduleKey);
  23  | }
  24  | 
  25  | function moduleLink(page: import("@playwright/test").Page, testId: string, moduleKey: string) {
  26  |   return page.locator(`[data-testid="${testId}"][data-module-key="${moduleKey}"]`);
  27  | }
  28  | 
  29  | test.describe("module navigation", () => {
  30  |   test("entry page shows account actions and both enter the system", async ({ page }) => {
  31  |     await page.goto("/");
  32  | 
> 33  |     await expect(page.getByText("Hỗ trợ đầu tư").first()).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  34  |     await expect(page.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", workspacePath);
  35  |     await expect(page.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", workspacePath);
  36  |     await expect(page.getByText("Demo", { exact: true })).toHaveCount(0);
  37  | 
  38  |     await page.getByRole("link", { name: "Đăng nhập" }).click();
  39  |     await expect(page).toHaveURL(new RegExp(`${workspacePath}$`));
  40  |     await expectActiveModule(page, "overview");
  41  |   });
  42  | 
  43  |   test("clicking every desktop sidebar item renders the matching module and URL query", async ({ page }) => {
  44  |     await page.goto(workspacePath);
  45  |     await expectActiveModule(page, "overview");
  46  | 
  47  |     for (const moduleKey of moduleKeys) {
  48  |       await moduleLink(page, "sidebar-module-link", moduleKey).click();
  49  | 
  50  |       await expectActiveModule(page, moduleKey);
  51  |       await expect(page).toHaveURL(new RegExp(`[?&]module=${moduleKey}(?:&|$)`));
  52  |       await expect(
  53  |         moduleLink(page, "sidebar-module-link", moduleKey)
  54  |       ).toHaveAttribute("aria-current", "page");
  55  |     }
  56  |   });
  57  | 
  58  |   test("refresh keeps the module from the URL query", async ({ page }) => {
  59  |     await page.goto(`${workspacePath}?module=valuation`);
  60  |     await expectActiveModule(page, "valuation");
  61  | 
  62  |     await page.reload();
  63  |     await expectActiveModule(page, "valuation");
  64  |     await expect(page).toHaveURL(/module=valuation/);
  65  |   });
  66  | 
  67  |   test("invalid module query falls back to overview", async ({ page }) => {
  68  |     await page.goto(`${workspacePath}?module=not-a-real-module`);
  69  |     await expectActiveModule(page, "overview");
  70  |   });
  71  | 
  72  |   test("browser back and forward restore active module", async ({ page }) => {
  73  |     await page.goto(workspacePath);
  74  | 
  75  |     await moduleLink(page, "sidebar-module-link", "macro").click();
  76  |     await expectActiveModule(page, "macro");
  77  | 
  78  |     await moduleLink(page, "sidebar-module-link", "industry").click();
  79  |     await expectActiveModule(page, "industry");
  80  | 
  81  |     await page.goBack();
  82  |     await expectActiveModule(page, "macro");
  83  |     await expect(page).toHaveURL(/module=macro/);
  84  | 
  85  |     await page.goForward();
  86  |     await expectActiveModule(page, "industry");
  87  |     await expect(page).toHaveURL(/module=industry/);
  88  |   });
  89  | 
  90  |   test("mobile navigation changes active module and URL", async ({ page }) => {
  91  |     await page.setViewportSize({ width: 390, height: 844 });
  92  |     await page.goto(workspacePath);
  93  | 
  94  |     await moduleLink(page, "mobile-module-link", "watchlist").click();
  95  |     await expectActiveModule(page, "watchlist");
  96  |     await expect(page).toHaveURL(/module=watchlist/);
  97  |   });
  98  | 
  99  |   test("important cross-module CTAs navigate to the expected module", async ({ page }) => {
  100 |     await page.goto(`${workspacePath}?module=valuation`);
  101 |     await expectActiveModule(page, "valuation");
  102 | 
  103 |     await moduleLink(page, "module-cta", "risk").first().click();
  104 |     await expectActiveModule(page, "risk");
  105 |     await expect(page).toHaveURL(/module=risk/);
  106 | 
  107 |     await page.goto(`${workspacePath}?module=valuation`);
  108 |     await moduleLink(page, "module-cta", "technical").first().click();
  109 |     await expectActiveModule(page, "technical");
  110 |     await expect(page).toHaveURL(/module=technical/);
  111 | 
  112 |     await moduleLink(page, "module-cta", "watchlist").first().click();
  113 |     await expectActiveModule(page, "watchlist");
  114 |     await expect(page).toHaveURL(/module=watchlist/);
  115 |   });
  116 | });
  117 | 
```