import { expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert, FileText, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function ExpenseTypesPage() {
  const { country } = useGlobalFilter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const countryFiltered = country === "all"
    ? expenseTypes
    : expenseTypes.filter(e => e.countries.includes(country as any));

  const filtered = search
    ? countryFiltered.filter(e =>
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.subcategory.toLowerCase().includes(search.toLowerCase())
      )
    : countryFiltered;

  const sensitiveCount = filtered.filter(e => e.auditSensitive).length;
  const docRequiredCount = filtered.filter(e => e.documentRequired).length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Types</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} types configured · {sensitiveCount} audit-sensitive · {docRequiredCount} require documents
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Type
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Filter by category or subcategory…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label w-[180px]">Expense Type</TableHead>
              <TableHead className="section-label">Sub-Expense Type</TableHead>
              <TableHead className="section-label hidden md:table-cell">Countries</TableHead>
              <TableHead className="section-label hidden lg:table-cell text-center">Docs</TableHead>
              <TableHead className="section-label text-right hidden lg:table-cell">Alert At</TableHead>
              <TableHead className="section-label text-right hidden lg:table-cell">Hard Stop</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Max Amount</TableHead>
              <TableHead className="section-label hidden xl:table-cell text-center">Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((et) => (
              <TableRow key={et.id} className="data-table-row group">
                <TableCell className="font-medium text-sm">{et.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{et.subcategory}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {et.countries.map(c => (
                      <span key={c} className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {et.documentRequired ? (
                    <FileText className="h-3.5 w-3.5 text-primary mx-auto" />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums hidden lg:table-cell">
                  <span className="text-status-validating font-medium">{et.alertThreshold.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums hidden lg:table-cell">
                  <span className="text-status-hold font-semibold">{et.hardStopThreshold.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums text-muted-foreground hidden xl:table-cell">
                  {et.maxAmount.toLocaleString()}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center justify-center gap-1.5">
                    {et.auditSensitive && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-status-hold/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-hold">
                        <ShieldAlert className="h-2.5 w-2.5" />Sensitive
                      </span>
                    )}
                    {et.advanceAllowed && (
                      <span className="inline-flex items-center rounded bg-status-approved/10 px-1.5 py-0.5 text-[10px] font-medium text-status-approved">
                        Advance
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
