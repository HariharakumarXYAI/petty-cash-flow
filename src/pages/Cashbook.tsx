import { useState } from "react";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, AlertTriangle, Scale, Plus,
  RefreshCcw, Receipt, Banknote, ArrowRight, CheckCircle, XCircle,
  TrendingDown, CircleDot,
} from "lucide-react";
import { cashbookEntries, stores } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const typeConfig: Record<string, { icon: typeof Wallet; color: string; bg: string; direction: "in" | "out" | "neutral" }> = {
  "Opening Balance": { icon: Wallet, color: "text-primary", bg: "bg-primary/8", direction: "neutral" },
  "Replenishment": { icon: RefreshCcw, color: "text-status-approved", bg: "bg-status-approved/10", direction: "in" },
  "Settlement Return": { icon: ArrowDownLeft, color: "text-status-approved", bg: "bg-status-approved/10", direction: "in" },
  "Claim Payout": { icon: Receipt, color: "text-status-hold", bg: "bg-status-hold/10", direction: "out" },
  "Advance Issue": { icon: Banknote, color: "text-status-validating", bg: "bg-status-validating/10", direction: "out" },
  "Cash Count": { icon: Scale, color: "text-muted-foreground", bg: "bg-muted", direction: "neutral" },
};

export default function Cashbook() {
  const { storeId } = useGlobalFilter();
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [cashCount, setCashCount] = useState("");

  const store = stores.find(s => s.id === (storeId !== "all" ? storeId : "s1")) || stores[0];
  const entries = cashbookEntries;
  const openingBalance = entries[0]?.runningBalance || 0;
  const lastEntry = entries[entries.length - 1];
  const currentBalance = lastEntry?.runningBalance || 0;
  const totalIn = entries.reduce((s, e) => s + e.debit, 0);
  const totalOut = entries.reduce((s, e) => s + e.credit, 0);
  const isLowBalance = currentBalance <= store.minBalance * 1.3;
  const isOverMax = currentBalance > store.maxFloat;
  const balancePct = Math.round((currentBalance / store.floatLimit) * 100);
  const minPct = Math.round((store.minBalance / store.floatLimit) * 100);
  const maxPct = Math.round((store.maxFloat / store.floatLimit) * 100);

  const cashCountNum = parseFloat(cashCount) || 0;
  const variance = cashCountNum > 0 ? cashCountNum - currentBalance : 0;

  // Group entries by date
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cashbook</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{store.name} · {store.currency} · March 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setReconcileOpen(true)}>
            <Scale className="h-3.5 w-3.5" /> Reconcile
          </Button>
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Record Entry
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO — Current Balance + Float Gauge        */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Balance Hero */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Current Balance</p>
              <p className="text-3xl font-bold text-foreground tabular-nums mt-1">{currentBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{store.currency}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isLowBalance ? "bg-status-hold/10" : "bg-primary/8"}`}>
              <Wallet className={`h-6 w-6 ${isLowBalance ? "text-status-hold" : "text-primary"}`} />
            </div>
          </div>

          {/* Float gauge */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>Fund limit: {store.floatLimit.toLocaleString()}</span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLowBalance ? "bg-status-hold" : isOverMax ? "bg-status-validating" : "bg-primary"}`}
                style={{ width: `${Math.min(balancePct, 100)}%` }}
              />
              {/* Min marker */}
              <div className="absolute top-0 h-full w-px bg-status-hold/60" style={{ left: `${minPct}%` }} />
              {/* Max marker */}
              <div className="absolute top-0 h-full w-px bg-status-validating/60" style={{ left: `${Math.min(maxPct, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-status-hold font-medium">Min {store.minBalance.toLocaleString()}</span>
              <span className="font-semibold text-foreground tabular-nums">{balancePct}% utilized</span>
              <span className="text-status-validating font-medium">Max {store.maxFloat.toLocaleString()}</span>
            </div>
          </div>

          {/* Alerts inline */}
          {isLowBalance && (
            <div className="mt-4 bg-status-hold/5 border border-status-hold/15 rounded-lg px-3 py-2 flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5 text-status-hold shrink-0" />
              <p className="text-[11px] text-status-hold font-medium">Below safe threshold — request replenishment</p>
            </div>
          )}
          {isOverMax && (
            <div className="mt-4 bg-status-validating/5 border border-status-validating/15 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-status-validating shrink-0" />
              <p className="text-[11px] text-status-validating font-medium">Exceeds maximum petty cash fund limit</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Opening Balance</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-2">{openingBalance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">1 Mar 2026</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-5 w-5 rounded bg-status-approved/10 flex items-center justify-center">
                <ArrowDownLeft className="h-3 w-3 text-status-approved" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Cash In</p>
            </div>
            <p className="text-xl font-bold text-status-approved tabular-nums">{totalIn.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Replenishments + returns</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-5 w-5 rounded bg-status-hold/10 flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-status-hold" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Cash Out</p>
            </div>
            <p className="text-xl font-bold text-status-hold tabular-nums">{totalOut.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Payouts + advances</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Net Movement</p>
            <p className={`text-xl font-bold tabular-nums mt-2 ${totalIn - totalOut >= 0 ? "text-status-approved" : "text-status-hold"}`}>
              {totalIn - totalOut >= 0 ? "+" : ""}{(totalIn - totalOut).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">This period</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Transactions</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-2">{entries.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{entries.filter(e => e.credit > 0).length} out · {entries.filter(e => e.debit > 0).length} in</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Last Reconciled</p>
            <p className="text-sm font-bold text-foreground mt-2">6 Mar 2026</p>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-status-approved" />
              <span className="text-[10px] text-status-approved font-medium">No variance</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* LEDGER — Grouped by Date                   */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Ledger</h3>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{entries.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-[140px]">Type</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Reference</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Description</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-[100px]">In</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-[100px]">Out</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-[120px]">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([date, dayEntries]) => (
                <>
                  {/* Date group header */}
                  <TableRow key={`date-${date}`} className="hover:bg-transparent bg-muted/20">
                    <TableCell colSpan={6} className="py-1.5 px-4">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </TableCell>
                  </TableRow>
                  {dayEntries.map((entry) => {
                    const config = typeConfig[entry.type] || typeConfig["Cash Count"];
                    const Icon = config.icon;
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${config.bg}`}>
                              <Icon className={`h-3 w-3 ${config.color}`} />
                            </div>
                            <span className="text-xs font-medium text-foreground">{entry.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">{entry.reference}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[250px] truncate">{entry.description}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {entry.debit > 0 ? (
                            <span className="font-semibold text-status-approved">+{entry.debit.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {entry.credit > 0 ? (
                            <span className="font-semibold text-status-hold">−{entry.credit.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="text-sm font-bold text-foreground">{entry.runningBalance.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* RECONCILE DRAWER                           */}
      {/* ═══════════════════════════════════════════ */}
      <Sheet open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Cash Count Reconciliation
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* System balance */}
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">System Balance</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{currentBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{store.currency} · As of {new Date().toLocaleDateString("en-GB")}</p>
            </div>

            <Separator />

            {/* Input */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actual Cash Count</Label>
                <Input
                  type="number"
                  placeholder="Enter counted amount"
                  className="h-10 text-lg font-bold tabular-nums"
                  value={cashCount}
                  onChange={e => setCashCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
                <Textarea placeholder="Any observations or discrepancies…" rows={2} className="text-sm resize-none" />
              </div>
            </div>

            {/* Variance */}
            {cashCountNum > 0 && (
              <div className={`rounded-xl p-4 border ${
                variance === 0 ? "bg-status-approved/5 border-status-approved/15" :
                variance > 0 ? "bg-status-validating/5 border-status-validating/15" :
                "bg-status-hold/5 border-status-hold/15"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Variance</p>
                    <p className={`text-2xl font-bold tabular-nums mt-1 ${
                      variance === 0 ? "text-status-approved" : variance > 0 ? "text-status-validating" : "text-status-hold"
                    }`}>
                      {variance > 0 ? "+" : ""}{variance.toLocaleString()}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    variance === 0 ? "bg-status-approved/10" : variance > 0 ? "bg-status-validating/10" : "bg-status-hold/10"
                  }`}>
                    {variance === 0 ? <CheckCircle className="h-5 w-5 text-status-approved" /> :
                     variance > 0 ? <ArrowUpRight className="h-5 w-5 text-status-validating" /> :
                     <TrendingDown className="h-5 w-5 text-status-hold" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {variance === 0 ? "Cash count matches system balance perfectly." :
                   variance > 0 ? `Overage of ${variance.toLocaleString()} ${store.currency} detected.` :
                   `Shortage of ${Math.abs(variance).toLocaleString()} ${store.currency} detected.`}
                </p>
              </div>
            )}

            <Button className="w-full h-10 font-semibold gap-2" disabled={cashCountNum <= 0}>
              <CheckCircle className="h-4 w-4" /> Submit Cash Count
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
