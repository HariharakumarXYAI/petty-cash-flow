import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        draft: "border-transparent bg-status-draft/15 text-status-draft",
        submitted: "border-transparent bg-status-submitted/15 text-status-submitted",
        validating: "border-transparent bg-status-validating/15 text-status-validating",
        approved: "border-transparent bg-status-approved/15 text-status-approved",
        alert: "border-transparent bg-status-alert/15 text-status-alert",
        hold: "border-transparent bg-status-hold/15 text-status-hold",
        investigation: "border-transparent bg-status-investigation/15 text-status-investigation",
        audit: "border-transparent bg-status-audit/15 text-status-audit",
        settled: "border-transparent bg-status-settled/15 text-status-settled",
        rejected: "border-transparent bg-status-rejected/15 text-status-rejected",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
