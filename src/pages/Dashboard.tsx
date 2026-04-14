import {
  FileText, AlertTriangle, CheckCircle, Clock, Wallet, TrendingDown,
  ArrowRight, Activity, ShieldAlert, Search, ArrowUpRight, ArrowDownRight,
  Store, CircleDot, Eye, Banknote,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge";
import {
  claims, alerts, stores, investigations, auditRequests, advances,
  getDashboardMetrics, monthlySpendData, spendByCategory,
  storeBenchmarkData, recentActivity,
} from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend, Cell,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { country } = useGlobalFilter();
  const metrics = getDashboardMetrics(country);

  const filteredAlerts = (country === "all" ? alerts : alerts.filter(a => a.country === country))
    .filter(a => a.status === "Open" || a.status === "In Progress")
    .sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });

  const exceptionClaims = (country === "all" ? claims : claims.filter(c => c.country === country))
    .filter(c => ["On Hold", "Under Investigation", "Auto Approved with Alert", "Awaiting Audit Document"].includes(c.status));

  const lowBalanceStores = (country === "all" ? stores : stores.filter(s => s.country === country))
    .filter(s => s.currentBalance <= s.minBalance * 1.3)
    .sort((a, b) => (a.currentBalance / a.minBalance) - (b.currentBalance / b.minBalance));

  const openInvestigations = (country === "all" ? investigations : investigations.filter(i => i.country === country))
    .filter(i => i.status !== "Resolved");

  const pendingAudits = (country === "all" ? auditRequests : auditRequests.filter(a => a.country === country))
    .filter(a => a.status !== "Completed");

  const overdueAdvances = (country === "all" ? advances : advances.filter(a => a.country === country))
    .filter(a => a.status === "Overdue");

  const activityIcons: Record<string, typeof FileText> = {
    claim: FileText, approval: CheckCircle, alert: AlertTriangle, hold: ShieldAlert,
  };

  const benchmarkWithVariance = storeBenchmarkData.map(s => ({
    ...s,
    variance: Math.round(((s.actual - s.benchmark) / s.benchmark) * 100),
    overBudget: s.actual > s.benchmark,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Finance Control Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {country === "all" ? "All countries" : country} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Button onClick={() => navigate("/claims/new")} size="sm" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" /> New Claim
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 1 — Petty Cash Exposure (Hero KPIs)       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Cash on Hand — Hero card */}
        <div className="col-span-2 bg-card border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total Petty Cash on Hand</p>
              <p className="text-3xl font-bold text-foreground tabular-nums mt-1">
                ฿{metrics.totalFloat.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {(country === "all" ? stores : stores.filter(s => s.country === country)).length} stores
                {country === "all" && " · Multi-currency consolidated"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Low Balance</p>
              <p className="text-lg font-bold text-status-hold tabular-nums">{metrics.lowBalanceStores}</p>
              <p className="text-[10px] text-muted-foreground">stores at risk</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overdue Advances</p>
              <p className="text-lg font-bold text-status-hold tabular-nums">{metrics.overdueAdvances}</p>
              <p className="text-[10px] text-muted-foreground">need settlement</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending Audits</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{pendingAudits.length}</p>
              <p className="text-[10px] text-muted-foreground">awaiting docs</p>
            </div>
          </div>
        </div>

        {/* Auto-Approval Rate */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Auto-Approval Rate</p>
            <div className="h-8 w-8 rounded-lg bg-status-approved/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-status-approved" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-status-approved tabular-nums">{metrics.autoApprovedRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">MTD · {metrics.todayClaims} today</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-status-approved">
            <ArrowUpRight className="h-3 w-3" />
            <span className="font-medium">+3% vs last month</span>
          </div>
        </div>

        {/* Claims Needing Attention */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col justify-between cursor-pointer hover:border-status-hold/30 transition-colors" onClick={() => navigate("/alerts")}>
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Needs Attention</p>
            <div className="h-8 w-8 rounded-lg bg-status-hold/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-status-hold" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-foreground tabular-nums">{metrics.onHold + metrics.openAlerts}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{metrics.onHold} on hold · {metrics.openAlerts} alerts</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
            <Eye className="h-3 w-3" />
            <span className="font-medium">Review now →</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 2 — Today's Auto-Approved + Spend Trends  */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Spend YoY */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Monthly Spend vs Last Year</h3>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">THB consolidated</span>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, undefined]}
                />
                <Line type="monotone" dataKey="thisYear" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--chart-1))" }} name="2026" activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="lastYear" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="2025" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[hsl(var(--chart-1))] rounded" /> This year</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-muted-foreground rounded border-dashed" style={{ borderTop: "1.5px dashed" }} /> Last year</span>
          </div>
        </div>

        {/* Spend by Category */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Spend by Category</h3>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">MTD</span>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCategory} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
                  {spendByCategory.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 3 — Open Alerts (Needs Attention)         */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-status-hold" />
            <h3 className="text-sm font-semibold text-foreground">Open Alerts</h3>
            <Badge variant="alert" className="text-[10px] h-5">{filteredAlerts.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/alerts")}>
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {filteredAlerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="h-8 w-8 text-status-approved mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No open alerts — all clear.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-start gap-3" onClick={() => navigate("/alerts")}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  alert.severity === "critical" ? "bg-status-hold/10" : alert.severity === "high" ? "bg-status-validating/10" : "bg-muted"
                }`}>
                  {alert.type === "duplicate" ? <Search className="h-4 w-4 text-status-hold" /> :
                   alert.type === "limit_breach" ? <ShieldAlert className="h-4 w-4 text-status-validating" /> :
                   <Activity className="h-4 w-4 text-status-investigation" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-[10px] text-muted-foreground">{alert.store}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{alert.expenseCategory}</span>
                    {alert.amountDeviation > 0 && (
                      <span className="text-[10px] font-semibold text-status-hold flex items-center gap-0.5">
                        <ArrowUpRight className="h-2.5 w-2.5" /> {alert.amountDeviation}% above peer
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                  {new Date(alert.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 4 — Store Benchmark (Out of Pattern)      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Store Benchmark vs Actual</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/reports/benchmarking")}>
            Full Report <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Chart */}
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeBenchmarkData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="store" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(v: number) => [`฿${v.toLocaleString()}`, undefined]} />
                <Bar dataKey="benchmark" fill="hsl(var(--muted-foreground) / 0.2)" radius={[4, 4, 0, 0]} barSize={14} name="Benchmark" />
                <Bar dataKey="actual" radius={[4, 4, 0, 0]} barSize={14} name="Actual">
                  {storeBenchmarkData.map((s, i) => (
                    <Cell key={i} fill={s.actual > s.benchmark ? "hsl(var(--status-hold))" : "hsl(var(--chart-1))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variance Table */}
          <div className="border-t lg:border-t-0 lg:border-l border-border">
            <div className="px-4 py-2 bg-muted/20 border-b border-border">
              <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Store</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Benchmark</span>
                <span className="text-right">Variance</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {benchmarkWithVariance.map(s => (
                <div key={s.store} className="px-4 py-2 grid grid-cols-4 items-center text-xs">
                  <div>
                    <span className="font-medium text-foreground">{s.store}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{s.type.charAt(0)}</span>
                  </div>
                  <span className="text-right tabular-nums font-medium">{(s.actual / 1000).toFixed(0)}k</span>
                  <span className="text-right tabular-nums text-muted-foreground">{(s.benchmark / 1000).toFixed(0)}k</span>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${s.overBudget ? "text-status-hold" : "text-status-approved"}`}>
                      {s.overBudget ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {s.variance > 0 ? "+" : ""}{s.variance}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 5 — Low Balance + Activity + Investigations */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Low Balance Stores */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-status-hold" />
              <h3 className="text-sm font-semibold text-foreground">Low Balance Stores</h3>
              {lowBalanceStores.length > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">{lowBalanceStores.length}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/masters/stores")}>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {lowBalanceStores.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle className="h-8 w-8 text-status-approved mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All stores above minimum balance.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lowBalanceStores.map((s) => {
                const pct = Math.round((s.currentBalance / s.floatLimit) * 100);
                const minPct = Math.round((s.minBalance / s.floatLimit) * 100);
                const isCritical = s.currentBalance <= s.minBalance;
                return (
                  <div key={s.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{s.type}</span>
                      </div>
                      {isCritical && <Badge variant="destructive" className="text-[10px] h-5">Below minimum</Badge>}
                    </div>
                    <div className="relative">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isCritical ? "bg-status-hold" : "bg-status-validating"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {/* Min threshold marker */}
                      <div className="absolute top-0 h-2 border-r-2 border-dashed border-muted-foreground/40" style={{ left: `${minPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground">{s.currentBalance.toLocaleString()} {s.currency}</span>
                      <span>Min: {s.minBalance.toLocaleString()} · Fund: {s.floatLimit.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Today's Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((item, i) => {
              const Icon = activityIcons[item.type] || CircleDot;
              const colorMap: Record<string, string> = {
                approval: "text-status-approved bg-status-approved/10",
                alert: "text-status-validating bg-status-validating/10",
                hold: "text-status-hold bg-status-hold/10",
                claim: "text-primary bg-primary/8",
              };
              const color = colorMap[item.type] || "text-muted-foreground bg-muted";
              return (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{item.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.user} · {item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Investigations + Pending Audits */}
        <div className="lg:col-span-3 space-y-4">
          {/* Investigations */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Investigations</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate("/investigations")}>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {openInvestigations.slice(0, 3).map(inv => (
                <div key={inv.id} className="px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/investigations")}>
                  <p className="text-xs font-medium text-foreground truncate">{inv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SeverityBadge severity={inv.severity} />
                    <span className="text-[10px] text-muted-foreground">{inv.daysOpen}d</span>
                    <span className="text-[10px] text-muted-foreground truncate">{inv.owner.split(" ")[0]}</span>
                  </div>
                </div>
              ))}
              {openInvestigations.length > 3 && (
                <div className="px-4 py-2 text-center">
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => navigate("/investigations")}>
                    +{openInvestigations.length - 3} more
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Audits */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Pending Audits</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate("/audit")}>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {pendingAudits.slice(0, 3).map(aud => (
                <div key={aud.id} className="px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/audit")}>
                  <p className="text-xs font-mono font-medium text-foreground">{aud.claimNumber}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{aud.store} · {aud.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 6 — Exception Queue                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Exception Queue</h3>
            {exceptionClaims.length > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{exceptionClaims.length} items</span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/claims")}>
            All Claims <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Claim #</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Store</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Expense</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptionClaims.map(claim => (
                <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/claims/${claim.id}`)}>
                  <TableCell className="font-mono text-xs font-medium text-foreground">{claim.claimNumber}</TableCell>
                  <TableCell className="text-xs">{claim.store}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{claim.expenseType}</TableCell>
                  <TableCell className="text-xs font-medium text-right tabular-nums">
                    {claim.amount.toLocaleString()} <span className="text-muted-foreground">{claim.currency}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={claim.status} /></TableCell>
                </TableRow>
              ))}
              {exceptionClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No exceptions — all claims processing normally.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
