import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormGridProps {
  children: ReactNode;
  /** Column count on md+ screens. Defaults to 2. */
  cols?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, cols = 2, className }: FormGridProps) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 3
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";
  return <div className={cn("grid gap-5", colClass, className)}>{children}</div>;
}

interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

/** Standard vertical stack for label + input + helper. */
export function FormField({ children, className }: FormFieldProps) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
