"use client";

import { useState, type ReactNode } from "react";
import { loverAgreementV1 } from "@/content/agreement-v1";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { SealIcon } from "@/components/icons/SceneIcons";
import {
  paginateAgreementBlocks,
  parseAgreementBlocks,
  tokensToPlainText,
  type AgreementBlock,
  type InlineToken,
} from "@/lib/agreement/parse";
import { AnimatePresence, m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";

function renderTokens(tokens: InlineToken[], name: string): ReactNode {
  return tokens.map((token, index) => {
    if (token.type === "text") return <span key={index}>{token.value}</span>;
    if (token.type === "name") return <span key={index}>{name}</span>;
    if (token.type === "bold") return <strong key={index}>{renderTokens(token.children, name)}</strong>;
    return <em key={index}>{renderTokens(token.children, name)}</em>;
  });
}

/** "Fine print" and "Final warning" read as a wall of prose otherwise — each paragraph becomes its own marked clause. */
function ClauseParagraph({ tokens, name, clauseNumber }: { tokens: InlineToken[]; name: string; clauseNumber: number }) {
  return (
    <div
      className="parchment-ink flex gap-3 border-t pt-3 text-[15px] leading-relaxed first:border-t-0 first:pt-0"
      style={{ borderColor: "#b4903f40" }}
    >
      <span className="font-display text-base text-[#b4903f] italic">{String.fromCharCode(96 + clauseNumber)}.</span>
      <p>{renderTokens(tokens, name)}</p>
    </div>
  );
}

function renderBlock(block: AgreementBlock, index: number, name: string, isClausePage: boolean, clauseNumber: number): ReactNode {
  if (block.type === "h3") {
    return (
      <h1 key={index} className="parchment-ink font-display text-[1.7rem] leading-tight">
        {renderTokens(block.tokens, name)}
      </h1>
    );
  }
  if (block.type === "h4") {
    return (
      <h2 key={index} className="parchment-ink font-display text-lg">
        {renderTokens(block.tokens, name)}
      </h2>
    );
  }
  if (block.type === "h5") {
    return (
      <h3 key={index} className="text-sm font-semibold tracking-wide text-accent-strong uppercase">
        {renderTokens(block.tokens, name)}
      </h3>
    );
  }
  if (block.type === "list") {
    return (
      <ol key={index} className="parchment-ink flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderTokens(item, name)}</li>
        ))}
      </ol>
    );
  }
  if (isClausePage) {
    return <ClauseParagraph key={index} tokens={block.tokens} name={name} clauseNumber={clauseNumber} />;
  }
  return (
    <p key={index} className="parchment-ink text-[15px] leading-relaxed">
      {renderTokens(block.tokens, name)}
    </p>
  );
}

export function LoverAgreement({
  preferredName,
  acknowledged,
  onAcknowledgedChange,
  onSign,
  readOnly = false,
}: {
  preferredName: string;
  acknowledged: boolean;
  onAcknowledgedChange?: (checked: boolean) => void;
  onSign?: () => void;
  readOnly?: boolean;
}) {
  const [legalMessage, setLegalMessage] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pages = paginateAgreementBlocks(parseAgreementBlocks(loverAgreementV1.markdown));
  const name = preferredName || "you";
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === pages.length - 1;

  const currentPage = pages[pageIndex];
  const currentHeading = currentPage.find((block) => block.type === "h4");
  const currentHeadingText =
    currentHeading && "tokens" in currentHeading ? tokensToPlainText(currentHeading.tokens, name) : "";
  const isClausePage = currentHeadingText === "Fine print" || currentHeadingText === "Final warning";
  const clauseNumbers = currentPage.reduce<number[]>((acc, block) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(block.type === "p" && isClausePage ? previous + 1 : previous);
    return acc;
  }, []);

  return (
    <div className="parchment-panel flex flex-col gap-6 px-6 py-9 sm:px-10">
      <div className="relative flex items-center justify-between">
        <SealIcon className="h-7 w-7 shrink-0 text-accent-strong" style={{ transform: "rotate(-6deg)" }} />
        <p className="parchment-ink-muted tabular-nums text-xs tracking-wide uppercase">
          Page {pageIndex + 1} of {pages.length}
        </p>
      </div>

      <div className="relative min-h-[40vh]">
        <AnimatePresence mode="wait">
          <m.div
            key={pageIndex}
            className="flex flex-col gap-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: motionTokens.component.ease }}
          >
            {currentPage.map((block, index) => renderBlock(block, index, name, isClausePage, clauseNumbers[index]))}
          </m.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <GlassAction variant="secondary" onClick={() => setPageIndex((i) => i - 1)} disabled={isFirstPage}>
          {experienceCopy.agreement.previousPage}
        </GlassAction>
        {!isLastPage && (
          <GlassAction variant="primary" trailingArrow onClick={() => setPageIndex((i) => i + 1)}>
            {experienceCopy.agreement.nextPage}
          </GlassAction>
        )}
      </div>

      {!readOnly && isLastPage && (
        <m.div
          className="relative mt-2 flex flex-col gap-5 border-t pt-6"
          style={{ borderColor: "#b4903f40" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionTokens.component.ease }}
        >
          <label className="parchment-ink flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => onAcknowledgedChange?.(event.target.checked)}
              className="mt-0.5 h-5 w-5 accent-[var(--accent)]"
            />
            {experienceCopy.agreement.acknowledgement}
          </label>

          <p aria-live="polite" className="parchment-ink-muted min-h-[1.25rem] text-sm">
            {legalMessage}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <GlassAction variant="primary" trailingArrow disabled={!acknowledged} onClick={onSign}>
              {experienceCopy.agreement.signAction}
            </GlassAction>
            <GlassAction variant="secondary" onClick={() => setLegalMessage(experienceCopy.agreement.legalResponse)}>
              {experienceCopy.agreement.legalAction}
            </GlassAction>
          </div>
        </m.div>
      )}
    </div>
  );
}
