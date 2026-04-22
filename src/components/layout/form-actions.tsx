import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PAGE_MAX_WIDTH } from "./page-shell";

interface FormActionsProps {
  /** Cancel / discard slot (left of primary). */
  secondary?: ReactNode;
  /** Save / Create slot — must use design-system primary button (default Button). */
  primary: ReactNode;
  /** Sticky footer pinned to bottom of viewport. Default: inline (right-aligned). */
  sticky?: boolean;
  className?: string;
}

/**
 * Right-aligned action bar for Edit/Create pages.
 *
 * Use the default `Button` component (no variant) for the primary action so it
 * picks up the design-system primary token. Do NOT pass literal bg-blue-600,
 * bg-foreground, or bg-destructive.
 */
export function FormActions({ secondary, primary, sticky, className }: FormActionsProps) {
  if (sticky) {
    return (
      <div
        className={cn(
          "sticky bottom-0 left-0 right-0 -mx-8 -mb-8 mt-6 bg-background border-t px-8 py-4 z-10",
          className,
        )}
      >
        <div className={cn(PAGE_MAX_WIDTH, "flex items-center justify-end gap-3")}>
          {secondary}
          {primary}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-end gap-3 pb-6", className)}>
      {secondary}
      {primary}
    </div>
  );
}
