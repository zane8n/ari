"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LetterExperienceProps = {
  token: string;
  letterId: string;
  unlockAtMs: number;
  serverNowMs: number;
  /** e.g. "4:00 PM today" — formatted on the server in the letter's own timezone. */
  opensAtLabel: string;
  dateLabel: string;
  /** null until the lock lifts: the server never sends the body early. */
  pages: string[][] | null;
  signature: string | null;
};

type View = "cover" | "reading" | "finished";

function clockParts(ms: number): [string, string, string] {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    pad(Math.floor(total / 3600)),
    pad(Math.floor((total % 3600) / 60)),
    pad(total % 60),
  ];
}

const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={back ? { transform: "scaleX(-1)" } : undefined}
  >
    <path
      d="M4 12h15M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Fleuron = () => (
  <span className="letter-fleuron" aria-hidden="true">
    <i />
  </span>
);

function readSavedPage(key: string, pageCount: number): number {
  try {
    const saved = Number(window.localStorage.getItem(key));
    return Number.isInteger(saved) && saved > 0 && saved < pageCount
      ? saved
      : 0;
  } catch {
    return 0;
  }
}

function savePage(key: string, page: number): void {
  try {
    window.localStorage.setItem(key, String(page));
  } catch {
    // Private mode / blocked storage — she simply starts from page one next time.
  }
}

export function LetterExperience({
  token,
  letterId,
  unlockAtMs,
  serverNowMs,
  opensAtLabel,
  dateLabel,
  pages,
  signature,
}: LetterExperienceProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("cover");
  const [page, setPage] = useState(0);
  const [nowMs, setNowMs] = useState(serverNowMs);
  const topRef = useRef<HTMLDivElement>(null);
  const storageKey = `letter:${letterId}:page`;

  const locked = pages === null;
  const remainingMs = unlockAtMs - nowMs;
  const due = locked && remainingMs <= 0;

  // Tick against the server's clock, not the device's — a wrong phone clock
  // must neither tease an early opening nor hold the letter back.
  useEffect(() => {
    if (!locked) return;
    const offset = serverNowMs - Date.now();
    const timer = window.setInterval(() => setNowMs(Date.now() + offset), 1000);
    return () => window.clearInterval(timer);
  }, [locked, serverNowMs]);

  // The moment arrives while she is waiting on the page: ask the server for the letter.
  useEffect(() => {
    if (!due) return;
    router.refresh();
    const retry = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(retry);
  }, [due, router]);

  function report(event: "opened" | "finished"): void {
    void fetch(`/api/letter/${token}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  }

  function showTop(): void {
    window.scrollTo({ top: 0 });
    window.requestAnimationFrame(() =>
      topRef.current?.focus({ preventScroll: true }),
    );
  }

  function goTo(next: number): void {
    setPage(next);
    savePage(storageKey, next);
    showTop();
  }

  function open(fromStart = false): void {
    if (!pages) return;
    const start = fromStart ? 0 : readSavedPage(storageKey, pages.length);
    setPage(start);
    if (fromStart) savePage(storageKey, 0);
    setView("reading");
    report("opened");
    showTop();
  }

  function finish(): void {
    report("finished");
    savePage(storageKey, 0);
    setView("finished");
    showTop();
  }

  if (view === "reading" && pages) {
    const isFirst = page === 0;
    const isLast = page === pages.length - 1;
    const paragraphs = pages[page];
    return (
      <main className="letter-root flex flex-col items-center px-4 pt-6 pb-10 sm:px-6 sm:pt-12">
        <div
          ref={topRef}
          tabIndex={-1}
          className="flex w-full max-w-[40rem] flex-1 flex-col"
          aria-label={`Page ${page + 1} of ${pages.length}`}
        >
          <div className="flex items-center gap-4">
            <div className="letter-progress" aria-hidden="true">
              {pages.map((_, index) => (
                <span
                  key={index}
                  data-state={
                    index < page ? "read" : index === page ? "current" : "ahead"
                  }
                />
              ))}
            </div>
            <p className="letter-folio" aria-live="polite">
              {page + 1} of {pages.length}
            </p>
          </div>

          <div key={page} className="letter-stack letter-enter mt-5">
            <article className="letter-sheet px-7 pt-10 pb-11 sm:px-14 sm:pt-14 sm:pb-16">
              {isFirst && <p className="letter-date mb-7">{dateLabel}</p>}
              <div
                className={`letter-body${isFirst ? " letter-body--opening" : ""}`}
              >
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      isLast &&
                      index === paragraphs.length - 1 &&
                      index > 0 &&
                      paragraph.length < 80
                        ? "letter-closing"
                        : undefined
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {isLast && signature && (
                <p className="letter-signature mt-6">{signature}</p>
              )}
              {!isLast && (
                <div className="mt-10">
                  <Fleuron />
                </div>
              )}
            </article>
          </div>

          <nav
            className="mt-8 flex items-center justify-between gap-3"
            aria-label="Letter pages"
          >
            {isFirst ? (
              <span />
            ) : (
              <button
                type="button"
                className="letter-link focus-ring"
                onClick={() => goTo(page - 1)}
              >
                <Arrow back />
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                className="letter-button letter-button--onwash focus-ring"
                onClick={finish}
              >
                I&rsquo;ve read it all
              </button>
            ) : (
              <button
                type="button"
                className="letter-button letter-button--onwash focus-ring"
                onClick={() => goTo(page + 1)}
              >
                Continue
                <Arrow />
              </button>
            )}
          </nav>
        </div>
      </main>
    );
  }

  if (view === "finished") {
    return (
      <main className="letter-root flex items-center justify-center px-5 py-10">
        <div ref={topRef} tabIndex={-1} className="letter-cover letter-enter">
          <Fleuron />
          <p className="letter-meta mt-7">End of the letter</p>
          <button
            type="button"
            className="letter-link focus-ring mt-6"
            onClick={() => open(true)}
          >
            Read it again
          </button>
        </div>
      </main>
    );
  }

  const [hours, minutes, seconds] = clockParts(remainingMs);

  return (
    <main className="letter-root flex items-center justify-center px-5 py-10">
      <div className="letter-cover letter-enter">
        <Fleuron />
        <h1 className="letter-title mt-9">I had a few things to say.</h1>

        <div className="mt-12 flex w-full flex-col items-center gap-5">
          {locked ? (
            <>
              <p className="letter-opens">It opens at {opensAtLabel}.</p>
              <div
                className="letter-clock"
                role="timer"
                aria-label={
                  due
                    ? "Opening"
                    : `Opens in ${hours} hours ${minutes} minutes ${seconds} seconds`
                }
              >
                <div>
                  <b>{hours}</b>
                  <small>hrs</small>
                </div>
                <span aria-hidden="true">:</span>
                <div>
                  <b>{minutes}</b>
                  <small>min</small>
                </div>
                <span aria-hidden="true">:</span>
                <div>
                  <b>{seconds}</b>
                  <small>sec</small>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="letter-button focus-ring"
              onClick={() => open()}
            >
              Open the letter
              <Arrow />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
