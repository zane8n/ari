import { expect, test } from "@playwright/test";
import { provisionTestInvite } from "./support/provision";

// `reducedMotion` is a genuine, supported BrowserContext option at runtime;
// this installed @playwright/test version just doesn't surface it in
// PlaywrightTestOptions, so the literal needs a narrow cast to match.
test.use({ reducedMotion: "reduce" } as Parameters<typeof test.use>[0]);

test("the experience stays fully usable with prefers-reduced-motion: reduce", async ({ page }) => {
  const { token } = await provisionTestInvite();

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`/for/${token}`);
  await page.getByRole("button", { name: "Let it meet me" }).click();

  await page.getByLabel("What should I call you here?").fill("Reduced Motion");
  await page.getByRole("button", { name: "Continue" }).click();

  // The colour wash becomes a crossfade under reduced motion, but the token
  // switch and the confirm action must still work exactly the same way.
  await page.getByText("Midnight Blue", { exact: true }).click();
  const confirmTheme = page.getByRole("button", { name: "Keep this one" });
  await expect(confirmTheme).toBeEnabled({ timeout: 3000 });
  await confirmTheme.click();

  const continueButton = page.getByRole("button", { name: "Continue" });
  await continueButton.waitFor({ state: "visible" });
  await continueButton.click();

  await expect(page.getByRole("heading", { name: /What do you actually want/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
