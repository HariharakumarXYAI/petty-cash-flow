import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare, AlertTriangle, ArrowRight, Wallet, Store as StoreIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MOCK_CLAIMS, type MockClaim } from "@/data/mockClaims";
import { advances, stores } from "@/lib/mock-data";
import { applyScope, getDefaultScope } from "@/lib/scope";
import { regionLabels } from "@/lib/roles";
import { cn } from "@/lib/utils";

function firstName(full?: string | null) {
  if (!full) return "there";
  return full.split(" ")[0] ?? full;
}

function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const AUTO_TARGET = 70; // auto-approval target %

export function RegionalManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = useMemo(
    () => new Date().toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "short", year: "numeric",
    }),
    [],
  );

  const regionId = user?.region_id ?? null;
  const regionName = (regionId && regionLabels[regionId]) || user?.scope?.label || "Your region";

  const regionStores = useMemo(
    () => (regionId ? stores.filter((s) => s.region_id === regionId) : []),
    [regionId],
  );

  // Region-scoped claims
  const regionClaims = useMemo<MockClaim[]>(() => {
    if (!user) return [];
    return applyScope(MOCK_CLAIMS, getDefaultScope(user), user);
  }, [user]);

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const claimsThisMonth = regionClaims.filter(
    (c) => new Date(c.transaction_date) >= monthStart,
  );
  const approvedThisMonth = claimsThisMonth.filter(
    (c) => c.status === "Approved" || c.status === "Approved with Alert",
  );
  const totalApprovedAmount = approvedThisMonth.reduce((s, c) => s + c.amount, 0);

  // Per-store metrics
  const perStore = useMemo(() => {
    return regionStores.map((s) => {
      const sc = claimsThisMonth.filter((c) => c.store_id === s.id);
      const approved = sc.filter((c) => c.status === "Approved" || c.status === "Approved with Alert");
      const exceptions = sc.filter((c) => c.status === "On Hold" || c.status === "Rejected" || c.alert);
      const autoRate = sc.length === 0 ? 0 : Math.round((approved.length / sc.length) * 100);
      const spend = approved.reduce((acc, c) => acc + c.amount, 0);
      return {
        id: s.id,
        name: s.name,
        spend,
        claims: sc.length,
        autoRate,
        exceptionRate: sc.length === 0 ? 0 : Math.round((exceptions.length / sc.length) * 100),
        underTarget: autoRate < AUTO_TARGET,
      };
    });
  }, [regionStores, claimsThisMonth]);

  const storesUnderTarget = perStore.filter((s) => s.claims > 0 && s.underTarget).length;

  const pendingEscalations = regionClaims.filter(
    (c) => c.status === "On Hold" || c.status === "Pending",
  );

  const overdueAdvances = useMemo(() => {
    const ids = new Set(regionStores.map((s) => s.id));
    return advances.filter((a) => ids.has(a.storeId) && a.status === "Overdue");
  }, [regionStores]);

  const exceptionFeed = useMemo(() => {
    return regionClaims
      .filter((c) => c.status === "On Hold" || c.status === "Rejected" || (c.alert && c.status === "Approved with Alert"))
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 8);
  }, [regionClaims]);

  const pendingQueue = useMemo(() => {
    return regionClaims
      .filter((c) => c.status === "On Hold" || c.status === "Pending")
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 8);
  }, [regionClaims]);

  const rankingData = useMemo(
    () => [...perStore].sort((a, b) => b.spend - a.spend),
    [perStore],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hello, {firstName(user?.full_name ?? user?.displayName)}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Region: {regionName} · {regionStores.length} stores · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/approvals")}>
            <CheckSquare className="h-3.5 w-3.5" />
            Approvals
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {pendingEscalations.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Region this month"
          value={`฿${totalApprovedAmount.toLocaleString()}`}
          hint={`${approvedThisMonth.length} approved · ${regionStores.length} stores`}
        />
        <StatCard
          label="Stores under target"
          value={storesUnderTarget.toString()}
          hint={`Below ${AUTO_TARGET}% auto-approval`}
          tone={storesUnderTarget > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Pending escalations"
          value={pendingEscalations.length.toString()}
          hint="On hold / pending"
          onClick={() => navigate("/approvals")}
          tone={pendingEscalations.length > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Overdue advances"
          value={overdueAdvances.length.toString()}
          hint="Across region"
          onClick={() => navigate("/advances")}
          tone={overdueAdvances.length > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Store ranking */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Store Ranking — Spend MTD</h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{regionName} · THB</span>
        </div>
        <div className="p-4 h-64">
          {rankingData.every((s) => s.spend === 0) ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No approved spend this month in your region.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={150} axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`฿${v.toLocaleString()}`, "Approved spend"]}
                />
                <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={16}>
                  {rankingData.map((s, i) => (
                    <Cell key={s.id} fill={s.underTarget && s.claims > 0 ? "hsl(var(--destructive))" : `hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground">
          {perStore.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{s.name}</span>
              <span className={cn("font-semibold tabular-nums", s.underTarget && s.claims > 0 ? "text-destructive" : "text-foreground")}>
                {s.autoRate}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Exception feed + Pending queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-hold" />
              <h3 className="text-sm font-semibold text-foreground">Region Exceptions</h3>
              <Badge variant="alert" className="text-[10px] h-5">{exceptionFeed.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/alerts")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Claim #</TableHead>
                <TableHead className="section-label">Store</TableHead>
                <TableHead className="section-label">Status</TableHead>
                <TableHead className="section-label">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptionFeed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    No exceptions in your region.
                  </TableCell>
                </TableRow>
              ) : (
                exceptionFeed.map((c) => (
                  <TableRow key={c.claim_no} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/claims/${c.claim_no}`)}>
                    <TableCell className="font-mono text-xs">{c.claim_no}</TableCell>
                    <TableCell className="text-sm">{c.store_name}</TableCell>
                    <TableCell className="text-xs">{c.status}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateDMY(c.transaction_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Pending Approvals · Region</h3>
              <Badge variant="secondary" className="h-5 text-[10px]">{pendingQueue.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/approvals")}>
              Open queue <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Claim #</TableHead>
                <TableHead className="section-label">Store</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    No pending escalations.
                  </TableCell>
                </TableRow>
              ) : (
                pendingQueue.map((c) => (
                  <TableRow key={c.claim_no} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/claims/${c.claim_no}`)}>
                    <TableCell className="font-mono text-xs">{c.claim_no}</TableCell>
                    <TableCell className="text-sm">{c.store_name}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">{c.amount.toLocaleString("en-US")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateDMY(c.transaction_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
        <Wallet className="h-3 w-3" />
        {regionStores.length} stores · {claimsThisMonth.length} claims this month · {overdueAdvances.length} overdue advance{overdueAdvances.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function StatCard({
  label, value, hint, onClick, tone,
}: {
  label: string; value: string; hint?: string; onClick?: () => void; tone?: "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm p-4",
        onClick && "cursor-pointer hover:border-primary/40 transition-colors",
      )}
      onClick={onClick}
    >
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn(
        "text-2xl font-bold tabular-nums mt-2",
        tone === "warn" ? "text-status-hold" : "text-foreground",
      )}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
