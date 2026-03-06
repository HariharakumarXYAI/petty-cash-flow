import { useState } from "react";
import { AlertItem } from "@/components/AlertItem";
import { AlertStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { alerts } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  TrendingUp, Users, Calendar, FileSearch, MessageSquare, ArrowUpRight,
  CheckCircle, AlertTriangle, Shield, FileText, Clock, User, ChevronRight,
  BarChart3, Target, Send,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ReferenceLine,
} from "recharts";
import type { AlertRecord } from "@/lib/mock-data";

// Peer comparison data generator
function getPeerComparisonData(alert: AlertRecord) {
  const peer = alert.peerBenchmark;
  const actual = alert.actualAmount;
  return [
    { label: "Peer Avg", value: peer, fill: "hsl(var(--chart-2))" },
    { label: "This Store", value: actual, fill: actual > peer * 1.5 ? "hsl(var(--status-hold))" : "hsl(var(--chart-1))" },
  ];
}

// Historical trend
function getHistoricalData(alert: AlertRecord) {
  const base = alert.peerBenchmark;
  const yoy = alert.yoyChange;
  const lastYear = Math.round(alert.actualAmount / (1 + yoy / 100));
  return [
    { period: "Last Year", amount: lastYear },
    { period: "This Year", amount: alert.actualAmount },
  ];
}

export default function AlertsPage() {
  const { country } = useGlobalFilter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const filtered = (country === "all" ? alerts : alerts.filter(a => a.country === country))
    .sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });

  const selected = filtered.find(a => a.id === selectedId) || filtered[0];
  const openCount = filtered.filter(a => a.status !== "Closed").length;
  const criticalCount = filtered.filter(a => a.severity === "critical" || a.severity === "high").length;

  const peerData = selected ? getPeerComparisonData(selected) : [];
  const histData = selected ? getHistoricalData(selected) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exception Workspace</h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open · {criticalCount} critical/high priority
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-hold/8 rounded-md">
            <AlertTriangle className="h-3.5 w-3.5 text-status-hold" />
            <span className="text-xs font-semibold text-status-hold">{criticalCount} Need Action</span>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[75vh] bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Left Panel - Queue */}
        <div className="lg:col-span-4 xl:col-span-3 border-r overflow-y-auto max-h-[80vh]">
          <div className="sticky top-0 bg-card z-10 px-4 py-3 border-b">
            <p className="section-label">Alert Queue</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} alerts · sorted by severity</p>
          </div>
          <div className="p-2 space-y-1">
            {filtered.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                selected={selected?.id === alert.id}
                onClick={() => setSelectedId(alert.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="lg:col-span-8 xl:col-span-9 overflow-y-auto max-h-[80vh]">
          {selected ? (
            <div className="divide-y">
              {/* Alert Header */}
              <div className="p-5 bg-muted/30">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={selected.severity} />
                      <AlertStatusBadge status={selected.status} />
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {selected.type.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-bold text-foreground leading-snug">{selected.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-center gap-1.5 justify-end">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Assigned</span>
                    </div>
                    <p className="text-sm font-semibold">{selected.assignedTo}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Deviation Metrics - Hero */}
              <div className="p-5">
                <p className="section-label mb-3">Deviation Analysis</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3 bg-status-hold/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-status-hold" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deviation</p>
                    </div>
                    <p className="text-2xl font-bold text-status-hold tabular-nums">+{selected.amountDeviation}%</p>
                    <p className="text-[10px] text-muted-foreground">above peer average</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Peer Avg</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{selected.peerBenchmark.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{selected.storeType} stores</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actual</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{selected.actualAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{selected.expenseCategory}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-status-validating/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-status-validating" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">YoY Change</p>
                    </div>
                    <p className={`text-2xl font-bold tabular-nums ${selected.yoyChange > 50 ? "text-status-hold" : selected.yoyChange > 0 ? "text-status-validating" : "text-status-approved"}`}>
                      {selected.yoyChange > 0 ? "+" : ""}{selected.yoyChange}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">vs same period</p>
                  </div>
                </div>
              </div>

              {/* Charts - Peer Benchmark & YoY */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Peer Benchmark Chart */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Peer Benchmark</h3>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peerData} layout="vertical" barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                            formatter={(value: number) => [value.toLocaleString(), "Amount"]}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {peerData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                          {selected.peerBenchmark > 0 && (
                            <ReferenceLine x={selected.peerBenchmark} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Benchmark", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      Compared to {selected.storeType} peer group average
                    </p>
                  </div>

                  {/* YoY Comparison Chart */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Year-over-Year</h3>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={histData} barSize={36}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                            formatter={(value: number) => [value.toLocaleString(), "Amount"]}
                          />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            <Cell fill="hsl(var(--chart-1))" />
                            <Cell fill={selected.yoyChange > 50 ? "hsl(var(--status-hold))" : "hsl(var(--chart-3))"} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      Same category, same period comparison
                    </p>
                  </div>
                </div>
              </div>

              {/* Context: Store + Reason Codes */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Store Context */}
                  <div className="rounded-lg border p-4">
                    <p className="section-label mb-3">Store Context</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Store</span>
                        <span className="text-sm font-medium">{selected.store}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Format</span>
                        <span className="text-sm font-medium">{selected.storeType}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Country</span>
                        <span className="text-sm font-medium">{selected.country}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="text-sm font-medium">{selected.expenseCategory}</span>
                      </div>
                      {selected.linkedClaimId && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Linked Claim</span>
                            <span className="text-xs font-mono text-primary">{selected.linkedClaimId}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reason Codes */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <FileSearch className="h-4 w-4 text-muted-foreground" />
                      <p className="section-label">Reason Codes</p>
                    </div>
                    <div className="space-y-2">
                      {selected.reasonCodes.map((code) => {
                        const descriptions: Record<string, string> = {
                          "PEER_ANOMALY": "Spending deviates significantly from peer group",
                          "YOY_SPIKE": "Year-over-year increase exceeds threshold",
                          "HARD_STOP_LIMIT": "Amount exceeds category hard-stop limit",
                          "DUPLICATE_RECEIPT": "Receipt hash matches a previous submission",
                          "LOW_BALANCE": "Store cash balance approaching minimum",
                        };
                        return (
                          <div key={code} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0 mt-0.5">{code}</Badge>
                            <p className="text-xs text-muted-foreground">{descriptions[code] || code}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Notes & Timeline */}
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="section-label">Case Notes</p>
                </div>
                {selected.notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">No case notes recorded yet.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {selected.notes.map((note, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-3 w-3 text-primary" />
                          </div>
                          {i < selected.notes.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-medium text-foreground">Note {i + 1}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Note */}
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Add a case note..."
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

              {/* Actions Bar */}
              <div className="p-5 bg-muted/30">
                <p className="section-label mb-3">Case Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Valid
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Reassign
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Escalate
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Request Original
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-status-hold border-status-hold/30 hover:bg-status-hold/5">
                    <Shield className="h-3.5 w-3.5" />
                    Close Case
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select an alert to begin investigation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
