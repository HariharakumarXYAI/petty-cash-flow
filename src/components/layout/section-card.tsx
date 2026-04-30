import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot in the section header (e.g. read-only badge). */
  headerAside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * White card with rounded border + generous padding.
 * One SectionCard = one visual block. Do NOT nest SectionCards.
 */
export function SectionCard({
  title,
  description,
  headerAside,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn("bg-card rounded-lg border p-8 space-y-5", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {headerAside}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
