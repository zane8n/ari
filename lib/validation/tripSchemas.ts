import { z } from "zod";
import {
  BUDGET_CATEGORY_VALUES,
  BUDGET_KIND_VALUES,
  BUDGET_STATUS_VALUES,
  CURRENCY_VALUES,
  EVENT_STATUS_VALUES,
  EXPENSE_FUND_VALUES,
} from "@/db/schema";

export const budgetCategorySchema = z.enum(BUDGET_CATEGORY_VALUES);
export const currencySchema = z.enum(CURRENCY_VALUES);
export const eventStatusSchema = z.enum(EVENT_STATUS_VALUES);

const dayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.");

export const createBudgetItemSchema = z.object({
  category: budgetCategorySchema,
  label: z.string().trim().min(1).max(120),
  day: dayStringSchema.nullable().optional(),
  estimatedUsd: z.number().finite().nonnegative().max(100_000),
  kind: z.enum(BUDGET_KIND_VALUES).optional(),
  notes: z.string().trim().max(500).optional(),
  isReserve: z.boolean().optional(),
});

export const updateBudgetItemSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    category: budgetCategorySchema.optional(),
    day: dayStringSchema.nullable().optional(),
    estimatedUsd: z.number().finite().nonnegative().max(100_000).optional(),
    kind: z.enum(BUDGET_KIND_VALUES).optional(),
    status: z.enum(BUDGET_STATUS_VALUES).optional(),
    cutRank: z.number().int().min(0).max(99).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    isReserve: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export const createExpenseSchema = z
  .object({
    amount: z.number().finite().nonnegative().max(10_000_000),
    currency: currencySchema,
    budgetItemId: z.string().uuid().nullable().optional(),
    category: budgetCategorySchema.optional(),
    label: z.string().trim().min(1).max(120).optional(),
    day: dayStringSchema.nullable().optional(),
    fund: z.enum(EXPENSE_FUND_VALUES).optional(),
  })
  .refine((value) => value.budgetItemId || value.category, "Pick what it was for.");

export const createEventSchema = z.object({
  day: dayStringSchema,
  sortOrder: z.number().int().min(0).max(9999).optional(),
  timeOfDay: z.string().trim().max(40).optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(160).optional(),
  linkedBudgetItemId: z.string().uuid().optional(),
});

export const updateEventSchema = z
  .object({
    day: dayStringSchema.optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    timeOfDay: z.string().trim().max(40).nullable().optional(),
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    location: z.string().trim().max(160).nullable().optional(),
    linkedBudgetItemId: z.string().uuid().nullable().optional(),
    status: eventStatusSchema.optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export const checkinSchema = z.object({
  day: dayStringSchema,
  highlight: z.string().trim().max(280).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
});

export const updateTaskSchema = z.object({ done: z.boolean() });
