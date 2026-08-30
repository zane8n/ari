import type { Currency } from "@/db/schema";

/** Rates are always expressed relative to a USD base (USD itself is always 1). */
export type ExchangeRates = Record<Currency, number>;

export function convertFromUsd(amountUsd: number, currency: Currency, rates: ExchangeRates): number {
  return amountUsd * rates[currency];
}

export function convertToUsd(amount: number, currency: Currency, rates: ExchangeRates): number {
  return amount / rates[currency];
}

/** TZS/KES are conventionally shown as whole units — only USD carries cents. */
export function formatMoney(amount: number, currency: Currency): string {
  const fractionDigits = currency === "USD" ? 2 : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(fractionDigits)}`;
  }
}
