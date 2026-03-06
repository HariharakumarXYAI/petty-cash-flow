import { Badge } from "@/components/ui/badge";
import { type ClaimStatus, statusToBadgeVariant, type BadgeVariant } from "@/lib/mock-data";

interface StatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusToBadgeVariant[status] as BadgeVariant;
  return <Badge variant={variant} className={className}>{status}</Badge>;
}

// Reusable for other entity statuses
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, BadgeVariant> = {
    critical: "rejected",
    high: "hold",
    medium: "alert",
    low: "draft",
  };
  return <Badge variant={map[severity] || "draft"}>{severity}</Badge>;
}

export function AuditStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Requested": "submitted",
    "Shipped": "validating",
    "Received": "audit",
    "Under Review": "investigation",
    "Finding Recorded": "alert",
    "Completed": "approved",
  };
  return <Badge variant={map[status] || "draft"}>{status}</Badge>;
}

export function AdvanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Open": "submitted",
    "Partially Settled": "validating",
    "Settled": "settled",
    "Overdue": "hold",
    "Blocked": "rejected",
  };
  return <Badge variant={map[status] || "draft"}>{status}</Badge>;
}

export function InvestigationStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Open": "submitted",
    "In Progress": "investigation",
    "Pending Evidence": "validating",
    "Resolved": "approved",
    "Escalated": "hold",
  };
  return <Badge variant={map[status] || "draft"}>{status}</Badge>;
}

export function AlertStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Open": "hold",
    "In Progress": "investigation",
    "Escalated": "rejected",
    "Closed": "settled",
  };
  return <Badge variant={map[status] || "draft"}>{status}</Badge>;
}
