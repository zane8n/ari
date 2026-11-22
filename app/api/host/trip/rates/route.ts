import { NextResponse } from "next/server";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { fetchExchangeRates } from "@/lib/server/currency";
import { currentGuestPass } from "@/lib/server/tripAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidHostSession()) && !(await currentGuestPass())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { rates, fetchedAt } = await fetchExchangeRates();
    return NextResponse.json({ rates, fetchedAt });
  } catch {
    return NextResponse.json({ error: "Could not reach the exchange rate provider." }, { status: 502 });
  }
}
