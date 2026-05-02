import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert, AlertTriangle, FileSearch, Clock, ArrowRight, Store, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { investigations } from "@/lib/mock-data";
import { MOCK_CLAIMS } from "@/data/mockClaims";
import { SeverityBadge } from "@/components/StatusBadge";

export function InternalAuditDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openInvestigations = useMemo(
    () => investigations.filter((i) => i.status !== "Resolved"),
    [],
  );

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const flaggedThisMonth = useMemo(() => {
    return MOCK_CLAIMS.filter((c) => {
      if (!c.alert) return false;
      return new Date(c.transaction_date) >= monthStart;
    });
  }, [monthStart]);

  const lowConfidenceThisMonth = useMemo(
    () => MOCK_CLAIMS.filter(
      (c) => c.ocr_status === "low_confidence"
        && new Date(c.transaction_date) >= monthStart,
    ),
    [monthStart],
  );

  const anomalyCount = flaggedThisMonth.length + lowConfidenceThisMonth.length;

  const pendingReview = useMemo(
    () => MOCK_CLAIMS.filter(
      (c) => c.status === "On Hold" || c.status === "Approved with Alert",
    ),
    [],
  );

  // Stores with most exceptions chart
  const exceptionsByStore = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const c of MOCK_CLAIMS) {
      if (!c.alert && c.ocr_status !== "low_confidence" && c.status !== "On Hold") continue;
      const cur = counts.get(c.store_id) ?? { name: c.store_name, count: 0 };
      cur.count += 1;
      counts.set(c.store_id, cur);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, []);

  const recentFlagged = useMemo(
    () => MOCK_CLAIMS.filter((c) => c.alert).slice(0, 6),
    [],
  );

  const firstName = user?.full_name?.split(" ")[0] ?? "Auditor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All countries · read-only oversight · {firstName}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          <Eye className="h-3 w-3 mr-1" /> Read-only
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Open investigations"
          value={openInvestigations.length}
          icon={<FileSearch className="h-4 w-4 text-status-investigation" />}
          tone="bg-status-investigation/10"
          onClick={() => navigate("/investigations")}
        />
        <StatCard
          label="Anomaly flags this month"
          value={anomalyCount}
          icon={<AlertTriangle className="h-4 w-4 text-status-hold" />}
          tone="bg-status-hold/10"
          sub={`${flaggedThisMonth.length} alerts · ${lowConfidenceThisMonth.length} low OCR`}
          onClick={() => navigate("/alerts")}
        />
        <StatCard
          label="Reviewed this month"
          value={0}
          icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />}
          tone="bg-muted"
          sub="Tracked once review actions ship"
        />
        <StatCard
          label="Pending review"
          value={pendingReview.length}
          icon={<Clock className="h-4 w-4 text-status-validating" />}
          tone="bg-status-validating/10"
          sub="On Hold + Approved with Alert"
          onClick={() => navigate("/claims")}
        />
      </div>

      {/* Investigations queue + Stores chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-status-investigation" />
              <h3 className="text-sm font-semibold text-foreground">Investigations queue</h3>
              <Badge variant="outline" className="text-[10px] h-5">{openInvestigations.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/investigations")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {openInvestigations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No open investigations.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="section-label">Case</TableHead>
                  <TableHead className="section-label">Store</TableHead>
                  <TableHead className="section-label">Severity</TableHead>
                  <TableHead className="section-label">Days open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openInvestigations.slice(0, 6).map((i) => (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate("/investigations")}
                  >
                    <TableCell className="text-xs font-medium">{i.caseNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.store}</TableCell>
                    <TableCell><SeverityBadge severity={i.severity} /></TableCell>
                    <TableCell className="text-xs tabular-nums">{i.daysOpen}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Stores with most exceptions</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptionsByStore} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={130} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`${v} exceptions`, ""]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                  {exceptionsByStore.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent flagged transactions */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-hold" />
            <h3 className="text-sm font-semibold text-foreground">Recent flagged transactions</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/claims")}>
            View all claims <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {recentFlagged.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No flagged transactions.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="section-label">Claim #</TableHead>
                <TableHead className="section-label">Store</TableHead>
                <TableHead className="section-label">Submitter</TableHead>
                <TableHead className="section-label">Alert</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFlagged.map((c) => (
                <TableRow
                  key={c.claim_no}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => navigate(`/claims/${c.claim_no}`)}
                >
                  <TableCell className="text-xs font-mono font-medium">{c.claim_no}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.store_name}</TableCell>
                  <TableCell className="text-xs">{c.submitter_name}</TableCell>
                  <TableCell className="text-xs text-amber-700 dark:text-amber-300">{c.alert?.message}</TableCell>
                  <TableCell className="text-xs tabular-nums text-right">{c.amount.toLocaleString()} THB</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
