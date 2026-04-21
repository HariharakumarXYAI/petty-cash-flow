import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CreditCard, CheckCircle2, Settings, BarChart3, Search, User, Check,
  Calendar as CalendarIcon, AlertTriangle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

const Req = () => <span className="text-destructive ml-0.5">*</span>;

const SYSTEM_ROLES = [
  { value: "cardholder", label: "Cardholder", icon: CreditCard, desc: "Can submit petty cash vouchers and expense claims" },
  { value: "approver", label: "Approver", icon: CheckCircle2, desc: "Can approve vouchers from subordinates" },
  { value: "finance_reviewer", label: "Finance Reviewer", icon: BarChart3, desc: "Can review and post vouchers to GL" },
  { value: "admin", label: "Admin", icon: Settings, desc: "Can manage master data and system settings" },
] as const;

const CARD_ISSUERS = [
  "KBank", "SCB (Siam Commercial Bank)", "Bangkok Bank", "Krungsri (BAY)", "Krungthai (KTB)", "Other",
];

const formatThousands = (val: string) => {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
};

const parseExpiry = (mmYY: string): { date: Date | null; daysLeft: number | null } => {
  const m = mmYY.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return { date: null, daysLeft: null };
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return { date: null, daysLeft: null };
  // last day of month
  const date = new Date(year, month, 0, 23, 59, 59);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return { date, daysLeft };
};

interface Employee { code: string; name: string; positionLevel: string; active: boolean }

interface Props {
  form: any;
  setForm: (v: any) => void;
  selectedBU: { loaTableRef: string; buType: string } | undefined;
  approverPopoverOpen: boolean;
  setApproverPopoverOpen: (v: boolean) => void;
  currentEmployeeCode: string;
  approverList?: Employee[];
}

export function RoleAuthorizationSection({
  form, setForm, selectedBU, approverPopoverOpen, setApproverPopoverOpen, currentEmployeeCode, approverList,
}: Props) {
  // Lazy-loaded approver list (mock fallback)
  const [employees, setEmployees] = useState<Employee[]>(approverList ?? []);
  useEffect(() => {
    if (!approverList) {
      import("@/lib/mock-data").then((m) => {
        setEmployees(
          (m as any).mockEmployees ?? []
        );
      }).catch(() => {});
    }
  }, [approverList]);

  const isCardholder = form.systemRoles?.includes("cardholder");
  const isApprover = form.systemRoles?.includes("approver");

  // Auto-clear conditional fields when role removed
  useEffect(() => {
    if (!isCardholder && (form.cardLastFour || form.cardIssuer || form.cardExpiry)) {
      setForm({ ...form, cardLastFour: "", cardholderNameOnCard: "", cardIssuer: "", cardExpiry: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCardholder]);
  useEffect(() => {
    if (!isApprover && (form.approvalLimitPerTxn || form.approvalLimitPerMonth)) {
      setForm({ ...form, approvalLimitPerTxn: "", approvalLimitPerMonth: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprover]);

  const toggleRole = (role: string) => {
    const set = new Set<string>(form.systemRoles ?? []);
    if (set.has(role)) set.delete(role); else set.add(role);
    setForm({ ...form, systemRoles: Array.from(set) });
  };

  const expiry = useMemo(() => parseExpiry(form.cardExpiry || ""), [form.cardExpiry]);
  const expiryStatus =
    expiry.date && expiry.daysLeft !== null
      ? expiry.daysLeft < 0 ? "expired" : expiry.daysLeft <= 60 ? "soon" : "ok"
      : null;

  const dateRangeError =
    form.effectiveFrom && form.effectiveTo && form.effectiveTo < form.effectiveFrom
      ? "Effective To must be later than Effective From"
      : "";

  const monthLimitError = (() => {
    const txn = Number((form.approvalLimitPerTxn || "").replace(/\D/g, ""));
    const month = Number((form.approvalLimitPerMonth || "").replace(/\D/g, ""));
    if (form.approvalLimitPerMonth && month < txn) return "Monthly limit must be ≥ per-transaction limit";
    return "";
  })();

  const handleExpiryChange = (raw: string) => {
    let v = raw.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setForm({ ...form, cardExpiry: v });
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Role & Authorization</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure access permissions, card information, and approval authority for this employee.
        </p>
        <div className="mt-3 h-px bg-gray-200" />
      </div>

      <div className="space-y-6">
        {/* System Role */}
        <div>
          <Label className="text-sm">System Role <Req /></Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Select all applicable roles. A manager can be both Cardholder and Approver.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SYSTEM_ROLES.map(({ value, label, icon: Icon, desc }) => {
              const checked = form.systemRoles?.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleRole(value)}
                  className={cn(
                    "text-left rounded-md border p-4 transition-all flex gap-3 items-start",
                    checked
                      ? "border-primary border-2 bg-primary/5"
                      : "border-gray-300 bg-background hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {(!form.systemRoles || form.systemRoles.length === 0) && (
            <p className="text-xs text-destructive mt-2">Select at least one role</p>
          )}
        </div>

        {/* Account Status + Effective dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label className="text-sm">Account Status</Label>
            <div className="mt-1.5 flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 h-10">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    form.isActive ? "bg-emerald-500" : "bg-gray-400"
                  )}
                />
                <span className={form.isActive ? "text-emerald-700" : "text-muted-foreground"}>
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <Switch
                checked={!!form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v, active: v })}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Effective From <Req /></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal rounded-md border-gray-300",
                    !form.effectiveFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.effectiveFrom ? format(form.effectiveFrom, "dd/MM/yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.effectiveFrom}
                  onSelect={(d) => setForm({ ...form, effectiveFrom: d })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-sm">Effective To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal rounded-md border-gray-300",
                    !form.effectiveTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.effectiveTo ? format(form.effectiveTo, "dd/MM/yyyy") : "Leave blank for no end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.effectiveTo}
                  onSelect={(d) => setForm({ ...form, effectiveTo: d })}
                  disabled={(d) => (form.effectiveFrom ? d < form.effectiveFrom : false)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-[11px] text-muted-foreground mt-1">Set for temporary/contract employees</p>
            {dateRangeError && <p className="text-xs text-destructive mt-1">{dateRangeError}</p>}
          </div>
        </div>

        {!form.isActive && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Inactive employees cannot submit or approve vouchers. Pending vouchers will be reassigned to backup approver.
            </p>
          </div>
        )}

        {/* Card Information (conditional) */}
        {isCardholder && (
          <div className="rounded-md bg-gray-50 border-l-4 border-l-primary border border-gray-200 p-5 transition-all">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Card Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-sm">Credit Card Last 4 <Req /></Label>
                <Input
                  className="mt-1.5 rounded-md border-gray-300 tabular-nums"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={form.cardLastFour}
                  onChange={(e) =>
                    setForm({ ...form, cardLastFour: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                />
                <p className="text-[11px] text-muted-foreground mt-1">Last 4 digits of corporate credit card</p>
              </div>
              <div>
                <Label className="text-sm">Cardholder Name (as printed on card) <Req /></Label>
                <Input
                  className="mt-1.5 rounded-md border-gray-300 uppercase"
                  placeholder="SOMCHAI JAIDEE"
                  value={form.cardholderNameOnCard}
                  onChange={(e) => setForm({ ...form, cardholderNameOnCard: e.target.value.toUpperCase() })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  May differ from full name. Use name exactly as printed on card.
                </p>
              </div>
              <div>
                <Label className="text-sm">Card Issuer <Req /></Label>
                <Select value={form.cardIssuer} onValueChange={(v) => setForm({ ...form, cardIssuer: v })}>
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300">
                    <SelectValue placeholder="Select card issuer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_ISSUERS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm flex items-center gap-2">
                  Card Expiry (MM/YY) <Req />
                  {expiryStatus === "soon" && (
                    <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 text-[10px]">
                      ⚠ Expires soon
                    </Badge>
                  )}
                  {expiryStatus === "expired" && (
                    <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive text-[10px]">
                      🔴 Card expired
                    </Badge>
                  )}
                </Label>
                <Input
                  className="mt-1.5 rounded-md border-gray-300 tabular-nums"
                  placeholder="12/28"
                  maxLength={5}
                  value={form.cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Approval Authority (conditional) */}
        {isApprover && (
          <div className="rounded-md bg-gray-50 border-l-4 border-l-emerald-500 border border-gray-200 p-5 transition-all">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approval Authority
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-sm">Approval Limit per Transaction (THB) <Req /></Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input
                    className="pl-7 rounded-md border-gray-300 tabular-nums"
                    placeholder="50,000"
                    value={formatThousands(form.approvalLimitPerTxn)}
                    onChange={(e) =>
                      setForm({ ...form, approvalLimitPerTxn: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Maximum amount this approver can authorize in a single transaction
                </p>
              </div>
              <div>
                <Label className="text-sm">Approval Limit per Month (THB)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input
                    className="pl-7 rounded-md border-gray-300 tabular-nums"
                    placeholder="500,000"
                    value={formatThousands(form.approvalLimitPerMonth)}
                    onChange={(e) =>
                      setForm({ ...form, approvalLimitPerMonth: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Optional: Cumulative monthly approval cap</p>
                {monthLimitError && <p className="text-xs text-destructive mt-1">{monthLimitError}</p>}
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">LOA Table</Label>
                <div className="mt-1.5">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-800 border-blue-200 gap-1.5 px-3 py-1"
                  >
                    <Info className="h-3.5 w-3.5" />
                    📋 {selectedBU?.loaTableRef ?? "Select a Business Unit to populate LOA"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Direct Approver */}
        <div>
          <Label className="text-sm">Direct Approver <Req /></Label>
          <Popover open={approverPopoverOpen} onOpenChange={setApproverPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal mt-1.5 rounded-md border-gray-300"
              >
                {form.directApprover
                  ? employees.find((e) => e.code === form.directApprover)?.name || form.directApprover
                  : "Search by name or employee code..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[440px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search by name or employee code..." />
                <CommandList>
                  <CommandEmpty>No employee found.</CommandEmpty>
                  <CommandGroup>
                    {employees
                      .filter((e) => e.code !== currentEmployeeCode && e.active)
                      .map((e) => (
                        <CommandItem
                          key={e.code}
                          value={`${e.code} ${e.name}`}
                          onSelect={() => {
                            setForm({ ...form, directApprover: e.code });
                            setApproverPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.directApprover === e.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{e.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {e.code} · {e.positionLevel}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {form.directApprover && (() => {
            const approver = employees.find((e) => e.code === form.directApprover);
            return approver ? (
              <div className="mt-1.5">
                <Badge variant="secondary" className="text-xs gap-1">
                  <User className="h-3 w-3" />
                  {approver.name} — {approver.positionLevel}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, directApprover: "" })}
                    className="ml-1 hover:text-destructive"
                  >×</button>
                </Badge>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </section>
  );
}
