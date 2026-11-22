import { Cormorant_Garamond, Jost, Parisienne, Quicksand } from "next/font/google";

/** Romantic, mystical display serif — headlines, questions, the reveal. */
export const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

/** Flowing script accent — spent sparingly: names, the signature, the brand mark. */
export const script = Parisienne({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
  weight: ["400"],
});

/** Warm, soft-terminal body/UI face. */
export const body = Quicksand({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Trip tracker UI face — a crisp geometric sans for a quieter, more editorial register than the invitation's. */
export const ui = Jost({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});
