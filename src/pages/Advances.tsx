import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, Clock, AlertTriangle, CheckCircle, ArrowRight, Ban,
  ArrowUpRight, ArrowDownRight, DollarSign, User, CalendarClock,
  FileText, ChevronRight, Banknote, ShieldAlert, Timer,
} from "lucide-react";
import { AdvanceStatusBadge } from "@/components/StatusBadge";
import { advances, advanceAgingData } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { Advance } from "@/lib/mock-data";

import { useAuth } from "@/contexts/AuthContext";
import { StoreUserAdvances } from "@/components/advance/StoreUserAdvances";

export default function Advances() {
  const { country } = useGlobalFilter();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Advance | null>(null);

  if (user?.role === "store_user") {
    return <StoreUserAdvances />;
  }

  const filtered = country === "all" ? advances : advances.filter(a => a.country === country);
  const open = filtered.filter(a => a.status === "Open" || a.status === "Partially Settled");
  const overdue = filtered.filter(a => a.status === "Overdue");
  const settled = filtered.filter(a => a.status === "Settled");
  const totalOutstanding = filtered.filter(a => a.status !== "Settled").reduce((s, a) => s + (a.amount - a.settledAmount - a.returnedCash), 0);

  const agingColors = ["hsl(var(--chart-1))", "hsl(var(--status-validating))", "hsl(var(--status-hold))", "hsl(var(--status-hold))"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Advances</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} advances · {country === "all" ? "All countries" : country}</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/advances/new")}>
          <Banknote className="h-3.5 w-3.5" /> Issue Advance
        </Button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* KPI ROW                                    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-5 w-5 rounded bg-primary/8 flex items-center justify-center">
              <Wallet className="h-3 w-3 text-primary" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Open</p>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{open.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active advances</p>
        </div>

        <div className={`bg-card border rounded-xl shadow-sm p-4 ${overdue.length > 0 ? "border-status-hold/30 bg-status-hold/[0.02]" : "border-border"}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`h-5 w-5 rounded flex items-center justify-center ${overdue.length > 0 ? "bg-status-hold/10" : "bg-muted"}`}>
              <ShieldAlert className={`h-3 w-3 ${overdue.length > 0 ? "text-status-hold" : "text-muted-foreground"}`} />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Overdue</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${overdue.length > 0 ? "text-status-hold" : "text-foreground"}`}>{overdue.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Past due date</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-5 w-5 rounded bg-status-validating/10 flex items-center justify-center">
              <Timer className="h-3 w-3 text-status-validating" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Outstanding</p>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Pending settlement</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-5 w-5 rounded bg-status-approved/10 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-status-approved" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Returned</p>
          </div>
          <p className="text-xl font-bold text-status-approved tabular-nums">{settled.reduce((s, a) => s + a.returnedCash, 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Cash returned this month</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* OVERDUE BANNER (if any)                    */}
      {/* ═══════════════════════════════════════════ */}
      {overdue.length > 0 && (
        <div className="bg-status-hold/5 border border-status-hold/20 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-status-hold/10 border-b border-status-hold/15 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-status-hold" />
            <span className="text-xs font-semibold text-status-hold">Overdue Advances — Immediate Action Required</span>
            <Badge variant="destructive" className="text-[10px] h-5 ml-auto">{overdue.length}</Badge>
          </div>
          <div className="divide-y divide-status-hold/10">
            {overdue.map(adv => {
              const remaining = adv.amount - adv.settledAmount - adv.returnedCash;
              return (
                <div key={adv.id} className="px-4 py-3 flex items-center gap-4 hover:bg-status-hold/5 transition-colors cursor-pointer" onClick={() => setSelected(adv)}>
                  <div className="h-8 w-8 rounded-lg bg-status-hold/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-status-hold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-foreground">{adv.advanceNumber}</span>
                      <span className="text-[10px] font-semibold text-status-hold bg-status-hold/10 px-1.5 py-0.5 rounded">{adv.daysOutstanding} days overdue</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{adv.recipient} · {adv.store} · {remaining.toLocaleString()} {adv.currency} outstanding</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={(e) => { e.stopPropagation(); }}>
                      <Ban className="h-3 w-3" /> Block New
                    </Button>
                    <Button size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); setSelected(adv); }}>
                      Settle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* AGING CHART + TABLE SIDE BY SIDE           */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Aging Chart */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Advance Aging</h3>
          </div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanceAgingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                  {advanceAgingData.map((_, i) => (
                    <Cell key={i} fill={agingColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Advances Table */}
        <div className="lg:col-span-8 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">All Advances</h3>
            <span className="text-[10px] text-muted-foreground font-medium">{filtered.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Advance</TableHead>
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Recipient</TableHead>
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</TableHead>
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-[160px]">Settlement</TableHead>
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right hidden lg:table-cell">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(adv => {
                  const remaining = adv.amount - adv.settledAmount - adv.returnedCash;
                  const pct = Math.round((adv.settledAmount / adv.amount) * 100);
                  const returnPct = Math.round((adv.returnedCash / adv.amount) * 100);
                  const isOverdue = adv.status === "Overdue";

                  return (
                    <TableRow
                      key={adv.id}
                      className={`cursor-pointer transition-colors ${isOverdue ? "bg-status-hold/[0.02] hover:bg-status-hold/[0.05]" : "hover:bg-muted/30"}`}
                      onClick={() => setSelected(adv)}
                    >
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs font-semibold text-foreground">{adv.advanceNumber}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{adv.store}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <span className="text-xs font-medium text-foreground">{adv.recipient}</span>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{adv.purpose}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-foreground tabular-nums">{adv.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{adv.currency}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
                            <div className="h-full bg-status-approved rounded-l-full" style={{ width: `${pct}%` }} />
                            {returnPct > 0 && <div className="h-full bg-primary" style={{ width: `${returnPct}%` }} />}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground tabular-nums">{adv.settledAmount.toLocaleString()} settled</span>
                            {remaining > 0 && <span className="font-semibold text-foreground tabular-nums">{remaining.toLocaleString()} left</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdvanceStatusBadge status={adv.status} />
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        <span className={`text-xs font-semibold tabular-nums ${isOverdue ? "text-status-hold" : "text-muted-foreground"}`}>
                          {adv.daysOutstanding}d
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* DETAIL DRAWER                              */}
      {/* ═══════════════════════════════════════════ */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (() => {
            const remaining = selected.amount - selected.settledAmount - selected.returnedCash;
            const pct = Math.round((selected.settledAmount / selected.amount) * 100);
            const returnPct = Math.round((selected.returnedCash / selected.amount) * 100);
            const isOverdue = selected.status === "Overdue";

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="font-mono text-base">{selected.advanceNumber}</span>
                    <AdvanceStatusBadge status={selected.status} />
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  {/* Overdue Warning */}
                  {isOverdue && (
                    <div className="bg-status-hold/5 border border-status-hold/15 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Ban className="h-4 w-4 text-status-hold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-status-hold">Overdue by {selected.daysOutstanding} days</p>
                        <p className="text-[11px] text-status-hold/80 mt-0.5">Recipient blocked from new advances until settlement.</p>
                      </div>
                    </div>
                  )}

                  {/* Amount Hero */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Advance</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums mt-1">{selected.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{selected.currency}</p>
                  </div>

                  {/* Settlement Progress */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Settlement Progress</p>

                    <div className="relative">
                      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
                        <div className="h-full bg-status-approved transition-all rounded-l-full" style={{ width: `${pct}%` }} />
                        {returnPct > 0 && <div className="h-full bg-primary transition-all" style={{ width: `${returnPct}%` }} />}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-status-approved/5 border border-status-approved/10 rounded-lg p-2.5 text-center">
                        <p className="text-[9px] font-semibold text-status-approved uppercase">Settled</p>
                        <p className="text-sm font-bold text-status-approved tabular-nums mt-0.5">{selected.settledAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 text-center">
                        <p className="text-[9px] font-semibold text-primary uppercase">Returned</p>
                        <p className="text-sm font-bold text-primary tabular-nums mt-0.5">{selected.returnedCash.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-lg p-2.5 text-center border ${remaining > 0 ? "bg-status-validating/5 border-status-validating/10" : "bg-muted border-border"}`}>
                        <p className={`text-[9px] font-semibold uppercase ${remaining > 0 ? "text-status-validating" : "text-muted-foreground"}`}>Remaining</p>
                        <p className={`text-sm font-bold tabular-nums mt-0.5 ${remaining > 0 ? "text-status-validating" : "text-muted-foreground"}`}>{remaining.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recipient</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{selected.recipient}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Store</p>
                      <p className="text-sm text-foreground mt-0.5">{selected.store}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Issued</p>
                      <p className="text-sm text-foreground mt-0.5">{selected.issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Due Date</p>
                      <p className={`text-sm font-medium mt-0.5 ${isOverdue ? "text-status-hold" : "text-foreground"}`}>{selected.dueDate}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Purpose</p>
                      <p className="text-sm text-foreground mt-0.5">{selected.purpose}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1 h-10 font-semibold gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Settle Advance
                    </Button>
                    <Button variant="outline" className="h-10 gap-1.5">
                      <ArrowDownRight className="h-4 w-4" /> Record Return
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
