import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { TripApp, type TripTab } from "@/components/trip/TripApp";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";
import { findTripBySlug, loadTripBundle } from "@/lib/server/trip";

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
    appleWebApp: { capable: true, title: "Trip", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#f4efe4" };

export default async function TripPage({ params, searchParams }: Props) {
  const cookieStore = await cookies();
  if (!verifyHostSessionToken(cookieStore.get(HOST_SESSION_COOKIE_NAME)?.value)) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-5">
        <HostLoginForm />
      </main>
    );
  }

  const { slug } = await params;
  const trip = await findTripBySlug(slug);
  if (!trip) notFound();

  const query = await searchParams;
  const tab = TABS.find((t) => t === query.tab);
  const checkin = query.checkin && /^\d{4}-\d{2}-\d{2}$/.test(query.checkin) ? query.checkin : undefined;

  return <TripApp initial={await loadTripBundle(trip)} entry={{ tab, log: query.log === "1", checkin }} />;
}
