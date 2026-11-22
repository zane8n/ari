import { describe, expect, it } from "vitest";
import { addDays, daysBetween, parseStartMinutes, todayInZone, tripPhase } from "@/lib/trip/dates";
import { buildIcs, zonedTimeToUtc } from "@/lib/trip/ics";
import { pendingCheckins, statusAfterLogging, summarizeMoney } from "@/lib/trip/money";
import type { SerializedBudgetItem, SerializedExpense } from "@/lib/trip/types";

const TRIP = { potUsd: 800, reserveUsd: 200, startDate: "2026-12-09", endDate: "2026-12-14" };

function line(partial: Partial<SerializedBudgetItem> & { id: string; estimatedUsd: number }): SerializedBudgetItem {
  return {
    tripId: "t",
    category: "food",
    label: partial.id,
    day: null,
    kind: "fixed",
    status: "open",
    cutRank: null,
    cutNote: null,
    cutSavingUsd: null,
    notes: null,
    isReserve: false,
    isCustom: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...partial,
  };
}

let n = 0;
function spend(amountUsd: number, partial: Partial<SerializedExpense> = {}): SerializedExpense {
  n += 1;
  return {
    id: `e${n}`,
    tripId: "t",
    budgetItemId: null,
    day: "2026-12-10",
    category: "food",
    label: "x",
    amount: amountUsd * 129,
    currency: "KES",
    amountUsd,
    fund: "pot",
    createdAt: new Date(n * 1000).toISOString(),
    ...partial,
  };
}

describe("summarizeMoney", () => {
  it("before anything is spent, the forecast is the plan and the headroom is the unallocated cushion", () => {
    const m = summarizeMoney({ ...TRIP, today: "2026-11-22", budgetItems: [line({ id: "a", estimatedUsd: 500 }), line({ id: "b", estimatedUsd: 265, kind: "running" })], expenses: [] });
    expect(m.plannedUsd).toBe(765);
    expect(m.forecastUsd).toBe(765);
    expect(m.headroomUsd).toBe(35);
    expect(m.leftUsd).toBe(800);
    expect(m.daysLeft).toBe(6);
  });

  it("a paid fixed line counts what was actually paid, not its estimate", () => {
    const items = [line({ id: "dinner", estimatedUsd: 45, status: "paid" })];
    const m = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: items, expenses: [spend(60, { budgetItemId: "dinner" })] });
    expect(m.spentUsd).toBe(60);
    expect(m.stillExpectedUsd).toBe(0);
    expect(m.forecastUsd).toBe(60);
    expect(m.items[0].varianceUsd).toBe(15);
  });

  it("a running line keeps expecting whatever its estimate hasn't absorbed, never less than zero", () => {
    const items = [line({ id: "tuk", estimatedUsd: 30, kind: "running" })];
    const under = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: items, expenses: [spend(10, { budgetItemId: "tuk" })] });
    expect(under.stillExpectedUsd).toBe(20);
    expect(under.forecastUsd).toBe(30);
    const over = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: items, expenses: [spend(40, { budgetItemId: "tuk" })] });
    expect(over.stillExpectedUsd).toBe(0);
    expect(over.forecastUsd).toBe(40);
  });

  it("dropping a line frees its estimate", () => {
    const m = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: [line({ id: "kayak", estimatedUsd: 120, status: "dropped" })], expenses: [] });
    expect(m.freedUsd).toBe(120);
    expect(m.forecastUsd).toBe(0);
  });

  it("reserve spending never touches the pot", () => {
    const m = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: [], expenses: [spend(50, { fund: "reserve" })] });
    expect(m.spentUsd).toBe(0);
    expect(m.reserveSpentUsd).toBe(50);
    expect(m.reserveLeftUsd).toBe(150);
    expect(m.leftUsd).toBe(800);
  });

  it("spreads positive headroom over the days left, including today", () => {
    const m = summarizeMoney({ ...TRIP, today: "2026-12-12", budgetItems: [line({ id: "a", estimatedUsd: 770 })], expenses: [] });
    expect(m.daysLeft).toBe(3);
    expect(m.extrasPerDayUsd).toBe(10);
  });

  it("when over the pot, the cut list runs in agreed order with a cumulative saving, skipping anything already paid", () => {
    const items = [
      line({ id: "mandharini", estimatedUsd: 40, cutRank: 2, cutSavingUsd: 25 }),
      line({ id: "kayak", estimatedUsd: 120, cutRank: 1, cutSavingUsd: 76 }),
      line({ id: "dhow", estimatedUsd: 75, cutRank: 3, cutSavingUsd: 25, status: "paid" }),
      line({ id: "big", estimatedUsd: 700 }),
    ];
    const m = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: items, expenses: [spend(75, { budgetItemId: "dhow" })] });
    expect(m.headroomUsd).toBeLessThan(0);
    expect(m.cutPlan.map((c) => c.item.id)).toEqual(["kayak", "mandharini"]);
    expect(m.cutPlan.map((c) => c.cumulativeUsd)).toEqual([76, 101]);
  });

  it("counts unlinked spending as unplanned", () => {
    const m = summarizeMoney({ ...TRIP, today: "2026-12-10", budgetItems: [line({ id: "a", estimatedUsd: 10 })], expenses: [spend(5), spend(10, { budgetItemId: "a" })] });
    expect(m.unplannedSpentUsd).toBe(5);
    expect(m.todaySpentUsd).toBe(15);
  });
});

describe("statusAfterLogging", () => {
  it("closes one-offs but leaves running pots open", () => {
    expect(statusAfterLogging({ kind: "fixed", status: "open" })).toBe("paid");
    expect(statusAfterLogging({ kind: "running", status: "open" })).toBe("open");
  });
});

describe("pendingCheckins", () => {
  const dayDates = ["2026-12-09", "2026-12-10", "2026-12-11"];
  it("lists past unchecked days and flags today only after the check-in hour", () => {
    const early = pendingCheckins({ dayDates, checkedIn: new Set(["2026-12-09"]), today: "2026-12-11", minutesNow: 18 * 60, checkinHour: 21 });
    expect(early).toEqual({ overdue: ["2026-12-10"], dueToday: false });
    const late = pendingCheckins({ dayDates, checkedIn: new Set(["2026-12-09", "2026-12-10"]), today: "2026-12-11", minutesNow: 21 * 60 + 5, checkinHour: 21 });
    expect(late).toEqual({ overdue: [], dueToday: true });
  });
});

describe("trip dates", () => {
  it("reads the trip-local date, not UTC", () => {
    // 22:30 UTC on the 9th is already the 10th in Nairobi (UTC+3).
    expect(todayInZone("Africa/Nairobi", new Date("2026-12-09T22:30:00Z"))).toBe("2026-12-10");
  });
  it("does day arithmetic and phases", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-11-22", "2026-12-09")).toBe(17);
    expect(tripPhase("2026-12-09", "2026-12-14", "2026-12-14")).toBe("during");
    expect(tripPhase("2026-12-09", "2026-12-14", "2026-12-15")).toBe("after");
  });
  it("parses the first clock time out of free-form labels", () => {
    expect(parseStartMinutes("16:30–18:21")).toBe(16 * 60 + 30);
    expect(parseStartMinutes("Morning")).toBeNull();
  });
});

describe("reminder calendar", () => {
  it("converts trip-local wall time to UTC", () => {
    expect(zonedTimeToUtc("2026-12-10", 21, 0, "Africa/Nairobi").toISOString()).toBe("2026-12-10T18:00:00.000Z");
  });
  it("emits a valid VEVENT with an alarm and escaped text", () => {
    const ics = buildIcs("Kilifi reminders", [{ uid: "u1", start: new Date("2026-12-10T18:00:00Z"), minutes: 10, title: "Check-in, two minutes; go" }], new Date("2026-11-22T00:00:00Z"));
    expect(ics).toContain("DTSTART:20261210T180000Z");
    expect(ics).toContain("SUMMARY:Check-in\\, two minutes\\; go");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
