import { notFound } from "next/navigation";
import { LetterExperience } from "@/components/letter/LetterExperience";
import { paginateLetter } from "@/lib/letter/paginate";
import { findLetterByToken, isLetterUnlocked } from "@/lib/server/letters";

export const dynamic = "force-dynamic";

/** The letter is written from, and read in, Kenya — times are shown in that zone whatever the device says. */
const LETTER_TIME_ZONE = "Africa/Nairobi";

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LETTER_TIME_ZONE }).format(date);
}

function describeOpening(unlockAt: Date, now: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: LETTER_TIME_ZONE,
  }).format(unlockAt);
  if (dayKey(unlockAt) === dayKey(now)) return `${time} today`;
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: LETTER_TIME_ZONE,
  }).format(unlockAt);
  return `${time} on ${day}`;
}

export default async function LetterPage({ params }: PageProps<"/letter/[token]">) {
  const { token } = await params;
  const letter = await findLetterByToken(token);
  if (!letter) notFound();

  const now = new Date();
  const unlocked = isLetterUnlocked(letter, now);

  return (
    <LetterExperience
      token={token}
      letterId={letter.id}
      unlockAtMs={letter.unlockAt.getTime()}
      serverNowMs={now.getTime()}
      opensAtLabel={describeOpening(letter.unlockAt, now)}
      dateLabel={new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: LETTER_TIME_ZONE,
      }).format(letter.unlockAt)}
      // The body only ever leaves the server once the lock has lifted.
      pages={unlocked ? paginateLetter(letter.body) : null}
      signature={unlocked ? letter.signature : null}
    />
  );
}
