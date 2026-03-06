import { AlertTriangle, Copy, Ban, TrendingUp } from "lucide-react";
import type { AlertRecord } from "@/lib/mock-data";
import { SeverityBadge } from "@/components/StatusBadge";

const alertIcons = {
  anomaly: TrendingUp,
  duplicate: Copy,
  limit_breach: AlertTriangle,
  prohibited: Ban,
};

const severityBorder = {
  critical: "border-l-status-hold",
  high: "border-l-status-alert",
  medium: "border-l-status-validating",
  low: "border-l-status-draft",
};

export function AlertItem({ alert, selected, onClick }: { alert: AlertRecord; selected?: boolean; onClick?: () => void }) {
  const Icon = alertIcons[alert.type];

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 border-l-[3px] ${severityBorder[alert.severity]} bg-card rounded-r-md transition-all cursor-pointer ${
        selected ? "ring-1 ring-primary shadow-sm" : "hover:bg-muted/50"
      }`}
    >
      <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        alert.severity === "critical" || alert.severity === "high" ? "bg-status-hold/8" : "bg-status-validating/8"
      }`}>
        <Icon className={`h-4 w-4 ${
          alert.severity === "critical" || alert.severity === "high" ? "text-status-hold" : "text-status-validating"
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-tight">{alert.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{alert.store}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{alert.expenseCategory}</span>
          <SeverityBadge severity={alert.severity} />
        </div>
      </div>
    </div>
  );
}
