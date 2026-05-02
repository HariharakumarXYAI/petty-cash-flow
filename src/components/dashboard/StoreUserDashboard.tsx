import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus, ArrowRight, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MOCK_CLAIMS, type ClaimStatus } from "@/data/mockClaims";
import { advances, stores } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<ClaimStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  "Approved with Alert": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "On Hold": "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  Settled: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function firstName(full?: string | null) {
  if (!full) return "there";
  return full.split(" ")[0] ?? full;
}

export function StoreUserDashboard() {
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

  // Self-scoped claims (the only scope a Store User has).
  const myClaims = useMemo(
    () => MOCK_CLAIMS.filter((c) => c.submitted_by === user?.user_id),
    [user?.user_id],
  );

  const myDrafts = myClaims.filter((c) => c.status === "Draft");
  const myPending = myClaims.filter((c) => c.status === "Pending");

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const monthSpend = myClaims
    .filter((c) => c.status === "Approved" || c.status === "Approved with Alert")
    .filter((c) => new Date(c.transaction_date) >= monthStart)
    .reduce((s, c) => s + c.amount, 0);

  const recent = useMemo(
    () =>
      [...myClaims]
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
        .slice(0, 5),
    [myClaims],
  );

  // Self-scoped advances. Advances are keyed by recipient name in the mock; match
  // by the user's full_name / displayName.
  const myOpenAdvances = useMemo(() => {
    if (!user) return [];
    const candidates = [user.full_name, user.displayName].filter(Boolean) as string[];
    return advances.filter(
      (a) =>
        (a.status === "Open" ||
          a.status === "Overdue" ||
          a.status === "Partially Settled") &&
        candidates.includes(a.recipient),
    );
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Hello, {firstName(user?.full_name ?? user?.displayName)}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {storeName} · {today}
        </p>
      </div>

      {/* Quick action */}
      <div className="bg-gradient-to-br from-primary/8 to-primary/[0.02] border border-primary/15 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-foreground">Need to claim an expense?</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Snap your receipt — auto-approval takes under 90 seconds.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => navigate("/claims/new")}>
          <FilePlus className="h-4 w-4" />
          Submit a new claim
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="My drafts"
          value={myDrafts.length.toString()}
          hint="Not yet submitted"
          onClick={() => navigate("/claims?status=Draft")}
        />
        <StatCard
          label="Awaiting approval"
          value={myPending.length.toString()}
          hint="Pending review"
          onClick={() => navigate("/claims?status=Pending")}
        />
        <StatCard
          label="This month's spend"
          value={`${monthSpend.toLocaleString("en-US")} THB`}
          hint="Approved claims"
        />
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">My recent claims</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => navigate("/claims")}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Claim #</TableHead>
              <TableHead className="section-label">Expense</TableHead>
              <TableHead className="section-label text-right">Amount</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  You haven't submitted any claims yet.
                </TableCell>
              </TableRow>
            ) : (
              recent.map((c) => (
                <TableRow
                  key={c.claim_no}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => navigate(`/claims/${c.claim_no}`)}
                >
                  <TableCell className="font-mono text-xs">{c.claim_no}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate" title={c.expense_type}>
                    {c.expense_type}
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                    {c.amount.toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-muted-foreground">THB</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_PILL[c.status])}>
                      {c.status}
                    </span>
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

      {/* Open advances */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">My open advances</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => navigate("/advances")}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {myOpenAdvances.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            You have no open advances.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label">Advance #</TableHead>
                <TableHead className="section-label">Purpose</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Status</TableHead>
                <TableHead className="section-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOpenAdvances.map((a) => (
                <TableRow key={a.id} className="hover:bg-secondary/50">
                  <TableCell className="font-mono text-xs">{a.advanceNumber}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate" title={a.purpose}>
                    {a.purpose}
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                    {a.amount.toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-muted-foreground">{a.currency}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        a.status === "Overdue"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
                      )}
                    >
                      {a.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => navigate(`/advances?settle=${a.id}`)}
                    >
                      Settle
                    </Button>
                  </TableCell>
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
  label, value, hint, onClick,
}: { label: string; value: string; hint?: string; onClick?: () => void }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm p-4",
        onClick && "cursor-pointer hover:border-primary/40 transition-colors",
      )}
      onClick={onClick}
    >
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums mt-2">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
