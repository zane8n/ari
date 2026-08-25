/**
 * Approved on-screen copy. Rewritten after live testing to be warmer,
 * flirtier and more playful throughout — buttons and prompts, not the love
 * letter or the agreement's own joke clauses, which keep their original
 * words. Only bracketed tokens (e.g. {{name}}) are runtime-substituted, see
 * lib/content/interpolate.ts for the allowlist.
 */
export const experienceCopy = {
  arrival: {
    title: "Hey!! You found your last gift.",
    body: "Okay fine — you found the secret part of the internet that's a little obsessed with you. Let it meet you properly first.",
    action: "Let's go!",
    ariaLabel: "A private, playful birthday experience made just for you.",
  },
  setTheMood: {
    namePrompt: "So... what should I call you, my love? 😊",
    nameContinueAction: "That's me",
    themePrompt: "Okay baby, what color are you feeling today? 🎨",
    keepThisOne: "This is so me",
  },
  prologue: {
    bridge: ["Much better, {{name}}.", "Now it finally looks like it belongs to you 😌"],
    letter: [
      "I could have simply sent you another birthday message, but you deserve more than words that eventually disappear into a chat.",
      "You have become such a beautiful part of my life—not because everything between us has always been effortless, but because what we have is honest, alive and worth choosing. There is a softness in the way you care, a certainty in the way you love, and a presence that stays with me even across the distance.",
      "So I made you this small world: partly to make you smile, partly to remind you how deeply you are loved, and partly because I have a question waiting for you at the end.",
      "Happy birthday, my love.",
      "Now come and cause some trouble.",
    ],
    continueAction: "Turn the page",
  },
  wish: {
    question: "So... what do you actually want for your birthday?",
    options: {
      money: "Lots of money",
      vacation: "A vacation",
      "love-letter": "An embarrassingly long love letter",
      "peace-and-sleep": "Peace, sleep and absolutely no responsibilities",
    },
  },
  wishConfirm: {
    title: "Wait, wait... are you sure sure?",
    body: "Once you say yes, there's no taking it back — you're about to run off with the person who built you this whole little universe.",
    confirm: "Yes — whisk me away",
    cancel: "Let me look around a little more",
  },
  spoilModes: {
    question: "What does being properly spoiled look like to you, baby?",
    helper: "Pick as many as you like — greed is allowed today.",
    options: {
      "dinner-and-dressing-up": "A beautiful dinner and dressing up",
      "slow-mornings": "Slow mornings with no alarms",
      "little-surprises": "Little surprises throughout the day",
      "comfort-and-disappearing": "Good food, comfort and disappearing from everyone",
    },
    allSelectedAside: "A bold, no-regrets, all-of-the-above answer. I respect it.",
    continueAction: "Shall we proceed?",
  },
  travelPersona: {
    question: "Which version of us are we packing? ✈️",
    options: {
      "soft-private-luxurious": "Soft, private and slightly luxurious",
      "explore-by-day-disappear-by-night": "Exploring during the day, disappearing together at night",
      "eating-through-the-destination": "Eating our way through the destination",
      "no-plan-beautiful-chaos": "No plan—just questionable decisions made beautifully",
    },
    continueAction: "Pack it up",
  },
  mustNotMiss: {
    prompt: "Okay, one thing I really must not get wrong…",
    helper: "Say anything that would make this feel more comfortable, special or truly yours.",
    surpriseOption: "Nothing specific. Surprise me.",
    continueAction: "Onward, my love",
  },
  review: {
    heading: "Your very official answers",
    body: "Before the paperwork — one last look. Is this really the story you meant to tell?",
    confirmAction: "Yes, this is all embarrassingly true",
    editLabels: {
      preferredName: "Edit preferred name",
      theme: "Edit preferred colour",
      birthdayWish: "Edit birthday wish",
      spoilModes: "Edit what being spoiled means",
      travelPersona: "Edit travel personality",
      mustNotMiss: "Edit the one thing I must not get wrong",
    },
  },
  agreement: {
    signAction: "Sign it and make it official",
    legalAction: "I need legal representation",
    legalResponse: "Legal counsel has reviewed the agreement and strongly recommends accepting the vacation.",
    acknowledgement: "I have read every ridiculous clause above and accept them anyway.",
    nextPage: "Keep reading",
    previousPage: "Back a page",
  },
  signature: {
    body: "Once you sign, your choices become part of the official birthday proposal. There will be no edits, no appeals and no pretending this was somehow entirely my idea.",
    signAction: "Seal it with a kiss 💋",
    typedFallback: "I'd rather type it",
    clearAction: "Clear",
    cancelAction: "Cancel",
  },
  reveal: {
    eyebrow: "Application... shockingly... approved.",
    invitationLine: "{{name}}, I would love nothing more than to whisk you away for your birthday.",
    saveAction: "Save my invitation",
    readAgreementAction: "Read our silly little agreement again",
  },
  edgeStates: {
    unavailable: "This little corner of the internet isn't available right now.",
    offlineDuringSigning: "Nothing has been lost.",
    retry: "Retry",
    resumedProgress: "I kept your place.",
    pageLoadHiccup: "Even magic has a bad connection sometimes.",
    pageLoadRetry: "Try that again",
  },
} as const;

export type ExperienceCopy = typeof experienceCopy;
