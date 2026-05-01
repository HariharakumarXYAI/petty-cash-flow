import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Camera, ArrowLeft, Receipt, CheckCircle, AlertTriangle,
  XCircle, Lightbulb, FileCheck, Scan, ShieldCheck, Link2, Zap,
  CircleDot, Eye, ChevronDown, Pencil, Check as CheckIcon, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { stores, expenseTypes, advances } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function NewClaim() {
  const navigate = useNavigate();
  const { country } = useGlobalFilter();
  const [uploaded, setUploaded] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedAdvance, setLinkedAdvance] = useState("");
  const [vendor, setVendor] = useState("");
  const [receiptDate, setReceiptDate] = useState("2026-03-06");
  const [requesterEdit, setRequesterEdit] = useState(false);
  const [onBehalf, setOnBehalf] = useState(false);
  const [onBehalfEmployee, setOnBehalfEmployee] = useState("");
  const [delegationReason, setDelegationReason] = useState("");
  const requester = {
    employeeId: "EMP-10247",
    fullName: "Somchai Prathumwan",
    department: "store-ops",
    position: "Store Manager",
    storeCode: "BKK-001",
    costCenter: "CC-5520",
    email: "somchai.p@cpaxtra.com",
    phone: "081-234-5678",
  };

  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const filteredExpenseTypes = country === "all" ? expenseTypes : expenseTypes.filter(e => e.countries.includes(country as any));
  const openAdvances = advances.filter(a => a.status === "Open" || a.status === "Partially Settled");

  const selectedExpenseType = expenseTypes.find(e => e.id === selectedExpense);
  const selectedAdv = advances.find(a => a.id === linkedAdvance);
  const amountNum = parseFloat(amount) || 0;
  const isOverAlert = selectedExpenseType && amountNum > selectedExpenseType.alertThreshold;
  const isOverHardStop = selectedExpenseType && amountNum > selectedExpenseType.hardStopThreshold;

  const advanceDeduction = selectedAdv ? Math.min(amountNum, selectedAdv.amount - selectedAdv.settledAmount - selectedAdv.returnedCash) : 0;
  const payableAmount = Math.max(0, amountNum - advanceDeduction);

  const expectedOutcome = isOverHardStop ? "On Hold" : isOverAlert ? "Auto Approved with Alert" : "Auto Approved";

  const ocrData = {
    vendor: "OfficeMate",
    date: "2026-03-06",
    amount: "1,250.00",
    currency: "THB",
    taxId: "0105536024882",
    confidence: 94,
  };

  const validationRules = [
    { label: "Receipt document attached", pass: uploaded && ocrDone, pending: !uploaded },
    { label: "OCR confidence ≥ 75%", pass: ocrDone, pending: !ocrDone },
    { label: "Amount within policy limit", pass: !isOverHardStop && amountNum > 0, pending: amountNum === 0 },
    { label: "No duplicate receipt detected", pass: ocrDone, pending: !ocrDone },
    { label: "Expense type allowed for country", pass: !!selectedExpenseType, pending: !selectedExpenseType },
    { label: "Submission within 7-day window", pass: true, pending: false },
    { label: "Vendor not on blocked list", pass: ocrDone, pending: !ocrDone },
  ];

  const passedCount = validationRules.filter(r => r.pass).length;

  const handleUpload = () => {
    setUploaded(true);
    setOcrProcessing(true);
    setTimeout(() => {
      setOcrProcessing(false);
      setOcrDone(true);
      setVendor(ocrData.vendor);
      setAmount("1250");
      toast({ title: "OCR Complete", description: "Receipt data extracted with 94% confidence." });
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Claim Submitted", description: "Your claim has been submitted for validation." });
    navigate("/claims");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">New Claim</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Verify details → capture receipt → submit · Under 60 seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">



          <div className="space-y-4">

            {/* ═══════════════════════════════════════════ */}
            {/* REQUESTER DETAILS                           */}
            {/* ═══════════════════════════════════════════ */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">Requester Details</h3>
                    {onBehalf && (
                      <Badge variant="submitted" className="text-[10px]">Delegated submission</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Auto-filled from your profile. Click Edit if submitting on behalf of someone else.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs shrink-0"
                  onClick={() => setRequesterEdit(v => !v)}
                >
                  {requesterEdit ? <><CheckIcon className="h-3.5 w-3.5" /> Done</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {requesterEdit && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-status-alert/20 bg-status-alert/5">
                    <AlertTriangle className="h-3.5 w-3.5 text-status-alert mt-0.5 shrink-0" />
                    <p className="text-[11px] text-foreground leading-tight">
                      You are editing requester details. Changes only apply to this claim and will not update your profile.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Employee ID</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.employeeId} readOnly={!requesterEdit} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.fullName} readOnly={!requesterEdit} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Store</Label>
                    <Select disabled={!requesterEdit}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select store" /></SelectTrigger>
                      <SelectContent>
                        {filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Position / Role</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.position} readOnly={!requesterEdit} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                    <Input className="h-9 text-sm" type="email" defaultValue={requester.email} readOnly={!requesterEdit} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.phone} readOnly={!requesterEdit} />
                  </div>
                </div>

                {/* Submit on behalf */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={onBehalf}
                      onCheckedChange={(v) => setOnBehalf(v === true)}
                    />
                    <span className="text-xs text-foreground">Submitting on behalf of another person</span>
                  </label>
                </div>

                {onBehalf && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">On Behalf Of (Employee ID)</Label>
                      <Select value={onBehalfEmployee} onValueChange={setOnBehalfEmployee}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Search employee…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMP-10311">EMP-10311 — Niran Suksai</SelectItem>
                          <SelectItem value="EMP-10422">EMP-10422 — Pim Chaiyo</SelectItem>
                          <SelectItem value="EMP-10588">EMP-10588 — Anan Wong</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Relationship / Reason</Label>
                      <Select value={delegationReason} onValueChange={setDelegationReason}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subordinate">Subordinate — staff cannot access system</SelectItem>
                          <SelectItem value="manager-delegation">Manager delegation</SelectItem>
                          <SelectItem value="cross-department">Cross-department support</SelectItem>
                          <SelectItem value="other">Other (specify in notes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* CLAIM DETAILS + STICKY SUMMARY (full width)*/}
            {/* ═══════════════════════════════════════════ */}

            {/* Claim Form */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Claim Details</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Fields auto-filled from OCR are highlighted</p>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Expense Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expense Type</Label>
                    <Select value={selectedExpense} onValueChange={setSelectedExpense}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {filteredExpenseTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.category} – {e.subcategory}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedExpenseType && (
                      <div className="flex items-start gap-1.5 mt-1 px-0.5">
                        <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          Policy limit: {selectedExpenseType.maxAmount.toLocaleString()} · Alert above {selectedExpenseType.alertThreshold.toLocaleString()} · {selectedExpenseType.documentRequired ? "Receipt required" : "No receipt needed"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amount — OCR highlight */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      Amount
                      {ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
                    </Label>
                    <Input
                      className={`h-9 text-sm tabular-nums font-medium ${ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Currency</Label>
                    <Select defaultValue="THB">
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">THB – Thai Baht</SelectItem>
                        <SelectItem value="USD">USD – US Dollar</SelectItem>
                        <SelectItem value="MMK">MMK – Myanmar Kyat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Receipt Date */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      Receipt Date
                      {ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
                    </Label>
                    <Input
                      className={`h-9 text-sm ${ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                      type="date"
                      value={receiptDate}
                      onChange={e => setReceiptDate(e.target.value)}
                    />
                  </div>

                  {/* Vendor */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      Vendor
                      {ocrDone && <span className="text-[9px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full normal-case tracking-normal">OCR filled</span>}
                    </Label>
                    <Input
                      className={`h-9 text-sm ${ocrDone ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                      placeholder="Vendor name"
                      value={vendor}
                      onChange={e => setVendor(e.target.value)}
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment Mode</Label>
                    <Select defaultValue="cash">
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash from petty cash</SelectItem>
                        <SelectItem value="transfer">Bank transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Link to Advance */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" /> Link to Advance
                    </Label>
                    <Select value={linkedAdvance} onValueChange={setLinkedAdvance}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked advance</SelectItem>
                        {openAdvances.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.advanceNumber} · {(a.amount - a.settledAmount - a.returnedCash).toLocaleString()} {a.currency} remaining
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advance Adjustment Callout */}
                {selectedAdv && linkedAdvance && linkedAdvance !== "none" && amountNum > 0 && (
                  <div className="mt-1 border border-primary/20 bg-primary/[0.03] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Advance Adjustment</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Advance Balance</p>
                        <p className="font-semibold tabular-nums">{(selectedAdv.amount - selectedAdv.settledAmount - selectedAdv.returnedCash).toLocaleString()} {selectedAdv.currency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deduction</p>
                        <p className="font-semibold tabular-nums text-status-hold">−{advanceDeduction.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Payable</p>
                        <p className="font-bold tabular-nums text-primary">{payableAmount.toLocaleString()} {selectedAdv.currency}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</Label>
                  <Textarea placeholder="Brief description of expense…" rows={2} className="text-sm resize-none" />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* RECEIPT CAPTURE + OCR (full width)         */}
            {/* ═══════════════════════════════════════════ */}

            {/* Receipt Capture Card */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Scan className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Receipt Capture</h3>
                {ocrDone && (
                  <Badge variant="approved" className="ml-auto text-[10px]">Scanned</Badge>
                )}
              </div>

              {!uploaded ? (
                <div
                  className="p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors group"
                  onClick={handleUpload}
                >
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                    <Receipt className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Tap to capture or upload receipt</p>
                  <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, or PDF · Max 10 MB</p>
                  <p className="text-[11px] text-primary/80 mt-3 flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" /> OCR will extract vendor, amount, and date automatically
                  </p>
                  <div className="flex gap-2 mt-5 justify-center">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Upload className="h-3.5 w-3.5" /> Upload File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {/* Uploaded file */}
                  <div className="bg-muted/40 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-status-approved/10 flex items-center justify-center shrink-0">
                      <FileCheck className="h-5 w-5 text-status-approved" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">receipt_20260306.jpg</p>
                      <p className="text-[11px] text-muted-foreground">2.4 MB · Uploaded just now</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground shrink-0">
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </div>

                  {/* OCR Processing / Result */}
                  {ocrProcessing ? (
                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-foreground">Extracting receipt data…</span>
                      </div>
                      <Progress value={65} className="h-1.5" />
                      <p className="text-[11px] text-muted-foreground">Running OCR and duplicate check</p>
                    </div>
                  ) : ocrDone ? (
                    <div className="border border-primary/20 bg-primary/[0.02] rounded-lg overflow-hidden">
                      <div className="px-3.5 py-2.5 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scan className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-foreground">OCR Extracted Data</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-status-approved" />
                          <span className="text-[11px] font-semibold text-status-approved">{ocrData.confidence}% confidence</span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-2.5">
                        {[
                          { label: "Vendor", value: ocrData.vendor, icon: "🏪" },
                          { label: "Amount", value: `฿${ocrData.amount}`, icon: "💰" },
                          { label: "Date", value: ocrData.date, icon: "📅" },
                          { label: "Tax ID", value: ocrData.taxId, icon: "🔖" },
                        ].map((field) => (
                          <div key={field.label} className="flex items-center justify-between py-1">
                            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{field.label}</span>
                            <span className="text-sm font-semibold text-foreground font-mono bg-primary/5 px-2 py-0.5 rounded">
                              {field.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-3.5 py-2 border-t border-primary/10 bg-primary/[0.03]">
                        <p className="text-[10px] text-muted-foreground">
                          OCR values auto-fill the form above. Review and adjust if needed.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Duplicate Check */}
                  {ocrDone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-approved/5 border border-status-approved/15">
                      <ShieldCheck className="h-4 w-4 text-status-approved shrink-0" />
                      <span className="text-xs text-status-approved font-medium">No duplicate receipt detected</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OCR vs User Input Comparison (desktop) */}
            {ocrDone && (
              <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">OCR vs Your Input</h3>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { field: "Vendor", ocr: ocrData.vendor, user: vendor || "—" },
                    { field: "Amount", ocr: `฿${ocrData.amount}`, user: amountNum > 0 ? `฿${amountNum.toLocaleString()}` : "—" },
                    { field: "Date", ocr: ocrData.date, user: receiptDate || "—" },
                  ].map((row) => {
                    const match = row.ocr === row.user || (row.field === "Amount" && row.ocr === `฿${amountNum.toLocaleString()}.00`);
                    return (
                      <div key={row.field} className="grid grid-cols-3 px-3.5 py-2.5 text-xs items-center">
                        <span className="text-muted-foreground font-medium uppercase tracking-wide">{row.field}</span>
                        <span className="font-mono text-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded text-center">{row.ocr}</span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-center font-semibold ${match ? "bg-status-approved/8 text-status-approved" : "bg-status-validating/8 text-status-validating"}`}>
                          {row.user}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3.5 py-2 bg-muted/20 border-t border-border">
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CircleDot className="h-2.5 w-2.5 text-foreground/40" /> OCR extracted</span>
                    <span className="flex items-center gap-1"><CircleDot className="h-2.5 w-2.5 text-primary" /> Your input</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* STICKY SUMMARY — Validation + Outcome      */}
            {/* ═══════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Validation & Outcome</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {passedCount}/{validationRules.length} passed
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Validation Checklist */}
                  <div className="space-y-1.5">
                    {validationRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1">
                        {rule.pass ? (
                          <CheckCircle className="h-4 w-4 text-status-approved shrink-0" />
                        ) : rule.pending ? (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-status-hold shrink-0" />
                        )}
                        <span className={`text-xs ${rule.pass ? "text-foreground" : rule.pending ? "text-muted-foreground" : "text-status-hold font-semibold"}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Payable + Outcome */}
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expected Outcome</p>
                      <div className="flex items-center gap-2">
                        {expectedOutcome === "Auto Approved" && (
                          <>
                            <div className="h-6 w-6 rounded-full bg-status-approved/10 flex items-center justify-center">
                              <CheckCircle className="h-3.5 w-3.5 text-status-approved" />
                            </div>
                            <span className="text-sm font-bold text-status-approved">Auto Approved</span>
                          </>
                        )}
                        {expectedOutcome === "Auto Approved with Alert" && (
                          <>
                            <div className="h-6 w-6 rounded-full bg-status-validating/10 flex items-center justify-center">
                              <AlertTriangle className="h-3.5 w-3.5 text-status-validating" />
                            </div>
                            <span className="text-sm font-bold text-status-validating">Approved with Alert</span>
                          </>
                        )}
                        {expectedOutcome === "On Hold" && (
                          <>
                            <div className="h-6 w-6 rounded-full bg-status-hold/10 flex items-center justify-center">
                              <XCircle className="h-3.5 w-3.5 text-status-hold" />
                            </div>
                            <span className="text-sm font-bold text-status-hold">On Hold</span>
                          </>
                        )}
                      </div>
                      {isOverHardStop && selectedExpenseType && (
                        <p className="text-[11px] text-status-hold">
                          Exceeds hard-stop limit of {selectedExpenseType.hardStopThreshold.toLocaleString()}
                        </p>
                      )}
                      {isOverAlert && !isOverHardStop && selectedExpenseType && (
                        <p className="text-[11px] text-status-validating">
                          Above alert threshold of {selectedExpenseType.alertThreshold.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payable</p>
                      <p className="text-2xl font-bold tabular-nums text-foreground leading-tight">
                        {amountNum > 0 ? payableAmount.toLocaleString() : "—"}
                      </p>
                      {advanceDeduction > 0 && (
                        <p className="text-[10px] text-muted-foreground">after advance deduction</p>
                      )}
                    </div>
                  </div>

                  {/* Trust Message */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-primary font-medium leading-tight">
                      This claim will auto-approve if all validations pass. No manual review needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button type="submit" className="flex-1 sm:flex-none h-10 px-6 font-semibold gap-2">
                  <CheckCircle className="h-4 w-4" /> Submit Claim
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-10 px-4">
                  Save Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
