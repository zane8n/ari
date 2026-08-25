import { notFound } from "next/navigation";

/** This app has no public landing surface — every real route is a private, token-gated URL. */
export default function Home() {
  notFound();
}
