import { FileText, AlertTriangle, CheckCircle, Wallet, TrendingUp, Clock } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { AlertItem } from "@/components/AlertItem";
import { StatusBadge } from "@/components/StatusBadge";
import { mockClaims, mockAlerts, dashboardMetrics } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const exceptionClaims = mockClaims.filter(c =>
    ["On Hold", "Under Investigation", "Auto Approved with Alert", "Awaiting Audit Document"].includes(c.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Exception-first overview · All countries</p>
        </div>
        <Button onClick={() => navigate("/claims/new")} size="sm">
          New Claim
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Claims"
          value={dashboardMetrics.todayClaims}
          subtitle="Across all stores"
          icon={FileText}
          trend={{ value: 8, label: "vs yesterday" }}
        />
        <MetricCard
          title="Pending Exceptions"
          value={dashboardMetrics.pendingExceptions}
          subtitle="Require attention"
          icon={AlertTriangle}
          variant="alert"
        />
        <MetricCard
          title="Auto-Approval Rate"
          value={`${dashboardMetrics.autoApprovalRate}%`}
          subtitle="MTD average"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 3, label: "vs last month" }}
        />
        <MetricCard
          title="Open Alerts"
          value={dashboardMetrics.alertsOpen}
          subtitle="Across 3 countries"
          icon={Clock}
          variant="alert"
        />
      </div>

      {/* Float Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { country: "Thailand", code: "TH", balance: dashboardMetrics.totalFloatBalance.TH, currency: "THB", spend: dashboardMetrics.mtdSpend.TH },
          { country: "Cambodia", code: "KH", balance: dashboardMetrics.totalFloatBalance.KH, currency: "USD", spend: dashboardMetrics.mtdSpend.KH },
          { country: "Myanmar", code: "MM", balance: dashboardMetrics.totalFloatBalance.MM, currency: "MMK", spend: dashboardMetrics.mtdSpend.MM },
        ].map((c) => (
          <div key={c.code} className="metric-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{c.code}</span>
              <span className="text-sm font-medium text-foreground">{c.country}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Float Balance</p>
                <p className="text-lg font-bold text-foreground">{c.balance.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{c.currency}</span></p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">MTD Spend</p>
                <p className="text-lg font-bold text-foreground">{c.spend.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{c.currency}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Active Alerts</h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/alerts")}>View All</Button>
          </div>
          <div className="space-y-2">
            {mockAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* Exception Claims */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Exception Queue</h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/claims")}>View All Claims</Button>
          </div>
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Claim #</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Store</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptionClaims.map((claim) => (
                  <TableRow key={claim.id} className="data-table-row cursor-pointer">
                    <TableCell className="font-mono text-xs">{claim.claimNumber}</TableCell>
                    <TableCell className="text-sm">{claim.store}</TableCell>
                    <TableCell className="text-sm font-medium">{claim.amount.toLocaleString()} {claim.currency}</TableCell>
                    <TableCell><StatusBadge status={claim.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
