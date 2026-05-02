import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Info, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_CLAIMS } from "@/data/mockClaims";
import { applyScope, getDefaultScope } from "@/lib/scope";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Approvals() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const scope = useMemo(() => (user ? getDefaultScope(user) : null), [user]);

  // Auto-approved claims at this user's scope (preview while MVP2 is not live).
  const previewRows = useMemo(() => {
    if (!user || !scope) return [];
    return applyScope(MOCK_CLAIMS, scope, user)
      .filter((c) => c.status === "Approved" || c.status === "Approved with Alert")
      .slice(0, 10);
  }, [user, scope]);

  const storeLabel = user?.scope?.label ?? "your store";

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            {storeLabel} · Pending your decision
          </p>
        </div>
      </div>

      {/* MVP2 banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 p-3 flex gap-3">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-300 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">
          <strong>Approval workflow launches in MVP2</strong> — for now, claims
          auto-approve based on validation rules. This page will activate once
          multi-tier approval is live. Below is a preview of recent
          auto-approved claims at your scope.
        </div>
      </div>

      {/* Empty pending queue placeholder */}
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-status-approved mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">No claims awaiting your approval</p>
        <p className="text-xs text-muted-foreground mt-1">
          Approve / Reject actions will appear here in MVP2.
        </p>
      </div>

      {/* Preview: recent auto-approved at scope */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">
            Recent auto-approved at {storeLabel}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Preview only — no action required.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Claim #</TableHead>
              <TableHead className="section-label">Submitter</TableHead>
              <TableHead className="section-label">Expense</TableHead>
              <TableHead className="section-label text-right">Amount</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label">Date</TableHead>
              <TableHead className="section-label text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No recent auto-approved claims at your scope.
                </TableCell>
              </TableRow>
            ) : (
              previewRows.map((c) => (
                <TableRow
                  key={c.claim_no}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => navigate(`/claims/${c.claim_no}`)}
                >
                  <TableCell className="font-mono text-xs">{c.claim_no}</TableCell>
                  <TableCell className="text-sm">{c.submitter_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate" title={c.expense_type}>
                    {c.expense_type}
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                    {c.amount.toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-muted-foreground">THB</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300 px-2 py-0.5 text-[11px] font-medium">
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateDMY(c.transaction_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button size="sm" variant="outline" disabled className="h-7 text-xs">Approve</Button>
                      <Button size="sm" variant="outline" disabled className="h-7 text-xs">Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
