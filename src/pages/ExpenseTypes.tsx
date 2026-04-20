import { expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldAlert, ShieldCheck, FileText, AlertTriangle, Ban, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { ExpenseType } from "@/lib/mock-data";

export default function ExpenseTypesPage() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<ExpenseType | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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
        <Button size="sm" onClick={() => setCreateOpen(true)}>
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
              <TableRow key={et.id} className="data-table-row cursor-pointer group" onClick={() => setSelected(et)}>
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

      {/* Edit / Create Dialog */}
      <Dialog open={!!selected || createOpen} onOpenChange={(o) => { if (!o) { setSelected(null); setCreateOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Expense Type" : "New Expense Type"}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.category} › ${selected.subcategory}`
                : "Define a new expense category with thresholds and rules."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Expense Type</Label>
                  <Input className="h-9" defaultValue={selected?.category || ""} placeholder="e.g. Office Supplies" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Sub-Expense Type</Label>
                  <Input className="h-9" defaultValue={selected?.subcategory || ""} placeholder="e.g. Stationery" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Thresholds */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Threshold Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Define the amount limits that trigger alerts or block submissions.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Amount</Label>
                  <Input className="h-9 tabular-nums" type="number" defaultValue={selected?.maxAmount || ""} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-status-validating" />
                    <span className="text-status-validating">Alert</span>
                  </Label>
                  <Input className="h-9 tabular-nums border-status-validating/30 focus-visible:ring-status-validating/30" type="number" defaultValue={selected?.alertThreshold || ""} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Ban className="h-3 w-3 text-status-hold" />
                    <span className="text-status-hold">Hard Stop</span>
                  </Label>
                  <Input className="h-9 tabular-nums border-status-hold/30 focus-visible:ring-status-hold/30" type="number" defaultValue={selected?.hardStopThreshold || ""} />
                </div>
              </div>
              {selected && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-primary/40 h-full" style={{ width: `${(selected.alertThreshold / selected.maxAmount) * 100}%` }} />
                    <div className="bg-status-validating h-full" style={{ width: `${((selected.hardStopThreshold - selected.alertThreshold) / selected.maxAmount) * 100}%` }} />
                    <div className="bg-status-hold h-full flex-1" />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    OK → Alert → Block
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Rules */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Rules & Flags</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-sm">Document Required</Label>
                    <p className="text-[11px] text-muted-foreground">Claim must include receipt or invoice</p>
                  </div>
                  <Switch defaultChecked={selected?.documentRequired} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-sm">Advance Allowed</Label>
                    <p className="text-[11px] text-muted-foreground">Can be funded via cash advance</p>
                  </div>
                  <Switch defaultChecked={selected?.advanceAllowed} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-sm">Reimbursement Allowed</Label>
                    <p className="text-[11px] text-muted-foreground">Post-payment reimbursement permitted</p>
                  </div>
                  <Switch defaultChecked={selected?.reimbursementAllowed} />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-status-hold" />
                    <div>
                      <Label className="text-sm">Audit Sensitive</Label>
                      <p className="text-[11px] text-muted-foreground">Triggers mandatory audit sampling</p>
                    </div>
                  </div>
                  <Switch defaultChecked={selected?.auditSensitive} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Country Applicability */}
            {selected && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground border-b pb-1">Country Applicability</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["TH", "KH", "MM"].map(c => {
                    const active = selected.countries.includes(c as any);
                    return (
                      <span
                        key={c}
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border ${
                          active
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground border-transparent opacity-50"
                        }`}
                      >
                        {c === "TH" ? "🇹🇭 Thailand" : c === "KH" ? "🇰🇭 Cambodia" : "🇲🇲 Myanmar"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setCreateOpen(false); }}>Cancel</Button>
            <Button>Save Changes</Button>
            {selected && (
              <Button variant="outline" size="sm" className="text-status-hold border-status-hold/20 hover:bg-status-hold/5">
                Deactivate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
