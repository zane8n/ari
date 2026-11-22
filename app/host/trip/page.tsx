import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";
import { listTrips } from "@/lib/server/trip";
import { formatDateRange, todayInZone, tripPhase } from "@/lib/trip/dates";

export const dynamic = "force-dynamic";

/** Every trip, newest first. With exactly one current or upcoming trip it goes straight there. */
export default async function TripsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const cookieStore = await cookies();
  if (!verifyHostSessionToken(cookieStore.get(HOST_SESSION_COOKIE_NAME)?.value)) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-5">
        <HostLoginForm />
      </main>
    );
  }

  const trips = (await listTrips()).reverse();
  const withPhase = trips.map((trip) => ({ trip, phase: tripPhase(trip.startDate, trip.endDate, todayInZone(trip.timezone)) }));
  const live = withPhase.filter((t) => t.phase !== "after");
  if (live.length === 1 && (await searchParams).all === undefined) redirect(`/host/trip/${live[0].trip.slug}`);

  return (
    <main className="trip">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
        <a href="/host" className="text-xs font-semibold text-[var(--t-muted)] underline">
          ← Host view
        </a>
        <h1 className="font-display text-4xl font-semibold">Trips</h1>
        {withPhase.length === 0 && <p className="text-[var(--t-muted)]">No trips yet. Seed one with pnpm seed:trip &lt;slug&gt;.</p>}
        <ul className="flex flex-col gap-3">
          {withPhase.map(({ trip, phase }) => (
            <li key={trip.id}>
              <a href={`/host/trip/${trip.slug}`} className="trip-card flex items-center justify-between gap-3 px-4 py-4">
                <span>
                  <span className="font-display block text-2xl leading-tight font-semibold">{trip.name}</span>
                  <span className="block text-sm text-[var(--t-muted)]">{formatDateRange(trip.startDate, trip.endDate)}</span>
                </span>
                <span className={`trip-tag ${phase === "after" ? "" : "!bg-[var(--t-sea)] !text-white"}`}>
                  {phase === "before" ? "Upcoming" : phase === "during" ? "Now" : "Past"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
