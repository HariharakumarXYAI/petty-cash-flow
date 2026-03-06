import { useState } from "react";
import { AlertItem } from "@/components/AlertItem";
import { AlertStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { alerts } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Users, Calendar, FileSearch, MessageSquare, ArrowUpRight,
  CheckCircle, AlertTriangle, Shield, FileText,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { AlertRecord } from "@/lib/mock-data";

const trendData = [
  { month: "Oct", amount: 2200 }, { month: "Nov", amount: 2400 },
  { month: "Dec", amount: 3100 }, { month: "Jan", amount: 2800 },
  { month: "Feb", amount: 2600 }, { month: "Mar", amount: 8500 },
];

export default function AlertsPage() {
  const { country } = useGlobalFilter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = (country === "all" ? alerts : alerts.filter(a => a.country === country))
    .sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });

  const selected = filtered.find(a => a.id === selectedId) || filtered[0];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts & Investigations</h1>
          <p className="text-sm text-muted-foreground">{filtered.filter(a => a.status !== "Closed").length} open alerts · Exception workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[70vh]">
        {/* Left - Alert Queue */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2 overflow-y-auto max-h-[80vh]">
          <p className="section-label px-1 sticky top-0 bg-background py-1">Alert Queue ({filtered.length})</p>
          {filtered.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              selected={selected?.id === alert.id}
              onClick={() => setSelectedId(alert.id)}
            />
          ))}
        </div>

        {/* Right - Alert Detail */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {selected ? (
            <>
              {/* Header */}
              <div className="metric-card">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={selected.severity} />
                      <AlertStatusBadge status={selected.status} />
                      <Badge variant="outline" className="text-[10px]">{selected.type.replace("_", " ")}</Badge>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="section-label">Assigned To</p>
                    <p className="text-sm font-medium mt-0.5">{selected.assignedTo}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="metric-card py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="section-label">Amount Deviation</p>
                  </div>
                  <p className="text-xl font-bold text-status-hold">+{selected.amountDeviation}%</p>
                </div>
                <div className="metric-card py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="section-label">Peer Benchmark</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{selected.peerBenchmark.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Actual: {selected.actualAmount.toLocaleString()}</p>
                </div>
                <div className="metric-card py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="section-label">YoY Change</p>
                  </div>
                  <p className={`text-xl font-bold ${selected.yoyChange > 50 ? "text-status-hold" : "text-status-validating"}`}>
                    +{selected.yoyChange}%
                  </p>
                </div>
                <div className="metric-card py-3">
                  <p className="section-label mb-1">Store Info</p>
                  <p className="text-sm font-medium">{selected.store}</p>
                  <p className="text-xs text-muted-foreground">{selected.storeType} · {selected.country}</p>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="metric-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">Category Spending Trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reason Codes & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="metric-card">
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileSearch className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Reason Codes</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.reasonCodes.map((code) => (
                      <Badge key={code} variant="outline" className="text-[10px] font-mono">{code}</Badge>
                    ))}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="flex items-center gap-1.5 mb-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Case Notes</h3>
                  </div>
                  {selected.notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.notes.map((note, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {note}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Mark Valid
                </Button>
                <Button size="sm" variant="outline">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />Escalate
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />Request Audit Original
                </Button>
                <Button size="sm" variant="outline">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />Close Case
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select an alert to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
