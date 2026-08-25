import { describe, expect, it } from "vitest";
import { experienceCopy } from "@/content/experience-copy";

/**
 * Locks the exact "preserve wording" strings from the developer guideline.
 * If one of these fails, someone paraphrased approved copy — fix the copy,
 * not the test.
 */
describe("approved copy — exact wording", () => {
  it("arrival", () => {
    expect(experienceCopy.arrival.title).toBe("Welcome to the side of the internet that's dedicated to you.");
    expect(experienceCopy.arrival.body).toBe("Before this little place becomes yours, let it meet you properly.");
    expect(experienceCopy.arrival.action).toBe("Let it meet me");
  });

  it("set the mood", () => {
    expect(experienceCopy.setTheMood.namePrompt).toBe("What should I call you here?");
    expect(experienceCopy.setTheMood.themePrompt).toBe("Which colour feels most like you today?");
  });

  it("prologue letter, in order", () => {
    expect(experienceCopy.prologue.letter).toEqual([
      "I could have simply sent you another birthday message, but you deserve more than words that eventually disappear into a chat.",
      "You have become such a beautiful part of my life—not because everything between us has always been effortless, but because what we have is honest, alive and worth choosing. There is a softness in the way you care, a certainty in the way you love, and a presence that stays with me even across the distance.",
      "So I made you this small world: partly to make you smile, partly to remind you how deeply you are loved, and partly because I have a question waiting for you at the end.",
      "Happy birthday, my love.",
      "Now come and cause some trouble.",
    ]);
  });

  it("the birthday wish trap", () => {
    expect(experienceCopy.wish.question).toBe("What do you actually want for your birthday?");
    expect(experienceCopy.wish.options.money).toBe("Lots of money");
    expect(experienceCopy.wish.options.vacation).toBe("A vacation");
    expect(experienceCopy.wish.options["love-letter"]).toBe("A suspiciously long love letter");
    expect(experienceCopy.wish.options["peace-and-sleep"]).toBe("Peace, sleep and absolutely no responsibilities");
  });

  it("vacation confirmation", () => {
    expect(experienceCopy.wishConfirm.title).toBe("Are you reaaally sure?");
    expect(experienceCopy.wishConfirm.confirm).toBe("Yes, take me away");
    expect(experienceCopy.wishConfirm.cancel).toBe("Let me inspect the nonsense again");
  });

  it("the sincere question", () => {
    expect(experienceCopy.mustNotMiss.prompt).toBe("One thing I must not get wrong…");
    expect(experienceCopy.mustNotMiss.surpriseOption).toBe("Nothing specific. Surprise me.");
  });

  it("signing copy", () => {
    expect(experienceCopy.signature.body).toBe(
      "Once you sign, your choices become part of the official birthday proposal. There will be no edits, no appeals and no pretending this was somehow entirely my idea.",
    );
  });

  it("reveal eyebrow", () => {
    expect(experienceCopy.reveal.eyebrow).toBe("Application suspiciously approved.");
  });
});
