import {
  FileText, AlertTriangle, CheckCircle, Clock, Wallet, TrendingDown,
  ArrowRight, Activity,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { AlertItem } from "@/components/AlertItem";
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge";
import {
  claims, alerts, stores, investigations, auditRequests,
  getDashboardMetrics, monthlySpendData, spendByCategory,
  storeBenchmarkData, recentActivity,
} from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { country, storeId } = useGlobalFilter();
  const metrics = getDashboardMetrics(country);

  const filteredAlerts = (country === "all" ? alerts : alerts.filter(a => a.country === country))
    .filter(a => a.status === "Open" || a.status === "In Progress")
    .slice(0, 5);

  const exceptionClaims = (country === "all" ? claims : claims.filter(c => c.country === country))
    .filter(c => ["On Hold", "Under Investigation", "Auto Approved with Alert", "Awaiting Audit Document"].includes(c.status));

  const lowBalanceStores = (country === "all" ? stores : stores.filter(s => s.country === country))
    .filter(s => s.currentBalance <= s.minBalance * 1.3)
    .sort((a, b) => (a.currentBalance / a.minBalance) - (b.currentBalance / b.minBalance));

  const openInvestigations = (country === "all" ? investigations : investigations.filter(i => i.country === country))
    .filter(i => i.status !== "Resolved");

  const pendingAudits = (country === "all" ? auditRequests : auditRequests.filter(a => a.country === country))
    .filter(a => a.status !== "Completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Exception-first overview · {country === "all" ? "All countries" : country}</p>
        </div>
        <Button onClick={() => navigate("/claims/new")} size="sm">
          New Claim
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Cash on Hand"
          value={metrics.totalFloat.toLocaleString()}
          subtitle={country === "all" ? "All countries (mixed)" : undefined}
          icon={Wallet}
          variant="default"
        />
        <MetricCard
          title="Today's Claims"
          value={metrics.todayClaims}
          subtitle="Auto-processed"
          icon={FileText}
          trend={{ value: 12, label: "vs yesterday" }}
        />
        <MetricCard
          title="Auto-Approval"
          value={`${metrics.autoApprovedRate}%`}
          subtitle="MTD rate"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 3, label: "vs last month" }}
        />
        <MetricCard
          title="On Hold"
          value={metrics.onHold}
          subtitle="Need attention"
          icon={AlertTriangle}
          variant="danger"
          onClick={() => navigate("/alerts")}
        />
        <MetricCard
          title="High-Risk Alerts"
          value={metrics.openAlerts}
          subtitle="Open cases"
          icon={Activity}
          variant="warning"
          onClick={() => navigate("/alerts")}
        />
        <MetricCard
          title="Overdue Advances"
          value={metrics.overdueAdvances}
          subtitle={`${metrics.lowBalanceStores} stores low bal.`}
          icon={Clock}
          variant={metrics.overdueAdvances > 0 ? "danger" : "default"}
          onClick={() => navigate("/advances")}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Spend Chart */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Monthly Spend vs Last Year</h3>
            <span className="section-label">THB (all stores)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, undefined]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="thisYear" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} name="2026" />
                <Line type="monotone" dataKey="lastYear" stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="2025" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Spend by Expense Type</h3>
            <span className="section-label">MTD</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Store Benchmark */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Store Type Benchmark vs Actual</h3>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/reports/benchmarking")}>View Details</Button>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storeBenchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="store" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={18} name="Actual" />
              <Bar dataKey="benchmark" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} barSize={18} name="Benchmark" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Low Balance Stores */}
        <div className="lg:col-span-4 metric-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Low Balance Stores</h3>
            <TrendingDown className="h-4 w-4 text-status-hold" />
          </div>
          {lowBalanceStores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">All stores above minimum</p>
          ) : (
            <div className="space-y-3">
              {lowBalanceStores.map((s) => {
                const pct = Math.round((s.currentBalance / s.minBalance) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">{s.currentBalance.toLocaleString()} / {s.minBalance.toLocaleString()} {s.currency}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct <= 100 ? "bg-status-hold" : "bg-status-validating"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3 metric-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2.5">
            {recentActivity.slice(0, 6).map((item, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-muted-foreground font-mono shrink-0 w-10">{item.time}</span>
                <span className="text-foreground">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Investigations */}
        <div className="lg:col-span-3 metric-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Open Investigations</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/investigations")}>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {openInvestigations.slice(0, 4).map((inv) => (
              <div key={inv.id} className="p-2 rounded-md border bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors">
                <p className="text-xs font-medium text-foreground">{inv.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{inv.caseNumber}</span>
                  <SeverityBadge severity={inv.severity} />
                  <span className="text-[10px] text-muted-foreground">{inv.daysOpen}d open</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Audit Requests */}
        <div className="lg:col-span-2 metric-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Audits</h3>
          <div className="space-y-2">
            {pendingAudits.slice(0, 4).map((aud) => (
              <div key={aud.id} className="text-xs cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/audit")}>
                <p className="font-mono font-medium">{aud.claimNumber}</p>
                <p className="text-muted-foreground">{aud.store} · {aud.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exception Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Exception Queue</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/claims")}>View All Claims</Button>
        </div>
        <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Claim #</TableHead>
                <TableHead className="section-label">Store</TableHead>
                <TableHead className="section-label hidden md:table-cell">Expense</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptionClaims.map((claim) => (
                <TableRow key={claim.id} className="data-table-row cursor-pointer" onClick={() => navigate(`/claims/${claim.id}`)}>
                  <TableCell className="font-mono text-xs font-medium">{claim.claimNumber}</TableCell>
                  <TableCell className="text-sm">{claim.store}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{claim.expenseType}</TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums">
                    {claim.amount.toLocaleString()} <span className="text-xs text-muted-foreground">{claim.currency}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={claim.status} /></TableCell>
                </TableRow>
              ))}
              {exceptionClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No exceptions found — all claims are processing normally.
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
