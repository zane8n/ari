import type { Metadata, Viewport } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PassWelcome } from "@/components/trip/PassWelcome";
import { getDb } from "@/db/client";
import { trips } from "@/db/schema";
import { currentGuestPass, findPassByToken } from "@/lib/server/tripAccess";
import { formatDateRange } from "@/lib/trip/dates";

export const dynamic = "force-dynamic";

// Link previews (WhatsApp, iMessage) only ever see this — never the trip.
export const metadata: Metadata = { title: "A private pass", robots: { index: false, follow: false } };

export const viewport: Viewport = { themeColor: "#0c0b09", colorScheme: "dark" };

export default async function PassPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const pass = await findPassByToken(token);

  if (pass && !pass.revokedAt) {
    const [trip] = await getDb().select().from(trips).where(eq(trips.id, pass.tripId)).limit(1);
    // Re-opening your own claimed link just takes you in.
    const held = await currentGuestPass();
    if (held && held.id === pass.id) redirect(`/host/trip/${trip.slug}`);
    if (!pass.claimedAt) {
      return <PassWelcome token={token} tripName={trip.name} destination={trip.destination} dates={formatDateRange(trip.startDate, trip.endDate)} label={pass.label} />;
    }
  }

  return (
    <main className="trip trip-luxe flex min-h-[100svh] items-center justify-center px-6">
      <div className="trip-pass-card w-full max-w-sm px-8 py-12 text-center">
        <p className="trip-eyebrow">Private pass</p>
        <h1 className="font-display mt-4 text-3xl font-medium">This pass has been used.</h1>
        <p className="mt-3 text-sm text-[var(--t-muted)]">Each pass opens on one device, once. Ask for a fresh one if you need it on another phone.</p>
      </div>
    </main>
  );
}
