import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { provisionTestInvite } from "./support/provision";

test.describe("accessibility (axe)", () => {
  test("arrival has no automatically-detectable violations", async ({ page }) => {
    const { token } = await provisionTestInvite();
    await page.goto(`/for/${token}`);
    await expect(page.getByRole("button", { name: "Let it meet me" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the theme selection grid has no automatically-detectable violations", async ({ page }) => {
    const { token } = await provisionTestInvite();
    await page.goto(`/for/${token}`);
    await page.getByRole("button", { name: "Let it meet me" }).click();
    await page.getByLabel("What should I call you here?").fill("Ada");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Emerald", { exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
