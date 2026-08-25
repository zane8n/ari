import { Cormorant_Garamond, Parisienne, Quicksand } from "next/font/google";

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
