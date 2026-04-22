import { useRef, useState } from "react";
import { Upload, Download, X, FileText } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  loadDocuments,
  saveDocuments,
  type DocumentType,
} from "@/lib/documents-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

const HEADERS = ["document_name", "ocr_verification", "active"];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const v = cell ?? "";
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let val = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        val += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        val += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cur.push(val);
      val = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      cur.push(val);
      rows.push(cur);
      cur = [];
      val = "";
    } else {
      val += c;
    }
  }
  if (val.length > 0 || cur.length > 0) {
    cur.push(val);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toId(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function DocumentImportDialog({ open, onOpenChange, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setFile(null);
    setError(null);
    setImporting(false);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const acceptFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDownloadTemplate = () => {
    downloadCsv("document-types-template.csv", [HEADERS]);
  };

  const handleDownloadSample = () => {
    downloadCsv("document-types-sample.csv", [
      HEADERS,
      ["Tax Invoice", "Enabled", "true"],
      ["Boarding Pass", "Disabled", "true"],
      ["Approval Form", "Disabled", "false"],
    ]);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("CSV is empty.");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf("document_name");
      const ocrIdx = header.indexOf("ocr_verification");
      const activeIdx = header.indexOf("active");
      if (nameIdx === -1)
        throw new Error('Missing required column "document_name".');

      const existing = loadDocuments();
      const map = new Map<string, DocumentType>(existing.map((d) => [d.id, d]));
      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = (row[nameIdx] ?? "").trim();
        if (!name) continue;
        const ocrRaw = ocrIdx >= 0 ? (row[ocrIdx] ?? "").trim().toLowerCase() : "";
        const activeRaw =
          activeIdx >= 0 ? (row[activeIdx] ?? "").trim().toLowerCase() : "true";
        const ocr: "Enabled" | "Disabled" =
          ocrRaw === "enabled" || ocrRaw === "true" || ocrRaw === "yes"
            ? "Enabled"
            : "Disabled";
        const active = !["false", "no", "0", "inactive"].includes(activeRaw);
        const id = toId(name);
        map.set(id, {
          id,
          name,
          type: map.get(id)?.type ?? "Primary",
          ocr,
          active,
        });
        count++;
      }

      if (count === 0) throw new Error("No valid rows found in CSV.");

      saveDocuments(Array.from(map.values()));
      toast.success(
        `Imported ${count} document type${count === 1 ? "" : "s"}`,
      );
      onImported();
      handleClose(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[560px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Import Document Types from CSV
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a CSV file with document types. Download the template for the
            correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownloadSample}
            >
              <Download className="h-4 w-4" /> Download Sample CSV
            </Button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0] ?? null;
              acceptFile(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-lg py-12 px-4 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-destructive bg-destructive/5"
                : "border-gray-300 hover:border-gray-400 bg-gray-50/50",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <p className="text-sm">
                  Click to select or drag &amp; drop a .csv file
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className={cn(
              (!file || importing) && "opacity-50 cursor-not-allowed",
            )}
          >
            {importing ? "Importing..." : "Confirm Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
