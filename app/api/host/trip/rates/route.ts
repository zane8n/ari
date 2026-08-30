import { NextResponse } from "next/server";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { fetchExchangeRates } from "@/lib/server/currency";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { rates, fetchedAt } = await fetchExchangeRates();
    return NextResponse.json({ rates, fetchedAt });
  } catch {
    return NextResponse.json({ error: "Could not reach the exchange rate provider." }, { status: 502 });
  }
}
