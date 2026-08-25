/**
 * Canonical, immutable versioned content asset. The stored acceptance
 * (agreementVersion) references this id — the markdown below must never be
 * edited in place. A wording change requires a new id (e.g. lover-agreement-v2)
 * and a new file, never a mutation of this one.
 */
export const loverAgreementV1 = {
  id: "lover-agreement-v1",
  effectiveDate: "2026-08-25",
  markdown: `### The Official Birthday Lover Agreement

##### Terms, Conditions & Completely Reasonable Levels of Affection

This agreement is entered into by **{{name}}**, hereinafter referred to as **“The Birthday Girl,”** and Isaac, hereinafter referred to as **“The Man Who Clearly Has a Plan.”**

By signing below, both parties agree to the following extremely fair and absolutely non-negotiable terms.

#### The Birthday Girl agrees:

1. To allow herself to be celebrated, complimented and mildly spoiled without launching a full financial investigation.

2. Not to say *“anything is fine”* when there are, in fact, at least six things that are absolutely not fine.

3. That no serious disagreement may begin on an empty stomach. Snacks must first be administered, after which the complaint may be formally resubmitted.

4. To permit spontaneous photographs while retaining the unrestricted right to delete any evidence that could reasonably be described as criminally unflattering.

5. To pack at least one outfit capable of making Isaac temporarily forget the itinerary, the destination and possibly his own name.

6. Not to pretend she is unimpressed when her face has already submitted contradictory evidence.

7. To accept compliments without responding with *“you’re just saying that”* more than twice per compliment.

8. To enjoy herself properly without feeling guilty, checking whether everyone else is okay, or trying to turn her own birthday into a normal working day.

#### The Man Who Clearly Has a Plan agrees:

1. To handle the important matters: reservations, transport, snacks, directions and safely returning The Birthday Girl to civilisation.

2. Not to become an itinerary dictator. Naps, kisses, beautiful views and unexpectedly good food may overrule the schedule.

3. To take approximately forty-seven photographs so that The Birthday Girl may approve one.

4. Not to rush her while getting ready and then mysteriously take longer choosing his own shirt.

5. To carry bags, provide honest outfit opinions and understand that *“I’m almost ready”* is an emotional estimate rather than a legally recognised measurement of time.

6. If lost, to use the phrase *“scenic detour”* for no longer than three minutes before admitting what has happened.

7. To ensure that every surprise remains thoughtful, every plan leaves room for her comfort, and the entire escape still feels like her birthday—not merely a trip he wanted to take.

#### Fine print

Affection may be administered without prior warning.

Dessert may be ordered even when both parties claim to be full.

Minor disagreements about where to eat shall be resolved through hunger levels, persuasive reasoning or whichever person finds the better restaurant first.

This agreement remains valid across time zones, delayed flights, missed turns, sleepy mornings and all suspiciously romantic circumstances.

#### Final warning

Once signed, your choices will be sealed into the **Official Birthday Proposal**.

There will be no edits, no appeals, no pretending you did not read the terms, and absolutely no claiming later that this vacation was somehow entirely my idea.

Please sign only if you are prepared to be loved, celebrated and ready to make bad decisions.`,
} as const;

export type LoverAgreementContent = typeof loverAgreementV1;
