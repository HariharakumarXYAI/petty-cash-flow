import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Upload, Camera, Plus, Trash2, ArrowLeft, ArrowRight,
  CheckCircle, AlertTriangle, FileText, X, Inbox, Replace, Eye, Sparkles,
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
  DOC_TYPE_LABEL,
  DocTypeCode,
} from "@/lib/mock-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubTypeTilePicker } from "@/components/claim/SubTypeTilePicker";
import { getSubExpenseTypeById } from "@/lib/sub-expense-types";
import {
  DOC_REQUIREMENTS,
  DocSlot,
  getDocRequirementsForSubType,
} from "@/config/docRequirements";

// ────────── Line model ──────────
export interface AttachedDoc {
  fileName: string;
  fileSize: number;
  ocrConfidence: number;
  extractedSummary: string;
  uploadedAt: number;
  // For required_one_of: which option id was selected at upload time
  selectedOptionId?: string;
  // OCR validation flag (e.g. license plate detection failed)
  ocrValidationFailed?: boolean;
}

// Slot input value: string for free_text/select/number, string[] for list,
// Record<string,string> for structured_form
export type SlotInputValue = string | string[] | Record<string, string>;

export interface ExpenseLineV2 {
  id: string;
  subExpenseTypeId: string;
  vendor: string;
  receiptDate: string;
  amount: string;
  vatAmount: string;
  whtAmount: string;
  vatEdited?: boolean;
  whtEdited?: boolean;
  currency: string;
  glAccount: string;
  vatCode: string;
  whtCode: string;
  paymentMode: string;

  lineJustification: string;

  // ── New config-driven slot state (keyed by DocSlot.id) ──
  slotFiles: Record<string, AttachedDoc>;
  slotInputs: Record<string, SlotInputValue>;
  conditionResponses: Record<string, boolean>;

  // Legacy: kept for bulk-dropzone auto-routing back-compat (not used for completeness)
  docs: Record<string, AttachedDoc>;
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

  lineJustification: "",
  slotFiles: {},
  slotInputs: {},
  conditionResponses: {},
  docs: {},
  structured: {},
});

// VAT/WHT rates by code
const VAT_RATE_PCT: Record<string, number> = { V07: 7, V00: 0, VEX: 0, VNA: 0 };
const WHT_RATE_PCT: Record<string, number> = { WHT00: 0, WHT01: 1, WHT02: 2, WHT03: 3, WHT05: 5, WHT15: 15 };

const round2 = (n: number) => Math.round(n * 100) / 100;

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

const GL_BY_SUBTYPE: Record<string, string> = {
  "lt-taxi": "5102-001", "lt-train": "5102-001", "lt-car": "5102-001",
  "lt-toll": "5102-001", "lt-airpark": "5102-001", "lt-otherpark": "5102-001",
  "lt-rental": "5102-001", "lt-air-dom": "5102-001", "lt-hotel-dom": "5102-001",
  "lt-meal": "5103-001", "lt-perdiem": "5103-001",
  "lt-postage": "5106-001", "lt-night": "5103-001",
};

const LARGE_LINE_THRESHOLD = 30000;

// Doc-type heuristic from filename (used by bulk dropzone)
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
  return { code: "RECEIPT", confidence: 60 };
}

// Heuristic: map a doc-type code to a slot id within a sub-type's config
function findSlotIdForCode(subTypeId: string, code: DocTypeCode): string | null {
  const slots = getDocRequirementsForSubType(subTypeId);
  // Priority: file-style required → required_one_of → optional
  const isFileSlot = (s: DocSlot) => !s.input_type || s.input_type === "file";
  const codeHints: Record<DocTypeCode, RegExp> = {
    E_TICKET: /e_ticket|ticket/i,
    BOARDING_PASS: /boarding/i,
    TAX_INVOICE: /tax_invoice|invoice/i,
    HOTEL_FOLIO: /hotel|folio/i,
    FUEL_RECEIPT: /fuel|receipt/i,
    RECEIPT: /receipt/i,
    CLAIM_FORM: /claim_form|form/i,
    TRAVEL_APPROVAL: /travel_approval|approval/i,
    MEMO: /memo/i,
    MILEAGE_TEXT: /trip_log|mileage/i,
  };
  const re = codeHints[code];
  // 1. Direct id match in required slots
  for (const s of slots) {
    if (s.type === "required" && isFileSlot(s) && re && re.test(s.id)) return s.id;
  }
  // 2. required_one_of with matching option id
  for (const s of slots) {
    if (s.type === "required_one_of" && s.options?.some(o => re && re.test(o.id))) return s.id;
  }
  // 3. optional/conditional file slot
  for (const s of slots) {
    if ((s.type === "optional" || s.type === "conditional_optional" || s.type === "conditional_required")
        && isFileSlot(s) && re && re.test(s.id)) return s.id;
  }
  // 4. Fallback: first required file slot
  for (const s of slots) if (s.type === "required" && isFileSlot(s)) return s.id;
  return null;
}

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

// ───────── Slot evaluation helpers ─────────

function isSlotInputFilled(slot: DocSlot, value: SlotInputValue | undefined): boolean {
  if (value == null) return false;
  if (slot.input_type === "structured_form" && slot.structured_fields) {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    return slot.structured_fields.every(f => {
      const v = (value as Record<string, string>)[f.id];
      return v != null && String(v).trim().length > 0;
    });
  }
  if (slot.input_type === "list") {
    return Array.isArray(value) && value.some(v => String(v).trim().length > 0);
  }
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function isSlotFilled(line: ExpenseLineV2, slot: DocSlot): boolean {
  if (slot.input_type && slot.input_type !== "file") {
    return isSlotInputFilled(slot, line.slotInputs[slot.id]);
  }
  // File-based (or required_one_of which is always file-based here)
  return !!line.slotFiles[slot.id];
}

function isSlotActive(line: ExpenseLineV2, slot: DocSlot): boolean {
  if (slot.type === "conditional_required" || slot.type === "conditional_optional") {
    return line.conditionResponses[slot.id] === true;
  }
  return true;
}

function isSlotRequired(line: ExpenseLineV2, slot: DocSlot): boolean {
  if (slot.type === "required" || slot.type === "required_one_of") return true;
  if (slot.type === "conditional_required") return line.conditionResponses[slot.id] === true;
  return false;
}

// Per-line completeness — driven entirely by DOC_REQUIREMENTS
export function evaluateLine(line: ExpenseLineV2): {
  requiredTotal: number; requiredFilled: number;
  totalSlots: number; filledSlots: number;
  ocrOk: boolean; fieldsOk: boolean; complete: boolean; missingCaption: string;
} {
  const slots = getDocRequirementsForSubType(line.subExpenseTypeId);
  const amt = parseFloat(line.amount) || 0;

  let requiredTotal = 0, requiredFilled = 0, totalSlots = 0, filledSlots = 0;
  let ocrOk = true;

  for (const s of slots) {
    if (!isSlotActive(line, s)) continue;
    totalSlots += 1;
    const required = isSlotRequired(line, s);
    if (required) requiredTotal += 1;
    const filled = isSlotFilled(line, s);
    if (filled) filledSlots += 1;
    if (required && filled) requiredFilled += 1;

    // OCR check on file slots
    if (!s.input_type || s.input_type === "file" || s.type === "required_one_of") {
      const f = line.slotFiles[s.id];
      if (f && f.ocrConfidence < 75) ocrOk = false;
    }
  }

  const fieldsOk = !!line.subExpenseTypeId && !!line.receiptDate && amt > 0;

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
  const subTypeLabel = (id: string) =>
    expenseTypes.find(e => e.id === id)?.subcategory ?? "Unassigned";

  // ───────── Mutators ─────────
  const updateLine = useCallback((id: string, patch: Partial<ExpenseLineV2>) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  }, [setLines]);

  const setLineSubType = useCallback((id: string, subTypeId: string) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      // Reset slot state when sub-type changes (different config = different slot ids)
      return {
        ...l,
        subExpenseTypeId: subTypeId,
        glAccount: l.glAccount || GL_BY_SUBTYPE[subTypeId] || "",
        vatCode: l.vatCode || "V07",
        slotFiles: {},
        slotInputs: {},
        conditionResponses: {},
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

  // ───────── Slot-level helpers (new config-driven) ─────────
  const attachToSlot = (lineId: string, slotId: string, file: File, opts?: {
    selectedOptionId?: string; classified?: { code: DocTypeCode; confidence: number };
  }) => {
    const code = opts?.classified?.code ?? classifyFile(file.name).code;
    const confidence = opts?.classified?.confidence ?? 92;
    const sm = mockSummary(code);
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const slot = getDocRequirementsForSubType(l.subExpenseTypeId).find(s => s.id === slotId);
      // ocr_validation flag — random pass for mock; for license plate require filename hint
      let ocrValidationFailed = false;
      if (slot?.ocr_validation === "must_show_license_plate") {
        ocrValidationFailed = !/plate|[a-z]{2}\s*\d|\bกข|\bขข|\bคค/i.test(file.name);
      }
      const doc: AttachedDoc = {
        fileName: file.name, fileSize: file.size,
        ocrConfidence: confidence, extractedSummary: sm.summary,
        uploadedAt: Date.now(),
        selectedOptionId: opts?.selectedOptionId,
        ocrValidationFailed,
      };
      return {
        ...l,
        slotFiles: { ...l.slotFiles, [slotId]: doc },
        vendor: l.vendor || sm.vendor || "",
        amount: l.amount || sm.amount || "",
        vatAmount: l.vatEdited ? l.vatAmount : String(deriveVat(l.amount || sm.amount || "", l.vatCode)),
        whtAmount: l.whtEdited ? l.whtAmount : String(deriveWht(l.amount || sm.amount || "", l.vatEdited ? l.vatAmount : String(deriveVat(l.amount || sm.amount || "", l.vatCode)), l.whtCode)),
        receiptDate: l.receiptDate || sm.date || "",
      };
    }));
  };

  const removeFromSlot = (lineId: string, slotId: string) => {
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const slotFiles = { ...l.slotFiles };
      delete slotFiles[slotId];
      return { ...l, slotFiles };
    }));
  };

  const setSlotInput = (lineId: string, slotId: string, value: SlotInputValue) => {
    setLines(prev => prev.map(l => l.id === lineId
      ? { ...l, slotInputs: { ...l.slotInputs, [slotId]: value } }
      : l));
  };

  const setConditionResponse = (lineId: string, slotId: string, yes: boolean) => {
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const conditionResponses = { ...l.conditionResponses, [slotId]: yes };
      // If user answered No, clear any existing file/input for that slot
      const slotFiles = { ...l.slotFiles };
      const slotInputs = { ...l.slotInputs };
      if (!yes) { delete slotFiles[slotId]; delete slotInputs[slotId]; }
      return { ...l, conditionResponses, slotFiles, slotInputs };
    }));
  };

  // ───────── Bulk dropzone ─────────
  const handleDropFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    let routed = 0, unsorted = 0;
    const createdLineIds: string[] = [];

    setLines(prev => {
      let next = [...prev];
      const ensureLineForCode = (code: DocTypeCode): ExpenseLineV2 | null => {
        for (const ln of next) {
          if (!ln.subExpenseTypeId) continue;
          const slotId = findSlotIdForCode(ln.subExpenseTypeId, code);
          if (slotId && !ln.slotFiles[slotId]) return ln;
        }
        const guessSubType =
          code === "E_TICKET" || code === "BOARDING_PASS" ? "lt-air-dom" :
          code === "HOTEL_FOLIO" ? "lt-hotel-dom" :
          code === "FUEL_RECEIPT" ? "lt-car" :
          code === "TAX_INVOICE" ? "lt-air-dom" :
          code === "TRAVEL_APPROVAL" ? "lt-air-dom" :
          code === "CLAIM_FORM" ? "lt-taxi" :
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
        if (guess.confidence < 80) { unsorted += 1; continue; }
        const ln = ensureLineForCode(guess.code);
        if (!ln) { unsorted += 1; continue; }
        const slotId = findSlotIdForCode(ln.subExpenseTypeId, guess.code);
        if (!slotId) { unsorted += 1; continue; }
        const sm = mockSummary(guess.code);
        next = next.map(x => x.id === ln.id ? {
          ...x,
          slotFiles: { ...x.slotFiles, [slotId]: {
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

  const dropUnsortedOnLine = (unsortedId: string, lineId: string) => {
    const item = needsSorting.find(u => u.id === unsortedId);
    if (!item) return;
    const ln = lines.find(l => l.id === lineId);
    if (!ln || !ln.subExpenseTypeId) {
      toast({ title: "Pick a sub-type for this line first", variant: "destructive" });
      return;
    }
    const slotId = findSlotIdForCode(ln.subExpenseTypeId, item.guess.code);
    if (!slotId) {
      toast({ title: `${DOC_TYPE_LABEL[item.guess.code]} not allowed for this sub-type`, variant: "destructive" });
      return;
    }
    setLines(prev => prev.map(l => l.id !== lineId ? l : ({
      ...l,
      slotFiles: { ...l.slotFiles, [slotId]: {
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
  // (Bulk dropzone retained for parity; rendered by parent layout if desired.)

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
    else if (ev.requiredFilled > 0 || Object.keys(line.slotFiles).length > 0) pillTone = "alert";

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
              {line.subExpenseTypeId ? (
                <>
                  {subTypeLabel(line.subExpenseTypeId)}
                  {getSubExpenseTypeById(line.subExpenseTypeId)?.th && (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      · {getSubExpenseTypeById(line.subExpenseTypeId)!.th}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic font-normal">Pick sub-type</span>
              )}
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
  const capHint = (slot: DocSlot): string | null => {
    if (!slot.cap) return null;
    if (slot.cap.max_amount != null) return `Maximum ${slot.cap.max_amount.toLocaleString()} ${slot.cap.currency ?? ""}`.trim();
    if (slot.cap.max_days != null && slot.cap.max_hours != null) return `Maximum ${slot.cap.max_days} days / ${slot.cap.max_hours} hours`;
    return null;
  };

  const SlotShell = ({
    slot, line, badgeText, tone, children,
  }: {
    slot: DocSlot;
    line: ExpenseLineV2;
    badgeText: string;
    tone: "required" | "optional" | "filled";
    children: React.ReactNode;
  }) => {
    const filled = isSlotFilled(line, slot);
    const isRequired = tone === "required";
    return (
      <div className={cn(
        "rounded-lg p-3 border-l-[3px] border border-l-[3px] transition-colors",
        filled
          ? "border-status-approved/40 border-l-status-approved bg-status-approved/5"
          : isRequired
            ? "border-destructive/40 border-l-destructive bg-destructive/5"
            : "border-dashed border-border border-l-border bg-muted/20",
      )}>
        <div className="flex items-start gap-2 mb-2">
          <FileText className={cn("h-3.5 w-3.5 mt-0.5", filled ? "text-status-approved" : isRequired ? "text-destructive" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground leading-tight">{slot.label_en}</div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{slot.label_th}</div>
            {slot.hint_en && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">{slot.hint_en}</p>
            )}
          </div>
          <Badge
            variant={isRequired ? "rejected" : "outline"}
            className="text-[9px] px-1.5 py-0 shrink-0"
          >
            {badgeText}
          </Badge>
        </div>
        {children}
        {capHint(slot) && (
          <p className="text-[10px] font-semibold text-destructive mt-1.5">{capHint(slot)}</p>
        )}
      </div>
    );
  };

  const FileUploadRow = ({
    line, slot, doc, onPick, requiredText,
  }: {
    line: ExpenseLineV2;
    slot: DocSlot;
    doc: AttachedDoc | undefined;
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
    requiredText: string;
  }) => (
    doc ? (
      <div className="flex items-center gap-2 text-xs">
        <div className="h-9 w-9 rounded bg-status-approved/15 flex items-center justify-center shrink-0">
          <CheckCircle className="h-4 w-4 text-status-approved" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{doc.fileName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{doc.extractedSummary}</p>
          {doc.ocrValidationFailed && slot.ocr_validation === "must_show_license_plate" && (
            <p className="text-[10px] text-status-alert mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Could not detect license plate — please ensure it's visible
            </p>
          )}
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
              onClick={() => removeFromSlot(line.id, slot.id)} title="Remove"
            ><Trash2 className="h-3.5 w-3.5" /></Button>
          </>
        )}
      </div>
    ) : (
      <label className={cn("flex items-center justify-between gap-2 cursor-pointer", readOnly && "pointer-events-none opacity-60")}>
        <span className="text-[11px] text-muted-foreground">
          <Plus className="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
          {requiredText}
        </span>
        <span className="inline-flex">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 pointer-events-none">
            <Upload className="h-3 w-3" /> Upload
          </Button>
        </span>
        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPick} />
      </label>
    )
  );

  const renderSlotInput = (line: ExpenseLineV2, slot: DocSlot) => {
    const value = line.slotInputs[slot.id];
    if (slot.input_type === "free_text") {
      return (
        <Textarea
          rows={2}
          className="text-sm resize-none"
          placeholder="Type your answer…"
          value={(value as string) ?? ""}
          onChange={(e) => setSlotInput(line.id, slot.id, e.target.value)}
          disabled={readOnly}
        />
      );
    }
    if (slot.input_type === "number") {
      return (
        <Input
          type="number"
          className="h-9 text-sm tabular-nums"
          placeholder="0"
          value={(value as string) ?? ""}
          onChange={(e) => setSlotInput(line.id, slot.id, e.target.value)}
          disabled={readOnly}
        />
      );
    }
    if (slot.input_type === "select") {
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => setSlotInput(line.id, slot.id, v)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {(slot.options_select ?? []).map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (slot.input_type === "structured_form") {
      const v = (value as Record<string, string>) ?? {};
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(slot.structured_fields ?? []).map(f => (
            <div key={f.id} className={cn("space-y-1", f.input_type === "free_text" && "sm:col-span-3", f.input_type === "list" && "sm:col-span-3")}>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {f.label_en} <span className="text-muted-foreground/70 normal-case">· {f.label_th}</span>
              </Label>
              {f.input_type === "list" ? (
                <Textarea
                  rows={2}
                  className="text-sm resize-none"
                  placeholder="One per line…"
                  value={v[f.id] ?? ""}
                  onChange={(e) => setSlotInput(line.id, slot.id, { ...v, [f.id]: e.target.value })}
                  disabled={readOnly}
                />
              ) : f.input_type === "free_text" ? (
                <Textarea
                  rows={2}
                  className="text-sm resize-none"
                  value={v[f.id] ?? ""}
                  onChange={(e) => setSlotInput(line.id, slot.id, { ...v, [f.id]: e.target.value })}
                  disabled={readOnly}
                />
              ) : (
                <Input
                  type={f.input_type === "number" ? "number" : "text"}
                  className="h-8 text-xs"
                  value={v[f.id] ?? ""}
                  onChange={(e) => setSlotInput(line.id, slot.id, { ...v, [f.id]: e.target.value })}
                  disabled={readOnly}
                />
              )}
            </div>
          ))}
        </div>
      );
    }
    if (slot.input_type === "list") {
      const arr = Array.isArray(value) ? value : [];
      return (
        <Textarea
          rows={3}
          className="text-sm resize-none"
          placeholder="One per line…"
          value={arr.join("\n")}
          onChange={(e) => setSlotInput(line.id, slot.id, e.target.value.split("\n"))}
          disabled={readOnly}
        />
      );
    }
    return null;
  };

  const renderRequiredOneOf = (line: ExpenseLineV2, slot: DocSlot) => {
    const doc = line.slotFiles[slot.id];
    const initialIdx = (() => {
      if (!doc?.selectedOptionId) return 0;
      const i = (slot.options ?? []).findIndex(o => o.id === doc.selectedOptionId);
      return i >= 0 ? i : 0;
    })();
    return (
      <OneOfBlock
        key={slot.id}
        line={line}
        slot={slot}
        doc={doc}
        initialIdx={initialIdx}
        readOnly={readOnly}
        attachToSlot={attachToSlot}
        FileUploadRow={FileUploadRow}
      />
    );
  };

  const renderConditionalSlot = (line: ExpenseLineV2, slot: DocSlot) => {
    const answered = slot.id in line.conditionResponses;
    const yes = line.conditionResponses[slot.id] === true;

    if (!answered) {
      return (
        <div key={slot.id} className="rounded-lg p-3 border border-border bg-muted/20">
          <div className="flex items-start gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground leading-tight">{slot.label_en}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{slot.label_th}</div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {slot.hint_en ?? "Does this apply to your claim?"}
              </p>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => setConditionResponse(line.id, slot.id, true)} disabled={readOnly}>
                  Yes
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                  onClick={() => setConditionResponse(line.id, slot.id, false)} disabled={readOnly}>
                  No
                </Button>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
              {slot.type === "conditional_required" ? "Conditional · required if Yes" : "Conditional · optional if Yes"}
            </Badge>
          </div>
        </div>
      );
    }

    if (!yes) {
      return (
        <div key={slot.id} className="rounded-lg px-3 py-2 border border-dashed border-border bg-muted/10 flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground flex-1 truncate">
            {slot.label_en} — not applicable
          </span>
          <button
            type="button"
            className="text-[10px] text-primary hover:underline"
            onClick={() => setConditionResponse(line.id, slot.id, true)}
            disabled={readOnly}
          >
            Change to Yes
          </button>
        </div>
      );
    }

    // Answered Yes → render as required (or optional if conditional_optional)
    const tone: "required" | "optional" = slot.type === "conditional_required" ? "required" : "optional";
    const badge = tone === "required" ? "Required" : "Optional";
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (!f) return;
      attachToSlot(line.id, slot.id, f);
      e.target.value = "";
    };
    return (
      <div key={slot.id} className="space-y-1.5">
        <SlotShell slot={slot} line={line} badgeText={badge} tone={tone}>
          {slot.input_type && slot.input_type !== "file"
            ? renderSlotInput(line, slot)
            : <FileUploadRow
                line={line}
                slot={slot}
                doc={line.slotFiles[slot.id]}
                onPick={onPick}
                requiredText={tone === "required" ? "Required — drop file or click upload" : "Optional — drop file or click upload"}
              />}
        </SlotShell>
        <button
          type="button"
          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline ml-1"
          onClick={() => setConditionResponse(line.id, slot.id, false)}
          disabled={readOnly}
        >
          Mark as not applicable
        </button>
      </div>
    );
  };

  const renderSlot = (line: ExpenseLineV2, slot: DocSlot) => {
    if (slot.type === "conditional_required" || slot.type === "conditional_optional") {
      return renderConditionalSlot(line, slot);
    }
    if (slot.type === "required_one_of") {
      return renderRequiredOneOf(line, slot);
    }
    const tone: "required" | "optional" = slot.type === "required" ? "required" : "optional";
    const badge = tone === "required" ? "Required" : "Optional";
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (!f) return;
      attachToSlot(line.id, slot.id, f);
      e.target.value = "";
    };
    return (
      <SlotShell key={slot.id} slot={slot} line={line} badgeText={badge} tone={tone}>
        {slot.input_type && slot.input_type !== "file"
          ? renderSlotInput(line, slot)
          : <FileUploadRow
              line={line}
              slot={slot}
              doc={line.slotFiles[slot.id]}
              onPick={onPick}
              requiredText={tone === "required" ? "Required — drop file or click upload" : "Optional — drop file or click upload"}
            />}
      </SlotShell>
    );
  };

  // ───────── Render: Editor pane for selected line ─────────
  const renderEditor = (line: ExpenseLineV2) => {
    const slots = getDocRequirementsForSubType(line.subExpenseTypeId);
    const requiredSlots = slots.filter(s =>
      s.type === "required" || s.type === "required_one_of" || s.type === "conditional_required"
    );
    const optionalSlots = slots.filter(s =>
      s.type === "optional" || s.type === "conditional_optional"
    );
    const idx = lines.findIndex(l => l.id === line.id);
    const selectedSubType = expenseTypes.find(e => e.id === line.subExpenseTypeId);
    const amt = parseFloat(line.amount) || 0;
    const isLargeLine = amt > LARGE_LINE_THRESHOLD;
    const isOverHardStop = selectedSubType && amt > selectedSubType.hardStopThreshold;

    if (!line.subExpenseTypeId || changingSubType) {
      return (
        <SubTypeTilePicker
          countryFilter={countryFilter}
          showCancel={!!line.subExpenseTypeId}
          onCancel={() => setChangingSubType(false)}
          onPick={(subTypeId) => {
            setLineSubType(line.id, subTypeId);
            setChangingSubType(false);
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
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
            onClick={() => setChangingSubType(true)} disabled={readOnly}>
            Change sub-type
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ZONE A — Required documents */}
          {requiredSlots.length > 0 && (
            <section>
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                A · Required Documents
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{requiredSlots.length} slot(s)</Badge>
              </h4>
              <p className="text-xs text-muted-foreground mb-2.5">
                Upload first — we'll fill the fields below from the receipt.
              </p>
              <div className="space-y-2.5">
                {requiredSlots.map(s => renderSlot(line, s))}
              </div>
            </section>
          )}

          {/* ZONE B — Receipt details (auto-filled from OCR) */}
          <section>
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
              B · Receipt details
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              We'll fill these from your receipt. Check and correct anything that looks off.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Vendor" ocr badgeIfDoc={Object.keys(line.slotFiles).length > 0}>
                <Input className="h-9 text-sm" value={line.vendor} onChange={(e) => updateLine(line.id, { vendor: e.target.value })} disabled={readOnly} />
              </Field>
              <Field label="Receipt Date" required ocr badgeIfDoc={Object.keys(line.slotFiles).length > 0}>
                <Input type="date" className="h-9 text-sm" value={line.receiptDate} onChange={(e) => updateLine(line.id, { receiptDate: e.target.value })} disabled={readOnly} />
              </Field>
              <Field label="Total Amount" required ocr badgeIfDoc={Object.keys(line.slotFiles).length > 0}>
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
              {isLargeLine && (
                <div className="sm:col-span-2">
                  <Field label="Large-line Justification" required>
                    <Textarea rows={2} className="text-sm resize-none border-status-alert/40" placeholder="Explain why this line exceeds 30,000 THB…" value={line.lineJustification} onChange={(e) => updateLine(line.id, { lineJustification: e.target.value })} disabled={readOnly} />
                  </Field>
                </div>
              )}
            </div>
          </section>

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

function OneOfBlock({
  line, slot, doc, initialIdx, readOnly, attachToSlot, FileUploadRow,
}: {
  line: ExpenseLineV2;
  slot: DocSlot;
  doc: AttachedDoc | undefined;
  initialIdx: number;
  readOnly: boolean;
  attachToSlot: (lineId: string, slotId: string, file: File, opts?: { selectedOptionId?: string }) => void;
  FileUploadRow: React.FC<{
    line: ExpenseLineV2; slot: DocSlot; doc: AttachedDoc | undefined;
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void; requiredText: string;
  }>;
}) {
  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const opts = slot.options ?? [];
  const activeOpt = opts[activeIdx];
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    attachToSlot(line.id, slot.id, f, { selectedOptionId: activeOpt?.id });
    e.target.value = "";
  };
  const filled = !!doc;

  return (
    <div className={cn(
      "rounded-lg p-3 border-l-[3px] border transition-colors",
      filled
        ? "border-status-approved/40 border-l-status-approved bg-status-approved/5"
        : "border-destructive/40 border-l-destructive bg-destructive/5",
    )}>
      <div className="flex items-start gap-2 mb-2">
        <FileText className={cn("h-3.5 w-3.5 mt-0.5", filled ? "text-status-approved" : "text-destructive")} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground leading-tight">{slot.label_en}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{slot.label_th}</div>
        </div>
        <Badge variant="rejected" className="text-[9px] px-1.5 py-0 shrink-0">Required (one of)</Badge>
      </div>

      <Tabs value={String(activeIdx)} className="mb-2">
        <TabsList className="h-7">
          {opts.map((o, i) => (
            <TabsTrigger
              key={o.id}
              value={String(i)}
              className="h-6 text-[11px] px-2"
              onClick={() => setActiveIdx(i)}
            >
              {o.label_en}
              {doc?.selectedOptionId === o.id && <CheckCircle className="h-3 w-3 ml-1 text-status-approved" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeOpt && (
        <div className="text-[10px] text-muted-foreground mb-2">
          Uploading as: <span className="font-medium text-foreground">{activeOpt.label_th}</span>
          {activeOpt.hint_en && <span className="ml-2 italic">· {activeOpt.hint_en}</span>}
        </div>
      )}

      <FileUploadRow
        line={line}
        slot={slot}
        doc={doc}
        onPick={onPick}
        requiredText="Required — drop file or click upload"
      />
    </div>
  );
}
