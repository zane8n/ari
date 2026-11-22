import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { TripApp, type TripTab } from "@/components/trip/TripApp";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { findTripBySlug, loadTripBundle } from "@/lib/server/trip";
import { getTripAccess } from "@/lib/server/tripAccess";

export const dynamic = "force-dynamic";

const TABS: TripTab[] = ["today", "plan", "money", "insights"];

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; log?: string; checkin?: string }>;
};

/** Its own home-screen identity: "Add to Home Screen" from here lands back on this trip, with Log / Check-in shortcuts. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Trip",
    manifest: `/host/trip/${encodeURIComponent(slug)}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Trip", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { themeColor: "#0c0b09", colorScheme: "dark" };

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const trip = await findTripBySlug(slug);
  const access = trip ? await getTripAccess(trip) : null;

  if (!access) {
    if (!trip && (await hasValidHostSession())) notFound();
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-4 px-5">
        <HostLoginForm />
        <p className="max-w-sm text-center text-xs text-ink-muted">Have a pass? Open the link you were sent, in this browser.</p>
      </main>
    );
  }
  if (!trip) notFound();

  const query = await searchParams;
  const tab = TABS.find((t) => t === query.tab);
  const checkin = query.checkin && /^\d{4}-\d{2}-\d{2}$/.test(query.checkin) ? query.checkin : undefined;

  return <TripApp initial={await loadTripBundle(trip)} access={access} entry={{ tab, log: query.log === "1", checkin }} />;
}
