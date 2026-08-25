import { describe, expect, it } from "vitest";
import {
  canConfirmTheme,
  canConfirmTravelPersona,
  canContinueSpoilModes,
  canReachAgreement,
  canSeal,
  canSubmitMustNotMiss,
  canSubmitName,
} from "@/lib/experience/guards";
import { createInitialState } from "@/lib/experience/types";

describe("canSubmitName", () => {
  it("accepts 1-32 trimmed characters", () => {
    expect(canSubmitName("A")).toBe(true);
    expect(canSubmitName("a".repeat(32))).toBe(true);
  });
  it("rejects whitespace-only and over-length input", () => {
    expect(canSubmitName("   ")).toBe(false);
    expect(canSubmitName("a".repeat(33))).toBe(false);
  });
});

describe("canConfirmTheme", () => {
  it("accepts a known theme id and rejects everything else", () => {
    expect(canConfirmTheme("teal")).toBe(true);
    expect(canConfirmTheme("hot-pink")).toBe(false);
    expect(canConfirmTheme(null)).toBe(false);
  });
});

describe("canContinueSpoilModes / canConfirmTravelPersona", () => {
  it("requires at least one spoil mode", () => {
    expect(canContinueSpoilModes([])).toBe(false);
    expect(canContinueSpoilModes(["slow-mornings"])).toBe(true);
  });
  it("requires exactly one travel persona to be selected", () => {
    expect(canConfirmTravelPersona(null)).toBe(false);
    expect(canConfirmTravelPersona("eating-through-the-destination")).toBe(true);
  });
});

describe("canSubmitMustNotMiss", () => {
  it("surprise flag is always valid", () => {
    expect(canSubmitMustNotMiss({ kind: "surprise" })).toBe(true);
  });
  it("text must be 2-280 trimmed characters", () => {
    expect(canSubmitMustNotMiss({ kind: "text", value: "a" })).toBe(false);
    expect(canSubmitMustNotMiss({ kind: "text", value: "ok" })).toBe(true);
    expect(canSubmitMustNotMiss({ kind: "text", value: "a".repeat(281) })).toBe(false);
  });
});

describe("canReachAgreement", () => {
  it("is false until every answer is present", () => {
    expect(canReachAgreement(createInitialState("i1"))).toBe(false);
  });

  it("is true once name, theme, wish, spoil modes, persona and note are all set", () => {
    const state = {
      ...createInitialState("i1"),
      preferredName: "Alex",
      themeId: "teal" as const,
      birthdayWish: "vacation" as const,
      spoilModes: ["slow-mornings" as const],
      travelPersona: "eating-through-the-destination" as const,
      mustNotMiss: { kind: "surprise" as const },
    };
    expect(canReachAgreement(state)).toBe(true);
  });
});

describe("canSeal", () => {
  const readyState = {
    ...createInitialState("i1"),
    agreementAcknowledgedAt: "2027-01-01T00:00:00.000Z",
  };

  it("requires acknowledgement", () => {
    const notAcknowledged = { ...readyState, agreementAcknowledgedAt: null };
    expect(canSeal(notAcknowledged, { kind: "typed", value: "Alex" })).toBe(false);
  });

  it("requires a valid signature", () => {
    expect(canSeal(readyState, { kind: "typed", value: "" })).toBe(false);
    expect(canSeal(readyState, { kind: "typed", value: "Alex" })).toBe(true);
  });

  it("refuses to reseal an already-sealed invite", () => {
    const sealed = { ...readyState, sealedAt: "2027-01-01T00:00:00.000Z" };
    expect(canSeal(sealed, { kind: "typed", value: "Alex" })).toBe(false);
  });
});
