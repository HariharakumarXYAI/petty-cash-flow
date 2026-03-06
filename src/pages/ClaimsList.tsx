import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { claims, stores, type ClaimStatus, type Claim } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const allStatuses: ClaimStatus[] = [
  "Draft", "Submitted", "OCR Validating", "Auto Approved", "Auto Approved with Alert",
  "On Hold", "Under Investigation", "Awaiting Audit Document", "Settled", "Rejected",
];

export default function ClaimsList() {
  const navigate = useNavigate();
  const { country, storeId } = useGlobalFilter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expenseFilter, setExpenseFilter] = useState<string>("all");
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const filtered = claims.filter((c) => {
    if (country !== "all" && c.country !== country) return false;
    if (storeId !== "all" && c.storeId !== storeId) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (expenseFilter !== "all" && c.expenseType !== expenseFilter) return false;
    if (alertFilter === "flagged" && !c.hasAlert) return false;
    if (alertFilter === "clean" && c.hasAlert) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.claimNumber.toLowerCase().includes(q) || c.store.toLowerCase().includes(q) || c.submitter.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q);
    }
    return true;
  });

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

      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expenseFilter} onValueChange={setExpenseFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs hidden sm:flex"><SelectValue placeholder="All Expenses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expenses</SelectItem>
            {uniqueExpenseTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={alertFilter} onValueChange={setAlertFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs hidden md:flex"><SelectValue placeholder="Alert Flag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
          </SelectContent>
        </Select>
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
