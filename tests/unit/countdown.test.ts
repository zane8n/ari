import { describe, expect, it } from "vitest";
import { daysUntil, formatVacationDate, formatVacationDateRange } from "@/lib/reveal/countdown";

describe("formatVacationDate", () => {
  it("shows the destination's own calendar date regardless of a large negative UTC offset", () => {
    // 23:30 in UTC-08:00 is already the next UTC day — the display must still say the 9th.
    expect(formatVacationDate("2027-03-09T23:30:00-08:00")).toBe("March 9, 2027");
  });

  it("shows the destination's own calendar date regardless of a positive UTC offset", () => {
    expect(formatVacationDate("2027-03-01T01:00:00+13:00")).toBe("March 1, 2027");
  });

  it("formats a date range", () => {
    expect(formatVacationDateRange("2027-01-10T14:00:00+02:00", "2027-01-17T11:00:00+02:00")).toBe(
      "January 10, 2027 – January 17, 2027",
    );
  });
});

describe("daysUntil", () => {
  it("counts up to a future date", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    expect(daysUntil("2027-01-04T00:00:00Z", now)).toBe(3);
  });

  it("never goes negative once the date has passed", () => {
    const now = new Date("2027-02-01T00:00:00Z");
    expect(daysUntil("2027-01-04T00:00:00Z", now)).toBe(0);
  });

  it("handles a daylight-saving-adjacent range without throwing", () => {
    const now = new Date("2027-03-10T00:00:00Z");
    expect(() => daysUntil("2027-03-14T12:00:00-04:00", now)).not.toThrow();
  });
});
