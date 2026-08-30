import { z } from "zod";
import { BUDGET_CATEGORY_VALUES, CURRENCY_VALUES, EVENT_STATUS_VALUES } from "@/db/schema";

export const budgetCategorySchema = z.enum(BUDGET_CATEGORY_VALUES);
export const currencySchema = z.enum(CURRENCY_VALUES);
export const eventStatusSchema = z.enum(EVENT_STATUS_VALUES);

const dayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.");

export const createBudgetItemSchema = z.object({
  category: budgetCategorySchema,
  label: z.string().trim().min(1).max(120),
  day: dayStringSchema.nullable().optional(),
  estimatedUsd: z.number().finite().nonnegative().max(100_000),
  notes: z.string().trim().max(500).optional(),
  isReserve: z.boolean().optional(),
});

export const updateBudgetItemSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    category: budgetCategorySchema.optional(),
    day: dayStringSchema.nullable().optional(),
    estimatedUsd: z.number().finite().nonnegative().max(100_000).optional(),
    actualAmount: z.number().finite().nonnegative().max(1_000_000).nullable().optional(),
    actualCurrency: currencySchema.nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    isReserve: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

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
