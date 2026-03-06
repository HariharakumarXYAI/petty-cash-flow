import { investigations } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { InvestigationStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Search, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Investigation } from "@/lib/mock-data";

export default function Investigations() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<Investigation | null>(null);

  const filtered = country === "all" ? investigations : investigations.filter(i => i.country === country);
  const open = filtered.filter(i => i.status !== "Resolved");

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investigations</h1>
          <p className="text-sm text-muted-foreground">{open.length} open cases</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Open Cases" value={open.length} icon={Search} />
        <MetricCard title="Avg Days Open" value={Math.round(open.reduce((s, i) => s + i.daysOpen, 0) / Math.max(open.length, 1))} icon={Clock} />
        <MetricCard title="Pending Evidence" value={filtered.filter(i => i.status === "Pending Evidence").length} icon={AlertTriangle} variant="warning" />
        <MetricCard title="Escalated" value={filtered.filter(i => i.status === "Escalated").length} icon={AlertTriangle} variant="danger" />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Case #</TableHead>
              <TableHead className="section-label">Title</TableHead>
              <TableHead className="section-label hidden md:table-cell">Store</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Owner</TableHead>
              <TableHead className="section-label">Severity</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id} className="data-table-row cursor-pointer" onClick={() => setSelected(inv)}>
                <TableCell className="font-mono text-xs font-medium">{inv.caseNumber}</TableCell>
                <TableCell className="text-sm max-w-[250px] truncate">{inv.title}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{inv.store}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{inv.owner}</TableCell>
                <TableCell><SeverityBadge severity={inv.severity} /></TableCell>
                <TableCell><InvestigationStatusBadge status={inv.status} /></TableCell>
                <TableCell className="text-xs tabular-nums hidden lg:table-cell">{inv.daysOpen}d</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">
                  <span className="font-mono">{selected.caseNumber}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold">{selected.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <SeverityBadge severity={selected.severity} />
                    <InvestigationStatusBadge status={selected.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="section-label">Store</p><p className="mt-0.5">{selected.store} · {selected.country}</p></div>
                  <div><p className="section-label">Owner</p><p className="mt-0.5">{selected.owner}</p></div>
                  <div><p className="section-label">Category</p><p className="mt-0.5">{selected.category}</p></div>
                  <div><p className="section-label">Total Amount</p><p className="mt-0.5 font-bold tabular-nums">{selected.totalAmount.toLocaleString()} {selected.currency}</p></div>
                </div>

                <Separator />

                <div>
                  <p className="section-label mb-2">Evidence Checklist</p>
                  <div className="space-y-2">
                    {selected.evidenceChecklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox checked={item.completed} disabled />
                        <span className={`text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="section-label mb-2">Notes & Decision History</p>
                  <div className="space-y-3">
                    {selected.notes.map((note, i) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-medium">{note.author} · {note.date}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm">Resolve</Button>
                  <Button size="sm" variant="outline">Escalate</Button>
                  <Button size="sm" variant="outline">Add Note</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
