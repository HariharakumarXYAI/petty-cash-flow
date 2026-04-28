import { useState } from "react";
import { expenseTypes } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Pencil, Search, ChevronDown, ChevronRight, ShieldAlert, FileText } from "lucide-react";

type ExpenseRow = (typeof expenseTypes)[number];

type EditTarget =
  | { mode: "category"; category: string; items: ExpenseRow[] }
  | { mode: "subtype"; row: ExpenseRow };

export default function AdminExpenseTypesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  // Edit form state
  const [form, setForm] = useState({
    name: "",
    alertThreshold: 0,
    hardStopThreshold: 0,
    maxAmount: 0,
    documentRequired: false,
    auditSensitive: false,
    advanceAllowed: false,
  });

  // Group expense types by category
  const grouped = expenseTypes.reduce<Record<string, ExpenseRow[]>>((acc, et) => {
    if (!acc[et.category]) acc[et.category] = [];
    acc[et.category].push(et);
    return acc;
  }, {});

  const categories = Object.entries(grouped).filter(([category, items]) => {
    if (
      search &&
      !category.toLowerCase().includes(search.toLowerCase()) &&
      !items.some((i) => i.subcategory.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const sensitiveCount = expenseTypes.filter((e) => e.auditSensitive).length;
  const docRequiredCount = expenseTypes.filter((e) => e.documentRequired).length;

  const openEditCategory = (category: string, items: ExpenseRow[]) => {
    setEditTarget({ mode: "category", category, items });
    setForm({
      name: category,
      alertThreshold: 0,
      hardStopThreshold: 0,
      maxAmount: 0,
      documentRequired: items.some((i) => i.documentRequired),
      auditSensitive: items.some((i) => i.auditSensitive),
      advanceAllowed: items.some((i) => i.advanceAllowed),
    });
  };

  const openEditSubtype = (row: ExpenseRow) => {
    setEditTarget({ mode: "subtype", row });
    setForm({
      name: row.subcategory,
      alertThreshold: row.alertThreshold,
      hardStopThreshold: row.hardStopThreshold,
      maxAmount: row.maxAmount,
      documentRequired: row.documentRequired,
      auditSensitive: row.auditSensitive,
      advanceAllowed: row.advanceAllowed,
    });
  };

  const handleSave = () => {
    toast({
      title: "Changes saved",
      description:
        editTarget?.mode === "category"
          ? `Updated category "${form.name}".`
          : `Updated subtype "${form.name}".`,
    });
    setEditTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expense Types</h1>
          <p className="text-sm text-muted-foreground">
            {expenseTypes.length} types configured · {sensitiveCount} audit-sensitive · {docRequiredCount} require documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense Type</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expense types..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Expense Type</TableHead>
              <TableHead>Subtypes</TableHead>
              <TableHead className="hidden md:table-cell">Countries</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Docs</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Alert At</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Hard Stop</TableHead>
              <TableHead className="hidden xl:table-cell text-center">Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(([category, items]) => (
              <Collapsible
                key={category}
                open={expanded[category]}
                onOpenChange={(o) => setExpanded((p) => ({ ...p, [category]: o }))}
                asChild
              >
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expanded[category] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">{category}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{items.length} subtypes</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {[...new Set(items.flatMap(i => i.countries))].map(c => (
                          <span key={c} className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            {c}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      {items.some(i => i.documentRequired) ? (
                        <FileText className="h-3.5 w-3.5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        {items.some(i => i.auditSensitive) && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-status-hold/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-hold">
                            <ShieldAlert className="h-2.5 w-2.5" />Sensitive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditCategory(category, items)}
                        aria-label={`Edit ${category}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <>
                      {items.map((et) => (
                        <TableRow key={et.id} className="bg-muted/30">
                          <TableCell />
                          <TableCell className="pl-12 text-sm text-muted-foreground">{et.subcategory}</TableCell>
                          <TableCell />
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditSubtype(et)}
                              aria-label={`Edit ${et.subcategory}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No expense types found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editTarget?.mode === "category" ? "Edit Expense Type" : "Edit Subtype"}
            </DialogTitle>
            <DialogDescription>
              {editTarget?.mode === "category"
                ? "Update the category name and default flags."
                : "Update thresholds, document requirement, and flags for this subtype."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {editTarget?.mode === "category" ? "Category Name" : "Subtype Name"}
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {editTarget?.mode === "subtype" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="alert">Alert At</Label>
                  <Input
                    id="alert"
                    type="number"
                    value={form.alertThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hardstop">Hard Stop</Label>
                  <Input
                    id="hardstop"
                    type="number"
                    value={form.hardStopThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, hardStopThreshold: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max">Max Amount</Label>
                  <Input
                    id="max"
                    type="number"
                    value={form.maxAmount}
                    onChange={(e) => setForm((f) => ({ ...f, maxAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="docs" className="text-sm font-normal">Document required</Label>
                <Switch
                  id="docs"
                  checked={form.documentRequired}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, documentRequired: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sensitive" className="text-sm font-normal">Audit sensitive</Label>
                <Switch
                  id="sensitive"
                  checked={form.auditSensitive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, auditSensitive: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="advance" className="text-sm font-normal">Advance allowed</Label>
                <Switch
                  id="advance"
                  checked={form.advanceAllowed}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, advanceAllowed: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
