import { useState } from "react";
import {
  Upload, Camera, Receipt, Trash2, ChevronDown, ChevronUp, Scan,
  CheckCircle, FileCheck, Eye, Zap, AlertTriangle, Lightbulb, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { expenseTypes } from "@/lib/mock-data";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface ExpenseLine {
  id: string;
  uploaded: boolean;
  ocrProcessing: boolean;
  ocrDone: boolean;
  ocrConfidence: number;
  expenseType: string;
  subExpenseType: string;
  paymentMode: string;
  receiptDate: string;
  vendor: string;
  vatCode: string;
  whtCode: string;
  accountCode: string;
  amount: string;
  currency: string;
  notes: string;
  lineJustification: string;
}

export const createEmptyLine = (): ExpenseLine => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  uploaded: false,
  ocrProcessing: false,
  ocrDone: false,
  ocrConfidence: 0,
  expenseType: "",
  subExpenseType: "",
  paymentMode: "cash",
  receiptDate: "",
  vendor: "",
  vatCode: "",
  whtCode: "",
  accountCode: "",
  amount: "",
  currency: "THB",
  notes: "",
  lineJustification: "",
});

interface Props {
  line: ExpenseLine;
  index: number;
  canDelete: boolean;
  countryFilter: string;
  onChange: (patch: Partial<ExpenseLine>) => void;
  onDelete: () => void;
}

const LARGE_LINE_THRESHOLD = 30000;

export function ExpenseLineCard({ line, index, canDelete, countryFilter, onChange, onDelete }: Props) {
  const filteredExpenseTypes = countryFilter === "all"
    ? expenseTypes
    : expenseTypes.filter(e => e.countries.includes(countryFilter as any));
  const selectedExpenseType = expenseTypes.find(e => e.id === line.expenseType);
  const amountNum = parseFloat(line.amount) || 0;
  const isOverAlert = selectedExpenseType && amountNum > selectedExpenseType.alertThreshold;
  const isOverHardStop = selectedExpenseType && amountNum > selectedExpenseType.hardStopThreshold;
  const isLargeLine = amountNum > LARGE_LINE_THRESHOLD;

  const requiredFilled = !!line.expenseType && !!line.receiptDate && !!line.accountCode && amountNum > 0;
  const lineValid = requiredFilled && line.uploaded && line.ocrDone && !isOverHardStop &&
    (!isLargeLine || !!line.lineJustification.trim());

  // expanded state — auto collapse when valid (initial). User can override.
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [expandedOverride, setExpandedOverride] = useState(true);
  const expanded = manuallyToggled ? expandedOverride : !lineValid;

  const toggle = () => {
    setManuallyToggled(true);
    setExpandedOverride(!expanded);
  };

  const handleUpload = () => {
    onChange({ uploaded: true, ocrProcessing: true });
    setTimeout(() => {
      onChange({
        ocrProcessing: false,
        ocrDone: true,
        ocrConfidence: 94,
        vendor: line.vendor || "OfficeMate",
        amount: line.amount || "1250",
        receiptDate: line.receiptDate || new Date().toISOString().slice(0, 10),
      });
      toast({ title: `Line ${index + 1}: OCR complete`, description: "Extracted at 94% confidence." });
    }, 1500);
  };

  const handleExpenseTypeChange = (v: string) => {
    onChange({
      expenseType: v,
      vatCode: "V07",
      whtCode: "WHT00",
      accountCode: "5101-001",
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-3">
        <span className="text-xs font-semibold text-foreground shrink-0">Line {index + 1}</span>

        {!expanded && (
          <div className="flex items-center gap-2 flex-1 min-w-0 text-xs text-muted-foreground">
            {selectedExpenseType && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {selectedExpenseType.category}
              </Badge>
            )}
            {lineValid && (
              <span className="flex items-center gap-1 text-status-approved shrink-0">
                <CheckCircle className="h-3 w-3" /> Valid
              </span>
            )}
            <span className="truncate">
              {line.vendor && `${line.vendor} · `}
              {line.receiptDate}
            </span>
            <span className="ml-auto font-semibold tabular-nums text-foreground shrink-0">
              {amountNum > 0 ? `${amountNum.toLocaleString()} ${line.currency}` : "—"}
            </span>
          </div>
        )}

        {expanded && isLargeLine && (
          <Badge variant="alert" className="text-[10px] gap-1">
            <AlertTriangle className="h-3 w-3" /> Large line — requires extra justification
          </Badge>
        )}

        <div className={`flex items-center gap-1 ${expanded ? "ml-auto" : ""}`}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggle}
            aria-label={expanded ? "Collapse line" : "Expand line"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
                disabled={!canDelete}
                aria-label="Delete line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Line {index + 1}?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Receipt upload */}
          <div className="border border-dashed border-border rounded-lg overflow-hidden">
            {!line.uploaded ? (
              <div
                className="p-5 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={handleUpload}
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Tap to capture or upload receipt</p>
                <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, or PDF · Max 10 MB</p>
                <p className="text-[11px] text-primary/80 mt-2 flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3" /> OCR will extract vendor, amount, and date
                </p>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Camera className="h-3.5 w-3.5" /> Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Upload className="h-3.5 w-3.5" /> Upload File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-status-approved/10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-4 w-4 text-status-approved" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">receipt_line{index + 1}.jpg</p>
                    <p className="text-[10px] text-muted-foreground">2.4 MB · just now</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0 h-7">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0 h-7"
                    onClick={() => onChange({ uploaded: false, ocrDone: false, ocrProcessing: false })}
                  >
                    Replace
                  </Button>
                </div>
                {line.ocrProcessing && (
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Extracting receipt data…</span>
                    </div>
                    <Progress value={65} className="h-1.5" />
                  </div>
                )}
                {line.ocrDone && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-approved/5 border border-status-approved/15">
                    <Scan className="h-3.5 w-3.5 text-status-approved" />
                    <span className="text-[11px] text-status-approved font-medium">
                      OCR complete · {line.ocrConfidence}% confidence
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            {/* Expense Type */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Expense Type <span className="text-destructive">*</span>
              </Label>
              <Select value={line.expenseType} onValueChange={handleExpenseTypeChange}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {filteredExpenseTypes.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.category} – {e.subcategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Expense Type */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sub Expense Type</Label>
              <Select value={line.subExpenseType} onValueChange={(v) => onChange({ subExpenseType: v })} disabled={!line.expenseType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={line.expenseType ? "Select sub type" : "Select expense type first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="client">Client-related</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment Mode</Label>
              <Select value={line.paymentMode} onValueChange={(v) => onChange({ paymentMode: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash from petty cash</SelectItem>
                  <SelectItem value="transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipt Date */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                Receipt Date <span className="text-destructive">*</span>
                {line.ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
              </Label>
              <Input
                type="date"
                value={line.receiptDate}
                onChange={(e) => onChange({ receiptDate: e.target.value })}
                className={`h-9 text-sm ${line.ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
              />
            </div>

            {/* Vendor */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                Vendor
                {line.ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
              </Label>
              <Input
                placeholder="Vendor name"
                value={line.vendor}
                onChange={(e) => onChange({ vendor: e.target.value })}
                className={`h-9 text-sm ${line.ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
              />
            </div>
            <div className="hidden sm:block" />

            {/* VAT Code */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">VAT Code</Label>
              <Select value={line.vatCode} onValueChange={(v) => onChange({ vatCode: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select VAT code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="V07">V07 – VAT 7% (standard)</SelectItem>
                  <SelectItem value="V00">V00 – VAT 0% (zero-rated / export)</SelectItem>
                  <SelectItem value="VEX">VEX – VAT Exempt</SelectItem>
                  <SelectItem value="VNA">VNA – Non-VAT / Out of scope</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* WHT Code */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">WHT Code</Label>
              <Select value={line.whtCode} onValueChange={(v) => onChange({ whtCode: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select WHT code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHT00">WHT00 – No withholding</SelectItem>
                  <SelectItem value="WHT01">WHT01 – 1% Transportation (PND 53)</SelectItem>
                  <SelectItem value="WHT02">WHT02 – 2% Advertising (PND 53)</SelectItem>
                  <SelectItem value="WHT03">WHT03 – 3% Services (PND 53)</SelectItem>
                  <SelectItem value="WHT05">WHT05 – 5% Rental (PND 53)</SelectItem>
                  <SelectItem value="WHT15">WHT15 – 15% Foreign payment (PND 54)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Code */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Account Code <span className="text-destructive">*</span>
              </Label>
              <Select value={line.accountCode} onValueChange={(v) => onChange({ accountCode: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Search GL account..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5101-001">5101-001 – Office Supplies Expense</SelectItem>
                  <SelectItem value="5102-001">5102-001 – Travel Expense</SelectItem>
                  <SelectItem value="5103-001">5103-001 – Meals & Entertainment</SelectItem>
                  <SelectItem value="5104-001">5104-001 – Utilities Expense</SelectItem>
                  <SelectItem value="5105-001">5105-001 – Professional Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:block" />

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                Amount <span className="text-destructive">*</span>
                {line.ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={line.amount}
                onChange={(e) => onChange({ amount: e.target.value })}
                className={`h-9 text-sm tabular-nums font-medium ${line.ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
              />
              {selectedExpenseType && (
                <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  Policy limit: {selectedExpenseType.maxAmount.toLocaleString()} · Alert above {selectedExpenseType.alertThreshold.toLocaleString()}
                </p>
              )}
              {isOverHardStop && (
                <p className="text-[10px] text-status-hold font-semibold">Exceeds hard-stop limit</p>
              )}
              {isOverAlert && !isOverHardStop && (
                <p className="text-[10px] text-status-validating">Above alert threshold</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Currency</Label>
              <Select value={line.currency} onValueChange={(v) => onChange({ currency: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB – Thai Baht</SelectItem>
                  <SelectItem value="USD">USD – US Dollar</SelectItem>
                  <SelectItem value="KHR">KHR – Cambodian Riel</SelectItem>
                  <SelectItem value="VND">VND – Vietnamese Dong</SelectItem>
                  <SelectItem value="MMK">MMK – Myanmar Kyat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLargeLine && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-status-alert uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Line Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                required
                placeholder="Explain why this single line exceeds 30,000 THB…"
                rows={2}
                value={line.lineJustification}
                onChange={(e) => onChange({ lineJustification: e.target.value })}
                className="text-sm resize-none border-status-alert/30"
              />
              <p className="text-[10px] text-muted-foreground">Required for lines above 30,000 THB.</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</Label>
            <Textarea
              placeholder="Brief description of this expense…"
              rows={2}
              value={line.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              className="text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
