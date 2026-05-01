import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Camera, ArrowLeft, Receipt, CheckCircle, AlertTriangle,
  XCircle, Lightbulb, FileCheck, Scan, ShieldCheck, Link2, Zap,
  CircleDot, Eye, ChevronDown, Pencil, Check as CheckIcon, UserCog, Copy,
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
  const [vatCode, setVatCode] = useState("");
  const [whtCode, setWhtCode] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedAdvance, setLinkedAdvance] = useState("");
  const [vendor, setVendor] = useState("");
  const [receiptDate, setReceiptDate] = useState("2026-03-06");
  const [requesterEdit, setRequesterEdit] = useState(false);
  const [onBehalf, setOnBehalf] = useState(false);
  const [onBehalfEmployee, setOnBehalfEmployee] = useState("");
  const [delegationReason, setDelegationReason] = useState("");
  const [approver, setApprover] = useState("APR-001");
  const [selectedStoreId, setSelectedStoreId] = useState("s3"); // default: Makro Rama 4
  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const storeBranchCode = selectedStore ? String(parseInt(selectedStore.id.replace(/\D/g, ""), 10) || 0).padStart(5, "0") : "00000";
  const tzMap: Record<string, string> = { TH: "Asia/Bangkok", KH: "Asia/Phnom_Penh", VN: "Asia/Ho_Chi_Minh", MM: "Asia/Yangon" };
  const [creationDate] = useState(() => new Date());
  // Mock: next sequence per store+month — in production query backend
  const mockSeq = 1;
  const yyyy = creationDate.getFullYear();
  const mm = String(creationDate.getMonth() + 1).padStart(2, "0");
  const claimNumber = selectedStore
    ? `PC-${selectedStore.country}-${storeBranchCode}-${yyyy}-${mm}-${String(mockSeq).padStart(5, "0")}`
    : "";
  const tz = selectedStore ? tzMap[selectedStore.country] ?? "Asia/Bangkok" : "Asia/Bangkok";
  const creationDateDisplay = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(creationDate).replace(",", "");
  const copyClaimNumber = () => {
    if (!claimNumber) return;
    navigator.clipboard.writeText(claimNumber);
    toast({ title: "Claim number copied." });
  };
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

  const APPROVERS = [
    { id: "APR-001", name: "Somsak Vongchai", position: "Direct Manager", maxAmount: 5000 },
    { id: "APR-002", name: "Pranee Wongsiri", position: "Store Manager", maxAmount: 50000 },
    { id: "APR-003", name: "Nattaya Kittisak", position: "Regional Manager", maxAmount: 200000 },
    { id: "APR-004", name: "Chaiwat Boonmee", position: "Finance Director", maxAmount: Infinity },
  ];

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

  // Approver tier suggestion based on amount
  const suggestedApprover = APPROVERS.find(a => amountNum <= a.maxAmount) ?? APPROVERS[APPROVERS.length - 1];
  const selectedApprover = APPROVERS.find(a => a.id === approver);
  const approverInsufficient = !!selectedApprover && amountNum > selectedApprover.maxAmount;

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
    { label: "Approver assigned", pass: !!approver && !approverInsufficient, pending: !approver },
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
    if (!approver) {
      toast({ title: "Approver required", description: "Please select an approver.", variant: "destructive" });
      return;
    }
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
                    <Input className="h-9 text-sm" defaultValue={requester.employeeId} readOnly={!requesterEdit} tabIndex={1} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.fullName} readOnly={!requesterEdit} tabIndex={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Store</Label>
                    <Select disabled={!requesterEdit} value={selectedStoreId} onValueChange={setSelectedStoreId}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={3}><SelectValue placeholder="Select store" /></SelectTrigger>
                      <SelectContent>
                        {filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Position / Role</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.position} readOnly={!requesterEdit} tabIndex={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                    <Input className="h-9 text-sm" type="email" defaultValue={requester.email} readOnly={!requesterEdit} tabIndex={5} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <Input className="h-9 text-sm" defaultValue={requester.phone} readOnly={!requesterEdit} tabIndex={6} />
                  </div>

                  {/* Approver — left column, right column intentionally empty */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Approver <span className="text-destructive">*</span>
                    </Label>
                    <Select value={approver} onValueChange={setApprover} required>
                      <SelectTrigger className="h-9 text-sm" tabIndex={7}>
                        <SelectValue placeholder="Select approver">
                          {selectedApprover && `${selectedApprover.name} · ${selectedApprover.position}`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {APPROVERS.map(a => {
                          const initials = a.name.split(" ").map(n => n[0]).slice(0, 2).join("");
                          return (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                                  {initials}
                                </span>
                                <span>{a.name} · {a.position}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {approverInsufficient ? (
                      <div className="flex items-start gap-1.5 px-0.5">
                        <AlertTriangle className="h-3 w-3 text-status-validating mt-0.5 shrink-0" />
                        <span className="text-[10px] text-status-validating leading-tight">
                          Selected approver cannot approve this amount. Suggested: {suggestedApprover.name}.{" "}
                          <button
                            type="button"
                            onClick={() => setApprover(suggestedApprover.id)}
                            className="underline font-semibold hover:text-status-validating/80"
                          >
                            Use suggested
                          </button>
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Auto-suggested based on your reporting line and claim amount. Override if needed.
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:block" />
                </div>

                {/* Submit on behalf */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={onBehalf}
                      onCheckedChange={(v) => setOnBehalf(v === true)}
                      tabIndex={8}
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
                <h3 className="text-sm font-semibold text-foreground">Claim Information</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Fields auto-filled from OCR are highlighted</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Purpose (mandatory) — full width, top */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    required
                    placeholder="Enter purpose of this claim…"
                    rows={3}
                    maxLength={1750}
                    className="text-sm resize-none"
                    tabIndex={1}
                  />
                  <p className="text-[11px] text-muted-foreground">Required · up to 250 words</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Link to Advance */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" /> Link to Advance
                    </Label>
                    <Select value={linkedAdvance} onValueChange={setLinkedAdvance}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={2}><SelectValue placeholder="None" /></SelectTrigger>
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
                      tabIndex={3}
                    />
                  </div>

                  {/* Expense Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expense Type</Label>
                    <Select value={selectedExpense} onValueChange={(v) => {
                      setSelectedExpense(v);
                      // Auto-suggest VAT/WHT/Account codes based on expense type (user can override)
                      setVatCode("V07");
                      setWhtCode("WHT00");
                      setAccountCode("5101-001");
                    }}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={4}><SelectValue placeholder="Select type" /></SelectTrigger>
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

                  {/* Sub Expense Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sub Expense Type</Label>
                    <Select disabled={!selectedExpense}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={5}>
                        <SelectValue placeholder={selectedExpense ? "Select sub type" : "Select expense type first"} />
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
                    <Select defaultValue="cash">
                      <SelectTrigger className="h-9 text-sm" tabIndex={6}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash from petty cash</SelectItem>
                        <SelectItem value="transfer">Bank transfer</SelectItem>
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
                      tabIndex={7}
                    />
                  </div>

                  {/* VAT Code */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">VAT Code</Label>
                    <Select value={vatCode} onValueChange={setVatCode}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={8}>
                        <SelectValue placeholder="Select VAT code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V07">V07 – VAT 7% (standard)</SelectItem>
                        <SelectItem value="V00">V00 – VAT 0% (zero-rated / export)</SelectItem>
                        <SelectItem value="VEX">VEX – VAT Exempt</SelectItem>
                        <SelectItem value="VNA">VNA – Non-VAT / Out of scope</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-tight px-0.5">Auto-suggested from Expense Type. Override if needed.</p>
                  </div>

                  {/* WHT Code */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">WHT Code</Label>
                    <Select value={whtCode} onValueChange={setWhtCode}>
                      <SelectTrigger className="h-9 text-sm" tabIndex={9}>
                        <SelectValue placeholder="Select WHT code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHT00">WHT00 – No withholding</SelectItem>
                        <SelectItem value="WHT01">WHT01 – 1% Transportation (PND 53)</SelectItem>
                        <SelectItem value="WHT02">WHT02 – 2% Advertising (PND 53)</SelectItem>
                        <SelectItem value="WHT03">WHT03 – 3% Services / Professional fees (PND 53)</SelectItem>
                        <SelectItem value="WHT05">WHT05 – 5% Rental (PND 53)</SelectItem>
                        <SelectItem value="WHT15">WHT15 – 15% Foreign payment (PND 54)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-tight px-0.5">Used to generate PND withholding form.</p>
                  </div>

                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Account Code <span className="text-destructive">*</span>
                    </Label>
                    <Select value={accountCode} onValueChange={setAccountCode} required>
                      <SelectTrigger className="h-9 text-sm" tabIndex={10}>
                        <SelectValue placeholder="Search GL account..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5101-001">5101-001 – Office Supplies Expense</SelectItem>
                        <SelectItem value="5102-001">5102-001 – Travel Expense</SelectItem>
                        <SelectItem value="5103-001">5103-001 – Meals & Entertainment</SelectItem>
                        <SelectItem value="5104-001">5104-001 – Utilities Expense</SelectItem>
                        <SelectItem value="5105-001">5105-001 – Professional Fees</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-tight px-0.5">Required for GL posting. Auto-suggested from Expense Type.</p>
                  </div>

                  {/* Spacer to keep Amount/Currency on its own row */}
                  <div className="hidden md:block" aria-hidden="true" />

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
                      tabIndex={11}
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Currency</Label>
                    <Select defaultValue="THB">
                      <SelectTrigger className="h-9 text-sm" tabIndex={12}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">THB – Thai Baht</SelectItem>
                        <SelectItem value="USD">USD – US Dollar</SelectItem>
                        <SelectItem value="MMK">MMK – Myanmar Kyat</SelectItem>
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

                {/* Notes — full width, last */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</Label>
                  <Textarea placeholder="Brief description of expense…" rows={2} className="text-sm resize-none" tabIndex={13} />
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
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-10 px-4 w-full sm:w-auto" tabIndex={14}>
                  Save Draft
                </Button>
                <Button type="submit" className="h-10 px-6 font-semibold gap-2 w-full sm:w-auto" tabIndex={15}>
                  <CheckCircle className="h-4 w-4" /> Submit Claim
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
