import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, AlertTriangle, Store, Settings, Activity,
  CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { mockUsers, roleLabels } from "@/lib/roles";
import { stores } from "@/lib/mock-data";
import { MOCK_CLAIMS } from "@/data/mockClaims";

interface ConfigChange {
  id: string;
  timestamp: string;
  user: string;
  area: string;
  detail: string;
}

const MOCK_CONFIG_CHANGES: ConfigChange[] = [
  { id: "c1", timestamp: "2026-05-02T08:14:00Z", user: "Kanya Supachai", area: "Policy", detail: "Auto-approval threshold raised TH 5,000 → 7,500 THB" },
  { id: "c2", timestamp: "2026-05-01T16:42:00Z", user: "Kanya Supachai", area: "Sub-types", detail: "Added 'Per Diem — International' sub-type" },
  { id: "c3", timestamp: "2026-05-01T11:05:00Z", user: "Thanyarat Chaiyaphum", area: "Doc Requirements", detail: "Receipt now mandatory for amounts ≥ 1,000 THB" },
  { id: "c4", timestamp: "2026-04-30T09:22:00Z", user: "Kanya Supachai", area: "Users", detail: "Granted regional_manager role to Nattaya Kittisak" },
  { id: "c5", timestamp: "2026-04-29T14:50:00Z", user: "Kanya Supachai", area: "OCR", detail: "OCR confidence cutoff lowered 0.80 → 0.75" },
];

interface HealthIndicator {
  label: string;
  status: "ok" | "warn" | "down";
  detail: string;
}

const HEALTH: HealthIndicator[] = [
  { label: "OCR API", status: "ok", detail: "p95 1.4s · 99.97% uptime" },
  { label: "Azure Entra ID", status: "ok", detail: "Auth latency 220ms" },
  { label: "Database lag", status: "warn", detail: "Replica lag 4.2s (threshold 3s)" },
  { label: "Background jobs", status: "ok", detail: "Queue depth: 3" },
];

function statusColor(s: HealthIndicator["status"]) {
  if (s === "ok") return { dot: "bg-status-approved", icon: <CheckCircle2 className="h-4 w-4 text-status-approved" /> };
  if (s === "warn") return { dot: "bg-amber-500", icon: <Clock className="h-4 w-4 text-amber-500" /> };
  return { dot: "bg-status-hold", icon: <XCircle className="h-4 w-4 text-status-hold" /> };
}

export function SystemAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const activeUsersToday = useMemo(
    () => mockUsers.filter((u) => {
      if (!u.lastLogin) return false;
      const last = new Date(u.lastLogin);
      const today = new Date();
      return last.getFullYear() === today.getFullYear()
        && last.getMonth() === today.getMonth()
        && last.getDate() === today.getDate();
    }).length,
    [],
  );
  // For prototype credibility — show non-zero count even with stale mock dates.
  const activeUsersDisplay = activeUsersToday || mockUsers.filter((u) => u.status === "active").length;

  const claimsThisMonth = useMemo(
    () => MOCK_CLAIMS.filter((c) => new Date(c.transaction_date) >= monthStart).length,
    [monthStart],
  );

  const failedJobs = 2; // mock
  const activeStores = stores.length;

  const recentLogins = useMemo(
    () => [...mockUsers]
      .filter((u) => u.lastLogin)
      .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
      .slice(0, 6),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">System Administration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform health, user activity, and configuration · {user?.full_name ?? "Admin"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide gap-1">
            <ShieldCheck className="h-3 w-3" /> System admin
          </Badge>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/admin/system-settings")}>
            <Settings className="h-3.5 w-3.5" /> System Settings
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active users today"
          value={activeUsersDisplay}
          icon={<Users className="h-4 w-4 text-primary" />}
          tone="bg-primary/10"
          sub={`of ${mockUsers.length} provisioned`}
          onClick={() => navigate("/admin/employees")}
        />
        <StatCard
          label="Claims processed (MTD)"
          value={claimsThisMonth}
          icon={<FileText className="h-4 w-4 text-status-approved" />}
          tone="bg-status-approved/10"
          sub="Across all stores"
        />
        <StatCard
          label="System errors / failed jobs"
          value={failedJobs}
          icon={<AlertTriangle className="h-4 w-4 text-status-hold" />}
          tone="bg-status-hold/10"
          sub="Last 24h"
        />
        <StatCard
          label="Active stores"
          value={activeStores}
          icon={<Store className="h-4 w-4 text-status-validating" />}
          tone="bg-status-validating/10"
          sub="Across 4 countries"
          onClick={() => navigate("/admin/stores")}
        />
      </div>

      {/* System health */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">System health</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {HEALTH.map((h) => {
            const c = statusColor(h.status);
            return (
              <div key={h.label} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5">{c.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {h.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{h.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User activity + Config changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">User activity log</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/admin/employees")}>
              All users <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="section-label">User</TableHead>
                <TableHead className="section-label">Role</TableHead>
                <TableHead className="section-label">Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogins.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{roleLabels[u.role]}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.lastLogin).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent config changes</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/audit-trail")}>
              Audit log <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="section-label">When</TableHead>
                <TableHead className="section-label">Area</TableHead>
                <TableHead className="section-label">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CONFIG_CHANGES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.timestamp).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{c.area}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <p className="text-foreground">{c.detail}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">by {c.user}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, tone, sub, onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm p-4 ${onClick ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums mt-2">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
