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
  await page.getByRole("button", { name: "Let's go!" }).click();

  await page.getByLabel(/what should I call you/i).fill("Reduced Motion");
  await page.getByRole("button", { name: "That's me" }).click();

  // The colour wash becomes a crossfade under reduced motion, but the token
  // switch and the confirm action must still work exactly the same way.
  await page.getByText("Violet Hour", { exact: true }).click();
  const confirmTheme = page.getByRole("button", { name: "This is so me" });
  await expect(confirmTheme).toBeEnabled({ timeout: 3000 });
  await confirmTheme.click();

  const continueButton = page.getByRole("button", { name: "Turn the page" });
  await continueButton.waitFor({ state: "visible" });
  await continueButton.click();

  await expect(page.getByRole("heading", { name: /what do you actually want/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
