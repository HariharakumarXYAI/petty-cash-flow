import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        draft: "border-status-draft/20 bg-status-draft/10 text-status-draft",
        submitted: "border-status-submitted/20 bg-status-submitted/10 text-status-submitted",
        validating: "border-status-validating/20 bg-status-validating/10 text-status-validating",
        approved: "border-status-approved/20 bg-status-approved/10 text-status-approved",
        alert: "border-status-alert/20 bg-status-alert/10 text-status-alert",
        hold: "border-status-hold/20 bg-status-hold/10 text-status-hold",
        investigation: "border-status-investigation/20 bg-status-investigation/10 text-status-investigation",
        audit: "border-status-audit/20 bg-status-audit/10 text-status-audit",
        settled: "border-status-settled/20 bg-status-settled/10 text-status-settled",
        rejected: "border-status-rejected/20 bg-status-rejected/10 text-status-rejected",
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
