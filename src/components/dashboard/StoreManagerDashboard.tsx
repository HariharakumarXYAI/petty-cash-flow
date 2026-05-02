import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus, CheckSquare, FileText, AlertTriangle, ArrowRight,
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

function firstName(full?: string | null) {
  if (!full) return "there";
  return full.split(" ")[0] ?? full;
}

function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function StoreManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "short", year: "numeric",
      }),
    [],
  );

  const store = useMemo(
    () => (user?.store_id ? stores.find((s) => s.id === user.store_id) : null),
    [user?.store_id],
  );
  const storeName = store?.name ?? user?.scope?.label ?? "Your store";

  // Scope filtered claims (manager → store scope)
  const storeClaims = useMemo<MockClaim[]>(() => {
    if (!user) return [];
    return applyScope(MOCK_CLAIMS, getDefaultScope(user), user);
  }, [user]);

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const claimsThisMonth = storeClaims.filter(
    (c) => new Date(c.transaction_date) >= monthStart,
  );

  const pendingApproval = storeClaims.filter((c) => c.status === "Pending");
  const myDrafts = MOCK_CLAIMS.filter(
    (c) => c.status === "Draft" && c.submitted_by === user?.user_id,
  );
  const approvedThisMonth = claimsThisMonth.filter(
    (c) => c.status === "Approved" || c.status === "Approved with Alert",
  );
  const totalApprovedAmount = approvedThisMonth.reduce((s, c) => s + c.amount, 0);
  const autoApprovalRate = claimsThisMonth.length === 0
    ? 0
    : Math.round((approvedThisMonth.length / claimsThisMonth.length) * 100);

  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of approvedThisMonth) {
      // Top-level expense bucket = everything before the first " — " or " /" if present
      const cat = c.expense_type.split(" — ")[0].split(" / ")[0];
      map.set(cat, (map.get(cat) ?? 0) + c.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [approvedThisMonth]);

  const openAdvances = useMemo(() => {
    if (!user?.store_id) return [];
    return advances
      .filter((a) => a.storeId === user.store_id && a.status !== "Settled")
      .sort((a, b) => {
        const order = { Overdue: 0, Blocked: 1, "Partially Settled": 2, Open: 3, Settled: 4 } as const;
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      })
      .slice(0, 10);
  }, [user?.store_id]);

  const recentActivity = useMemo(
    () =>
      [...storeClaims]
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
        .slice(0, 10),
    [storeClaims],
  );

  const submitterCount = new Set(claimsThisMonth.map((c) => c.submitted_by)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hello, {firstName(user?.full_name ?? user?.displayName)}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {storeName} · Store Manager · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/claims/new")} size="sm" className="gap-1.5">
            <FilePlus className="h-3.5 w-3.5" /> Submit a new claim
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/approvals")}
            className="gap-1.5"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Approvals queue
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {pendingApproval.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pending my approval"
          value={pendingApproval.length.toString()}
          hint="At your store"
          onClick={() => navigate("/approvals")}
        />
        <StatCard
          label="My drafts"
          value={myDrafts.length.toString()}
          hint="Owned by you"
          onClick={() => navigate("/claims")}
        />
        <StatCard
          label="Store this month"
          value={`฿${totalApprovedAmount.toLocaleString()}`}
          hint={`${approvedThisMonth.length} approved claims`}
        />
        <StatCard
          label="Auto-approval rate"
          value={`${autoApprovalRate}%`}
          hint={`${claimsThisMonth.length} claims this month`}
        />
      </div>

      {/* Spend by category — single store */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Store Spend by Category</h3>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">MTD · {storeName}</span>
        </div>
        <div className="p-4 h-64">
          {spendByCategory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No approved spend this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCategory} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="category"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={140} axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`฿${v.toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
                  {spendByCategory.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two-column: Open advances + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open advances */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Open Advances · {storeName}</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/advances")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Recipient</TableHead>
                <TableHead className="section-label">Purpose</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    No open advances at your store.
                  </TableCell>
                </TableRow>
              ) : (
                openAdvances.map((a) => (
                  <TableRow key={a.id} className="hover:bg-secondary/50">
                    <TableCell className="text-sm">{a.recipient}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={a.purpose}>
                      {a.purpose}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                      {a.amount.toLocaleString("en-US")} <span className="text-[10px] text-muted-foreground">{a.currency}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          a.status === "Overdue"
                            ? "inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 px-2 py-0.5 text-[11px] font-medium"
                            : a.status === "Blocked"
                            ? "inline-flex items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 px-2 py-0.5 text-[11px] font-medium"
                            : "inline-flex items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-2 py-0.5 text-[11px] font-medium"
                        }
                      >
                        {a.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Recent activity · {storeName}</h3>
              <Badge variant="secondary" className="h-5 text-[10px]">{recentActivity.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/claims")}>
              View claims <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Claim #</TableHead>
                <TableHead className="section-label">Submitter</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    No recent claims at your store.
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((c) => (
                  <TableRow
                    key={c.claim_no}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/claims/${c.claim_no}`)}
                  >
                    <TableCell className="font-mono text-xs">{c.claim_no}</TableCell>
                    <TableCell className="text-sm">{c.submitter_name}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                      {c.amount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateDMY(c.transaction_date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer line for context */}
      <p className="text-[11px] text-muted-foreground">
        {storeName} · {submitterCount} submitter{submitterCount === 1 ? "" : "s"} this month · {claimsThisMonth.length} claims
      </p>
    </div>
  );
}

function StatCard({
  label, value, hint, onClick,
}: {
  label: string; value: string; hint?: string; onClick?: () => void;
}) {
  return (
    <div
      className={
        "bg-card border border-border rounded-xl shadow-sm p-4 " +
        (onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : "")
      }
      onClick={onClick}
    >
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums mt-2">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
