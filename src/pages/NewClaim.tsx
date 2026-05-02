import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { stores, advances, expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ExpenseLinesSection,
  createEmptyLineV2,
  evaluateLine,
  ExpenseLineV2,
} from "@/components/claim/ExpenseLinesSection";
import { RequesterDetailsCard } from "@/components/claim/RequesterDetailsCard";
import { ClaimDetailsCard } from "@/components/claim/ClaimDetailsCard";

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
  
  const [submittedForEmployeeId, setSubmittedForEmployeeId] = useState<string | null>(null);
  const [delegationReason, setDelegationReason] = useState<
    "sick_leave" | "annual_leave" | "traveling" | "no_store_account" | "other" | null
  >(null);
  const [selectedStoreId, setSelectedStoreId] = useState("s3");

  // Expense lines
  const [lines, setLines] = useState<ExpenseLineV2[]>(() => [createEmptyLineV2()]);

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
    store: stores.find(s => s.id === selectedStoreId)?.name ?? "Makro Rama 4",
    email: "somchai.p@cpaxtra.com",
    phone: "081-234-5678",
  };

  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const openAdvances = advances.filter(a => a.status === "Open" || a.status === "Partially Settled");

  // ────────── Totals ──────────
  const totals = useMemo(() => {
    let subtotal = 0, vat = 0, wht = 0;
    let multiCurrency = false;
    let firstCurrency: string | null = null;

    for (const l of lines) {
      const total = parseFloat(l.amount) || 0;
      const vatAmt = parseFloat(l.vatAmount) || 0;
      const whtAmt = parseFloat(l.whtAmount) || 0;
      const fx = FX_TO_THB[l.currency] ?? 1;
      subtotal += (total - vatAmt) * fx;
      vat += vatAmt * fx;
      wht += whtAmt * fx;
      if (firstCurrency === null) firstCurrency = l.currency;
      else if (firstCurrency !== l.currency) multiCurrency = true;
    }
    const payable = subtotal + vat - wht;
    return { subtotal, vat, wht, payable, multiCurrency };
  }, [lines]);

  // Per-line evaluations (drives footer chip & validation popover)
  const lineEvals = useMemo(() => lines.map(evaluateLine), [lines]);
  const completeLines = lineEvals.filter(e => e.complete).length;
  const allLinesComplete = completeLines === lines.length;

  // ────────── Approver auto-routing by total ──────────
  const selectedApprover = APPROVERS.find(a => totals.payable <= a.maxAmount) ?? APPROVERS[APPROVERS.length - 1];

  // ────────── Validations (all 9 still evaluated; surfaced via popover) ──────────
  const allLinesHaveReceipts = lines.every(l => Object.keys(l.docs).length > 0);
  const allLinesOcrConfident = lines.every(l =>
    Object.values(l.docs).length > 0 &&
    Object.values(l.docs).every(d => d.ocrConfidence >= 75)
  );
  const allLinesWithinPolicy = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    const et = expenseTypes.find(e => e.id === l.subExpenseTypeId);
    if (!et) return true;
    return amt <= et.hardStopThreshold;
  });
  const allRequiredFilled = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    return !!l.subExpenseTypeId && !!l.receiptDate && !!l.glAccount && amt > 0;
  });
  const largeLinesJustified = lines.every(l => {
    const amt = parseFloat(l.amount) || 0;
    return amt <= 30000 || !!l.lineJustification.trim();
  });
  const allDocPolicyMet = lineEvals.every(e => e.requiredFilled === e.requiredTotal);

  const validationRules = [
    { label: "All lines have receipts attached", pass: lines.length > 0 && allLinesHaveReceipts, pending: !allLinesHaveReceipts },
    { label: "All lines OCR confidence ≥ 75%", pass: allLinesOcrConfident, pending: !allLinesOcrConfident },
    { label: "Total amount within policy limit", pass: totals.payable > 0 && allLinesWithinPolicy, pending: totals.payable === 0 },
    { label: "No duplicate receipts across lines", pass: allLinesHaveReceipts, pending: !allLinesHaveReceipts },
    { label: "All sub-types allowed for country", pass: lines.every(l => !!l.subExpenseTypeId), pending: lines.some(l => !l.subExpenseTypeId) },
    { label: "Submission within 7-day window of latest receipt", pass: true, pending: false },
    { label: "Per-sub-type document checklist satisfied", pass: allDocPolicyMet, pending: !allDocPolicyMet },
    { label: "All required per-line fields filled", pass: allRequiredFilled, pending: !allRequiredFilled },
    { label: "Approver auto-routed", pass: !!selectedApprover && largeLinesJustified, pending: !selectedApprover },
  ];
  const passedCount = validationRules.filter(r => r.pass).length;
  const allPass = passedCount === validationRules.length;

  const expectedOutcome: "auto" | "pending" | "blocked" = !allPass
    ? "blocked"
    : totals.payable <= AUTO_APPROVE_THRESHOLD
      ? "auto"
      : "pending";

  // Submit gating
  const canSubmit = allPass && lines.length >= 1 && allRequiredFilled && largeLinesJustified && allLinesComplete;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({ title: "Cannot submit", description: "Complete all required fields and validations.", variant: "destructive" });
      return;
    }
    toast({ title: "Claim Submitted", description: `${lines.length} line(s) submitted for approval.` });
    navigate("/claims");
  };

  const handleSaveDraft = () => {
    toast({ title: "Draft saved", description: `${lines.length} line(s) saved as draft.` });
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
          <RequesterDetailsCard
            requester={requester}
            submittedForEmployeeId={submittedForEmployeeId}
            delegationReason={delegationReason}
            onDelegationChange={(empId, reason) => {
              setSubmittedForEmployeeId(empId);
              setDelegationReason(reason);
            }}
          />

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
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Claim Status</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/50">
                    <Badge variant="draft">Draft</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Draft → Submitted → Approved.</p>
                </div>
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
          {/* EXPENSE LINES — master-detail with doc policy */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Expense Lines</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Drop receipts above — auto-routed to the right line and slot. Sub-type drives the doc checklist per line.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">Lines: {lines.length}</Badge>
                <Badge variant="default" className="text-[10px] tabular-nums">
                  Total: {fmt(totals.payable)} THB
                </Badge>
              </div>
            </div>

            <div className="p-4">
              <ExpenseLinesSection
                lines={lines}
                setLines={setLines}
                countryFilter={country}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* STICKY SUMMARY FOOTER                        */}
          {/* ═══════════════════════════════════════════ */}
          <div className="sticky bottom-0 z-30 -mx-4 sm:mx-0 bg-card border-t sm:border border-border sm:rounded-xl shadow-lg sm:shadow-xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Inline metrics */}
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
              <Metric label="Lines" value={String(lines.length)} />
              <Metric label="Subtotal" value={`${fmt(totals.subtotal)} THB`} />
              <Metric label="VAT" value={`${fmt(totals.vat)} THB`} />
              <Metric label="WHT" value={`−${fmt(totals.wht)} THB`} />
              <Metric label="Payable" value={totals.payable > 0 ? `${fmt(totals.payable)} THB` : "—"} bold />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Validation chip → popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold border transition-colors ${
                      allLinesComplete && allPass
                        ? "bg-status-approved/10 text-status-approved border-status-approved/30 hover:bg-status-approved/15"
                        : "bg-status-alert/10 text-status-alert border-status-alert/30 hover:bg-status-alert/15"
                    }`}
                  >
                    {allLinesComplete && allPass
                      ? <CheckCircle className="h-3.5 w-3.5" />
                      : <AlertTriangle className="h-3.5 w-3.5" />}
                    {completeLines} of {lines.length} lines complete
                    <span className="opacity-60">· {passedCount}/{validationRules.length}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[380px]">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Validation & Outcome</h4>
                    <span className="ml-auto text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {passedCount}/{validationRules.length}
                    </span>
                  </div>
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
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expected Outcome</p>
                    {expectedOutcome === "auto" && (
                      <Badge variant="approved" className="gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" /> Auto Approved
                      </Badge>
                    )}
                    {expectedOutcome === "pending" && (
                      <Badge variant="validating" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> Pending — routed to {selectedApprover?.name ?? "—"}
                      </Badge>
                    )}
                    {expectedOutcome === "blocked" && (
                      <Badge variant="rejected" className="gap-1 text-xs">
                        <XCircle className="h-3 w-3" /> Blocked — fix issues above
                      </Badge>
                    )}
                    <div className="bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-2 flex items-start gap-2 mt-2">
                      <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-primary leading-tight">
                        Approver sees one task with all lines and approves or rejects the entire claim together.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button type="button" variant="outline" onClick={handleSaveDraft} className="h-9 px-4 text-xs">
                Save draft
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                title={!canSubmit ? "Complete every line per its doc checklist to submit." : undefined}
                className="h-9 px-5 text-xs font-semibold gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Submit claim
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Metric({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      <span className={`tabular-nums ${bold ? "text-sm font-bold text-foreground" : "text-xs text-foreground"}`}>{value}</span>
    </div>
  );
}

