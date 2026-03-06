import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { mockClaims, type ClaimStatus } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses: ClaimStatus[] = [
  "Draft", "Submitted", "OCR Validating", "Auto Approved", "Auto Approved with Alert",
  "On Hold", "Under Investigation", "Awaiting Audit Document", "Settled", "Rejected",
];

export default function ClaimsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const filtered = mockClaims.filter((c) => {
    const matchSearch = !search || c.claimNumber.toLowerCase().includes(search.toLowerCase()) || c.store.toLowerCase().includes(search.toLowerCase()) || c.submitter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchCountry = countryFilter === "all" || c.country === countryFilter;
    return matchSearch && matchStatus && matchCountry;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} claims · All countries</p>
        </div>
        <Button size="sm" onClick={() => navigate("/claims/new")}>
          <Plus className="h-4 w-4 mr-1" /> New Claim
        </Button>
      </div>

      {/* Filters - sticky */}
      <div className="sticky top-0 z-10 bg-background py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="TH">Thailand</SelectItem>
            <SelectItem value="KH">Cambodia</SelectItem>
            <SelectItem value="MM">Myanmar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Claim #</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Store</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">Submitter</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden lg:table-cell">Expense Type</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Amount</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden lg:table-cell">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((claim) => (
              <TableRow key={claim.id} className="data-table-row cursor-pointer">
                <TableCell className="font-mono text-xs font-medium">{claim.claimNumber}</TableCell>
                <TableCell>
                  <div className="text-sm">{claim.store}</div>
                  <div className="text-xs text-muted-foreground md:hidden">{claim.submitter}</div>
                </TableCell>
                <TableCell className="text-sm hidden md:table-cell">{claim.submitter}</TableCell>
                <TableCell className="text-sm hidden lg:table-cell">{claim.expenseType}</TableCell>
                <TableCell className="text-sm font-medium text-right tabular-nums">
                  {claim.amount.toLocaleString()} <span className="text-xs text-muted-foreground">{claim.currency}</span>
                </TableCell>
                <TableCell><StatusBadge status={claim.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                  {new Date(claim.submittedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
