import { expect, test } from "@playwright/test";

const moduleKeys = [
  "overview",
  "learning",
  "macro",
  "industry",
  "screening",
  "business",
  "financials",
  "valuation",
  "risk",
  "technical",
  "checklist",
  "simulation",
  "watchlist",
] as const;

const workspacePath = "/workspace";

async function expectActiveModule(page: import("@playwright/test").Page, moduleKey: string) {
  await expect(page.getByTestId("app-shell")).toHaveAttribute("data-active-module", moduleKey);
}

function moduleLink(page: import("@playwright/test").Page, testId: string, moduleKey: string) {
  return page.locator(`[data-testid="${testId}"][data-module-key="${moduleKey}"]`);
}

test.describe("module navigation", () => {
  test("entry page shows account actions and both enter the system", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Hỗ trợ đầu tư").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", workspacePath);
    await expect(page.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", workspacePath);
    await expect(page.getByText("Demo", { exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(new RegExp(`${workspacePath}$`));
    await expectActiveModule(page, "overview");
  });

  test("clicking every desktop sidebar item renders the matching module and URL query", async ({ page }) => {
    await page.goto(workspacePath);
    await expectActiveModule(page, "overview");

    for (const moduleKey of moduleKeys) {
      await moduleLink(page, "sidebar-module-link", moduleKey).click();

      await expectActiveModule(page, moduleKey);
      await expect(page).toHaveURL(new RegExp(`[?&]module=${moduleKey}(?:&|$)`));
      await expect(
        moduleLink(page, "sidebar-module-link", moduleKey)
      ).toHaveAttribute("aria-current", "page");
    }
  });

  test("refresh keeps the module from the URL query", async ({ page }) => {
    await page.goto(`${workspacePath}?module=valuation`);
    await expectActiveModule(page, "valuation");

    await page.reload();
    await expectActiveModule(page, "valuation");
    await expect(page).toHaveURL(/module=valuation/);
  });

  test("invalid module query falls back to overview", async ({ page }) => {
    await page.goto(`${workspacePath}?module=not-a-real-module`);
    await expectActiveModule(page, "overview");
  });

  test("browser back and forward restore active module", async ({ page }) => {
    await page.goto(workspacePath);

    await moduleLink(page, "sidebar-module-link", "macro").click();
    await expectActiveModule(page, "macro");

    await moduleLink(page, "sidebar-module-link", "industry").click();
    await expectActiveModule(page, "industry");

    await page.goBack();
    await expectActiveModule(page, "macro");
    await expect(page).toHaveURL(/module=macro/);

    await page.goForward();
    await expectActiveModule(page, "industry");
    await expect(page).toHaveURL(/module=industry/);
  });

  test("mobile navigation changes active module and URL", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(workspacePath);

    await moduleLink(page, "mobile-module-link", "watchlist").click();
    await expectActiveModule(page, "watchlist");
    await expect(page).toHaveURL(/module=watchlist/);
  });

  test("important cross-module CTAs navigate to the expected module", async ({ page }) => {
    await page.goto(`${workspacePath}?module=valuation`);
    await expectActiveModule(page, "valuation");

    await moduleLink(page, "module-cta", "risk").first().click();
    await expectActiveModule(page, "risk");
    await expect(page).toHaveURL(/module=risk/);

    await page.goto(`${workspacePath}?module=valuation`);
    await moduleLink(page, "module-cta", "technical").first().click();
    await expectActiveModule(page, "technical");
    await expect(page).toHaveURL(/module=technical/);

    await moduleLink(page, "module-cta", "watchlist").first().click();
    await expectActiveModule(page, "watchlist");
    await expect(page).toHaveURL(/module=watchlist/);
  });
});
