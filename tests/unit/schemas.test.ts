import { describe, expect, it } from "vitest";
import {
  MAX_SIGNATURE_POINTS,
  mustNotMissSchema,
  preferredNameSchema,
  sealedPayloadV1Schema,
  signatureDraftSchema,
  spoilModesSchema,
} from "@/lib/validation/schemas";

describe("preferredNameSchema", () => {
  it("accepts accents, spaces and apostrophes", () => {
    expect(preferredNameSchema.safeParse("Anaïs O'Brien").success).toBe(true);
  });

  it("trims before validating length", () => {
    const result = preferredNameSchema.safeParse("   Sam   ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("Sam");
  });

  it("rejects empty, over-length and markup input", () => {
    expect(preferredNameSchema.safeParse("").success).toBe(false);
    expect(preferredNameSchema.safeParse("a".repeat(33)).success).toBe(false);
    expect(preferredNameSchema.safeParse("<script>").success).toBe(false);
  });
});

describe("spoilModesSchema", () => {
  it("requires at least one selection", () => {
    expect(spoilModesSchema.safeParse([]).success).toBe(false);
  });

  it("accepts one to four unique known ids", () => {
    expect(spoilModesSchema.safeParse(["slow-mornings", "little-surprises"]).success).toBe(true);
  });

  it("rejects duplicate ids", () => {
    expect(spoilModesSchema.safeParse(["slow-mornings", "slow-mornings"]).success).toBe(false);
  });

  it("rejects an unknown id", () => {
    expect(spoilModesSchema.safeParse(["a-yacht"]).success).toBe(false);
  });
});

describe("mustNotMissSchema", () => {
  it("requires 2-280 characters for text answers", () => {
    expect(mustNotMissSchema.safeParse({ kind: "text", value: "a" }).success).toBe(false);
    expect(mustNotMissSchema.safeParse({ kind: "text", value: "ok" }).success).toBe(true);
    expect(mustNotMissSchema.safeParse({ kind: "text", value: "a".repeat(281) }).success).toBe(false);
  });

  it("allows the surprise flag with no text at all", () => {
    expect(mustNotMissSchema.safeParse({ kind: "surprise" }).success).toBe(true);
  });
});

describe("signatureDraftSchema", () => {
  it("accepts a typed signature", () => {
    expect(signatureDraftSchema.safeParse({ kind: "typed", value: "Alex" }).success).toBe(true);
  });

  it("rejects an empty drawn signature", () => {
    expect(signatureDraftSchema.safeParse({ kind: "drawn", points: [] }).success).toBe(false);
  });

  it("accepts a small drawn signature and rejects one over the point ceiling", () => {
    const smallGroup = Array.from({ length: 5 }, (_, i) => ({ x: i, y: i, time: i }));
    expect(signatureDraftSchema.safeParse({ kind: "drawn", points: [smallGroup] }).success).toBe(true);

    const hugeGroup = Array.from({ length: MAX_SIGNATURE_POINTS + 1 }, (_, i) => ({ x: i, y: i, time: i }));
    expect(signatureDraftSchema.safeParse({ kind: "drawn", points: [hugeGroup] }).success).toBe(false);
  });

  it("rejects non-finite point values", () => {
    const group = [
      { x: 0, y: 0, time: 0 },
      { x: Number.NaN, y: 1, time: 1 },
    ];
    expect(signatureDraftSchema.safeParse({ kind: "drawn", points: [group] }).success).toBe(false);
  });
});

describe("sealedPayloadV1Schema", () => {
  const validPayload = {
    preferredName: "Alex",
    themeId: "teal",
    birthdayWish: "vacation",
    spoilModes: ["slow-mornings"],
    travelPersona: "eating-through-the-destination",
    mustNotMiss: { kind: "surprise" },
    agreementVersion: "lover-agreement-v1",
    agreementAcknowledgedAt: "2027-01-01T00:00:00.000Z",
    signature: { kind: "typed", value: "Alex" },
  };

  it("accepts a fully valid payload", () => {
    expect(sealedPayloadV1Schema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects birthdayWish values other than the literal 'vacation'", () => {
    expect(sealedPayloadV1Schema.safeParse({ ...validPayload, birthdayWish: "money" }).success).toBe(false);
  });

  it("rejects a mismatched agreement version", () => {
    expect(sealedPayloadV1Schema.safeParse({ ...validPayload, agreementVersion: "lover-agreement-v2" }).success).toBe(
      false,
    );
  });
});
