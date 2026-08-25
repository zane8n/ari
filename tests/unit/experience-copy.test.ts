import { describe, expect, it } from "vitest";
import { experienceCopy } from "@/content/experience-copy";

/**
 * Locks the current approved copy exactly. If one of these fails, someone
 * changed copy — update the assertion deliberately (this content was
 * rewritten after live user testing to be warmer/flirtier), don't just
 * silence the test.
 */
describe("approved copy — exact wording", () => {
  it("arrival", () => {
    expect(experienceCopy.arrival.title).toBe("Hey!! You found your gift.");
    expect(experienceCopy.arrival.action).toBe("Let's go!");
  });

  it("set the mood", () => {
    expect(experienceCopy.setTheMood.namePrompt).toBe("So... what should I call you, my love? 😊");
    expect(experienceCopy.setTheMood.themePrompt).toBe("Okay baby, what color are you feeling today? 🎨");
  });

  it("prologue letter, in order, unchanged from the original", () => {
    expect(experienceCopy.prologue.letter).toEqual([
      "I could have simply sent you another birthday message, but you deserve more than words that eventually disappear into a chat.",
      "You have become such a beautiful part of my life—not because everything between us has always been effortless, but because what we have is honest, alive and worth choosing. There is a softness in the way you care, a certainty in the way you love, and a presence that stays with me even across the distance.",
      "So I made you this small world: partly to make you smile, partly to remind you how deeply you are loved, and partly because I have a question waiting for you at the end.",
      "Happy birthday, my love.",
      "Now come and cause some trouble.",
    ]);
  });

  it("the birthday wish trap", () => {
    expect(experienceCopy.wish.question).toBe("So... what do you actually want for your birthday?");
    expect(experienceCopy.wish.options.money).toBe("Lots of money");
    expect(experienceCopy.wish.options.vacation).toBe("A vacation");
  });

  it("vacation confirmation", () => {
    expect(experienceCopy.wishConfirm.title).toBe("Wait, wait... are you sure sure?");
    expect(experienceCopy.wishConfirm.confirm).toBe("Yes — whisk me away");
  });

  it("the sincere question", () => {
    expect(experienceCopy.mustNotMiss.prompt).toBe("Okay, one thing I really must not get wrong…");
    expect(experienceCopy.mustNotMiss.surpriseOption).toBe("Nothing specific. Surprise me.");
  });

  it("signing copy", () => {
    expect(experienceCopy.signature.body).toBe(
      "Once you sign, your choices become part of the official birthday proposal. There will be no edits, no appeals and no pretending this was somehow entirely my idea.",
    );
    expect(experienceCopy.signature.signAction).toBe("Seal it with a kiss 💋");
  });

  it("reveal eyebrow", () => {
    expect(experienceCopy.reveal.eyebrow).toBe("Application... shockingly... approved.");
  });

  it("does not overuse the word suspicious (feedback: it read as generic/generated)", () => {
    const flatCopy = JSON.stringify(experienceCopy).toLowerCase();
    const occurrences = (flatCopy.match(/suspicious/g) ?? []).length;
    expect(occurrences).toBe(0);
  });
});
