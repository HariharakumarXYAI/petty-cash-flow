import { Wallet, ArrowDownLeft, ArrowUpRight, AlertTriangle, Scale } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { cashbookEntries, stores } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Cashbook() {
  const { storeId } = useGlobalFilter();
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const store = stores.find(s => s.id === (storeId !== "all" ? storeId : "s1")) || stores[0];
  const entries = cashbookEntries;
  const lastEntry = entries[entries.length - 1];
  const currentBalance = lastEntry?.runningBalance || 0;
  const totalIn = entries.reduce((s, e) => s + e.debit, 0);
  const totalOut = entries.reduce((s, e) => s + e.credit, 0);
  const isLowBalance = currentBalance <= store.minBalance * 1.3;
  const isOverMax = currentBalance > store.maxFloat;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cashbook</h1>
          <p className="text-sm text-muted-foreground">{store.name} · {store.currency}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setReconcileOpen(true)}>
            <Scale className="h-3.5 w-3.5 mr-1.5" />Reconcile
          </Button>
          <Button size="sm"><ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" />Record Cash In</Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Current Balance"
          value={`${currentBalance.toLocaleString()} ${store.currency}`}
          icon={Wallet}
          variant={isLowBalance ? "danger" : "default"}
          subtitle={`Float: ${store.floatLimit.toLocaleString()}`}
        />
        <MetricCard title="Total Cash In" value={`${totalIn.toLocaleString()}`} icon={ArrowDownLeft} variant="success" subtitle="This period" />
        <MetricCard title="Total Cash Out" value={`${totalOut.toLocaleString()}`} icon={ArrowUpRight} variant="warning" subtitle="Claims + advances" />
        <MetricCard
          title="Float Utilization"
          value={`${Math.round((currentBalance / store.floatLimit) * 100)}%`}
          icon={AlertTriangle}
          variant={isLowBalance ? "danger" : "default"}
          subtitle={`Min: ${store.minBalance.toLocaleString()} · Max: ${store.maxFloat.toLocaleString()}`}
        />
      </div>

      {/* Alerts */}
      {isLowBalance && (
        <div className="bg-status-hold/5 border border-status-hold/10 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-hold shrink-0" />
          <p className="text-xs text-status-hold font-medium">Balance approaching minimum threshold. Replenishment recommended.</p>
        </div>
      )}
      {isOverMax && (
        <div className="bg-status-validating/5 border border-status-validating/10 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-validating shrink-0" />
          <p className="text-xs text-status-validating font-medium">Balance exceeds maximum float limit.</p>
        </div>
      )}

      {/* Ledger */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Date</TableHead>
              <TableHead className="section-label">Type</TableHead>
              <TableHead className="section-label">Reference</TableHead>
              <TableHead className="section-label hidden md:table-cell">Description</TableHead>
              <TableHead className="section-label text-right">Debit (In)</TableHead>
              <TableHead className="section-label text-right">Credit (Out)</TableHead>
              <TableHead className="section-label text-right font-semibold">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="data-table-row">
                <TableCell className="text-xs text-muted-foreground">{entry.date}</TableCell>
                <TableCell>
                  <Badge variant={
                    entry.type === "Replenishment" || entry.type === "Settlement Return" || entry.type === "Opening Balance" ? "approved" :
                    entry.type === "Claim Payout" || entry.type === "Advance Issue" ? "alert" :
                    "draft"
                  } className="text-[10px]">{entry.type}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[250px] truncate">{entry.description}</TableCell>
                <TableCell className="text-sm font-medium text-right tabular-nums text-status-approved">
                  {entry.debit > 0 ? entry.debit.toLocaleString() : ""}
                </TableCell>
                <TableCell className="text-sm font-medium text-right tabular-nums text-status-hold">
                  {entry.credit > 0 ? entry.credit.toLocaleString() : ""}
                </TableCell>
                <TableCell className="text-sm font-bold text-right tabular-nums">{entry.runningBalance.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reconcile Drawer */}
      <Sheet open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Cash Count Reconciliation</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <p className="section-label">System Balance</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{currentBalance.toLocaleString()} {store.currency}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="section-label">Actual Cash Count</Label>
                <Input type="number" placeholder="Enter actual amount" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="section-label">Notes</Label>
                <Input placeholder="Any observations" className="h-9" />
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="section-label">Variance</p>
              <p className="text-lg font-bold text-foreground mt-1">0.00</p>
              <p className="text-xs text-muted-foreground">Shortage / Overage will be recorded</p>
            </div>
            <Button className="w-full">Submit Cash Count</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
