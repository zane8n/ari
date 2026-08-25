import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { provisionTestInvite } from "./support/provision";

test.describe("accessibility (axe)", () => {
  test("arrival has no automatically-detectable violations", async ({ page }) => {
    const { token } = await provisionTestInvite();
    await page.goto(`/for/${token}`);
    await expect(page.getByRole("button", { name: "Let's go!" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the theme selection carousel has no automatically-detectable violations", async ({ page }) => {
    const { token } = await provisionTestInvite();
    await page.goto(`/for/${token}`);
    await page.getByRole("button", { name: "Let's go!" }).click();
    await page.getByLabel(/what should I call you/i).fill("Ada");
    await page.getByRole("button", { name: "That's me" }).click();
    await expect(page.getByText("Poppy Kiss", { exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
