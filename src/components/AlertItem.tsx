import { AlertTriangle, Copy, Ban, TrendingUp } from "lucide-react";
import type { Alert } from "@/lib/mock-data";

const alertIcons = {
  anomaly: TrendingUp,
  duplicate: Copy,
  limit_breach: AlertTriangle,
  prohibited: Ban,
};

const severityColors = {
  high: "border-l-status-hold",
  medium: "border-l-status-alert",
  low: "border-l-status-draft",
};

export function AlertItem({ alert }: { alert: Alert }) {
  const Icon = alertIcons[alert.type];

  return (
    <div className={`flex items-start gap-3 p-3 border-l-2 ${severityColors[alert.severity]} bg-card rounded-r-md hover:bg-muted/50 transition-colors cursor-pointer`}>
      <div className={`mt-0.5 h-7 w-7 rounded flex items-center justify-center shrink-0 ${
        alert.severity === "high" ? "bg-status-hold/10" : "bg-status-alert/10"
      }`}>
        <Icon className={`h-3.5 w-3.5 ${
          alert.severity === "high" ? "text-status-hold" : "text-status-alert"
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-tight">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.store} · {alert.country}</p>
      </div>
    </div>
  );
}
