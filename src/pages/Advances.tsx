import { Wallet, Clock, AlertTriangle, CheckCircle, ArrowRight, Ban } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { AdvanceStatusBadge } from "@/components/StatusBadge";
import { advances, advanceAgingData } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { Advance } from "@/lib/mock-data";

export default function Advances() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<Advance | null>(null);

  const filtered = country === "all" ? advances : advances.filter(a => a.country === country);
  const open = filtered.filter(a => a.status === "Open" || a.status === "Partially Settled");
  const overdue = filtered.filter(a => a.status === "Overdue");
  const settled = filtered.filter(a => a.status === "Settled");

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advances</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} advances · {country === "all" ? "All countries" : country}</p>
        </div>
        <Button size="sm"><Wallet className="h-3.5 w-3.5 mr-1.5" />Issue Advance</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Open Advances" value={open.length} icon={Wallet} />
        <MetricCard title="Overdue" value={overdue.length} icon={Clock} variant={overdue.length > 0 ? "danger" : "default"} />
        <MetricCard title="Pending Settlement" value={open.reduce((s, a) => s + (a.amount - a.settledAmount), 0).toLocaleString()} icon={AlertTriangle} variant="warning" subtitle="Total outstanding" />
        <MetricCard title="Returned Cash" value={settled.reduce((s, a) => s + a.returnedCash, 0).toLocaleString()} icon={CheckCircle} variant="success" subtitle="This month" />
      </div>

      {/* Aging Chart */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Advance Aging</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={advanceAgingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Advance #</TableHead>
              <TableHead className="section-label">Store</TableHead>
              <TableHead className="section-label hidden md:table-cell">Recipient</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Purpose</TableHead>
              <TableHead className="section-label text-right">Amount</TableHead>
              <TableHead className="section-label">Progress</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Days Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((adv) => {
              const pct = Math.round((adv.settledAmount / adv.amount) * 100);
              return (
                <TableRow key={adv.id} className="data-table-row cursor-pointer" onClick={() => setSelected(adv)}>
                  <TableCell className="font-mono text-xs font-medium">{adv.advanceNumber}</TableCell>
                  <TableCell className="text-sm">{adv.store}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{adv.recipient}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{adv.purpose}</TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums">
                    {adv.amount.toLocaleString()} <span className="text-[10px] text-muted-foreground">{adv.currency}</span>
                  </TableCell>
                  <TableCell>
                    <div className="w-20">
                      <Progress value={pct} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell><AdvanceStatusBadge status={adv.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell tabular-nums">{adv.daysOutstanding}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-base">{selected.advanceNumber}</span>
                  <AdvanceStatusBadge status={selected.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="section-label">Recipient</p><p className="text-sm font-medium mt-0.5">{selected.recipient}</p></div>
                  <div><p className="section-label">Store</p><p className="text-sm mt-0.5">{selected.store}</p></div>
                  <div><p className="section-label">Amount</p><p className="text-xl font-bold tabular-nums mt-0.5">{selected.amount.toLocaleString()} {selected.currency}</p></div>
                  <div><p className="section-label">Settled</p><p className="text-xl font-bold tabular-nums mt-0.5 text-status-approved">{selected.settledAmount.toLocaleString()}</p></div>
                  <div><p className="section-label">Issued</p><p className="text-sm mt-0.5">{selected.issuedDate}</p></div>
                  <div><p className="section-label">Due</p><p className="text-sm mt-0.5">{selected.dueDate}</p></div>
                </div>
                <div><p className="section-label">Purpose</p><p className="text-sm mt-0.5">{selected.purpose}</p></div>
                <div>
                  <p className="section-label mb-1">Settlement Progress</p>
                  <Progress value={Math.round((selected.settledAmount / selected.amount) * 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{selected.settledAmount.toLocaleString()} settled</span>
                    <span>{(selected.amount - selected.settledAmount - selected.returnedCash).toLocaleString()} remaining</span>
                  </div>
                  {selected.returnedCash > 0 && <p className="text-xs text-status-approved mt-1">{selected.returnedCash.toLocaleString()} cash returned</p>}
                </div>
                <Separator />
                {selected.status === "Overdue" && (
                  <div className="bg-status-hold/5 border border-status-hold/10 rounded-lg p-3 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-status-hold shrink-0" />
                    <p className="text-xs text-status-hold font-medium">This recipient is blocked from new advances until settlement.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm">Settle Advance</Button>
                  <Button size="sm" variant="outline">Record Return</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
