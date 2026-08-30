import "server-only";
import { CURRENCY_VALUES } from "@/db/schema";
import type { ExchangeRates } from "@/lib/currency/convert";

const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

/**
 * A free, keyless, no-signup endpoint (the open tier of exchangerate-api.com)
 * — verified during development to return sane KES/TZS rates matching the
 * trip doc's own planning numbers. `next.revalidate` uses Next's Data Cache,
 * which persists across serverless invocations on Vercel, so this doesn't
 * hit the provider on every request.
 */
export async function fetchExchangeRates(): Promise<{ rates: ExchangeRates; fetchedAt: string }> {
  const response = await fetch(RATES_ENDPOINT, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Exchange rate provider responded with ${response.status}`);
  }
  const data = (await response.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
  if (data.result !== "success" || !data.rates) {
    throw new Error("Exchange rate provider returned an unexpected payload.");
  }

  const rates = {} as ExchangeRates;
  for (const currency of CURRENCY_VALUES) {
    const value = currency === "USD" ? 1 : data.rates[currency];
    if (typeof value !== "number") throw new Error(`Exchange rate provider is missing a rate for ${currency}.`);
    rates[currency] = value;
  }

  return { rates, fetchedAt: data.time_last_update_utc ?? new Date().toISOString() };
}
