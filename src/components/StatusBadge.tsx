import { Badge } from "@/components/ui/badge";
import { type ClaimStatus, statusToBadgeVariant } from "@/lib/mock-data";

interface StatusBadgeProps {
  status: ClaimStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusToBadgeVariant[status] as any;
  return <Badge variant={variant}>{status}</Badge>;
}
