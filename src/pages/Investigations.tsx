import { investigations, alerts } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { InvestigationStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import {
  Search, Clock, AlertTriangle, CheckCircle, Shield, User, FileText,
  ArrowUpRight, Send, Link2, MessageSquare, ChevronRight, Target,
} from "lucide-react";
import type { Investigation } from "@/lib/mock-data";

export default function Investigations() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<Investigation | null>(null);
  const [noteText, setNoteText] = useState("");

  const filtered = country === "all" ? investigations : investigations.filter(i => i.country === country);
  const open = filtered.filter(i => i.status !== "Resolved");
  const escalated = filtered.filter(i => i.status === "Escalated");
  const pendingEvidence = filtered.filter(i => i.status === "Pending Evidence");
  const avgDays = open.length > 0 ? Math.round(open.reduce((s, i) => s + i.daysOpen, 0) / open.length) : 0;

  const getEvidenceProgress = (inv: Investigation) => {
    const done = inv.evidenceChecklist.filter(e => e.completed).length;
    return Math.round((done / inv.evidenceChecklist.length) * 100);
  };

  const getLinkedAlerts = (inv: Investigation) => {
    return inv.linkedAlertIds.map(id => alerts.find(a => a.id === id)).filter(Boolean);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investigations</h1>
          <p className="text-sm text-muted-foreground">{open.length} open cases · {escalated.length} escalated</p>
        </div>
        {escalated.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-hold/8 rounded-md">
            <ArrowUpRight className="h-3.5 w-3.5 text-status-hold" />
            <span className="text-xs font-semibold text-status-hold">{escalated.length} Escalated</span>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Open Cases" value={open.length} icon={Search} />
        <MetricCard title="Avg Days Open" value={`${avgDays}d`} icon={Clock} />
        <MetricCard title="Pending Evidence" value={pendingEvidence.length} icon={AlertTriangle} variant="warning" />
        <MetricCard title="Escalated" value={escalated.length} icon={ArrowUpRight} variant="danger" />
      </div>

      {/* Cases Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="section-label">Case Queue</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Case #</TableHead>
                <TableHead className="section-label">Title</TableHead>
                <TableHead className="section-label hidden md:table-cell">Store</TableHead>
                <TableHead className="section-label hidden lg:table-cell">Owner</TableHead>
                <TableHead className="section-label">Severity</TableHead>
                <TableHead className="section-label">Status</TableHead>
                <TableHead className="section-label hidden md:table-cell">Evidence</TableHead>
                <TableHead className="section-label hidden lg:table-cell">Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const progress = getEvidenceProgress(inv);
                return (
                  <TableRow
                    key={inv.id}
                    className={`data-table-row cursor-pointer ${inv.status === "Escalated" ? "bg-status-hold/3" : ""}`}
                    onClick={() => setSelected(inv)}
                  >
                    <TableCell className="font-mono text-xs font-medium">{inv.caseNumber}</TableCell>
                    <TableCell className="text-sm max-w-[250px] truncate font-medium">{inv.title}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{inv.store}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{inv.owner}</TableCell>
                    <TableCell><SeverityBadge severity={inv.severity} /></TableCell>
                    <TableCell><InvestigationStatusBadge status={inv.status} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 w-16" />
                        <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`text-xs tabular-nums font-medium ${inv.daysOpen > 5 ? "text-status-hold" : "text-muted-foreground"}`}>
                        {inv.daysOpen}d
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNoteText(""); } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selected && (
            <div className="divide-y">
              {/* Header */}
              <div className="p-5">
                <SheetHeader className="mb-0">
                  <SheetTitle className="text-base flex items-center gap-2">
                    <span className="font-mono text-sm">{selected.caseNumber}</span>
                  </SheetTitle>
                </SheetHeader>
                <h3 className="text-base font-bold mt-2">{selected.title}</h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <SeverityBadge severity={selected.severity} />
                  <InvestigationStatusBadge status={selected.status} />
                  <Badge variant="outline" className="text-[10px]">{selected.category}</Badge>
                </div>
              </div>

              {/* Key Facts */}
              <div className="p-5">
                <p className="section-label mb-3">Case Details</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Store</p>
                    <p className="mt-0.5 font-medium">{selected.store}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Owner</p>
                    <p className="mt-0.5 font-medium">{selected.owner}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</p>
                    <p className="mt-0.5 font-bold tabular-nums text-foreground">
                      {selected.totalAmount.toLocaleString()} {selected.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Days Open</p>
                    <p className={`mt-0.5 font-bold tabular-nums ${selected.daysOpen > 5 ? "text-status-hold" : "text-foreground"}`}>
                      {selected.daysOpen} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Alerts */}
              {selected.linkedAlertIds.length > 0 && (
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="section-label">Linked Alerts</p>
                  </div>
                  <div className="space-y-2">
                    {getLinkedAlerts(selected).map(alert => alert && (
                      <div key={alert.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="h-3.5 w-3.5 text-status-validating shrink-0" />
                          <span className="text-sm truncate">{alert.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <SeverityBadge severity={alert.severity} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Checklist */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="section-label">Evidence Checklist</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {selected.evidenceChecklist.filter(e => e.completed).length}/{selected.evidenceChecklist.length} complete
                  </span>
                </div>
                <Progress value={getEvidenceProgress(selected)} className="h-1.5 mb-3" />
                <div className="space-y-2">
                  {selected.evidenceChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox checked={item.completed} disabled className="shrink-0" />
                      <span className={`text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline & Notes */}
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="section-label">Decision History</p>
                </div>
                <div className="space-y-0">
                  {selected.notes.map((note, i) => (
                    <div key={i} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          note.author === "System" ? "bg-muted" : "bg-primary/10"
                        }`}>
                          {note.author === "System" ? (
                            <Shield className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <User className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        {i < selected.notes.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">{note.author}</p>
                          <p className="text-[10px] text-muted-foreground">{note.date}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{note.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Note */}
                <div className="flex gap-2 items-end mt-2">
                  <Textarea
                    placeholder="Record a finding or decision..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                  <Button size="sm" disabled={!noteText.trim()} className="shrink-0">
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 bg-muted/30">
                <p className="section-label mb-3">Case Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="gap-1.5 w-full">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Resolve Case
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 w-full">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Escalate
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 w-full">
                    <FileText className="h-3.5 w-3.5" />
                    Request Evidence
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 w-full text-status-hold border-status-hold/30 hover:bg-status-hold/5">
                    <Shield className="h-3.5 w-3.5" />
                    Block Submitter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
