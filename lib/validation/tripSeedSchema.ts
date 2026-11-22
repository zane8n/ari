import { z } from "zod";
import { BUDGET_CATEGORY_VALUES, BUDGET_KIND_VALUES, CURRENCY_VALUES, TASK_PHASE_VALUES } from "@/db/schema";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = (max: number) => z.string().trim().min(1).max(max);
const opt = (max: number) => z.string().trim().max(max).optional();

/** Validates a whole trip plan (the shape of content/trip-seed.ts) before it's written — from the CLI seed or the in-app import. */
export const tripSeedSchema = z
  .object({
    trip: z.object({
      slug: z.string().regex(/^[a-z0-9-]{1,40}$/),
      name: text(60),
      destination: text(80),
      homeBase: opt(80),
      startDate: day,
      endDate: day,
      potUsd: z.number().finite().nonnegative().max(1_000_000),
      reserveUsd: z.number().finite().nonnegative().max(1_000_000),
      spendCurrency: z.enum(CURRENCY_VALUES),
      timezone: opt(60),
      checkinHour: z.number().int().min(0).max(23).optional(),
      rules: z.array(text(300)).max(20).optional(),
    }),
    days: z
      .array(
        z.object({
          date: day,
          label: text(80),
          mood: opt(200),
          pace: opt(60),
          info: z
            .object({
              sunrise: opt(10),
              sunset: opt(10),
              highTides: z.array(z.string().max(10)).max(4).optional(),
              lowTides: z.array(z.string().max(10)).max(4).optional(),
              rainRisk: opt(30),
              why: opt(300),
            })
            .optional(),
        }),
      )
      .min(1)
      .max(60),
    budget: z
      .array(
        z.object({
          key: text(40),
          day: day.nullable(),
          category: z.enum(BUDGET_CATEGORY_VALUES),
          kind: z.enum(BUDGET_KIND_VALUES).optional(),
          label: text(120),
          estimatedUsd: z.number().finite().nonnegative().max(100_000),
          notes: opt(500),
          cutRank: z.number().int().min(0).max(99).optional(),
          cutNote: opt(300),
          cutSavingUsd: z.number().finite().nonnegative().max(100_000).optional(),
        }),
      )
      .max(300),
    events: z
      .array(
        z.object({
          day,
          timeOfDay: opt(40),
          title: text(160),
          description: opt(1000),
          location: opt(160),
          phone: opt(40),
          budgetKey: opt(40),
          isOptional: z.boolean().optional(),
          isSurprise: z.boolean().optional(),
        }),
      )
      .max(500),
    tasks: z.array(z.object({ phase: z.enum(TASK_PHASE_VALUES), title: text(200), detail: opt(500), dueDay: day.optional() })).max(200),
  })
  .superRefine((seed, ctx) => {
    const keys = new Set(seed.budget.map((b) => b.key));
    if (keys.size !== seed.budget.length) ctx.addIssue({ code: "custom", message: "Budget keys must be unique." });
    for (const e of seed.events) {
      if (e.budgetKey && !keys.has(e.budgetKey)) ctx.addIssue({ code: "custom", message: `Event "${e.title}" points at unknown budget key "${e.budgetKey}".` });
    }
    if (seed.trip.endDate < seed.trip.startDate) ctx.addIssue({ code: "custom", message: "The trip ends before it starts." });
  });
