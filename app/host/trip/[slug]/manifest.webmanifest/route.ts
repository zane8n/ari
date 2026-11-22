import { NextResponse } from "next/server";

/**
 * Per-trip web manifest. Deliberately unauthenticated and DB-free — browsers
 * fetch manifests without cookies — so it echoes only the slug already in
 * the URL and a generic name, revealing nothing about whether the trip exists.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const base = `/host/trip/${slug}`;
  return NextResponse.json(
    {
      name: "Trip",
      short_name: "Trip",
      start_url: base,
      scope: base,
      display: "standalone",
      background_color: "#fbf2f8",
      theme_color: "#fbf2f8",
      icons: [],
      shortcuts: [
        { name: "Log a spend", short_name: "Log", url: `${base}?log=1` },
        { name: "Money", url: `${base}?tab=money` },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
