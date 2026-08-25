import { expect, test } from "@playwright/test";
import { provisionTestInvite } from "./support/provision";

test.describe("full recipient journey", () => {
  test("arrival through sealed reveal, including the money joke, a two-stroke signature, a failed seal retry, and saving the image", async ({
    page,
  }) => {
    // This is deliberately the most thorough single test in the suite — it
    // walks the entire journey plus two regression checks (multi-stroke
    // signature, seal-retry) — so it needs real headroom over the 30s
    // default, especially under parallel worker CPU contention.
    test.slow();
    const { token } = await provisionTestInvite();

    await page.goto(`/for/${token}`);
    await expect(page.getByRole("heading", { name: /You found your gift/ })).toBeVisible();
    await page.getByRole("button", { name: "Let's go!" }).click();

    await page.getByLabel(/what should I call you/i).fill("Playwright Tester");
    await page.getByRole("button", { name: "That's me" }).click();

    await page.getByText("Sky Flirt", { exact: true }).click();
    await page.getByRole("button", { name: "This is so me" }).click();

    const turnPage = page.getByRole("button", { name: "Turn the page" });
    await turnPage.waitFor({ state: "visible" });
    await turnPage.click();

    // Exercise the money joke through all three evasion attempts.
    const moneyTile = page.getByRole("button", { name: /Lots of money/ });
    await moneyTile.click();
    await moneyTile.click();
    await moneyTile.click();
    await expect(page.getByText(/finance department is also your boyfriend/)).toBeVisible();

    await page.getByRole("button", { name: "A vacation" }).click();
    // Regression check: this dialog once rendered fully below the visible
    // viewport on a real iPhone (a bottom-anchored `position: fixed` sheet
    // fighting Safari's dynamic toolbar) — assert its confirm button is
    // actually within the viewport bounds, not merely CSS-"visible".
    const confirmVacation = page.getByRole("button", { name: "Yes — whisk me away" });
    await expect(confirmVacation).toBeVisible();
    const viewport = page.viewportSize();
    const confirmBox = await confirmVacation.boundingBox();
    if (!viewport || !confirmBox) throw new Error("could not measure the vacation-confirm dialog");
    expect(confirmBox.y).toBeGreaterThanOrEqual(0);
    expect(confirmBox.y + confirmBox.height).toBeLessThanOrEqual(viewport.height);
    await confirmVacation.click();

    await page.getByText("Slow mornings with no alarms").click();
    await page.getByRole("button", { name: "Shall we proceed?" }).click();

    await page.getByText("No plan—just questionable decisions made beautifully").click();
    await page.getByRole("button", { name: "Pack it up" }).click();

    await page.getByRole("checkbox", { name: "Nothing specific. Surprise me." }).check();
    await page.getByRole("button", { name: "Onward, my love" }).click();

    await expect(page.getByText("Your very official answers")).toBeVisible();
    await page.getByRole("button", { name: "Yes, this is all embarrassingly true" }).click();

    await expect(page.getByRole("heading", { name: "The Official Birthday Lover Agreement" })).toBeVisible();
    // Page through the agreement "in bits" until the acknowledgement appears.
    for (let i = 0; i < 6; i += 1) {
      const nextPage = page.getByRole("button", { name: "Keep reading" });
      if (!(await nextPage.isVisible().catch(() => false))) break;
      await nextPage.click();
    }
    await page.getByText("I have read every ridiculous clause above").click();
    await page.getByRole("button", { name: "Sign it and make it official" }).click();

    await expect(page.getByRole("heading", { name: "Seal it with a kiss" })).toBeVisible();
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("signature canvas did not render");

    // First stroke.
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2 - 30, { steps: 8 });
    await page.mouse.up();
    // Second stroke: a brief lift-and-retouch with zero movement (dotting an
    // "i", a quick flourish) — this used to land a stroke group with a
    // single point, which the payload schema rejects (groups need 2+
    // points), silently failing the whole seal on submit. Multi-pass
    // signing is the normal case, so this is the real regression to guard.
    await page.mouse.move(box.x + 30, box.y + box.height / 2 + 20);
    await page.mouse.down();
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

    await page.getByRole("button", { name: "Seal it with a kiss" }).click();
    await expect(page.getByText("Nothing has been lost.")).toBeVisible();
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByText("Application... shockingly... approved.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Playwright Tester, I would love nothing more than to whisk you away")).toBeVisible();
    await expect(page.getByText("Isaac")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Save my invitation" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^birthday-invitation-.*\.png$/);
  });
});
