import "server-only";
import type { BudgetItem } from "@/db/schema";

/** Postgres NUMERIC columns come back as strings from the driver — convert once, centrally. */
export type SerializedBudgetItem = Omit<BudgetItem, "estimatedUsd" | "actualAmount" | "actualUsd"> & {
  estimatedUsd: number;
  actualAmount: number | null;
  actualUsd: number | null;
};

export function serializeBudgetItem(item: BudgetItem): SerializedBudgetItem {
  return {
    ...item,
    estimatedUsd: Number(item.estimatedUsd),
    actualAmount: item.actualAmount === null ? null : Number(item.actualAmount),
    actualUsd: item.actualUsd === null ? null : Number(item.actualUsd),
  };
}
