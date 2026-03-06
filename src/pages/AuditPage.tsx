import { auditRequests, claims } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { AuditStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { ClipboardCheck, Clock, FileSearch, CheckCircle, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AuditRequest } from "@/lib/mock-data";

export default function AuditPage() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<AuditRequest | null>(null);

  const filtered = country === "all" ? auditRequests : auditRequests.filter(a => a.country === country);
  const pending = filtered.filter(a => a.status !== "Completed");
  const completed = filtered.filter(a => a.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit</h1>
          <p className="text-sm text-muted-foreground">Document requests & findings</p>
        </div>
        <Button size="sm"><ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />New Audit Sample</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Requests" value={filtered.length} icon={FileSearch} />
        <MetricCard title="Pending" value={pending.length} icon={Clock} variant="warning" />
        <MetricCard title="Completed" value={completed.length} icon={CheckCircle} variant="success" />
        <MetricCard title="With Findings" value={filtered.filter(a => a.findingSeverity && a.findingSeverity !== "None").length} icon={AlertTriangle} variant="danger" />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Audit #</TableHead>
              <TableHead className="section-label">Claim #</TableHead>
              <TableHead className="section-label hidden md:table-cell">Store</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Requested From</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Requested</TableHead>
              <TableHead className="section-label hidden xl:table-cell">Received</TableHead>
              <TableHead className="section-label">Finding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((aud) => (
              <TableRow key={aud.id} className="data-table-row cursor-pointer" onClick={() => setSelected(aud)}>
                <TableCell className="font-mono text-xs font-medium">{aud.auditNumber}</TableCell>
                <TableCell className="font-mono text-xs">{aud.claimNumber}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{aud.store}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{aud.requestedFrom}</TableCell>
                <TableCell><AuditStatusBadge status={aud.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{aud.requestedDate}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{aud.receivedDate || "—"}</TableCell>
                <TableCell>
                  {aud.findingSeverity ? (
                    <Badge variant={aud.findingSeverity === "None" ? "approved" : aud.findingSeverity === "Low" ? "draft" : aud.findingSeverity === "Medium" ? "alert" : "hold"} className="text-[10px]">
                      {aud.findingSeverity}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selected.auditNumber}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="section-label">Claim</p><p className="text-sm font-mono mt-0.5">{selected.claimNumber}</p></div>
                  <div><p className="section-label">Store</p><p className="text-sm mt-0.5">{selected.store}</p></div>
                  <div><p className="section-label">Status</p><div className="mt-0.5"><AuditStatusBadge status={selected.status} /></div></div>
                  <div><p className="section-label">Country</p><p className="text-sm mt-0.5">{selected.country}</p></div>
                </div>
                <Separator />
                <div>
                  <p className="section-label mb-2">Document Request Tracker</p>
                  <div className="space-y-2">
                    {[
                      { step: "Requested from store", date: selected.requestedDate, done: true },
                      { step: "Received at HO", date: selected.receivedDate, done: !!selected.receivedDate },
                      { step: "Reviewed", date: selected.reviewedDate, done: !!selected.reviewedDate },
                      { step: "Finding recorded", date: undefined, done: !!selected.findingSeverity },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.done ? "bg-status-approved/10 text-status-approved" : "bg-muted text-muted-foreground"}`}>
                          {s.done ? "✓" : i + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm">{s.step}</span>
                          {s.date && <span className="text-xs text-muted-foreground ml-2">{s.date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.findingSummary && (
                  <>
                    <Separator />
                    <div>
                      <p className="section-label mb-1">Finding Summary</p>
                      <p className="text-sm text-muted-foreground">{selected.findingSummary}</p>
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <Button size="sm">Record Finding</Button>
                  <Button size="sm" variant="outline">View Claim</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
