import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportExpenseTypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: (rows: ParsedRow[]) => void;
}

const COLUMNS = [
  "expenseType",
  "countries",
  "advanceAllowed",
  "auditSensitive",
  "alertAt",
  "hardStop",
  "flags",
  "subExpenseType",
  "accountCode",
  "accountNameEn",
  "requiredDocuments",
  "supportedDocuments",
  "subActive",
] as const;

const REQUIRED = ["expenseType", "countries", "subExpenseType", "accountCode", "accountNameEn"];

export interface ParsedRow {
  [key: string]: string;
}

const SAMPLE_ROWS = [
  [
    "Office Supplies",
    "TH;KH;MM",
    "false",
    "false",
    "3000",
    "8000",
    "",
    "Stationery",
    "ACC-OS001",
    "Account OS001",
    "Tax Invoice;Receipt",
    "Quotation",
    "true",
  ],
  [
    "Maintenance",
    "TH;KH",
    "true",
    "true",
    "10000",
    "25000",
    "Sensitive",
    "Minor Repairs",
    "ACC-MT001",
    "Account MT001",
    "Tax Invoice",
    "Quotation;Approval Form",
    "true",
  ],
];

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildCsv(rows: string[][]) {
  const lines = [COLUMNS.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportExpenseTypesDialog({ open, onOpenChange, onImported }: ImportExpenseTypesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setErrors([]);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDownloadTemplate = () => {
    downloadFile("expense-types-template.csv", buildCsv([]));
  };

  const handleDownloadSample = () => {
    downloadFile("expense-types-sample.csv", buildCsv(SAMPLE_ROWS));
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setFile(f);
    setErrors([]);
  };

  const handleConfirm = async () => {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setErrors(["CSV is empty"]);
      return;
    }
    const header = rows[0].map((h) => h.trim());
    const missingCols = REQUIRED.filter((c) => !header.includes(c));
    if (missingCols.length > 0) {
      setErrors([`Missing required columns: ${missingCols.join(", ")}`]);
      return;
    }
    const errs: string[] = [];
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: ParsedRow = {};
      header.forEach((h, idx) => (obj[h] = (row[idx] ?? "").trim()));
      for (const req of REQUIRED) {
        if (!obj[req]) {
          errs.push(`Row ${i + 1}: missing "${req}"`);
          break;
        }
      }
      parsed.push(obj);
    }
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    const parents = new Set(parsed.map((r) => r.expenseType));
    onImported?.(parsed);
    toast.success(
      `Successfully imported ${parents.size} expense type${parents.size === 1 ? "" : "s"} with ${parsed.length} sub expense type${parsed.length === 1 ? "" : "s"}.`,
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Expense Types from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import expense types with document type mappings. Download the sample CSV for reference.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Download Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="h-4 w-4 mr-2" /> Download Sample CSV
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Import failed: {errors.length} {errors.length === 1 ? "error" : `rows have errors`}
            </div>
            <ul className="mt-2 ml-6 list-disc text-xs text-destructive space-y-0.5">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errors.length > 5 && <li>…and {errors.length - 5} more</li>}
            </ul>
          </div>
        )}

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            "h-[180px] w-full text-center px-4",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              <span>
                {file.name} ({formatSize(file.size)})
              </span>
              <span className="text-xs text-muted-foreground">— Click to replace</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-foreground font-medium">Click to upload or drag &amp; drop a CSV file</div>
              <div className="text-xs text-muted-foreground">Only .csv files are accepted</div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!file}>
            Confirm Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportExpenseTypesDialog;
