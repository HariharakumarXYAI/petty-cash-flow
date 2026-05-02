import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Download, CalendarIcon, CheckCircle2, AlertTriangle, Loader2, Minus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MOCK_CLAIMS, STATUS_TABS, type ClaimStatus, type OcrStatus, type MockClaim } from "@/data/mockClaims";
import { useAuth } from "@/contexts/AuthContext";
import { applyScope, getDefaultScope, type Scope } from "@/lib/scope";
import { stores } from "@/lib/mock-data";

const STATUS_PILL: Record<ClaimStatus, string> = {
  "Draft": "bg-muted text-muted-foreground",
  "Pending": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Approved": "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  "Approved with Alert": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "On Hold": "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Rejected": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "Settled": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

function StatusPill({ status }: { status: ClaimStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_PILL[status])}>
      {status}
    </span>
  );
}

function OcrIcon({ status }: { status: OcrStatus }) {
  if (status === "confirmed") return <CheckCircle2 className="h-4 w-4 text-status-approved mx-auto" aria-label="OCR confirmed" />;
  if (status === "low_confidence") return <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" aria-label="OCR low confidence" />;
  if (status === "processing") return <Loader2 className="h-4 w-4 text-muted-foreground mx-auto animate-spin" aria-label="OCR processing" />;
  return <Minus className="h-4 w-4 text-muted-foreground mx-auto" aria-label="OCR not applicable" />;
}

function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const uniqueExpenseTypes = [...new Set(MOCK_CLAIMS.map(c => c.expense_type))].sort();

type DatePreset = "today" | "week" | "month" | "last30" | "all" | "custom";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function computePreset(preset: Exclude<DatePreset, "custom">): { from?: Date; to?: Date } {
  const today = startOfDay(new Date());
  if (preset === "all") return { from: undefined, to: undefined };
  if (preset === "today") return { from: today, to: today };
  if (preset === "month") {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
  }
  if (preset === "last30") {
    const from = new Date(today); from.setDate(from.getDate() - 30);
    return { from, to: today };
  }
  // week → Monday of current week
  const day = today.getDay(); // 0 Sun – 6 Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(today); monday.setDate(monday.getDate() - diffToMonday);
  return { from: monday, to: today };
}
function detectPreset(from?: Date, to?: Date): DatePreset {
  if (!from && !to) return "all";
  for (const p of ["today", "week", "month", "last30"] as const) {
    const r = computePreset(p);
    if (isSameDay(r.from, from) && isSameDay(r.to, to)) return p;
  }
  return "custom";
}

const PRESETS: { id: Exclude<DatePreset, "custom">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

export default function ClaimsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [expenseFilter, setExpenseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const initialMonth = useMemo(() => computePreset("month"), []);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(initialMonth.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(initialMonth.to);

  // Role-aware scope toggle (currently only Store Manager has a toggle).
  const isStoreManager = user?.role === "store_manager";
  const [scopeMode, setScopeMode] = useState<"self" | "store">("store");

  // Effective scope for filtering MOCK_CLAIMS.
  const scope: Scope | null = useMemo(() => {
    if (!user) return null;
    if (isStoreManager) {
      return scopeMode === "self"
        ? { type: "self", user_id: user.user_id, store_id: user.store_id }
        : { type: "store", store_id: user.store_id };
    }
    return getDefaultScope(user);
  }, [user, isStoreManager, scopeMode]);

  // Scope-filtered base list (everything else filters off this).
  const scopedClaims = useMemo<MockClaim[]>(() => {
    if (!user || !scope) return [];
    return applyScope(MOCK_CLAIMS, scope, user);
  }, [user, scope]);

  const storeName = useMemo(() => {
    if (!user?.store_id) return user?.scope?.label ?? "All stores";
    return stores.find((s) => s.id === user.store_id)?.name ?? user.scope?.label ?? "Your store";
  }, [user]);

  // Hide Store column when scope is fixed to a single store.
  const hideStoreColumn = scope?.type === "store" || scope?.type === "self";

  const applyPreset = (id: Exclude<DatePreset, "custom">) => {
    const r = computePreset(id);
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  const activePreset = useMemo(() => detectPreset(dateFrom, dateTo), [dateFrom, dateTo]);

  // Tab counts based on full data set (independent of active tab)
  const tabCounts = useMemo(
    () => STATUS_TABS.map(tab => (tab.label === "All" ? MOCK_CLAIMS.length : MOCK_CLAIMS.filter(c => c.status === tab.label).length)),
    []
  );

  const filtered = useMemo<MockClaim[]>(() => {
    const tab = STATUS_TABS[activeTab];
    return MOCK_CLAIMS.filter((c) => {
      if (tab.label !== "All" && c.status !== tab.label) return false;
      if (expenseFilter !== "all" && c.expense_type !== expenseFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      if (dateFrom || dateTo) {
        const t = new Date(c.transaction_date + "T00:00:00").getTime();
        if (dateFrom) {
          const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
          if (t < from.getTime()) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
          if (t > to.getTime()) return false;
        }
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!c.claim_no.toLowerCase().includes(q) && !c.submitter_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, expenseFilter, statusFilter, dateFrom, dateTo, search]);

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} claims found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => navigate("/claims/new")}><Plus className="h-3.5 w-3.5 mr-1.5" />New Claim</Button>
        </div>
      </div>

      {/* Row 1: Search + filters */}
      <div className="filter-bar flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by claim # or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={expenseFilter} onValueChange={setExpenseFilter}>
          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="All Expenses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expenses</SelectItem>
            {uniqueExpenseTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_TABS.filter(t => t.label !== "All").map(t => <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Date range with preset chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Transaction Date:</span>

        {/* Preset chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => {
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={cn(
                  "h-7 px-2.5 rounded-full border text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={active}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <span className="mx-1 h-5 w-px bg-border hidden sm:inline-block" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-8 w-[150px] justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "—"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground">to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-8 w-[150px] justify-start text-left text-xs font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "—"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 3: Status pill tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
              activeTab === i
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn(
              "inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-semibold",
              activeTab === i ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            )}>
              {tabCounts[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <TooltipProvider delayDuration={150}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="section-label sticky left-0 bg-card z-10 min-w-[200px]">Claim #</TableHead>
                <TableHead className="section-label">Store</TableHead>
                <TableHead className="section-label hidden md:table-cell">Submitter</TableHead>
                <TableHead className="section-label hidden lg:table-cell">Expense</TableHead>
                <TableHead className="section-label text-right">Amount</TableHead>
                <TableHead className="section-label">Status</TableHead>
                <TableHead className="section-label text-center hidden lg:table-cell">OCR</TableHead>
                <TableHead className="section-label hidden xl:table-cell">Date</TableHead>
                <TableHead className="section-label hidden xl:table-cell">Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                    No claims match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow
                    key={c.claim_no}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/claims/${c.claim_no}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium sticky left-0 bg-card z-10">{c.claim_no}</TableCell>
                    <TableCell className="text-sm">{c.store_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{c.submitter_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[220px] truncate" title={c.expense_type}>
                      {c.expense_type}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-right tabular-nums whitespace-nowrap">
                      {c.amount.toLocaleString("en-US")} <span className="text-[10px] text-muted-foreground">THB</span>
                    </TableCell>
                    <TableCell><StatusPill status={c.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      <OcrIcon status={c.ocr_status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                      {formatDateDMY(c.transaction_date)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {c.alert ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 max-w-[220px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span className="truncate">{truncate(c.alert.message, 30)}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            <p className="font-medium">{c.alert.type}</p>
                            <p>{c.alert.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}
