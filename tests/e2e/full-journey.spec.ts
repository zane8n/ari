import { expect, test } from "@playwright/test";
import { provisionTestInvite } from "./support/provision";

test.describe("full recipient journey", () => {
  test("arrival through sealed reveal, including the money joke, a failed seal retry, and saving the image", async ({
    page,
  }) => {
    const { token } = await provisionTestInvite();

    await page.goto(`/for/${token}`);
    await expect(page.getByRole("heading", { name: /Welcome to the side of the internet/ })).toBeVisible();
    await page.getByRole("button", { name: "Let it meet me" }).click();

    await page.getByLabel("What should I call you here?").fill("Playwright Tester");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByText("Teal", { exact: true }).click();
    await page.getByRole("button", { name: "Keep this one" }).click();

    const continueButton = page.getByRole("button", { name: "Continue" });
    await continueButton.waitFor({ state: "visible" });
    await continueButton.click();

    // Exercise the money joke through all three evasion attempts.
    const moneyTile = page.getByRole("button", { name: /Lots of money/ });
    await moneyTile.click();
    await moneyTile.click();
    await moneyTile.click();
    await expect(page.getByText(/finance department is also your boyfriend/)).toBeVisible();

    await page.getByRole("button", { name: "A vacation" }).click();
    await page.getByRole("button", { name: "Yes, take me away" }).click();

    await page.getByText("Slow mornings with no alarms").click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByText("No plan—just questionable decisions made beautifully").click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("checkbox", { name: "Nothing specific. Surprise me." }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Your suspiciously official answers")).toBeVisible();
    await page.getByRole("button", { name: "Everything looks suspiciously accurate" }).click();

    await expect(page.getByRole("heading", { name: "The Official Birthday Lover Agreement" })).toBeVisible();
    await page.getByText("I have read every suspicious clause above").click();
    await page.getByRole("button", { name: "Sign it and make this official" }).click();

    await expect(page.getByRole("heading", { name: "Sign and seal it" })).toBeVisible();
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("signature canvas did not render");
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2 - 30, { steps: 8 });
    await page.mouse.up();

    // Force the first seal attempt to fail — the app must show Retry, never a fake reveal.
    let sealAttempts = 0;
    await page.route("**/api/invite/*/seal", async (route) => {
      sealAttempts += 1;
      if (sealAttempts === 1) {
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await page.getByRole("button", { name: "Sign and seal it" }).click();
    await expect(page.getByText("Nothing has been lost.")).toBeVisible();
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByText("Application suspiciously approved.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Playwright Tester, I would officially like to take you away")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Save my invitation" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^birthday-invitation-.*\.png$/);
  });
});
