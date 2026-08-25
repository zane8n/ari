"use client";

import { forwardRef, type ReactNode } from "react";
import { m, type HTMLMotionProps } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";

type GlassActionProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary";
  trailingArrow?: boolean;
  children: ReactNode;
};

export const GlassAction = forwardRef<HTMLButtonElement, GlassActionProps>(function GlassAction(
  { variant = "primary", trailingArrow = false, className = "", children, disabled, ...props },
  ref,
) {
  const base = variant === "primary" ? "action-primary" : "action-secondary";
  return (
    <m.button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`focus-ring w-full sm:w-auto ${base} ${className}`}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={motionTokens.micro}
      {...props}
    >
      <span>{children}</span>
      {trailingArrow && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h13M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </m.button>
  );
});
