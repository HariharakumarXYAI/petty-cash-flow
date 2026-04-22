import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PAGE_MAX_WIDTH } from "./page-shell";

interface FormActionsProps {
  /** Cancel slot (always labeled "Cancel" — never "Discard"). */
  secondary?: ReactNode;
  /**
   * Optional tertiary slot rendered between secondary and primary.
   * Use sparingly (e.g. "Save Draft" on wizard pages).
   */
  tertiary?: ReactNode;
  /** Save / Create slot — must use design-system primary <Button> (no variant). */
  primary: ReactNode;
  /** Pin to bottom of viewport. Default: inline (right-aligned). */
  sticky?: boolean;
  /**
   * When true, shows muted "You have unsaved changes" text on the left.
   * No badges, no pulsing dots, no icons. Ever.
   */
  isDirty?: boolean;
  className?: string;
}

/**
 * Right-aligned action bar for Edit/Create pages.
 *
 * Conventions enforced by docs (not code):
 *   - Edit pages:   secondary="Cancel"  primary="Save Changes"
 *   - Create pages: secondary="Cancel"  primary="Create <Entity>"
 *   - Never use "Discard" as a label.
 *   - Never put icons on Cancel / Save / Create buttons here.
 *   - Never use literal bg-blue-600 / bg-foreground / bg-destructive
 *     on the primary button — use the default <Button>.
 */
export function FormActions({
  secondary,
  tertiary,
  primary,
  sticky,
  isDirty,
  className,
}: FormActionsProps) {
  const dirtyText = isDirty ? (
    <span className="text-xs text-muted-foreground">You have unsaved changes</span>
  ) : null;

  const inner = (
    <div className={cn(PAGE_MAX_WIDTH, "flex items-center justify-between gap-3")}>
      <div className="flex items-center">{dirtyText}</div>
      <div className="flex items-center gap-3">
        {secondary}
        {tertiary}
        {primary}
      </div>
    </div>
  );

  if (sticky) {
    return (
      <div
        className={cn(
          "sticky bottom-0 left-0 right-0 -mx-8 -mb-8 mt-6 bg-background border-t px-8 py-4 z-10",
          className,
        )}
      >
        {inner}
      </div>
    );
  }

  return <div className={cn("pb-6", className)}>{inner}</div>;
}
