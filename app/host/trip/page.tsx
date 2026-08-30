import { cookies } from "next/headers";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { TripApp } from "@/components/trip/TripApp";
import { getDb } from "@/db/client";
import { budgetItems, itineraryEvents, tripDays } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";
import { serializeBudgetItem } from "@/lib/server/trip";

export const dynamic = "force-dynamic";

export default async function TripPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(HOST_SESSION_COOKIE_NAME)?.value;

  if (!verifyHostSessionToken(session)) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-5">
        <HostLoginForm />
      </main>
    );
  }

  const db = getDb();
  const [budgetRows, eventRows, dayRows] = await Promise.all([
    db.select().from(budgetItems).orderBy(budgetItems.day, budgetItems.createdAt),
    db.select().from(itineraryEvents).orderBy(itineraryEvents.day, itineraryEvents.sortOrder),
    db.select().from(tripDays).orderBy(tripDays.sortOrder),
  ]);

  const env = getEnv();

  return (
    <TripApp
      initialBudgetItems={budgetRows.map(serializeBudgetItem)}
      initialEvents={eventRows}
      tripDays={dayRows}
      meta={{
        destination: env.TRIP_DESTINATION,
        homeBase: env.TRIP_HOME_BASE,
        cashBudgetUsd: env.TRIP_CASH_BUDGET_USD,
        reserveBudgetUsd: env.TRIP_RESERVE_BUDGET_USD,
      }}
    />
  );
}
