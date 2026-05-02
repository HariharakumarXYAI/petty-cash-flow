import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, ShieldCheck,
  Lightbulb, Clock, Ban, Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipientDetailsCard, IssueReason } from "@/components/advance/RecipientDetailsCard";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { stores, expenseTypes, advances } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { cn } from "@/lib/utils";

const ACCOUNT_CODES = [
  { code: "1140-001", label: "Cash Advance Receivable (Employee)" },
  { code: "1140-002", label: "Cash Advance Receivable (Vendor)" },
  { code: "5101-001", label: "Office Supplies Expense" },
  { code: "5102-001", label: "Travel Expense" },
];

const APPROVERS = [
  { id: "APR-001", name: "Nattaya Kittisak", role: "Regional Manager", tier: 50000 },
  { id: "APR-002", name: "Suchart Phongpan", role: "Area Manager", tier: 20000 },
  { id: "APR-003", name: "Pranee Wongsiri", role: "Finance Controller", tier: 200000 },
];

const AUTO_APPROVE_THRESHOLD = 5000; // THB

export default function NewAdvance() {
  const navigate = useNavigate();
  const { country } = useGlobalFilter();

  const requester = {
    employeeId: "EMP-10247",
    fullName: "Somchai Prathumwan",
    store: "Makro Rama 4",
    position: "Store Manager",
    email: "somchai.p@cpaxtra.com",
    phone: "081-234-5678",
  };

  // Recipient delegation (issue-on-behalf-of)
  const [issueToEmployeeId, setIssueToEmployeeId] = useState<string | null>(null);
  const [issueReason, setIssueReason] = useState<IssueReason | null>(null);
  const [showRecipientErrors, setShowRecipientErrors] = useState(false);

  // Advance details
  const [purpose, setPurpose] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountCode, setAccountCode] = useState("1140-001");
  const today = useMemo(() => new Date(), []);
  const defaultSettle = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d;
  }, []);
  const minSettle = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; }, []);
  const maxSettle = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 60); return d; }, []);
  const [settlementDate, setSettlementDate] = useState<Date | undefined>(defaultSettle);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [approver, setApprover] = useState("");
  const [notes, setNotes] = useState("");

  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const filteredExpenseTypes = country === "all" ? expenseTypes : expenseTypes.filter(e => e.countries.includes(country as any));
  const selectedExpenseType = expenseTypes.find(e => e.id === expenseType);

  // Overdue check (against signed-in requester) — pretend Somchai owns these
  const overdueAdvances = advances.filter(a => a.status === "Overdue").slice(0, 2);
  const hasOverdue = overdueAdvances.length > 0;

  const amountNum = parseFloat(amount) || 0;
  const withinPolicy = !selectedExpenseType || amountNum <= selectedExpenseType.hardStopThreshold;
  const withinTier = amountNum <= 100000; // mock tier limit
  const settleWithin60 = !!settlementDate && settlementDate <= maxSettle && settlementDate >= minSettle;
  const accountSelected = !!accountCode;
  const approverSelected = !!approver;

  const checks = [
    { label: "Recipient has no overdue advances", pass: !hasOverdue, blocking: true, pending: false },
    { label: "Amount within policy limit", pass: amountNum > 0 && withinPolicy, pending: amountNum === 0, blocking: false },
    { label: "Amount within recipient's tier limit", pass: amountNum > 0 && withinTier, pending: amountNum === 0, blocking: false },
    { label: "Expected settlement date within 60 days", pass: settleWithin60, pending: !settlementDate, blocking: false },
    { label: "Account Code selected", pass: accountSelected, pending: false, blocking: false },
    { label: "Approver selected", pass: approverSelected, pending: false, blocking: false },
  ];
  const passedCount = checks.filter(c => c.pass).length;
  const allPass = passedCount === checks.length;

  const requiredFilled = !!purpose.trim() && accountSelected && !!settlementDate && amountNum > 0 && approverSelected;
  const canSubmit = requiredFilled && !hasOverdue && allPass;

  const outcome: "blocked" | "auto" | "pending" | null = hasOverdue
    ? "blocked"
    : allPass
      ? (amountNum <= AUTO_APPROVE_THRESHOLD ? "auto" : "pending")
      : null;

  const wordCount = purpose.trim() ? purpose.trim().split(/\s+/).length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const ctry = country === "all" ? "TH" : country;
    const advId = `ADV-${ctry}-${new Date().getFullYear()}-${seq}`;
    toast({
      title: `Advance ${advId} created`,
      description: `Status: ${outcome === "auto" ? "Auto Approved" : "Pending Approval"}.`,
    });
    navigate("/advances");
  };

  const handleSaveDraft = () => {
    toast({ title: "Draft saved", description: "Your advance request has been saved as a draft." });
    navigate("/advances");
  };

  const approverObj = APPROVERS.find(a => a.id === approver);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/advances")} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">Issue Advance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verify recipient → enter details → request approval · Under 90 seconds
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* ═══════════════════════════════════════════ */}
          {/* RECIPIENT DETAILS                           */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">Recipient Details</h3>
                  {onBehalf && <Badge variant="submitted" className="text-[10px]">On behalf of another</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Auto-filled from your profile. Click Edit if issuing to someone else.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => setRecipientEdit(v => !v)}
              >
                {recipientEdit ? <><CheckIcon className="h-3.5 w-3.5" /> Done</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {onBehalf && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Look up employee
                  </Label>
                  <Select value={onBehalfEmployee} onValueChange={setOnBehalfEmployee}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Search employee by name or ID…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMP-10311">EMP-10311 — Niran Suksai</SelectItem>
                      <SelectItem value="EMP-10422">EMP-10422 — Pim Chaiyo</SelectItem>
                      <SelectItem value="EMP-10588">EMP-10588 — Anan Wong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Employee ID</Label>
                  <Input className="h-9 text-sm" defaultValue={requester.employeeId} readOnly={!recipientEdit && !onBehalf} tabIndex={1} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                  <Input className="h-9 text-sm" defaultValue={requester.fullName} readOnly={!recipientEdit && !onBehalf} tabIndex={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Store</Label>
                  <Select disabled={!recipientEdit && !onBehalf} defaultValue={requester.storeCode}>
                    <SelectTrigger className="h-9 text-sm" tabIndex={3}><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>
                      {filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Position / Role</Label>
                  <Input className="h-9 text-sm" defaultValue={requester.position} readOnly={!recipientEdit && !onBehalf} tabIndex={4} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input className="h-9 text-sm" type="email" defaultValue={requester.email} readOnly={!recipientEdit && !onBehalf} tabIndex={5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                  <Input className="h-9 text-sm" defaultValue={requester.phone} readOnly={!recipientEdit && !onBehalf} tabIndex={6} />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={onBehalf} onCheckedChange={(v) => setOnBehalf(v === true)} />
                  <span className="text-xs text-foreground">Issuing on behalf of another person</span>
                </label>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* ADVANCE DETAILS                             */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Advance Details</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cash issued BEFORE expense. Must be settled with receipts within the settlement period.
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Purpose — full width */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Purpose <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => {
                    const words = e.target.value.trim() ? e.target.value.trim().split(/\s+/) : [];
                    if (words.length <= 250) setPurpose(e.target.value);
                  }}
                  placeholder="Why is this advance needed? (e.g., Store event supplies, Emergency repair)"
                  className="text-sm resize-none"
                  tabIndex={7}
                />
                <p className="text-[11px] text-muted-foreground">Required · {wordCount}/250 words</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                {/* Expense Type */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expense Type</Label>
                  <Select value={expenseType} onValueChange={(v) => {
                    setExpenseType(v);
                    setAccountCode("5101-001");
                  }}>
                    <SelectTrigger className="h-9 text-sm" tabIndex={8}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {filteredExpenseTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.category} – {e.subcategory}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Estimate the expense category. Final type set on claim.</p>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 text-sm" tabIndex={9}><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petty-cash">Cash from petty cash</SelectItem>
                      <SelectItem value="bank-transfer">Bank transfer</SelectItem>
                      <SelectItem value="company-card">Company card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Code */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Account Code <span className="text-destructive">*</span>
                  </Label>
                  <Select value={accountCode} onValueChange={setAccountCode} required>
                    <SelectTrigger className="h-9 text-sm" tabIndex={10}><SelectValue placeholder="Search GL account…" /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_CODES.map(a => (
                        <SelectItem key={a.code} value={a.code}>{a.code} – {a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Required for GL posting. Auto-suggested from Expense Type.</p>
                </div>

                {/* Expected Settlement Date */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Expected Settlement Date <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        tabIndex={11}
                        className={cn(
                          "h-9 w-full justify-start text-left text-sm font-normal",
                          !settlementDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {settlementDate ? format(settlementDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={settlementDate}
                        onSelect={setSettlementDate}
                        disabled={(date) => date < minSettle || date > maxSettle}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-[10px] text-muted-foreground">Must settle with receipts by this date. Default: 14 days.</p>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm"
                    tabIndex={12}
                  />
                  {selectedExpenseType && (
                    <div className="flex items-start gap-1.5 px-0.5">
                      <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        Policy limit: {selectedExpenseType.hardStopThreshold.toLocaleString()} · Approval required above {selectedExpenseType.alertThreshold.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-sm" tabIndex={13}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB – Thai Baht</SelectItem>
                      <SelectItem value="USD">USD – US Dollar</SelectItem>
                      <SelectItem value="KHR">KHR – Cambodian Riel</SelectItem>
                      <SelectItem value="VND">VND – Vietnamese Dong</SelectItem>
                      <SelectItem value="MMK">MMK – Myanmar Kyat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Approver */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Approver <span className="text-destructive">*</span>
                  </Label>
                  <Select value={approver} onValueChange={setApprover} required>
                    <SelectTrigger className="h-9 text-sm" tabIndex={14}><SelectValue placeholder="Select approver" /></SelectTrigger>
                    <SelectContent>
                      {APPROVERS.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} — {a.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Routed based on amount and your reporting line.</p>
                </div>
                <div />
              </div>

              {/* Notes — full width */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes (Optional)</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context for approver…"
                  className="text-sm resize-none"
                  tabIndex={15}
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* VALIDATION & OUTCOME                        */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Validation & Outcome</h3>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                {passedCount}/{checks.length} passed
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                {checks.map((rule, i) => (
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
                    {rule.blocking && !rule.pass && !rule.pending && (
                      <Badge variant="destructive" className="text-[9px] h-4">BLOCKING</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Outcome */}
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-[240px]">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expected Outcome</p>

                  {outcome === "blocked" && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-hold/10 border border-status-hold/20">
                        <Ban className="h-3.5 w-3.5 text-status-hold" />
                        <span className="text-xs font-bold text-status-hold">Blocked — Settle overdue advances first</span>
                      </div>
                      <p className="text-[11px] text-status-hold">
                        Overdue: {overdueAdvances.map(a => a.advanceNumber).join(", ")}
                      </p>
                      <Link to="/advances" className="inline-flex items-center text-[11px] text-primary hover:underline">
                        Go to overdue advances →
                      </Link>
                    </div>
                  )}

                  {outcome === "auto" && (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-approved/10 border border-status-approved/20">
                        <CheckCircle className="h-3.5 w-3.5 text-status-approved" />
                        <span className="text-xs font-bold text-status-approved">Auto Approved</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        This advance will be issued immediately. Cash available within 1 business day.
                      </p>
                    </div>
                  )}

                  {outcome === "pending" && (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-validating/10 border border-status-validating/20">
                        <Clock className="h-3.5 w-3.5 text-status-validating" />
                        <span className="text-xs font-bold text-status-validating">Pending Approval</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Routed to {approverObj?.name ?? "approver"} for review. Typical response: 4 business hours.
                      </p>
                    </div>
                  )}

                  {!outcome && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                      <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Complete required fields</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payable</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground leading-tight">
                    {amountNum > 0 ? `${amountNum.toLocaleString()} ${currency}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
            <Button type="button" variant="outline" onClick={handleSaveDraft} className="h-10 px-4 w-full sm:w-auto" tabIndex={16}>
              Save Draft
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full sm:w-auto">
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="h-10 px-6 font-semibold gap-2 w-full sm:w-auto"
                      tabIndex={17}
                    >
                      <CheckCircle className="h-4 w-4" /> Issue Advance
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent>
                    <p className="text-xs">Complete all required fields to issue.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </form>
    </div>
  );
}
