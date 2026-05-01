import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Link2,
  Pencil, Check as CheckIcon, Copy, Plus, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { stores, advances, expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExpenseLineCard, createEmptyLine, ExpenseLine } from "@/components/claim/ExpenseLineCard";

// FX → THB (mock)
const FX_TO_THB: Record<string, number> = {
  THB: 1, USD: 36.2, KHR: 0.0089, VND: 0.0014, MMK: 0.017,
};

const APPROVERS = [
  { id: "APR-001", name: "Somsak Vongchai", position: "Direct Manager", maxAmount: 5000 },
  { id: "APR-002", name: "Pranee Wongsiri", position: "Department Head", maxAmount: 50000 },
  { id: "APR-003", name: "Nattaya Kittisak", position: "Regional Manager", maxAmount: 200000 },
  { id: "APR-004", name: "Chaiwat Boonmee", position: "Finance Director", maxAmount: Infinity },
];

// VAT/WHT rates derived from codes (mock)
const VAT_RATE: Record<string, number> = { V07: 0.07, V00: 0, VEX: 0, VNA: 0 };
const WHT_RATE: Record<string, number> = { WHT00: 0, WHT01: 0.01, WHT02: 0.02, WHT03: 0.03, WHT05: 0.05, WHT15: 0.15 };

const AUTO_APPROVE_THRESHOLD = 5000; // THB

export default function NewClaim() {
  const navigate = useNavigate();
  const { country } = useGlobalFilter();

  // Header state
  const [purpose, setPurpose] = useState("");
  const [linkedAdvance, setLinkedAdvance] = useState("");
  
  const [requesterEdit, setRequesterEdit] = useState(false);
  const [onBehalf, setOnBehalf] = useState(false);
  const [onBehalfEmployee, setOnBehalfEmployee] = useState("");
  const [delegationReason, setDelegationReason] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("s3");

  // Expense lines
  const [lines, setLines] = useState<ExpenseLine[]>(() => [createEmptyLine()]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const storeBranchCode = selectedStore ? String(parseInt(selectedStore.id.replace(/\D/g, ""), 10) || 0).padStart(5, "0") : "00000";
  const tzMap: Record<string, string> = { TH: "Asia/Bangkok", KH: "Asia/Phnom_Penh", VN: "Asia/Ho_Chi_Minh", MM: "Asia/Yangon" };
  const [creationDate] = useState(() => new Date());
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
    position: "Store Manager",
    email: "somchai.p@cpaxtra.com",
    phone: "081-234-5678",
  };

  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const openAdvances = advances.filter(a => a.status === "Open" || a.status === "Partially Settled");

  // ────────── Totals ──────────
  const totals = useMemo(() => {
    let subtotal = 0, vat = 0, wht = 0;
    const byCurrency: Record<string, { subtotal: number; vat: number; wht: number; lines: number }> = {};
    let multiCurrency = false;
    let firstCurrency: string | null = null;

    for (const l of lines) {
      const amt = parseFloat(l.amount) || 0;
      const fx = FX_TO_THB[l.currency] ?? 1;
      const amtTHB = amt * fx;
      const vatTHB = amtTHB * (VAT_RATE[l.vatCode] ?? 0);
      const whtTHB = amtTHB * (WHT_RATE[l.whtCode] ?? 0);
      subtotal += amtTHB;
      vat += vatTHB;
      wht += whtTHB;
      if (firstCurrency === null) firstCurrency = l.currency;
      else if (firstCurrency !== l.currency) multiCurrency = true;
      const bucket = byCurrency[l.currency] ?? { subtotal: 0, vat: 0, wht: 0, lines: 0 };
      bucket.subtotal += amt;
      bucket.vat += amt * (VAT_RATE[l.vatCode] ?? 0);
      bucket.wht += amt * (WHT_RATE[l.whtCode] ?? 0);
      bucket.lines += 1;
      byCurrency[l.currency] = bucket;
    }
    const payable = subtotal + vat - wht;
    return { subtotal, vat, wht, payable, byCurrency, multiCurrency };
  }, [lines]);

  // ────────── Approver routing by total ──────────
  const suggestedApprover = APPROVERS.find(a => totals.payable <= a.maxAmount) ?? APPROVERS[APPROVERS.length - 1];
  const selectedApprover = APPROVERS.find(a => a.id === approver);
  const approverInsufficient = !!selectedApprover && totals.payable > selectedApprover.maxAmount;

  // ────────── Validations ──────────
  const allLinesHaveReceipts = lines.every(l => l.uploaded);
  const allLinesOcrConfident = lines.every(l => l.ocrDone && l.ocrConfidence >= 75);
  // Per-line policy check: any line whose amount exceeds its expense-type hard-stop fails.
  const allLinesWithinPolicy = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    const et = expenseTypes.find(e => e.id === l.expenseType);
    if (!et) return true; // covered by "expense type required" rule
    return amt <= et.hardStopThreshold;
  });
  const allRequiredFilled = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    return !!l.expenseType && !!l.receiptDate && !!l.accountCode && amt > 0;
  });
  const largeLinesJustified = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    return amt <= 30000 || !!l.lineJustification.trim();
  });

  const validationRules = [
    { label: "All lines have receipts attached", pass: lines.length > 0 && allLinesHaveReceipts, pending: !allLinesHaveReceipts },
    { label: "All lines OCR confidence ≥ 75%", pass: allLinesOcrConfident, pending: !allLinesOcrConfident },
    { label: "Total amount within policy limit", pass: totals.payable > 0 && allLinesWithinPolicy, pending: totals.payable === 0 },
    { label: "No duplicate receipts across lines", pass: allLinesHaveReceipts, pending: !allLinesHaveReceipts },
    { label: "All expense types allowed for country", pass: lines.every(l => !!l.expenseType), pending: lines.some(l => !l.expenseType) },
    { label: "Submission within 7-day window of latest receipt", pass: true, pending: false },
    { label: "No vendor on blocked list", pass: allLinesHaveReceipts, pending: !allLinesHaveReceipts },
    { label: "All required per-line fields filled", pass: allRequiredFilled, pending: !allRequiredFilled },
    { label: "Approver assigned", pass: !!approver && !approverInsufficient && largeLinesJustified, pending: !approver },
  ];
  const passedCount = validationRules.filter(r => r.pass).length;
  const allPass = passedCount === validationRules.length;

  const expectedOutcome: "auto" | "pending" | "blocked" = !allPass
    ? "blocked"
    : totals.payable <= AUTO_APPROVE_THRESHOLD
      ? "auto"
      : "pending";

  // Submit gating
  const canSubmit = allPass && lines.length >= 1 && allRequiredFilled && largeLinesJustified;

  // ────────── Mutators ──────────
  const updateLine = (id: string, patch: Partial<ExpenseLine>) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);
  const deleteLine = (id: string) => {
    setLines(prev => (prev.length <= 1 ? prev : prev.filter(l => l.id !== id)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({ title: "Cannot submit", description: "Complete all required fields and validations.", variant: "destructive" });
      return;
    }
    toast({ title: "Claim Submitted", description: `${lines.length} line(s) submitted for approval.` });
    navigate("/claims");
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">New Claim</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Add one expense line per receipt — OCR runs on each.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">

          {/* ═══════════════════════════════════════════ */}
          {/* REQUESTER DETAILS                            */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">Requester Details</h3>
                  {onBehalf && <Badge variant="submitted" className="text-[10px]">Delegated submission</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Auto-filled from your profile. Click Edit if submitting on behalf of someone else.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0" onClick={() => setRequesterEdit(v => !v)}>
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
                  <Select disabled={!requesterEdit} value={selectedStoreId} onValueChange={setSelectedStoreId}>
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

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={onBehalf} onCheckedChange={(v) => setOnBehalf(v === true)} />
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
          {/* CLAIM INFORMATION (header-level)             */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Claim Information</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Claim-level details. Per-receipt fields go in Expense Lines below.</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Auto-generated read-only meta row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Claim Number</Label>
                  <div className="relative">
                    <Input
                      readOnly tabIndex={-1} value={claimNumber} placeholder="Select store first"
                      className="h-9 text-sm bg-muted/50 font-mono tabular-nums pr-9 cursor-default focus-visible:ring-0"
                    />
                    <button
                      type="button" onClick={copyClaimNumber} disabled={!claimNumber} tabIndex={-1}
                      aria-label="Copy claim number"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Auto-generated. Cannot be edited.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Claim Creation Date</Label>
                  <Input
                    readOnly tabIndex={-1} value={creationDateDisplay}
                    className="h-9 text-sm bg-muted/50 tabular-nums cursor-default focus-visible:ring-0"
                  />
                  <p className="text-[11px] text-muted-foreground">Auto-set when claim is created.</p>
                </div>
              </div>

              {/* Link to Advance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
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
                  <p className="text-[11px] text-muted-foreground">One advance covers the whole trip.</p>
                </div>
                <div className="hidden sm:block" />
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Purpose <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  required placeholder="Enter purpose of this claim…" rows={3} maxLength={1750}
                  value={purpose} onChange={(e) => setPurpose(e.target.value)}
                  className="text-sm resize-none"
                />
                <p className="text-[11px] text-muted-foreground">Required · up to 250 words</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* EXPENSE LINES                                */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Expense Lines</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Add each receipt as a separate line. OCR runs per receipt.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">Lines: {lines.length}</Badge>
                <Badge variant="default" className="text-[10px] tabular-nums">
                  Total: {fmt(totals.payable)} THB
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {lines.map((line, idx) => (
                <ExpenseLineCard
                  key={line.id}
                  line={line}
                  index={idx}
                  canDelete={lines.length > 1}
                  countryFilter={country}
                  onChange={(patch) => updateLine(line.id, patch)}
                  onDelete={() => deleteLine(line.id)}
                />
              ))}

              <button
                type="button"
                onClick={addLine}
                className="w-full border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] rounded-lg py-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Another Expense Line
              </button>

              {/* Total breakdown */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">
                    Total ({lines.length} {lines.length === 1 ? "line" : "lines"})
                  </p>
                </div>
                <div className="p-4 space-y-1.5 text-xs tabular-nums">
                  {lines.map((l, i) => {
                    const amt = parseFloat(l.amount) || 0;
                    return (
                      <div key={l.id} className="flex justify-between text-muted-foreground">
                        <span>Line {i + 1}{l.expenseType ? ` — ${expenseTypeLabel(l.expenseType)}` : ""}</span>
                        <span>{amt > 0 ? `${fmt(amt)} ${l.currency}` : "—"}</span>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="flex justify-between"><span>Subtotal</span><span>{fmt(totals.subtotal)} THB</span></div>
                  <div className="flex justify-between"><span>VAT (sum of lines)</span><span>{fmt(totals.vat)} THB</span></div>
                  <div className="flex justify-between"><span>WHT (sum of lines)</span><span>−{fmt(totals.wht)} THB</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-bold text-foreground">
                    <span>Total Payable</span><span>{fmt(totals.payable)} THB</span>
                  </div>
                  {totals.multiCurrency && (
                    <p className="text-[10px] text-muted-foreground pt-2">
                      Total in THB (base) using current FX rate. FX rate as of {creationDate.toISOString().slice(0, 10)}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* VALIDATION & OUTCOME                         */}
          {/* ═══════════════════════════════════════════ */}
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

              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expected Outcome</p>
                  {expectedOutcome === "auto" && (
                    <Badge variant="approved" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" /> Auto Approved
                    </Badge>
                  )}
                  {expectedOutcome === "pending" && (
                    <Badge variant="validating" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" /> Pending Approval — routed to {selectedApprover?.name ?? "—"}
                    </Badge>
                  )}
                  {expectedOutcome === "blocked" && (
                    <Badge variant="rejected" className="gap-1 text-xs">
                      <XCircle className="h-3 w-3" /> Blocked — fix issues above
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payable</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground leading-tight">
                    {totals.payable > 0 ? fmt(totals.payable) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">THB (base currency)</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium leading-tight">
                  Approver sees one task with all lines. They approve or reject the entire claim together.
                </p>
              </div>
            </div>
          </div>

          {/* Footer actions — bottom right */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-10 px-4 w-full sm:w-auto">
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              title={!canSubmit ? "Complete all required fields and validations to submit." : undefined}
              className="h-10 px-6 font-semibold gap-2 w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4" /> Submit Claim
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Helper: shorten expense type label for total breakdown
function expenseTypeLabel(id: string): string {
  const et = expenseTypes.find(e => e.id === id);
  return et ? et.category : "Expense";
}
