import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
  onClick?: () => void;
}

const iconBg = {
  default: "bg-primary/8",
  warning: "bg-status-validating/10",
  danger: "bg-status-hold/10",
  success: "bg-status-approved/10",
};

const iconColor = {
  default: "text-primary",
  warning: "text-status-validating",
  danger: "text-status-hold",
  success: "text-status-approved",
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className, onClick }: MetricCardProps) {
  return (
    <div className={cn("metric-card", onClick && "cursor-pointer", className)} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="section-label">{title}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg[variant])}>
          <Icon className={cn("h-5 w-5", iconColor[variant])} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-xs">
          <span className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            trend.value >= 0 ? "text-status-approved" : "text-status-hold"
          )}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
