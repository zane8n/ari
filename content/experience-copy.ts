/**
 * Approved on-screen copy, transcribed verbatim from the developer guideline.
 * Do not paraphrase strings here — only bracketed tokens (e.g. {{name}}) are
 * runtime-substituted. See lib/content/interpolate.ts for the allowlist.
 */
export const experienceCopy = {
  arrival: {
    title: "Welcome to the side of the internet that's dedicated to you.",
    body: "Before this little place becomes yours, let it meet you properly.",
    action: "Let it meet me",
    ariaLabel: "A private birthday experience, made just for you.",
  },
  setTheMood: {
    namePrompt: "What should I call you here?",
    themePrompt: "Which colour feels most like you today?",
    keepThisOne: "Keep this one",
  },
  prologue: {
    bridge: ["Much better, {{name}}.", "Now it looks a little more like it belongs to you."],
    letter: [
      "I could have simply sent you another birthday message, but you deserve more than words that eventually disappear into a chat.",
      "You have become such a beautiful part of my life—not because everything between us has always been effortless, but because what we have is honest, alive and worth choosing. There is a softness in the way you care, a certainty in the way you love, and a presence that stays with me even across the distance.",
      "So I made you this small world: partly to make you smile, partly to remind you how deeply you are loved, and partly because I have a question waiting for you at the end.",
      "Happy birthday, my love.",
      "Now come and cause some trouble.",
    ],
    continueAction: "Continue",
  },
  wish: {
    question: "What do you actually want for your birthday?",
    options: {
      money: "Lots of money",
      vacation: "A vacation",
      "love-letter": "A suspiciously long love letter",
      "peace-and-sleep": "Peace, sleep and absolutely no responsibilities",
    },
  },
  wishConfirm: {
    title: "Are you reaaally sure?",
    body: "You are about to voluntarily travel with the person who made this website.",
    confirm: "Yes, take me away",
    cancel: "Let me inspect the nonsense again",
  },
  spoilModes: {
    question: "What does being spoiled properly look like?",
    helper: "Choose as many as feel right.",
    options: {
      "dinner-and-dressing-up": "A beautiful dinner and dressing up",
      "slow-mornings": "Slow mornings with no alarms",
      "little-surprises": "Little surprises throughout the day",
      "comfort-and-disappearing": "Good food, comfort and disappearing from everyone",
    },
    allSelectedAside: "A balanced and financially fearless answer.",
  },
  travelPersona: {
    question: "Which version of us are we packing?",
    options: {
      "soft-private-luxurious": "Soft, private and slightly luxurious",
      "explore-by-day-disappear-by-night": "Exploring during the day, disappearing together at night",
      "eating-through-the-destination": "Eating our way through the destination",
      "no-plan-beautiful-chaos": "No plan—just questionable decisions made beautifully",
    },
  },
  mustNotMiss: {
    prompt: "One thing I must not get wrong…",
    helper: "Say anything that would make this feel more comfortable, special or properly yours.",
    surpriseOption: "Nothing specific. Surprise me.",
  },
  review: {
    heading: "Your suspiciously official answers",
    body: "Before the paperwork, make sure this is the version of the story you meant to tell.",
    confirmAction: "Everything looks suspiciously accurate",
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
    signAction: "Sign it and make this official",
    legalAction: "I need legal representation",
    legalResponse: "Legal counsel has reviewed the agreement and strongly recommends accepting the vacation.",
    acknowledgement: "I have read every suspicious clause above and accept them anyway.",
  },
  signature: {
    body: "Once you sign, your choices become part of the official birthday proposal. There will be no edits, no appeals and no pretending this was somehow entirely my idea.",
    signAction: "Sign and seal it",
    typedFallback: "I would rather type my signature",
    clearAction: "Clear",
    cancelAction: "Cancel",
  },
  reveal: {
    eyebrow: "Application suspiciously approved.",
    invitationLine: "{{name}}, I would officially like to take you away for your birthday.",
    saveAction: "Save my invitation",
    readAgreementAction: "Read our agreement",
  },
  edgeStates: {
    unavailable: "This little page is unavailable right now.",
    offlineDuringSigning: "Nothing has been lost.",
    retry: "Retry",
    resumedProgress: "I kept your place.",
  },
} as const;

export type ExperienceCopy = typeof experienceCopy;
