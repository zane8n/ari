/**
 * Contract for a private, time-locked letter (`/letter/<token>`).
 *
 * This repo is public, so the letter itself is never committed: write it in
 * `content/letter.local.ts` (gitignored — copy `letter.example.ts`), then run
 * `pnpm provision:letter`, which stores it in the database and prints the
 * private link. After that the local file is no longer needed by the app.
 */
export type LetterSeed = {
  /** When the letter becomes readable. ISO 8601 with an explicit offset, e.g. 2026-01-01T16:00:00+03:00. */
  unlockAt: string;
  /** The letter, verbatim. Paragraphs are separated by a blank line. */
  body: string;
  /** Optional sign-off shown under the last paragraph, e.g. a first name. */
  signature?: string;
};
