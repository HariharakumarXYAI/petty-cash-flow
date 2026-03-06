import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "alert" | "success";
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          variant === "alert" ? "bg-status-hold/10" :
          variant === "success" ? "bg-status-approved/10" :
          "bg-primary/10"
        }`}>
          <Icon className={`h-4 w-4 ${
            variant === "alert" ? "text-status-hold" :
            variant === "success" ? "text-status-approved" :
            "text-primary"
          }`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.value >= 0 ? "text-status-approved" : "text-status-hold"}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
