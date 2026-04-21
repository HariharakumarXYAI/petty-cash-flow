import { ReactNode, useEffect, useMemo, useState } from "react";
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
  positionLevelSlot?: ReactNode;
}

export function RoleAuthorizationSection({
  form, setForm, selectedBU, approverPopoverOpen, setApproverPopoverOpen, currentEmployeeCode, approverList, positionLevelSlot,
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
    <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Role & Authorization</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure access permissions, card information, and approval authority for this employee.
        </p>
      </div>

      <div className="space-y-6">
        {/* Position Level + Direct Approver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {positionLevelSlot}
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
                    ? (() => {
                        const a = employees.find((e) => e.code === form.directApprover);
                        return a ? `${a.code} - ${a.name}` : form.directApprover;
                      })()
                    : "Select direct approver..."}
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
                        .sort((a, b) => a.code.localeCompare(b.code))
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
                              <span className="text-sm font-medium">{e.code} - {e.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {e.positionLevel}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Effective dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

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
      </div>
    </section>
  );
}
