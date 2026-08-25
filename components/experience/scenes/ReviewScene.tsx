"use client";

import type { Dispatch, ReactNode } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { getTheme } from "@/lib/theme/themes";
import { canReachAgreement } from "@/lib/experience/guards";
import { m } from "@/lib/motion/m";
import type { EditableStage, ExperienceAction, ExperienceState } from "@/lib/experience/types";

function EditGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20l1-4.5L16.5 4 20 7.5 8.5 19 4 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReviewRow({
  index,
  label,
  value,
  editLabel,
  onEdit,
  chip,
}: {
  index: number;
  label: string;
  value: string;
  editLabel: string;
  onEdit: () => void;
  chip?: ReactNode;
}) {
  return (
    <m.div
      className="flex items-center justify-between gap-3 border-b py-3 last:border-0"
      style={{ borderColor: "var(--hairline)" }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.055 }}
    >
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-ink-muted uppercase">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {chip}
          <p className="truncate text-[15px] font-medium text-ink">{value || "—"}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="focus-ring shrink-0 rounded-full p-2 text-ink-muted hover:text-ink"
      >
        <EditGlyph />
      </button>
    </m.div>
  );
}

export function ReviewScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const theme = state.themeId ? getTheme(state.themeId) : null;
  const canConfirm = canReachAgreement(state);

  function edit(stage: EditableStage): void {
    dispatch({ type: "editRequested", fromStage: stage });
  }

  const rows = [
    { label: "Name", value: state.preferredName, editLabel: experienceCopy.review.editLabels.preferredName, stage: "name" as const },
    {
      label: "Colour",
      value: theme?.displayName ?? "",
      editLabel: experienceCopy.review.editLabels.theme,
      stage: "theme" as const,
      chip: (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border"
          style={{ background: theme?.accent, borderColor: "var(--hairline)" }}
        />
      ),
    },
    {
      label: "Birthday wish",
      value: state.birthdayWish ? experienceCopy.wish.options.vacation : "",
      editLabel: experienceCopy.review.editLabels.birthdayWish,
      stage: "wish" as const,
    },
    {
      label: "Being spoiled",
      value: state.spoilModes.map((id) => experienceCopy.spoilModes.options[id]).join(", "),
      editLabel: experienceCopy.review.editLabels.spoilModes,
      stage: "spoilModes" as const,
    },
    {
      label: "Travel personality",
      value: state.travelPersona ? experienceCopy.travelPersona.options[state.travelPersona] : "",
      editLabel: experienceCopy.review.editLabels.travelPersona,
      stage: "travelPersona" as const,
    },
    {
      label: "One thing I must not get wrong",
      value:
        state.mustNotMiss?.kind === "surprise"
          ? experienceCopy.mustNotMiss.surpriseOption
          : (state.mustNotMiss?.value ?? ""),
      editLabel: experienceCopy.review.editLabels.mustNotMiss,
      stage: "mustNotMiss" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-4">
      <div>
        <p className="text-xs tracking-wide text-accent-strong uppercase">{experienceCopy.review.heading}</p>
        <h1 className="mt-1 font-display text-[clamp(1.7rem,6vw,2.1rem)] leading-[1.05] text-ink">
          {experienceCopy.review.body}
        </h1>
      </div>

      <div>
        {rows.map((row, index) => (
          <ReviewRow
            key={row.label}
            index={index}
            label={row.label}
            value={row.value}
            editLabel={row.editLabel}
            onEdit={() => edit(row.stage)}
            chip={"chip" in row ? row.chip : undefined}
          />
        ))}
      </div>

      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!canConfirm}
        onClick={() => dispatch({ type: "agreementConfirmed", at: new Date().toISOString() })}
        className="self-end"
      >
        {experienceCopy.review.confirmAction}
      </GlassAction>
    </div>
  );
}
