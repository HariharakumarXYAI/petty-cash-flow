import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Upload, Download, ChevronLeft, ChevronRight, X, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────── */

interface PositionLevel {
  id: string;
  positionName: string;
  amountTolerance: number;
  updatedAt: string;
}

const PAGE_SIZE = 10;

const initialData: PositionLevel[] = [
  { id: "1", positionName: "Manager", amountTolerance: 50000, updatedAt: "2026-04-10T09:30:00Z" },
  { id: "2", positionName: "Senior Manager", amountTolerance: 75000, updatedAt: "2026-04-10T10:15:00Z" },
  { id: "3", positionName: "Director", amountTolerance: 100000, updatedAt: "2026-04-08T14:00:00Z" },
  { id: "4", positionName: "VP", amountTolerance: 200000, updatedAt: "2026-04-05T11:45:00Z" },
  { id: "5", positionName: "Supervisor", amountTolerance: 25000, updatedAt: "2026-03-28T08:20:00Z" },
  { id: "6", positionName: "Officer", amountTolerance: 10000, updatedAt: "2026-03-25T16:30:00Z" },
  { id: "7", positionName: "Executive", amountTolerance: 150000, updatedAt: "2026-03-20T13:00:00Z" },
  { id: "8", positionName: "Associate", amountTolerance: 5000, updatedAt: "2026-03-15T09:00:00Z" },
  { id: "9", positionName: "Team Lead", amountTolerance: 30000, updatedAt: "2026-03-10T10:00:00Z" },
  { id: "10", positionName: "Assistant Manager", amountTolerance: 40000, updatedAt: "2026-03-01T15:00:00Z" },
  { id: "11", positionName: "Analyst", amountTolerance: 15000, updatedAt: "2026-02-28T11:30:00Z" },
  { id: "12", positionName: "Coordinator", amountTolerance: 8000, updatedAt: "2026-02-20T14:15:00Z" },
];

/* ── Form state ────────────────────────────────────────────────────── */

interface FormState {
  positionName: string;
  amountTolerance: string;
  reason: string;
}

const emptyForm: FormState = { positionName: "", amountTolerance: "", reason: "" };

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function triggerCsvDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface CsvPreviewRow {
  positionName: string;
  amountTolerance: string;
}

const TEMPLATE_CSV = "\uFEFFposition_name,amount_tolerance\n";
const SAMPLE_CSV =
  "\uFEFFposition_name,amount_tolerance\n" +
  "Manager,50000\n" +
  "Senior Manager,75000\n" +
  "Director,100000\n" +
  "VP,200000\n" +
  "Supervisor,25000\n";

/* ── Component ─────────────────────────────────────────────────────── */

export default function PositionLevelsPage() {
  const [data, setData] = useState<PositionLevel[]>(initialData);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PositionLevel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [nameError, setNameError] = useState("");
  const [toleranceError, setToleranceError] = useState("");
  const [reasonError, setReasonError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<PositionLevel | null>(null);

  // CSV Import state
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [csvIssues, setCsvIssues] = useState<Map<number, string>>(new Map());
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const hasFilters = search !== "";

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (debouncedSearch && !p.positionName.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });
  }, [data, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = useCallback(() => {
    setSearch("");
  }, []);

  /* ── Modal helpers ───────────────────────────────────────────────── */

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setNameError("");
    setToleranceError("");
    setReasonError("");
    setDialogOpen(true);
  };

  const openEdit = (item: PositionLevel) => {
    setEditingItem(item);
    setForm({
      positionName: item.positionName,
      amountTolerance: String(item.amountTolerance),
      reason: "",
    });
    setNameError("");
    setToleranceError("");
    setReasonError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    setNameError("");
    setToleranceError("");
    setReasonError("");

    const name = form.positionName.trim();
    if (!name) {
      setNameError("Position name is required");
      return;
    }
    if (name.length > 100) {
      setNameError("Position name must be 100 characters or less");
      return;
    }
    if (!form.amountTolerance.trim()) {
      setToleranceError("Amount tolerance is required");
      return;
    }
    const toleranceNum = Number(form.amountTolerance);
    if (isNaN(toleranceNum) || toleranceNum < 0) {
      setToleranceError("Amount tolerance must be a non-negative number");
      return;
    }
    if (editingItem && form.reason.length < 20) {
      setReasonError("Reason must be at least 20 characters");
      return;
    }

    const now = new Date().toISOString();

    if (editingItem) {
      setData((prev) =>
        prev.map((p) =>
          p.id === editingItem.id
            ? { ...p, positionName: name, amountTolerance: toleranceNum, updatedAt: now }
            : p
        )
      );
      toast.success("Position level updated successfully");
    } else {
      setData((prev) => [
        ...prev,
        { id: crypto.randomUUID(), positionName: name, amountTolerance: toleranceNum, updatedAt: now },
      ]);
      toast.success("Position level created successfully");
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success("Position level deleted successfully");
    setDeleteTarget(null);
  };

  /* ── CSV Import helpers ────────────────────────────────────────── */

  const resetImport = () => {
    setCsvPreview([]);
    setCsvIssues(new Map());
    setCsvError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeImport = () => {
    resetImport();
    setImportOpen(false);
  };

  const checkCsvDuplicates = (rows: CsvPreviewRow[]) => {
    const issues = new Map<number, string>();
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      const key = r.positionName.toLowerCase();
      if (seen.has(key)) issues.set(i, "Duplicate name");
      seen.add(key);
    });
    return issues;
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("File must be a .csv file");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder("windows-874").decode(buffer);
      }
      text = text.replace(/^\uFEFF/, "");

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setCsvError("File is empty or contains only a header row with no data");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^"|"$/g, ""));
      const required = ["position_name", "amount_tolerance"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.join(", ")}`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const nameIdx = headers.indexOf("position_name");
      const tolIdx = headers.indexOf("amount_tolerance");
      const rows: CsvPreviewRow[] = [];
      const rowErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const positionName = cols[nameIdx]?.trim() ?? "";
        const rawTolerance = cols[tolIdx]?.trim() ?? "";
        if (!positionName) continue;
        if (!rawTolerance) {
          rowErrors.push(`Row ${i}: Amount tolerance is required`);
          continue;
        }
        const toleranceNum = Number(rawTolerance);
        if (isNaN(toleranceNum) || toleranceNum < 0) {
          rowErrors.push(`Row ${i}: Invalid amount tolerance "${rawTolerance}"`);
          continue;
        }
        rows.push({ positionName, amountTolerance: String(toleranceNum) });
      }

      if (rows.length === 0) {
        setCsvError(rowErrors.length > 0 ? rowErrors.join("\n") : "File is empty or contains only a header row with no data");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setCsvError(null);
      setCsvIssues(checkCsvDuplicates(rows));
      setCsvPreview(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvIssues(checkCsvDuplicates(updated));
  };

  const handleCsvImport = () => {
    const now = new Date().toISOString();
    const newItems: PositionLevel[] = csvPreview.map((r) => ({
      id: crypto.randomUUID(),
      positionName: r.positionName,
      amountTolerance: Number(r.amountTolerance),
      updatedAt: now,
    }));
    setData((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} position level(s) imported successfully`);
    closeImport();
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Position Levels</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Position Level
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search position levels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          No position levels found
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Position Level</TableHead>
                <TableHead className="text-right">Amount Tolerance (THB)</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((p, idx) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{p.positionName}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {p.amountTolerance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(p.updatedAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Position Level" : "Add Position Level"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Position Name */}
            <div className="space-y-1.5">
              <Label>
                Position Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.positionName}
                onChange={(e) => {
                  setForm({ ...form, positionName: e.target.value });
                  if (nameError) setNameError("");
                }}
                placeholder="e.g. Senior Manager"
                maxLength={100}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            {/* Amount Tolerance */}
            <div className="space-y-1.5">
              <Label>
                Amount Tolerance (THB) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amountTolerance}
                onChange={(e) => {
                  setForm({ ...form, amountTolerance: e.target.value });
                  if (toleranceError) setToleranceError("");
                }}
                placeholder="e.g. 50000"
                className={`font-mono ${toleranceError ? "border-destructive" : ""}`}
              />
              {toleranceError && <p className="text-xs text-destructive">{toleranceError}</p>}
            </div>

            {/* Reason (edit only) */}
            {editingItem && (
              <div className="space-y-1.5">
                <Label>Reason for change</Label>
                <textarea
                  value={form.reason}
                  onChange={(e) => {
                    setForm({ ...form, reason: e.target.value });
                    if (reasonError) setReasonError("");
                  }}
                  placeholder="Describe the reason for this change (min 20 characters)"
                  rows={2}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${
                    reasonError ? "border-destructive" : "border-input"
                  }`}
                />
                {reasonError ? (
                  <p className="text-xs text-destructive">{reasonError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{form.reason.length} / 20</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save" : "Create Position Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.positionName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) closeImport(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Position Levels</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to bulk-import position levels. Download the template to see the required format.
            </p>

            {/* Download buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerCsvDownload(TEMPLATE_CSV, "position_levels_template.csv")}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerCsvDownload(SAMPLE_CSV, "position_levels_sample.csv")}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Sample
              </Button>
            </div>

            {/* File upload zone */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drop a CSV file here or click to browse
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFile}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                Choose File
              </Button>
            </div>

            {/* Parse error */}
            {csvError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive whitespace-pre-line">{csvError}</p>
              </div>
            )}

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {csvPreview.length} row(s) parsed
                    {csvIssues.size > 0 && (
                      <span className="text-amber-600 ml-2">
                        ({csvIssues.size} issue(s))
                      </span>
                    )}
                  </p>
                </div>
                <div className="border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position Name</TableHead>
                        <TableHead className="text-right">Amount Tolerance</TableHead>
                        <TableHead className="text-center w-20">Status</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, i) => {
                        const issue = csvIssues.get(i);
                        return (
                          <TableRow key={i} className={issue ? "bg-destructive/5" : ""}>
                            <TableCell className="text-sm">{row.positionName}</TableCell>
                            <TableCell className="text-sm text-right font-mono">
                              {Number(row.amountTolerance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              {issue ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive" title={issue}>
                                  Error
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                                  OK
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeCsvRow(i)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeImport}>
              Cancel
            </Button>
            {csvPreview.length > 0 && (
              <Button onClick={handleCsvImport} disabled={csvIssues.size > 0}>
                Import {csvPreview.length} rows
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
