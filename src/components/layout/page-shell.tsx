import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared layout primitives for Edit / Create pages.
 *
 * Reference page: src/pages/StoreEdit.tsx
 * Width token: max-w-[900px] mx-auto (matches the reference exactly).
 */

export const PAGE_MAX_WIDTH = "max-w-[900px] mx-auto";

interface PageShellProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Full-bleed page background + consistent inner padding.
 * Use as the outermost wrapper for any Edit/Create page.
 */
export function PageShell({ header, footer, children, className }: PageShellProps) {
  return (
    <div className={cn("-m-6 min-h-[calc(100vh-4rem)] bg-muted/30 p-8", className)}>
      <div className={cn(PAGE_MAX_WIDTH, "space-y-6")}>
        {header}
        {children}
      </div>
      {footer}
    </div>
  );
}

export function RequiredMark() {
  return <span className="text-destructive">*</span>;
}
