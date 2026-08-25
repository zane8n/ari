import { describe, expect, it } from "vitest";
import { experienceReducer } from "@/lib/experience/reducer";
import { createInitialState, type ExperienceState } from "@/lib/experience/types";

const NOW = "2027-01-01T00:00:00.000Z";

describe("experienceReducer", () => {
  it("advances arrival -> name only on the arrived action", () => {
    const state = createInitialState("invite-1");
    const next = experienceReducer(state, { type: "arrived", at: NOW });
    expect(next.stage).toBe("name");
    expect(next.openedAt).toBe(NOW);
  });

  it("rejects a name that fails validation and does not advance the stage", () => {
    const state = { ...createInitialState("invite-1"), stage: "name" as const };
    const next = experienceReducer(state, { type: "nameSubmitted", name: "  " });
    expect(next.stage).toBe("name");
    expect(next.preferredName).toBe("");
  });

  it("trims and commits a valid name, advancing to theme", () => {
    const state = { ...createInitialState("invite-1"), stage: "name" as const };
    const next = experienceReducer(state, { type: "nameSubmitted", name: "  Alex  " });
    expect(next.stage).toBe("theme");
    expect(next.preferredName).toBe("Alex");
  });

  it("rejects an unknown theme id", () => {
    const state = { ...createInitialState("invite-1"), stage: "theme" as const };
    // @ts-expect-error deliberately invalid theme id for the guard test
    const next = experienceReducer(state, { type: "themeSelected", themeId: "hot-pink" });
    expect(next.stage).toBe("theme");
    expect(next.themeId).toBeNull();
  });

  it("only commits birthdayWish as vacation after wishConfirmed, never before", () => {
    let state: ExperienceState = { ...createInitialState("invite-1"), stage: "wish" };
    state = experienceReducer(state, { type: "wishConfirmRequested" });
    expect(state.stage).toBe("wishConfirm");
    expect(state.birthdayWish).toBeNull();

    state = experienceReducer(state, { type: "wishConfirmed", at: NOW });
    expect(state.stage).toBe("spoilModes");
    expect(state.birthdayWish).toBe("vacation");
    expect(state.vacationConfirmedAt).toBe(NOW);
  });

  it("wishConfirmDismissed returns to wish without committing anything", () => {
    let state: ExperienceState = { ...createInitialState("invite-1"), stage: "wish" };
    state = experienceReducer(state, { type: "wishConfirmRequested" });
    state = experienceReducer(state, { type: "wishConfirmDismissed" });
    expect(state.stage).toBe("wish");
    expect(state.birthdayWish).toBeNull();
  });

  it("requires at least one spoil mode before continuing", () => {
    const state = { ...createInitialState("invite-1"), stage: "spoilModes" as const, spoilModes: [] };
    const next = experienceReducer(state, { type: "spoilModesConfirmed" });
    expect(next.stage).toBe("spoilModes");
  });

  it("toggles spoil modes on and off", () => {
    let state: ExperienceState = { ...createInitialState("invite-1"), stage: "spoilModes" };
    state = experienceReducer(state, { type: "spoilModeToggled", mode: "slow-mornings" });
    expect(state.spoilModes).toEqual(["slow-mornings"]);
    state = experienceReducer(state, { type: "spoilModeToggled", mode: "slow-mornings" });
    expect(state.spoilModes).toEqual([]);
  });

  it("edit-return: editing from review sends every subsequent commit straight back to review", () => {
    const reviewState = {
      ...createInitialState("invite-1"),
      stage: "review" as const,
      preferredName: "Alex",
      themeId: "teal" as const,
      birthdayWish: "vacation" as const,
      spoilModes: ["slow-mornings" as const],
      travelPersona: "eating-through-the-destination" as const,
      mustNotMiss: { kind: "surprise" as const },
    };

    const editing = experienceReducer(reviewState, { type: "editRequested", fromStage: "name" });
    expect(editing.stage).toBe("name");
    expect(editing.revisionReturnStage).toBe("review");

    const afterEdit = experienceReducer(editing, { type: "nameSubmitted", name: "Alexis" });
    expect(afterEdit.stage).toBe("review");
    expect(afterEdit.revisionReturnStage).toBeNull();
    expect(afterEdit.preferredName).toBe("Alexis");
  });

  it("blocks review -> agreement until every answer is present", () => {
    const incomplete = { ...createInitialState("invite-1"), stage: "review" as const };
    const next = experienceReducer(incomplete, { type: "agreementConfirmed", at: NOW });
    expect(next.stage).toBe("review");
  });

  it("blocks agreement -> signature until the checkbox is acknowledged", () => {
    const state = { ...createInitialState("invite-1"), stage: "agreement" as const };
    const next = experienceReducer(state, { type: "signatureStageEntered" });
    expect(next.stage).toBe("agreement");
  });

  it("sealing clears sensitive draft fields but keeps theme, name and sealedAt", () => {
    const state = {
      ...createInitialState("invite-1"),
      stage: "sealing" as const,
      preferredName: "Alex",
      themeId: "teal" as const,
      birthdayWish: "vacation" as const,
      spoilModes: ["slow-mornings" as const],
      travelPersona: "eating-through-the-destination" as const,
      mustNotMiss: { kind: "surprise" as const },
      agreementAcknowledgedAt: NOW,
      signature: { kind: "typed" as const, value: "Alex" },
    };

    const sealed = experienceReducer(state, { type: "sealed", at: NOW });
    expect(sealed.stage).toBe("reveal");
    expect(sealed.sealedAt).toBe(NOW);
    expect(sealed.preferredName).toBe("Alex");
    expect(sealed.themeId).toBe("teal");
    expect(sealed.signature).toBeNull();
    expect(sealed.mustNotMiss).toBeNull();
    expect(sealed.spoilModes).toEqual([]);
    expect(sealed.travelPersona).toBeNull();
    expect(sealed.birthdayWish).toBeNull();
  });

  it("never reopens editable answers via wentBack once sealed", () => {
    const sealedState = { ...createInitialState("invite-1"), stage: "reveal" as const, sealedAt: NOW };
    const next = experienceReducer(sealedState, { type: "wentBack", stage: "review" });
    expect(next.stage).toBe("reveal");
  });

  it("wentBack moves stage while unsealed", () => {
    const state = { ...createInitialState("invite-1"), stage: "mustNotMiss" as const };
    const next = experienceReducer(state, { type: "wentBack", stage: "travelPersona" });
    expect(next.stage).toBe("travelPersona");
  });
});
