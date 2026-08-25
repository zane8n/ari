"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useRef, useState, type Dispatch, type MouseEvent } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { wishJokeResponses } from "@/content/response-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { CoinIcon, LetterIcon, MoonIcon, SuitcaseIcon } from "@/components/icons/SceneIcons";
import { SparkleIcon } from "@/components/icons/Decorative";
import { AnimatePresence, animate, m, useReducedMotion } from "@/lib/motion/m";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";
import type { WishOptionId } from "@/lib/experience/ids";

const MAX_MONEY_ATTEMPTS = 3;

export function WishScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const reducedMotion = useReducedMotion();
  const moneyRef = useRef<HTMLButtonElement>(null);
  const [moneyAttempts, setMoneyAttempts] = useState(0);
  const [moneySettledVisual, setMoneySettledVisual] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const moneySettled = moneyAttempts >= MAX_MONEY_ATTEMPTS;

  function playWobble(): void {
    if (!moneyRef.current || reducedMotion) return;
    void animate(
      moneyRef.current,
      { rotate: [0, -11, 9, -7, 5, -2, 0], y: [0, -5, 0, -3, 0] },
      { duration: 0.5, ease: "easeInOut" },
    );
  }

  function playFlop(): void {
    if (!moneyRef.current || reducedMotion) return;
    void animate(
      moneyRef.current,
      { rotate: [0, -14, 10, -3, 0], scale: [1, 0.92, 1.03, 1] },
      { duration: 0.6, ease: "easeInOut" },
    );
  }

  function resolveMoney(isKeyboard: boolean): void {
    if (moneySettled) return;
    const next = moneyAttempts + 1;
    setMoneyAttempts(next);

    if (isKeyboard || next >= MAX_MONEY_ATTEMPTS) {
      setMoneySettledVisual(true);
      playFlop();
      setMessage(wishJokeResponses.money);
      return;
    }

    playWobble();
  }

  function handleMoneyClick(event: MouseEvent<HTMLButtonElement>): void {
    resolveMoney(event.detail === 0);
  }

  function handleJoke(id: Exclude<WishOptionId, "vacation" | "money">): void {
    setMessage(wishJokeResponses[id]);
  }

  return (
    <div className="flex flex-col gap-6 px-4">
      <h1 className="font-display text-[clamp(1.9rem,7vw,2.4rem)] leading-[1.05] text-ink">
        {experienceCopy.wish.question}
      </h1>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          ref={moneyRef}
          type="button"
          onClick={handleMoneyClick}
          disabled={moneySettled}
          aria-disabled={moneySettled}
          className="choice-tile focus-ring relative flex items-center gap-3 px-4 py-3 text-left"
          style={{ opacity: moneySettledVisual ? 0.55 : 1 }}
        >
          <CoinIcon className="h-7 w-7 shrink-0 text-accent-strong" />
          <span className="text-[15.5px] font-semibold text-ink">{experienceCopy.wish.options.money}</span>
        </button>

        <button
          type="button"
          onClick={() => dispatch({ type: "wishConfirmRequested" })}
          className="choice-tile focus-ring flex items-center gap-3 px-4 py-3 text-left"
        >
          <SuitcaseIcon className="h-7 w-7 shrink-0 text-accent-strong" />
          <span className="text-[15.5px] font-semibold text-ink">{experienceCopy.wish.options.vacation}</span>
        </button>

        <button
          type="button"
          onClick={() => handleJoke("love-letter")}
          className="choice-tile focus-ring flex items-center gap-3 px-4 py-3 text-left"
        >
          <LetterIcon className="h-7 w-7 shrink-0 text-accent-strong" />
          <span className="text-[15.5px] font-semibold text-ink">{experienceCopy.wish.options["love-letter"]}</span>
        </button>

        <button
          type="button"
          onClick={() => handleJoke("peace-and-sleep")}
          className="choice-tile focus-ring flex items-center gap-3 px-4 py-3 text-left"
        >
          <MoonIcon className="h-7 w-7 shrink-0 text-accent-strong" />
          <span className="text-[15.5px] font-semibold text-ink">{experienceCopy.wish.options["peace-and-sleep"]}</span>
        </button>
      </div>

      <div aria-live="polite" className="flex min-h-[5rem] items-center justify-center">
        <AnimatePresence mode="wait">
          {message && (
            <m.div
              key={message}
              initial={{ opacity: 0, scale: 0.65, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 380, damping: 16 }}
              className="shimmer-pop relative flex items-center gap-3 border px-5 py-4 text-center"
              style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
            >
              <SparkleIcon className="h-5 w-5 shrink-0 text-accent-strong" />
              <p className="font-display text-xl leading-snug text-ink">{message}</p>
              <SparkleIcon className="h-5 w-5 shrink-0 text-accent-strong" />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog.Root open={state.stage === "wishConfirm"}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className="fixed inset-0 z-50"
            style={{ background: "color-mix(in oklab, var(--accent-strong) 38%, transparent)" }}
          />
          {/*
            Anchored from top-1/2 with a translate, on every breakpoint —
            not bottom-4 on mobile. iOS Safari's dynamic toolbar makes the
            visual viewport's bottom edge unstable mid-interaction, which put
            a bottom-anchored sheet fully off-screen on a real iPhone. The
            top-anchored center is stable regardless, and max-height plus
            scroll is a safety net for short viewports.
          */}
          {/*
            !fixed: .aura-panel-solid itself sets `position: relative`, and
            since that custom class rule compiles after Tailwind's utilities
            in source order, plain `fixed` loses the cascade at equal
            specificity — the dialog silently rendered `position: relative`
            in normal document flow (this, not any iOS-specific quirk, is
            what put it far off-screen). `!fixed` forces the win.
          */}
          <AlertDialog.Content className="aura-panel-solid !fixed inset-x-4 top-1/2 z-50 max-h-[calc(100svh-2rem)] -translate-y-1/2 overflow-y-auto px-7 py-8 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2">
            <AlertDialog.Title className="font-display text-[1.9rem] leading-tight text-ink">
              {experienceCopy.wishConfirm.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-base text-ink-muted">
              {experienceCopy.wishConfirm.body}
            </AlertDialog.Description>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
              <AlertDialog.Action asChild>
                <GlassAction
                  variant="primary"
                  trailingArrow
                  onClick={() => dispatch({ type: "wishConfirmed", at: new Date().toISOString() })}
                >
                  {experienceCopy.wishConfirm.confirm}
                </GlassAction>
              </AlertDialog.Action>
              <AlertDialog.Cancel asChild>
                <GlassAction variant="secondary" onClick={() => dispatch({ type: "wishConfirmDismissed" })}>
                  {experienceCopy.wishConfirm.cancel}
                </GlassAction>
              </AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
