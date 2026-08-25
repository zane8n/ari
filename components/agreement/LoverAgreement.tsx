"use client";

import { useState, type ReactNode } from "react";
import { loverAgreementV1 } from "@/content/agreement-v1";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { SealIcon } from "@/components/icons/SceneIcons";
import { paginateAgreementBlocks, parseAgreementBlocks, type AgreementBlock, type InlineToken } from "@/lib/agreement/parse";
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

function renderBlock(block: AgreementBlock, index: number, name: string): ReactNode {
  if (block.type === "h3") {
    return (
      <h1 key={index} className="font-display text-[1.7rem] leading-tight text-ink">
        {renderTokens(block.tokens, name)}
      </h1>
    );
  }
  if (block.type === "h4") {
    return (
      <h2 key={index} className="font-display text-lg text-ink">
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
      <ol key={index} className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed text-ink">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderTokens(item, name)}</li>
        ))}
      </ol>
    );
  }
  return (
    <p key={index} className="text-[15px] leading-relaxed text-ink">
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

  return (
    <div className="aura-panel-solid flex flex-col gap-6 px-6 py-9 sm:px-10">
      <div className="flex items-center justify-between">
        <SealIcon className="h-7 w-7 shrink-0 text-accent-strong" style={{ transform: "rotate(-6deg)" }} />
        <p className="tabular-nums text-xs tracking-wide text-ink-muted uppercase">
          Page {pageIndex + 1} of {pages.length}
        </p>
      </div>

      <div className="min-h-[40vh]">
        <AnimatePresence mode="wait">
          <m.div
            key={pageIndex}
            className="flex flex-col gap-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: motionTokens.component.ease }}
          >
            {pages[pageIndex].map((block, index) => renderBlock(block, index, name))}
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
          className="mt-2 flex flex-col gap-5 border-t pt-6"
          style={{ borderColor: "var(--hairline)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionTokens.component.ease }}
        >
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => onAcknowledgedChange?.(event.target.checked)}
              className="mt-0.5 h-5 w-5 accent-[var(--accent)]"
            />
            {experienceCopy.agreement.acknowledgement}
          </label>

          <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink-muted">
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
