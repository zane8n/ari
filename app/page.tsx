import { notFound } from "next/navigation";

// Nonce-based CSP requires dynamic rendering (a static page has no request
// to draw a fresh nonce from, so its scripts would carry none at all).
export const dynamic = "force-dynamic";

/** This app has no public landing surface — every real route is a private, token-gated URL. */
export default function Home() {
  notFound();
}
