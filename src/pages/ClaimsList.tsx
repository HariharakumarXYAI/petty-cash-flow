import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Download, CalendarIcon } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { claims, stores, type ClaimStatus, type Claim, employeeProfiles, getEmployeeProfile } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const hoPositions = ["Staff", "Senior Staff", "Manager", "Senior Manager", "Associate Director", "Director", "Senior Director"];
const storePositions = ["Staff", "Senior Staff", "Store Manager – Hypermarket", "Store Manager – Supermarket", "Store Manager – Mini", "Area Manager", "Director – Region Operations"];
const allPositionsList = [...new Set([...hoPositions, ...storePositions])];

// Status tab definitions with mapping to ClaimStatus values
const statusTabs: { label: string; statuses: ClaimStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Draft", statuses: ["Draft"] },
  { label: "Pending", statuses: ["Submitted", "OCR Validating", "Awaiting Audit Document"] },
  { label: "Approved", statuses: ["Auto Approved"] },
  { label: "Approved with Alert", statuses: ["Auto Approved with Alert"] },
  { label: "On Hold", statuses: ["On Hold", "Under Investigation"] },
  { label: "Rejected", statuses: ["Rejected"] },
  { label: "Settled", statuses: ["Settled"] },
];

export default function ClaimsList() {
  const navigate = useNavigate();
  const { country, storeId } = useGlobalFilter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [expenseFilter, setExpenseFilter] = useState<string>("all");
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [empStoreFilter, setEmpStoreFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  const handleEmployeeTypeChange = (value: string) => {
    setEmployeeTypeFilter(value);
    setPositionFilter("all");
    setEmpStoreFilter("all");
  };

  const positionOptions = useMemo(() => {
    if (employeeTypeFilter === "HO") return hoPositions;
    if (employeeTypeFilter === "Store") return storePositions;
    return allPositionsList;
  }, [employeeTypeFilter]);

  const storeOptions = useMemo(() => {
    const storeEmployees = employeeProfiles.filter(e => e.employeeType === "Store" && e.storeName);
    return [...new Set(storeEmployees.map(e => e.storeName!))].sort();
  }, []);

  // Base filter (everything except status tab)
  const baseFiltered = useMemo(() => claims.filter((c) => {
    if (country !== "all" && c.country !== country) return false;
    if (storeId !== "all" && c.storeId !== storeId) return false;
    if (expenseFilter !== "all" && c.expenseType !== expenseFilter) return false;
    if (alertFilter === "flagged" && !c.hasAlert) return false;
    if (alertFilter === "clean" && c.hasAlert) return false;

    // Date range filter
    if (dateFrom || dateTo) {
      const claimDate = new Date(c.submittedAt);
      if (dateFrom && claimDate < new Date(dateFrom.setHours(0, 0, 0, 0))) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (claimDate > end) return false;
      }
    }

    // Employee type / position / store filters
    if (employeeTypeFilter !== "all" || positionFilter !== "all" || empStoreFilter !== "all") {
      const profile = getEmployeeProfile(c.submitter);
      if (!profile) return false;
      if (employeeTypeFilter !== "all" && profile.employeeType !== employeeTypeFilter) return false;
      if (positionFilter !== "all" && profile.positionLevel !== positionFilter) return false;
      if (empStoreFilter !== "all" && profile.storeName !== empStoreFilter) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      return c.claimNumber.toLowerCase().includes(q) || c.store.toLowerCase().includes(q) || c.submitter.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q);
    }
    return true;
  }), [country, storeId, expenseFilter, alertFilter, employeeTypeFilter, positionFilter, empStoreFilter, search, dateFrom, dateTo]);

  // Tab counts based on baseFiltered
  const tabCounts = useMemo(() => statusTabs.map(tab => {
    if (!tab.statuses) return baseFiltered.length;
    return baseFiltered.filter(c => tab.statuses!.includes(c.status)).length;
  }), [baseFiltered]);

  // Final filtered = baseFiltered + active status tab
  const filtered = useMemo(() => {
    const tab = statusTabs[activeTab];
    if (!tab.statuses) return baseFiltered;
    return baseFiltered.filter(c => tab.statuses!.includes(c.status));
  }, [baseFiltered, activeTab]);

  const uniqueExpenseTypes = [...new Set(claims.map(c => c.expenseType))];

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

      {/* Row 1: Search + dropdown filters */}
      <div className="filter-bar flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={expenseFilter} onValueChange={setExpenseFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="All Expenses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expenses</SelectItem>
            {uniqueExpenseTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={employeeTypeFilter} onValueChange={handleEmployeeTypeChange}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="HO">🏢 HO (Head Office)</SelectItem>
            <SelectItem value="Store">🏪 Store</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[220px] h-8 text-xs"><SelectValue placeholder="All Positions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {employeeTypeFilter === "Store" && (
          <Select value={empStoreFilter} onValueChange={setEmpStoreFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="All Stores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {storeOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={alertFilter} onValueChange={setAlertFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Alert Flag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Date range */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Transaction Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-8 w-[150px] justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From date"}
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
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 3: Status pill tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {statusTabs.map((tab, i) => (
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
              activeTab === i
                ? "bg-background/20 text-background"
                : "bg-muted text-muted-foreground"
            )}>
              {tabCounts[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label sticky left-0 bg-card z-10 min-w-[160px]">Claim #</TableHead>
              <TableHead className="section-label">Store</TableHead>
              <TableHead className="section-label hidden md:table-cell">Submitter</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Expense</TableHead>
              <TableHead className="section-label text-right">Amount</TableHead>
              <TableHead className="section-label">Status</TableHead>
              <TableHead className="section-label hidden lg:table-cell">OCR</TableHead>
              <TableHead className="section-label hidden xl:table-cell">Date</TableHead>
              <TableHead className="section-label hidden xl:table-cell">Alert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((claim) => (
              <TableRow key={claim.id} className="data-table-row cursor-pointer" onClick={() => setSelectedClaim(claim)}>
                <TableCell className="font-mono text-xs font-medium sticky left-0 bg-card z-10">{claim.claimNumber}</TableCell>
                <TableCell>
                  <div className="text-sm">{claim.store}</div>
                  <div className="text-[10px] text-muted-foreground">{claim.storeType}</div>
                </TableCell>
                <TableCell className="text-sm hidden md:table-cell">{claim.submitter}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{claim.expenseType}</TableCell>
                <TableCell className="text-sm font-medium text-right tabular-nums">
                  {claim.amount.toLocaleString()} <span className="text-[10px] text-muted-foreground">{claim.currency}</span>
                </TableCell>
                <TableCell><StatusBadge status={claim.status} /></TableCell>
                <TableCell className="hidden lg:table-cell">
                  {claim.ocrConfidence > 0 ? (
                    <span className={`text-xs font-medium ${claim.ocrConfidence >= 90 ? "text-status-approved" : claim.ocrConfidence >= 75 ? "text-status-validating" : "text-status-hold"}`}>
                      {claim.ocrConfidence}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">
                  {new Date(claim.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {claim.hasAlert && <Badge variant="alert" className="text-[10px]">⚠</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedClaim && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedClaim.claimNumber}</span>
                  <StatusBadge status={selectedClaim.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="section-label">Store</p>
                    <p className="text-sm font-medium mt-0.5">{selectedClaim.store}</p>
                    <p className="text-xs text-muted-foreground">{selectedClaim.storeType} · {selectedClaim.country}</p>
                  </div>
                  <div>
                    <p className="section-label">Amount</p>
                    <p className="text-xl font-bold mt-0.5 tabular-nums">{selectedClaim.amount.toLocaleString()} {selectedClaim.currency}</p>
                  </div>
                  <div>
                    <p className="section-label">Submitter</p>
                    <p className="text-sm mt-0.5">{selectedClaim.submitter}</p>
                  </div>
                  <div>
                    <p className="section-label">Expense Type</p>
                    <p className="text-sm mt-0.5">{selectedClaim.expenseType}</p>
                    <p className="text-xs text-muted-foreground">{selectedClaim.subcategory}</p>
                  </div>
                  <div>
                    <p className="section-label">Vendor</p>
                    <p className="text-sm mt-0.5">{selectedClaim.vendor}</p>
                  </div>
                  <div>
                    <p className="section-label">Receipt Date</p>
                    <p className="text-sm mt-0.5">{selectedClaim.receiptDate}</p>
                  </div>
                  <div>
                    <p className="section-label">OCR Confidence</p>
                    <p className={`text-sm font-semibold mt-0.5 ${selectedClaim.ocrConfidence >= 90 ? "text-status-approved" : selectedClaim.ocrConfidence >= 75 ? "text-status-validating" : "text-status-hold"}`}>
                      {selectedClaim.ocrConfidence > 0 ? `${selectedClaim.ocrConfidence}%` : "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="section-label">Payment Mode</p>
                    <p className="text-sm mt-0.5">{selectedClaim.paymentMode}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="section-label mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.notes}</p>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setSelectedClaim(null); navigate(`/claims/${selectedClaim.id}`); }}>
                    View Full Detail
                  </Button>
                  <Button size="sm" variant="outline">Add Note</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
