import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Wallet, Clock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { advances, stores } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdvanceStatusBadge } from "@/components/StatusBadge";

export function StoreUserAdvances() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const storeName = useMemo(() => {
    if (!user?.store_id) return user?.scope?.label ?? "your store";
    return stores.find((s) => s.id === user.store_id)?.name ?? user.scope?.label ?? "your store";
  }, [user]);

  // Self-scoped advances — match by recipient name to the user's full_name/displayName.
  const myAdvances = useMemo(() => {
    if (!user) return [];
    const candidates = [user.full_name, user.displayName].filter(Boolean) as string[];
    return advances.filter((a) => candidates.includes(a.recipient));
  }, [user]);

  const open = myAdvances.filter((a) => a.status === "Open" || a.status === "Partially Settled");
  const overdue = myAdvances.filter((a) => a.status === "Overdue");
  const outstanding = myAdvances
    .filter((a) => a.status !== "Settled")
    .reduce((s, a) => s + (a.amount - a.settledAmount - a.returnedCash), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Advances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Showing only advances issued to you at {storeName}
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/advances/new")}>
          <Banknote className="h-3.5 w-3.5" /> Request Advance
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard icon={Wallet} label="Open" value={open.length.toString()} hint="Active advances" />
        <KpiCard
          icon={ShieldAlert}
          label="Overdue"
          value={overdue.length.toString()}
          hint="Past due date"
          tone={overdue.length > 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={Clock}
          label="Outstanding"
          value={outstanding.toLocaleString()}
          hint="Pending settlement"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">My advances</h3>
          <span className="text-[10px] text-muted-foreground font-medium">{myAdvances.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Advance #</TableHead>
                <TableHead className="section-label">Purpose</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label w-[160px]">Settlement</TableHead>
                <TableHead className="section-label">Status</TableHead>
                <TableHead className="section-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    You have no advances yet.
                  </TableCell>
                </TableRow>
              ) : (
                myAdvances.map((a) => {
                  const remaining = a.amount - a.settledAmount - a.returnedCash;
                  const settledPct = Math.round((a.settledAmount / a.amount) * 100);
                  const returnedPct = Math.round((a.returnedCash / a.amount) * 100);
                  const canSettle = a.status !== "Settled";
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold">{a.advanceNumber}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={a.purpose}>
                        {a.purpose}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                        {a.amount.toLocaleString()} <span className="text-[10px] text-muted-foreground">{a.currency}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
                            <div className="h-full bg-status-approved rounded-l-full" style={{ width: `${settledPct}%` }} />
                            {returnedPct > 0 && <div className="h-full bg-primary" style={{ width: `${returnedPct}%` }} />}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground tabular-nums">{a.settledAmount.toLocaleString()} settled</span>
                            {remaining > 0 && (
                              <span className="font-semibold text-foreground tabular-nums">{remaining.toLocaleString()} left</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdvanceStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canSettle ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Settle
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, tone = "default",
}: {
  icon: React.ElementType; label: string; value: string; hint?: string;
  tone?: "default" | "danger";
}) {
  const danger = tone === "danger";
  return (
    <div
      className={
        "rounded-xl shadow-sm p-4 border " +
        (danger ? "border-status-hold/30 bg-status-hold/[0.02]" : "border-border bg-card")
      }
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className={"h-5 w-5 rounded flex items-center justify-center " + (danger ? "bg-status-hold/10" : "bg-muted")}>
          <Icon className={"h-3 w-3 " + (danger ? "text-status-hold" : "text-muted-foreground")} />
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className={"text-2xl font-bold tabular-nums " + (danger ? "text-status-hold" : "text-foreground")}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
