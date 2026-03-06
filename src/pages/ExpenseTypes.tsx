import { expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

  const filtered = country === "all"
    ? expenseTypes
    : expenseTypes.filter(e => e.countries.includes(country as any));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Types</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} expense types configured</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Type</Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Category</TableHead>
              <TableHead className="section-label">Subcategory</TableHead>
              <TableHead className="section-label hidden md:table-cell">Countries</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Doc Req.</TableHead>
              <TableHead className="section-label text-right hidden lg:table-cell">Max Amount</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Alert At</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Hard Stop</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Advance</TableHead>
              <TableHead className="section-label hidden xl:table-cell">Audit Sensitive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((et) => (
              <TableRow key={et.id} className="data-table-row cursor-pointer" onClick={() => setSelected(et)}>
                <TableCell className="text-sm font-medium">{et.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{et.subcategory}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-1">
                    {et.countries.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {et.documentRequired ? <Badge variant="approved" className="text-[10px]">Yes</Badge> : <span className="text-xs text-muted-foreground">No</span>}
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums hidden lg:table-cell">{et.maxAmount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right tabular-nums hidden xl:table-cell text-status-validating">{et.alertThreshold.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right tabular-nums hidden xl:table-cell text-status-hold">{et.hardStopThreshold.toLocaleString()}</TableCell>
                <TableCell className="hidden lg:table-cell">{et.advanceAllowed ? "✓" : "—"}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  {et.auditSensitive ? <Badge variant="alert" className="text-[10px]">Sensitive</Badge> : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Drawer */}
      <Sheet open={!!selected || createOpen} onOpenChange={(o) => { if (!o) { setSelected(null); setCreateOpen(false); } }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected ? "Edit Expense Type" : "New Expense Type"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label className="section-label">Category</Label><Input className="h-9" defaultValue={selected?.category || ""} /></div>
            <div className="space-y-1.5"><Label className="section-label">Subcategory</Label><Input className="h-9" defaultValue={selected?.subcategory || ""} /></div>
            <div className="space-y-1.5"><Label className="section-label">Max Amount</Label><Input className="h-9" type="number" defaultValue={selected?.maxAmount || ""} /></div>
            <div className="space-y-1.5"><Label className="section-label">Alert Threshold</Label><Input className="h-9" type="number" defaultValue={selected?.alertThreshold || ""} /></div>
            <div className="space-y-1.5"><Label className="section-label">Hard Stop Threshold</Label><Input className="h-9" type="number" defaultValue={selected?.hardStopThreshold || ""} /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-sm">Document Required</Label><Switch defaultChecked={selected?.documentRequired} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Advance Allowed</Label><Switch defaultChecked={selected?.advanceAllowed} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Reimbursement Allowed</Label><Switch defaultChecked={selected?.reimbursementAllowed} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Audit Sensitive</Label><Switch defaultChecked={selected?.auditSensitive} /></div>
            <Button className="w-full">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
