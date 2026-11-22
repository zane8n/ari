import { cookies } from "next/headers";
import Link from "next/link";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { ImportTrip } from "@/components/trip/ImportTrip";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";

export const dynamic = "force-dynamic";

export default async function ImportTripPage() {
  if (!verifyHostSessionToken((await cookies()).get(HOST_SESSION_COOKIE_NAME)?.value)) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-5">
        <HostLoginForm />
      </main>
    );
  }
  return (
    <main className="trip trip-luxe">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
        <Link href="/host/trip?all=1" className="trip-eyebrow">
          ← Trips
        </Link>
        <h1 className="font-display text-4xl font-medium">Add a trip</h1>
        <ImportTrip />
      </div>
    </main>
  );
}
