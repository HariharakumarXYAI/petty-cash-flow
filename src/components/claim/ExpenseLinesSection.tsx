import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Upload, Camera, Plus, Trash2, Copy as CopyIcon, ArrowLeft, ArrowRight,
  CheckCircle, AlertTriangle, FileText, X, Inbox, Replace, Eye, Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  expenseTypes,
  getDocPolicyForSubType,
  DOC_TYPE_LABEL,
  DocPolicyRow,
  DocTypeCode,
} from "@/lib/mock-data";
import { useIsMobile } from "@/hooks/use-mobile";

// ────────── Line model ──────────
// Each "doc" represents a slot fill keyed by `${docTypeCode}|${altGroupId ?? ""}`
export interface AttachedDoc {
  fileName: string;
  fileSize: number;
  ocrConfidence: number;        // 0-100
  extractedSummary: string;     // e.g. "flight TG203 · BKK→CNX · 4,800 THB"
  uploadedAt: number;
}

export interface ExpenseLineV2 {
  id: string;
  subExpenseTypeId: string;     // expenseTypes.id (sub-type)
  vendor: string;
  receiptDate: string;
  amount: string;               // = totalAmount (gross, VAT-inclusive). Kept name for back-compat.
  vatAmount: string;
  whtAmount: string;
  vatEdited?: boolean;          // user manually edited VAT — auto-calc skipped
  whtEdited?: boolean;          // user manually edited WHT — auto-calc skipped
  currency: string;
  glAccount: string;
  vatCode: string;
  whtCode: string;
  paymentMode: string;
  notes: string;
  lineJustification: string;
  // doc slots: key = `${docTypeCode}|${altGroupId ?? ""}`
  docs: Record<string, AttachedDoc>;
  // structured-text slot values: key = `${docTypeCode}` ; value = field map
  structured: Record<string, Record<string, string>>;
}

export const createEmptyLineV2 = (): ExpenseLineV2 => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  subExpenseTypeId: "",
  vendor: "",
  receiptDate: "",
  amount: "",
  vatAmount: "",
  whtAmount: "",
  vatEdited: false,
  whtEdited: false,
  currency: "THB",
  glAccount: "",
  vatCode: "",
  whtCode: "WHT00",
  paymentMode: "cash",
  notes: "",
  lineJustification: "",
  docs: {},
  structured: {},
});

// VAT/WHT rates by code
const VAT_RATE_PCT: Record<string, number> = { V07: 7, V00: 0, VEX: 0, VNA: 0 };
const WHT_RATE_PCT: Record<string, number> = { WHT00: 0, WHT01: 1, WHT02: 2, WHT03: 3, WHT05: 5, WHT15: 15 };

const round2 = (n: number) => Math.round(n * 100) / 100;

// Compute VAT (VAT-inclusive) and WHT amounts from total + codes
function deriveVat(totalStr: string, vatCode: string): number {
  const total = parseFloat(totalStr) || 0;
  const r = VAT_RATE_PCT[vatCode] ?? 0;
  if (r <= 0) return 0;
  return round2(total * r / (100 + r));
}
function deriveWht(totalStr: string, vatAmtStr: string, whtCode: string): number {
  const total = parseFloat(totalStr) || 0;
  const vat = parseFloat(vatAmtStr) || 0;
  const w = WHT_RATE_PCT[whtCode] ?? 0;
  if (w <= 0) return 0;
  return round2((total - vat) * w / 100);
}

// GL/VAT defaults derived from sub-type id
const GL_BY_SUBTYPE: Record<string, string> = {
  "lt-taxi": "5102-001", "lt-train": "5102-001", "lt-car": "5102-001",
  "lt-toll": "5102-001", "lt-airpark": "5102-001", "lt-otherpark": "5102-001",
  "lt-rental": "5102-001", "lt-air-dom": "5102-001", "lt-hotel-dom": "5102-001",
  "lt-meal": "5103-001", "lt-perdiem": "5103-001",
  "lt-postage": "5106-001", "lt-night": "5103-001",
};

const LARGE_LINE_THRESHOLD = 30000;

// Doc-type heuristic from filename
function classifyFile(fileName: string): { code: DocTypeCode; confidence: number } {
  const n = fileName.toLowerCase();
  if (/(eticket|e-ticket|itinerary|booking)/.test(n)) return { code: "E_TICKET", confidence: 92 };
  if (/(boarding|bp[-_])/.test(n)) return { code: "BOARDING_PASS", confidence: 90 };
  if (/(taxinvoice|tax_invoice|tax-invoice|invoice)/.test(n)) return { code: "TAX_INVOICE", confidence: 88 };
  if (/(folio|hotel|stay)/.test(n)) return { code: "HOTEL_FOLIO", confidence: 90 };
  if (/(fuel|petrol|gas|ptt|shell|caltex|esso|bangchak)/.test(n)) return { code: "FUEL_RECEIPT", confidence: 90 };
  if (/(approval|approve|td-form|travel)/.test(n)) return { code: "TRAVEL_APPROVAL", confidence: 85 };
  if (/(claimform|claim-form|claim_form|form)/.test(n)) return { code: "CLAIM_FORM", confidence: 84 };
  if (/(memo|justif|note)/.test(n)) return { code: "MEMO", confidence: 82 };
  if (/(receipt|rcpt|bill)/.test(n)) return { code: "RECEIPT", confidence: 88 };
  return { code: "RECEIPT", confidence: 60 }; // fallback low confidence → Needs sorting
}

// Mock OCR extraction summary by doc type
function mockSummary(code: DocTypeCode): { summary: string; vendor?: string; amount?: string; date?: string } {
  const today = new Date().toISOString().slice(0, 10);
  switch (code) {
    case "E_TICKET":      return { summary: "TG203 · BKK→CNX · 4,800 THB", vendor: "Thai Airways", amount: "4800", date: today };
    case "BOARDING_PASS": return { summary: "Seat 14A · BKK→CNX · 09:30", vendor: "Thai Airways" };
    case "TAX_INVOICE":   return { summary: "TAX-INV 2026/0931 · 1,250 THB · VAT 7%", vendor: "OfficeMate", amount: "1250", date: today };
    case "HOTEL_FOLIO":   return { summary: "Centara · 2 nights · 6,400 THB", vendor: "Centara Hotels", amount: "6400", date: today };
    case "FUEL_RECEIPT":  return { summary: "PTT · 18.4 L · 720 THB", vendor: "PTT Station", amount: "720", date: today };
    case "RECEIPT":       return { summary: "Vendor receipt · 1,250 THB", vendor: "Vendor Co.", amount: "1250", date: today };
    case "CLAIM_FORM":    return { summary: "Signed claim form (PC-FRM)", };
    case "TRAVEL_APPROVAL": return { summary: "TA #2026-1142 · Approved by Dept Head", };
    case "MEMO":          return { summary: "Justification memo attached", };
    default:              return { summary: "Document attached" };
  }
}

const slotKey = (code: DocTypeCode, altGroupId?: string) => `${code}|${altGroupId ?? ""}`;

// Compute which policy entries are "active" for a line given amount (threshold gating)
function activePolicy(rows: DocPolicyRow[], amount: number): DocPolicyRow[] {
  return rows.filter(r => r.thresholdAmount == null || amount > r.thresholdAmount);
}

// Group ALTERNATIVE rows by alternativeGroupId for rendering
function groupSlots(rows: DocPolicyRow[]) {
  type Slot =
    | { kind: "single"; row: DocPolicyRow }
    | { kind: "alt"; groupId: string; rows: DocPolicyRow[]; requirement: "REQUIRED" | "OPTIONAL" };
  const out: Slot[] = [];
  const seenAlt = new Set<string>();
  for (const r of rows) {
    if (r.requirement === "ALTERNATIVE" && r.alternativeGroupId) {
      if (seenAlt.has(r.alternativeGroupId)) continue;
      seenAlt.add(r.alternativeGroupId);
      const peers = rows.filter(x => x.alternativeGroupId === r.alternativeGroupId);
      // an ALT group is REQUIRED unless ALL members are OPTIONAL (treat REQUIRED here)
      out.push({ kind: "alt", groupId: r.alternativeGroupId, rows: peers, requirement: "REQUIRED" });
    } else {
      out.push({ kind: "single", row: r });
    }
  }
  return out;
}

// Per-line completeness for required-doc + OCR + fields → drives pill color & footer chip
export function evaluateLine(line: ExpenseLineV2): {
  requiredTotal: number; requiredFilled: number;
  totalSlots: number; filledSlots: number;
  ocrOk: boolean; fieldsOk: boolean; complete: boolean; missingCaption: string;
} {
  const policy = getDocPolicyForSubType(line.subExpenseTypeId);
  const amt = parseFloat(line.amount) || 0;
  const active = activePolicy(policy, amt);
  const slots = groupSlots(active);

  let requiredTotal = 0, requiredFilled = 0, totalSlots = 0, filledSlots = 0;
  let ocrOk = true;
  for (const s of slots) {
    totalSlots += 1;
    const req =
      s.kind === "single"
        ? s.row.requirement === "REQUIRED"
        : s.requirement === "REQUIRED";
    if (req) requiredTotal += 1;

    let filled = false;
    if (s.kind === "single") {
      if (s.row.kind === "STRUCTURED_TEXT") {
        const v = line.structured[s.row.docTypeCode] ?? {};
        filled = !!(v.from && v.to && v.distance);
      } else {
        const d = line.docs[slotKey(s.row.docTypeCode, undefined)];
        filled = !!d;
        if (d && d.ocrConfidence < 75) ocrOk = false;
      }
    } else {
      filled = s.rows.some(r => {
        const d = line.docs[slotKey(r.docTypeCode, s.groupId)];
        if (d && d.ocrConfidence < 75) ocrOk = false;
        return !!d;
      });
    }
    if (filled) filledSlots += 1;
    if (req && filled) requiredFilled += 1;
  }

  const fieldsOk =
    !!line.subExpenseTypeId && !!line.receiptDate && amt > 0;

  let missingCaption = "";
  if (!line.subExpenseTypeId) missingCaption = "Sub-type missing";
  else if (requiredFilled < requiredTotal) missingCaption = `${requiredTotal - requiredFilled} required doc(s) missing`;
  
  else if (!line.receiptDate) missingCaption = "Date missing";
  else if (amt <= 0) missingCaption = "Amount missing";
  else if (!ocrOk) missingCaption = "OCR confidence below 75%";
  else if (amt > LARGE_LINE_THRESHOLD && !line.lineJustification.trim()) missingCaption = "Large-line justification needed";

  const complete = fieldsOk && requiredFilled === requiredTotal && ocrOk &&
    (amt <= LARGE_LINE_THRESHOLD || !!line.lineJustification.trim());

  return { requiredTotal, requiredFilled, totalSlots, filledSlots, ocrOk, fieldsOk, complete, missingCaption };
}

// ───────── Component ─────────
interface Props {
  lines: ExpenseLineV2[];
  setLines: React.Dispatch<React.SetStateAction<ExpenseLineV2[]>>;
  countryFilter: string;
  readOnly?: boolean;
}

interface UnsortedFile {
  id: string;
  fileName: string;
  fileSize: number;
  guess: { code: DocTypeCode; confidence: number };
  summary: string;
}

export function ExpenseLinesSection({ lines, setLines, countryFilter, readOnly = false }: Props) {
  const isMobile = useIsMobile();
  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id ?? "");
  const [needsSorting, setNeedsSorting] = useState<UnsortedFile[]>([]);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [changingSubType, setChangingSubType] = useState(false);
  const [pendingCategoryByLine, setPendingCategoryByLine] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Distinct parent expense types from the catalog (filtered by country)
  const expenseCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenseTypes) {
      if (countryFilter === "all" || e.countries.includes(countryFilter as any)) {
        set.add(e.category);
      }
    }
    return Array.from(set).sort();
  }, [countryFilter]);

  // Keep selection valid
  useEffect(() => {
    if (!lines.find(l => l.id === selectedLineId)) {
      setSelectedLineId(lines[0]?.id ?? "");
    }
  }, [lines, selectedLineId]);

  const selectedLine = lines.find(l => l.id === selectedLineId);
  const subTypes = useMemo(
    () => expenseTypes.filter(e =>
      e.category === "Local Travelling" &&
      (countryFilter === "all" || e.countries.includes(countryFilter as any))
    ),
    [countryFilter]
  );
  const subTypeLabel = (id: string) =>
    expenseTypes.find(e => e.id === id)?.subcategory ?? "Unassigned";

  // ───────── Mutators ─────────
  const updateLine = useCallback((id: string, patch: Partial<ExpenseLineV2>) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  }, [setLines]);

  const setLineSubType = useCallback((id: string, subTypeId: string) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      // Preserve docs whose docTypeCode is still in the new policy
      const newPolicy = getDocPolicyForSubType(subTypeId);
      const validKeys = new Set(
        newPolicy.map(r => slotKey(r.docTypeCode, r.alternativeGroupId))
      );
      const docs: Record<string, AttachedDoc> = {};
      for (const [k, v] of Object.entries(l.docs)) {
        if (validKeys.has(k)) docs[k] = v;
        // also try matching a same-code doc to a new alt group
        else {
          const code = k.split("|")[0] as DocTypeCode;
          const newRow = newPolicy.find(r => r.docTypeCode === code);
          if (newRow) docs[slotKey(newRow.docTypeCode, newRow.alternativeGroupId)] = v;
        }
      }
      return {
        ...l,
        subExpenseTypeId: subTypeId,
        glAccount: l.glAccount || GL_BY_SUBTYPE[subTypeId] || "",
        vatCode: l.vatCode || "V07",
        docs,
      };
    }));
  }, [setLines]);

  const addLine = () => {
    const fresh = createEmptyLineV2();
    setLines(prev => [...prev, fresh]);
    setSelectedLineId(fresh.id);
    if (isMobile) setMobileEditorOpen(true);
  };

  const deleteLine = (id: string) => {
    setLines(prev => (prev.length <= 1 ? prev : prev.filter(l => l.id !== id)));
  };

  const duplicateLine = (id: string) => {
    setLines(prev => {
      const src = prev.find(l => l.id === id);
      if (!src) return prev;
      const copy: ExpenseLineV2 = { ...src, id: `line-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, docs: { ...src.docs }, structured: { ...src.structured } };
      const idx = prev.findIndex(l => l.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const copyFromPrevious = (id: string) => {
    setLines(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx <= 0) return prev;
      const src = prev[idx - 1];
      return prev.map(l => l.id !== id ? l : {
        ...l,
        subExpenseTypeId: src.subExpenseTypeId,
        glAccount: src.glAccount,
        vatCode: src.vatCode,
        whtCode: src.whtCode,
        paymentMode: src.paymentMode,
        currency: src.currency,
        notes: src.notes,
      });
    });
    toast({ title: "Copied from previous line" });
  };

  // ───────── Bulk dropzone ─────────
  const handleDropFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    let routed = 0, unsorted = 0;
    let createdLineIds: string[] = [];

    setLines(prev => {
      let next = [...prev];
      const ensureLineForCode = (code: DocTypeCode): ExpenseLineV2 | null => {
        // Find an existing line whose policy contains this docTypeCode and slot is empty
        for (const ln of next) {
          if (!ln.subExpenseTypeId) continue;
          const policy = getDocPolicyForSubType(ln.subExpenseTypeId);
          const row = policy.find(r => r.docTypeCode === code);
          if (row && !ln.docs[slotKey(row.docTypeCode, row.alternativeGroupId)]) return ln;
        }
        // Create a new draft line whose default sub-type plausibly contains this code
        const guessSubType =
          code === "E_TICKET" || code === "BOARDING_PASS" ? "lt-air-dom" :
          code === "HOTEL_FOLIO" ? "lt-hotel-dom" :
          code === "FUEL_RECEIPT" ? "lt-car" :
          code === "TAX_INVOICE" ? "lt-air-dom" :
          code === "TRAVEL_APPROVAL" ? "lt-air-dom" :
          code === "CLAIM_FORM" ? "lt-meal" :
          code === "MEMO" ? "lt-taxi" :
          "lt-taxi";
        const fresh = createEmptyLineV2();
        fresh.subExpenseTypeId = guessSubType;
        fresh.glAccount = GL_BY_SUBTYPE[guessSubType] || "";
        fresh.vatCode = "V07";
        next.push(fresh);
        createdLineIds.push(fresh.id);
        return fresh;
      };

      for (const file of arr) {
        const guess = classifyFile(file.name);
        if (guess.confidence < 80) {
          unsorted += 1;
          continue;
        }
        const ln = ensureLineForCode(guess.code);
        if (!ln) { unsorted += 1; continue; }
        const policy = getDocPolicyForSubType(ln.subExpenseTypeId);
        const row = policy.find(r => r.docTypeCode === guess.code);
        if (!row) { unsorted += 1; continue; }
        const sm = mockSummary(guess.code);
        const key = slotKey(row.docTypeCode, row.alternativeGroupId);
        next = next.map(x => x.id === ln.id ? {
          ...x,
          docs: { ...x.docs, [key]: {
            fileName: file.name, fileSize: file.size,
            ocrConfidence: guess.confidence, extractedSummary: sm.summary,
            uploadedAt: Date.now(),
          }},
          vendor: x.vendor || sm.vendor || "",
          amount: x.amount || sm.amount || "",
          vatAmount: x.vatEdited ? x.vatAmount : String(deriveVat(x.amount || sm.amount || "", x.vatCode)),
          whtAmount: x.whtEdited ? x.whtAmount : String(deriveWht(x.amount || sm.amount || "", x.vatEdited ? x.vatAmount : String(deriveVat(x.amount || sm.amount || "", x.vatCode)), x.whtCode)),
          receiptDate: x.receiptDate || sm.date || "",
        } : x);
        routed += 1;
      }
      return next;
    });

    if (unsorted > 0) {
      // Push unsorted into tray (separate state — done after lines update)
      const tray: UnsortedFile[] = [];
      for (const file of arr) {
        const guess = classifyFile(file.name);
        if (guess.confidence < 80) {
          tray.push({
            id: `un-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
            fileName: file.name, fileSize: file.size, guess,
            summary: mockSummary(guess.code).summary,
          });
        }
      }
      setNeedsSorting(prev => [...prev, ...tray]);
    }
    if (createdLineIds.length) setSelectedLineId(createdLineIds[0]);

    toast({
      title: `${arr.length} file(s) processed`,
      description: `${routed} auto-routed · ${unsorted} need sorting`,
    });
  };

  const onPickFiles = () => fileInputRef.current?.click();

  // ───────── Slot-level helpers ─────────
  const attachToSlot = (lineId: string, code: DocTypeCode, altGroupId: string | undefined, file: File) => {
    const sm = mockSummary(code);
    const key = slotKey(code, altGroupId);
    setLines(prev => prev.map(l => l.id !== lineId ? l : ({
      ...l,
      docs: { ...l.docs, [key]: {
        fileName: file.name, fileSize: file.size,
        ocrConfidence: 92, extractedSummary: sm.summary, uploadedAt: Date.now(),
      }},
      vendor: l.vendor || sm.vendor || "",
      amount: l.amount || sm.amount || "",
      vatAmount: l.vatEdited ? l.vatAmount : String(deriveVat(l.amount || sm.amount || "", l.vatCode)),
      whtAmount: l.whtEdited ? l.whtAmount : String(deriveWht(l.amount || sm.amount || "", l.vatEdited ? l.vatAmount : String(deriveVat(l.amount || sm.amount || "", l.vatCode)), l.whtCode)),
      receiptDate: l.receiptDate || sm.date || "",
    })));
  };

  const removeFromSlot = (lineId: string, code: DocTypeCode, altGroupId: string | undefined) => {
    const key = slotKey(code, altGroupId);
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const docs = { ...l.docs };
      delete docs[key];
      return { ...l, docs };
    }));
  };

  const dropUnsortedOnLine = (unsortedId: string, lineId: string) => {
    const item = needsSorting.find(u => u.id === unsortedId);
    if (!item) return;
    const ln = lines.find(l => l.id === lineId);
    if (!ln || !ln.subExpenseTypeId) {
      toast({ title: "Pick a sub-type for this line first", variant: "destructive" });
      return;
    }
    const policy = getDocPolicyForSubType(ln.subExpenseTypeId);
    const row = policy.find(r => r.docTypeCode === item.guess.code);
    if (!row) {
      toast({ title: `${DOC_TYPE_LABEL[item.guess.code]} not allowed for this sub-type`, variant: "destructive" });
      return;
    }
    setLines(prev => prev.map(l => l.id !== lineId ? l : ({
      ...l,
      docs: { ...l.docs, [slotKey(row.docTypeCode, row.alternativeGroupId)]: {
        fileName: item.fileName, fileSize: item.fileSize,
        ocrConfidence: item.guess.confidence, extractedSummary: item.summary,
        uploadedAt: Date.now(),
      }},
    })));
    setNeedsSorting(prev => prev.filter(u => u.id !== unsortedId));
    toast({ title: "Routed to line", description: `${DOC_TYPE_LABEL[item.guess.code]} · Line ${lines.findIndex(l => l.id === lineId) + 1}` });
  };

  // ───────── Render: Bulk dropzone ─────────
  const [dragOver, setDragOver] = useState(false);
  const Dropzone = (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        if (e.dataTransfer.files?.length) handleDropFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border-2 border-dashed rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          Drop receipts and supporting docs — auto-classified to the right line and slot
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          JPG, PNG, PDF · max 10 MB each · OCR runs in parallel
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-8" disabled={readOnly}>
          <Camera className="h-3.5 w-3.5" /> Camera
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={onPickFiles} disabled={readOnly}>
          <Upload className="h-3.5 w-3.5" /> Upload files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files) handleDropFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
    </div>
  );

  // ───────── Render: Needs sorting tray ─────────
  const NeedsSortingTray = needsSorting.length > 0 && (
    <div className="border border-status-alert/30 bg-status-alert/5 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Inbox className="h-4 w-4 text-status-alert" />
        <span className="text-xs font-semibold text-foreground">Needs sorting · {needsSorting.length}</span>
        <span className="text-[11px] text-muted-foreground">Drag onto a line, or click to assign.</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {needsSorting.map(u => (
          <div
            key={u.id}
            draggable={!readOnly}
            onDragStart={(e) => e.dataTransfer.setData("text/unsorted-id", u.id)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card border border-border text-[11px] cursor-grab active:cursor-grabbing"
            title={`Best guess: ${DOC_TYPE_LABEL[u.guess.code]} (${u.guess.confidence}%)`}
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium truncate max-w-[160px]">{u.fileName}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">~{DOC_TYPE_LABEL[u.guess.code]} {u.guess.confidence}%</Badge>
            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setNeedsSorting(prev => prev.filter(x => x.id !== u.id))}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ───────── Render: Line row ─────────
  const renderLineRow = (line: ExpenseLineV2, idx: number) => {
    const ev = evaluateLine(line);
    const isSelected = line.id === selectedLineId;
    const amt = parseFloat(line.amount) || 0;
    let pillTone: "approved" | "alert" | "rejected" = "rejected";
    if (ev.requiredFilled === ev.requiredTotal && ev.requiredTotal > 0 && ev.fieldsOk && ev.ocrOk) pillTone = "approved";
    else if (ev.requiredFilled > 0 || Object.keys(line.docs).length > 0) pillTone = "alert";

    return (
      <div
        key={line.id}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("text/unsorted-id")) e.preventDefault(); }}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("text/unsorted-id");
          if (id) dropUnsortedOnLine(id, line.id);
        }}
        onClick={() => {
          setSelectedLineId(line.id);
          if (isMobile) setMobileEditorOpen(true);
        }}
        className={cn(
          "px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors",
          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30",
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-6 mt-0.5">#{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {line.subExpenseTypeId ? subTypeLabel(line.subExpenseTypeId) : <span className="text-muted-foreground italic font-normal">Pick sub-type</span>}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {line.vendor || "—"} · {amt > 0 ? `${amt.toLocaleString()} ${line.currency}` : "—"}
            </p>
            {!ev.complete && (
              <p className="text-[10px] text-status-alert mt-0.5 truncate">{ev.missingCaption}</p>
            )}
          </div>
          <Badge
            variant={pillTone}
            className="text-[9px] tabular-nums shrink-0 mt-0.5"
          >
            {ev.requiredFilled}/{ev.requiredTotal} docs
          </Badge>
        </div>
      </div>
    );
  };

  // ───────── Render: Slot ─────────
  const renderSlot = (
    line: ExpenseLineV2,
    slot: ReturnType<typeof groupSlots>[number],
  ) => {
    const isOptional =
      slot.kind === "single" && slot.row.requirement === "OPTIONAL";

    if (slot.kind === "single") {
      const r = slot.row;
      // Structured-text slot (MILEAGE_TEXT)
      if (r.kind === "STRUCTURED_TEXT") {
        const v = line.structured[r.docTypeCode] ?? {};
        return (
          <div key={slotKey(r.docTypeCode)} className={cn(
            "rounded-lg p-3 border",
            isOptional ? "border-dashed border-border bg-muted/20" : "border-primary/30 bg-primary/[0.02]",
          )}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{DOC_TYPE_LABEL[r.docTypeCode]}</span>
              <Badge variant={isOptional ? "outline" : "rejected"} className="text-[9px] px-1.5 py-0 ml-auto">
                {isOptional ? "Optional" : "Required"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["from","From"],["to","To"],["distance","Distance (km)"]].map(([k,l]) => (
                <div key={k} className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</Label>
                  <Input
                    className="h-8 text-xs"
                    value={v[k] ?? ""}
                    onChange={(e) => {
                      const nv = { ...v, [k]: e.target.value };
                      setLines(prev => prev.map(x => x.id === line.id ? { ...x, structured: { ...x.structured, [r.docTypeCode]: nv }} : x));
                    }}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
      // FILE single slot
      const key = slotKey(r.docTypeCode);
      const doc = line.docs[key];
      return renderFileSlot(line, [r], r.requirement === "REQUIRED", DOC_TYPE_LABEL[r.docTypeCode], doc, undefined);
    }

    // ALTERNATIVE group → tabs
    return renderAltGroup(line, slot.groupId, slot.rows);
  };

  const renderFileSlot = (
    line: ExpenseLineV2,
    rows: DocPolicyRow[],   // 1 or more (alt group)
    required: boolean,
    label: string,
    doc: AttachedDoc | undefined,
    altGroupId: string | undefined,
  ) => {
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const code = rows[0].docTypeCode;
      attachToSlot(line.id, code, altGroupId, f);
      e.target.value = "";
    };

    return (
      <div className={cn(
        "rounded-lg p-3 border transition-colors",
        doc
          ? "border-status-approved/40 bg-status-approved/5"
          : required
            ? "border-dashed border-status-hold/40 bg-status-hold/5"
            : "border-dashed border-border bg-muted/20",
      )}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className={cn("h-3.5 w-3.5", doc ? "text-status-approved" : "text-muted-foreground")} />
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <Badge variant={required ? "rejected" : "outline"} className="text-[9px] px-1.5 py-0 ml-auto">
            {required ? "Required" : "Optional"}
          </Badge>
        </div>

        {doc ? (
          <div className="flex items-center gap-2 text-xs">
            <div className="h-9 w-9 rounded bg-status-approved/15 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-status-approved" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{doc.fileName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{doc.extractedSummary}</p>
            </div>
            <Badge variant={doc.ocrConfidence >= 75 ? "approved" : "alert"} className="text-[9px] px-1.5 py-0 shrink-0">
              {doc.ocrConfidence}%
            </Badge>
            {!readOnly && (
              <>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="View"><Eye className="h-3.5 w-3.5" /></Button>
                <label className="cursor-pointer">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Replace" asChild>
                    <span><Replace className="h-3.5 w-3.5" /></span>
                  </Button>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPick} />
                </label>
                <Button
                  type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromSlot(line.id, rows[0].docTypeCode, altGroupId)} title="Remove"
                ><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        ) : (
          <label className={cn("flex items-center justify-between gap-2 cursor-pointer", readOnly && "pointer-events-none opacity-60")}>
            <span className="text-[11px] text-muted-foreground">
              <Plus className="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
              {required ? "Required — drop file or click upload" : "Add if available"}
            </span>
            <span className="inline-flex">
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 pointer-events-none">
                <Upload className="h-3 w-3" /> Upload
              </Button>
            </span>
            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPick} />
          </label>
        )}
      </div>
    );
  };

  const renderAltGroup = (line: ExpenseLineV2, groupId: string, rows: DocPolicyRow[]) => (
    <AltGroup
      key={`alt-${groupId}`}
      line={line}
      groupId={groupId}
      rows={rows}
      renderFileSlot={renderFileSlot}
    />
  );

  // ───────── Render: Editor pane for selected line ─────────
  const renderEditor = (line: ExpenseLineV2) => {
    const policy = getDocPolicyForSubType(line.subExpenseTypeId);
    const amt = parseFloat(line.amount) || 0;
    const active = activePolicy(policy, amt);
    const slots = groupSlots(active);
    const requiredSlots = slots.filter(s =>
      s.kind === "single" ? s.row.requirement === "REQUIRED" : true
    );
    const optionalSlots = slots.filter(s =>
      s.kind === "single" && s.row.requirement === "OPTIONAL"
    );
    const idx = lines.findIndex(l => l.id === line.id);
    const selectedSubType = expenseTypes.find(e => e.id === line.subExpenseTypeId);
    const isLargeLine = amt > LARGE_LINE_THRESHOLD;
    const isOverHardStop = selectedSubType && amt > selectedSubType.hardStopThreshold;

    // Initial picker if no sub-type — tile-based picker
    if (!line.subExpenseTypeId || changingSubType) {
      return (
        <SubTypeTilePicker
          countryFilter={countryFilter}
          showCancel={!!line.subExpenseTypeId}
          onCancel={() => setChangingSubType(false)}
          onPick={(subTypeId) => {
            setLineSubType(line.id, subTypeId);
            setChangingSubType(false);
            setPendingCategoryByLine(prev => {
              const next = { ...prev }; delete next[line.id]; return next;
            });
          }}
        />
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Editor header */}
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Line {idx + 1} · {selectedSubType?.subcategory ?? "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">Sub-type sets doc requirements</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ZONE A — Identity */}
          <section>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Vendor" ocr badgeIfDoc={Object.keys(line.docs).length > 0}>
                <Input className="h-9 text-sm" value={line.vendor} onChange={(e) => updateLine(line.id, { vendor: e.target.value })} disabled={readOnly} />
              </Field>
              <Field label="Receipt Date" required ocr badgeIfDoc={Object.keys(line.docs).length > 0}>
                <Input type="date" className="h-9 text-sm" value={line.receiptDate} onChange={(e) => updateLine(line.id, { receiptDate: e.target.value })} disabled={readOnly} />
              </Field>
              <Field label="Total Amount" required ocr badgeIfDoc={Object.keys(line.docs).length > 0}>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="h-9 text-sm tabular-nums font-medium"
                  value={line.amount}
                  onChange={(e) => {
                    const total = e.target.value;
                    const patch: Partial<ExpenseLineV2> = { amount: total };
                    if (!line.vatEdited) patch.vatAmount = String(deriveVat(total, line.vatCode));
                    const newVat = patch.vatAmount ?? line.vatAmount;
                    if (!line.whtEdited) patch.whtAmount = String(deriveWht(total, newVat, line.whtCode));
                    updateLine(line.id, patch);
                  }}
                  disabled={readOnly}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Gross amount on the receipt</p>
                {selectedSubType && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Policy limit {selectedSubType.maxAmount.toLocaleString()} · Alert above {selectedSubType.alertThreshold.toLocaleString()}
                  </p>
                )}
                {isOverHardStop && <p className="text-[10px] text-status-hold font-semibold mt-0.5">Exceeds hard-stop limit</p>}
              </Field>
              <Field label="Currency">
                <Select value={line.currency} onValueChange={(v) => updateLine(line.id, { currency: v })} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KHR">KHR</SelectItem>
                    <SelectItem value="MMK">MMK</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="VAT Amount">
                <Input
                  type="number"
                  placeholder="0.00"
                  className="h-9 text-sm tabular-nums"
                  value={line.vatAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    const patch: Partial<ExpenseLineV2> = { vatAmount: v, vatEdited: true };
                    if (!line.whtEdited) patch.whtAmount = String(deriveWht(line.amount, v, line.whtCode));
                    updateLine(line.id, patch);
                  }}
                  disabled={readOnly}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">Auto-calculated from VAT Code · editable</p>
                  {line.vatEdited && !readOnly && (
                    <button
                      type="button"
                      className="text-[10px] text-primary hover:underline"
                      onClick={() => {
                        const newVat = String(deriveVat(line.amount, line.vatCode));
                        const patch: Partial<ExpenseLineV2> = { vatAmount: newVat, vatEdited: false };
                        if (!line.whtEdited) patch.whtAmount = String(deriveWht(line.amount, newVat, line.whtCode));
                        updateLine(line.id, patch);
                      }}
                    >Recalculate</button>
                  )}
                </div>
              </Field>
              <Field label="WHT Amount">
                <Input
                  type="number"
                  placeholder="0.00"
                  className="h-9 text-sm tabular-nums"
                  value={line.whtAmount}
                  onChange={(e) => updateLine(line.id, { whtAmount: e.target.value, whtEdited: true })}
                  disabled={readOnly}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">Auto-calculated from WHT Code · editable</p>
                  {line.whtEdited && !readOnly && (
                    <button
                      type="button"
                      className="text-[10px] text-primary hover:underline"
                      onClick={() => {
                        updateLine(line.id, {
                          whtAmount: String(deriveWht(line.amount, line.vatAmount, line.whtCode)),
                          whtEdited: false,
                        });
                      }}
                    >Recalculate</button>
                  )}
                </div>
              </Field>
              <Field label="VAT Code">
                <Select
                  value={line.vatCode}
                  onValueChange={(v) => {
                    const patch: Partial<ExpenseLineV2> = { vatCode: v };
                    if (!line.vatEdited) patch.vatAmount = String(deriveVat(line.amount, v));
                    const newVat = patch.vatAmount ?? line.vatAmount;
                    if (!line.whtEdited) patch.whtAmount = String(deriveWht(line.amount, newVat, line.whtCode));
                    updateLine(line.id, patch);
                  }}
                  disabled={readOnly}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="VAT…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V07">V07 – VAT 7%</SelectItem>
                    <SelectItem value="V00">V00 – VAT 0%</SelectItem>
                    <SelectItem value="VEX">VEX – Exempt</SelectItem>
                    <SelectItem value="VNA">VNA – Out of scope</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="WHT Code">
                <Select
                  value={line.whtCode}
                  onValueChange={(v) => {
                    const patch: Partial<ExpenseLineV2> = { whtCode: v };
                    if (!line.whtEdited) patch.whtAmount = String(deriveWht(line.amount, line.vatAmount, v));
                    updateLine(line.id, patch);
                  }}
                  disabled={readOnly}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHT00">WHT00 – No WHT</SelectItem>
                    <SelectItem value="WHT01">WHT01 – 1% Transport</SelectItem>
                    <SelectItem value="WHT03">WHT03 – 3% Services</SelectItem>
                    <SelectItem value="WHT05">WHT05 – 5% Rental</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea rows={2} className="text-sm resize-none" value={line.notes} onChange={(e) => updateLine(line.id, { notes: e.target.value })} disabled={readOnly} />
                </Field>
              </div>
              {isLargeLine && (
                <div className="sm:col-span-2">
                  <Field label="Large-line Justification" required>
                    <Textarea rows={2} className="text-sm resize-none border-status-alert/40" placeholder="Explain why this line exceeds 30,000 THB…" value={line.lineJustification} onChange={(e) => updateLine(line.id, { lineJustification: e.target.value })} disabled={readOnly} />
                  </Field>
                </div>
              )}
            </div>
          </section>

          {/* ZONE B — Required documents */}
          {requiredSlots.length > 0 && (
            <section>
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-2">
                B · Required Documents
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{requiredSlots.length} slot(s)</Badge>
              </h4>
              <div className="space-y-2.5">
                {requiredSlots.map(s => renderSlot(line, s))}
              </div>
            </section>
          )}

          {/* ZONE C — Optional documents */}
          {optionalSlots.length > 0 && (
            <section>
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">C · Optional Documents</h4>
              <div className="space-y-2.5">
                {optionalSlots.map(s => renderSlot(line, s))}
              </div>
            </section>
          )}
        </div>

        {/* Editor footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => deleteLine(line.id)} disabled={readOnly || lines.length <= 1}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
          <Button
            type="button" size="sm" className="h-8 text-xs gap-1"
            onClick={() => {
              const next = lines[idx + 1];
              if (next) { setSelectedLineId(next.id); setChangingSubType(false); }
              else { addLine(); }
            }}
            disabled={readOnly}
          >
            Save and next <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  // ───────── Layout ─────────
  return (
    <div className="space-y-3">
      
      {NeedsSortingTray}

      {/* Master-detail */}
      <div className={cn(
        "grid gap-3",
        isMobile ? "grid-cols-1" : "grid-cols-[320px_1fr]",
      )}>
        {/* LEFT — Lines list */}
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col",
          isMobile && mobileEditorOpen && "hidden",
        )}>
          <div className="px-3 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Lines</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{lines.length}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[640px]">
            {lines.map((l, i) => renderLineRow(l, i))}
          </div>

          <button
            type="button"
            onClick={addLine}
            disabled={readOnly}
            className="w-full px-3 py-3 text-xs font-medium text-primary hover:bg-primary/5 border-t border-border flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Expense Line
          </button>
        </div>

        {/* RIGHT — Editor */}
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
          isMobile && !mobileEditorOpen && "hidden",
        )}>
          {isMobile && (
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileEditorOpen(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold">Back to lines</span>
            </div>
          )}
          {selectedLine ? renderEditor(selectedLine) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No line selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────── Subcomponents ───────
function Field({
  label, required, ocr, badgeIfDoc, children,
}: { label: string; required?: boolean; ocr?: boolean; badgeIfDoc?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {label}{required && <span className="text-destructive">*</span>}
        {ocr && badgeIfDoc && <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR</span>}
      </Label>
      {children}
    </div>
  );
}

function AltGroup({
  line, groupId, rows, renderFileSlot,
}: {
  line: ExpenseLineV2;
  groupId: string;
  rows: DocPolicyRow[];
  renderFileSlot: (line: ExpenseLineV2, rows: DocPolicyRow[], required: boolean, label: string, doc: AttachedDoc | undefined, altGroupId: string | undefined) => JSX.Element;
}) {
  const filledIdx = rows.findIndex(r => !!line.docs[slotKey(r.docTypeCode, groupId)]);
  const [activeIdx, setActiveIdx] = useState(filledIdx >= 0 ? filledIdx : 0);
  const activeRow = rows[activeIdx];
  const doc = line.docs[slotKey(activeRow.docTypeCode, groupId)];
  const anyFilled = rows.some(r => !!line.docs[slotKey(r.docTypeCode, groupId)]);

  return (
    <div className={cn(
      "rounded-lg p-3 border transition-colors",
      anyFilled ? "border-status-approved/40 bg-status-approved/5" : "border-dashed border-status-hold/40 bg-status-hold/5",
    )}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          {rows.map(r => DOC_TYPE_LABEL[r.docTypeCode]).join(" or ")}
        </span>
        <Badge variant="rejected" className="text-[9px] px-1.5 py-0 ml-auto">Required (one of)</Badge>
      </div>
      <Tabs value={String(activeIdx)} className="mb-2">
        <TabsList className="h-7">
          {rows.map((r, i) => (
            <TabsTrigger
              key={r.docTypeCode}
              value={String(i)}
              className="h-6 text-[11px] px-2"
              onClick={() => setActiveIdx(i)}
            >
              {DOC_TYPE_LABEL[r.docTypeCode]}
              {!!line.docs[slotKey(r.docTypeCode, groupId)] && <CheckCircle className="h-3 w-3 ml-1 text-status-approved" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {renderFileSlot(line, [activeRow], true, DOC_TYPE_LABEL[activeRow.docTypeCode], doc, groupId)}
    </div>
  );
}
