import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft, ChevronsUpDown, Check, AlertTriangle, Info, Building2, Store,
  User, Search, Phone, CreditCard, CheckCircle2, Settings, BarChart3, Calendar as CalendarIcon,
  Lock as LockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { RoleAuthorizationSection } from "@/components/employee/RoleAuthorizationSection";
import { toast } from "sonner";

// ── Shared data (same as EmployeesPage) ──
type BUType = "Wholesale" | "Retail" | "DC" | "HQ" | "Food Service" | "Property-Mall" | "International";

interface BUOption {
  buCode: string;
  buNameTH: string;
  buNameEN: string;
  entity: string;
  buType: BUType;
  lobCode: string;
  loaTableRef: string;
  areaManagerAllowed: boolean;
  status: "Active" | "Inactive";
}

const buMasterData: BUOption[] = [
  { buCode: "WS-MK-TH", buNameTH: "แม็คโคร ประเทศไทย", buNameEN: "Makro Thailand", entity: "CPA001", buType: "Wholesale", lobCode: "1001", loaTableRef: "LOA ตาราง 1 (Wholesale)", areaManagerAllowed: true, status: "Active" },
  { buCode: "RT-LT-TH", buNameTH: "โลตัส ประเทศไทย", buNameEN: "Lotus Thailand", entity: "CPA001", buType: "Retail", lobCode: "2001", loaTableRef: "LOA ตาราง 1 (Retail)", areaManagerAllowed: false, status: "Active" },
  { buCode: "DC-MK-TH", buNameTH: "แม็คโคร ศูนย์กระจายสินค้า", buNameEN: "Makro DC Thailand", entity: "CPA001", buType: "DC", lobCode: "1001", loaTableRef: "LOA ตาราง 2 (DC)", areaManagerAllowed: false, status: "Active" },
  { buCode: "HQ-CP", buNameTH: "ซีพี แอ็กซ์ตร้า สำนักงานใหญ่", buNameEN: "CP Axtra HQ", entity: "CPA001", buType: "HQ", lobCode: "9999", loaTableRef: "LOA ตาราง 3 (HQ)", areaManagerAllowed: false, status: "Active" },
];

const entityMap: Record<string, { name: string; oracleCode: string }> = {
  CPA001: { name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", oracleCode: "10001" },
  MKR002: { name: "บริษัท แม็คโคร จำกัด", oracleCode: "10002" },
  DEM003: { name: "บริษัท เดโม จำกัด", oracleCode: "13000" },
};

const activeBUs = buMasterData.filter((b) => b.status === "Active" && b.buType === "Wholesale");

interface Employee {
  name: string;
  code: string;
  email: string;
  dept: string;
  branch: string;
  roles: string[];
  active: boolean;
  buCode: string;
  positionLevel: string;
  employeeType: "HO" | "Store";
}

const mockEmployees: Employee[] = [
  { name: "สมชาย ใจดี", code: "EMP001", email: "somchai@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User"], active: true, buCode: "WS-MK-TH", positionLevel: "Staff", employeeType: "Store" },
  { name: "สมหญิง แก้วสาย", code: "EMP002", email: "somying@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User", "Store Manager"], active: true, buCode: "WS-MK-TH", positionLevel: "Area Manager", employeeType: "Store" },
  { name: "วิชาญ เจริญ", code: "EMP003", email: "wichai@makro.co.th", dept: "Engineering", branch: "Chiang Mai", roles: ["Store User"], active: true, buCode: "RT-LT-TH", positionLevel: "Staff", employeeType: "Store" },
  { name: "พิม ดี", code: "ACC001", email: "pim@makro.co.th", dept: "Finance", branch: "Bangkok", roles: ["HO Finance"], active: true, buCode: "HQ-CP", positionLevel: "Senior Manager", employeeType: "HO" },
  { name: "ณัฏฐพงษ์ ศรีสุข", code: "ADM001", email: "nattapong@makro.co.th", dept: "IT", branch: "Bangkok", roles: ["System Admin"], active: true, buCode: "HQ-CP", positionLevel: "Director", employeeType: "HO" },
  { name: "มานพ เก่ง", code: "EMP004", email: "manop@makro.co.th", dept: "Operations", branch: "Phuket", roles: ["Store User"], active: false, buCode: "DC-MK-TH", positionLevel: "Staff", employeeType: "Store" },
];

const allRoles = [
  { value: "store_user", label: "Store User" },
  { value: "store_manager", label: "Store Manager" },
  { value: "regional_manager", label: "Regional Manager" },
  { value: "ho_finance", label: "HO Finance" },
  { value: "internal_audit", label: "Internal Audit" },
  { value: "system_admin", label: "System Admin" },
];

const getPositionLevels = (employeeType: "HO" | "Store", storeType: string) => {
  const base = ["Staff", "Senior Manager", "Area Manager", "Associate Director", "Director", "Senior Director"];
  if (employeeType === "HO") return base;
  const storeLevels = [...base, "Director – Region Operations"];
  if (storeType === "Hypermarket") storeLevels.push("Store Manager – Hypermarket");
  if (storeType === "Supermarket") storeLevels.push("Store Manager – Supermarket");
  return storeLevels;
};

const loaHints: Record<string, string> = {
  "Staff": "LOA Level 1 — No signing authority",
  "Senior Manager": "LOA Level 2 — Local petty cash only",
  "Area Manager": "LOA Level 3 — Multi-store regional",
  "Associate Director": "LOA Level 4 — Department budget",
  "Director": "LOA Level 5 — Division budget",
  "Senior Director": "LOA Level 6 — Business unit scope",
  "Director – Region Operations": "LOA Level 5 — Regional operations authority",
  "Store Manager – Hypermarket": "LOA Level 3 — Single hypermarket store",
  "Store Manager – Supermarket": "LOA Level 3 — Single supermarket store",
};

// ── Organization Structure master data ──
interface MasterOption { code: string; name: string; type?: string }

const locationsMaster: MasterOption[] = [
  { code: "099999", name: "Head Office", type: "HO" },
  { code: "001001", name: "Makro Ladprao", type: "Store" },
  { code: "001002", name: "Makro Rama 4", type: "Store" },
  { code: "001003", name: "Makro Chiang Mai", type: "Store" },
  { code: "001004", name: "Makro Phuket", type: "Store" },
  { code: "002001", name: "Lotus Bangkok Central", type: "Store" },
  { code: "002002", name: "Lotus Pattaya", type: "Store" },
  { code: "003001", name: "DC Wang Noi", type: "DC" },
];

const divisionsMaster: MasterOption[] = [
  { code: "92029", name: "Finance and Accounting" },
  { code: "92030", name: "Information Technology" },
  { code: "92031", name: "Human Resources" },
  { code: "92032", name: "Operations" },
  { code: "92033", name: "Sales & Marketing" },
  { code: "92034", name: "Supply Chain" },
  { code: "92035", name: "Internal Audit" },
];

const lobsMaster: MasterOption[] = [
  { code: "1001", name: "Wholesales" },
  { code: "1002", name: "Retail" },
  { code: "1003", name: "Online" },
  { code: "1004", name: "Food Service" },
  { code: "9999", name: "Corporate / Shared Services" },
];

const channelsMaster: MasterOption[] = [
  { code: "9999", name: "All Channels" },
  { code: "1001", name: "B2B" },
  { code: "2001", name: "B2C" },
  { code: "3001", name: "Online Marketplace" },
  { code: "4001", name: "Direct Sales" },
];

type LoginType = "sso" | "local";

interface EmployeeFormData {
  name: string;
  code: string;
  email: string;
  phoneNumber: string;
  loginType: LoginType;
  role: string;
  dept: string;
  branch: string;
  buCode: string;
  positionLevel: string;
  employeeType: "HO" | "Store";
  storeType: string;
  storeName: string;
  directApprover: string;
  costCenter: string;
  division: string;
  location: string;
  lob: string;
  channel: string;
  active: boolean;
  // Role & Authorization
  systemRoles: string[];
  isActive: boolean;
  effectiveFrom: Date | undefined;
  effectiveTo: Date | undefined;
  cardLastFour: string;
  cardholderNameOnCard: string;
  cardIssuer: string;
  cardExpiry: string;
  approvalLimitPerTxn: string;
  approvalLimitPerMonth: string;
}

const formatPhoneDisplay = (raw: string): string => {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 10) return d;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
};

const normalizePhoneInput = (val: string): string => {
  let d = val.replace(/\D/g, "");
  // Strip Thai country code 66 → 0
  if (d.startsWith("66") && d.length > 9) d = "0" + d.slice(2);
  return d.slice(0, 10);
};

const validatePhone = (raw: string): string => {
  const d = raw.replace(/\D/g, "");
  if (!d) return "Phone number is required";
  if (d.length !== 10) return "Phone number must be 10 digits";
  if (!d.startsWith("0")) return "Phone number must start with 0";
  return "";
};

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
  </div>
);

const Req = () => <span className="text-destructive">*</span>;

interface MasterComboboxProps {
  id: string;
  value: string;
  options: MasterOption[];
  placeholder: string;
  onChange: (code: string) => void;
  error?: boolean;
  highlightCodes?: string[]; // sort these to top
}

const MasterCombobox = ({ id, value, options, placeholder, onChange, error, highlightCodes }: MasterComboboxProps) => {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => {
    if (!highlightCodes?.length) return options;
    const set = new Set(highlightCodes);
    const top = options.filter((o) => set.has(o.code));
    const rest = options.filter((o) => !set.has(o.code));
    return [...top, ...rest];
  }, [options, highlightCodes]);
  const selected = options.find((o) => o.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "mt-1.5 flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
            error ? "border-destructive" : "border-gray-300",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selected ? `${selected.code} - ${selected.name}` : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command
          filter={(val, search) => {
            const opt = options.find((o) => o.code === val);
            if (!opt) return 0;
            const haystack = `${opt.code} ${opt.name}`.toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search by code or name..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {sorted.map((opt) => (
                <CommandItem
                  key={opt.code}
                  value={opt.code}
                  onSelect={() => { onChange(opt.code); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt.code ? "opacity-100" : "opacity-0")} />
                  <span className="font-mono text-xs text-muted-foreground mr-2">{opt.code}</span>
                  <span>{opt.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employee = mockEmployees.find((e) => e.code === id);

  const [form, setForm] = useState<EmployeeFormData>({
    name: "", code: "", email: "", phoneNumber: "", loginType: "sso", role: "store_user", dept: "", branch: "",
    buCode: "", positionLevel: "", employeeType: "Store",
    storeType: "", storeName: "", directApprover: "", costCenter: "",
    division: "", location: "", lob: "", channel: "9999", active: true,
    systemRoles: [], isActive: true, effectiveFrom: new Date(), effectiveTo: undefined,
    cardLastFour: "", cardholderNameOnCard: "", cardIssuer: "", cardExpiry: "",
    approvalLimitPerTxn: "", approvalLimitPerMonth: "",
  });
  const [emailWarning, setEmailWarning] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [initialForm, setInitialForm] = useState<EmployeeFormData>(form);
  const [buPopoverOpen, setBuPopoverOpen] = useState(false);
  const [approverPopoverOpen, setApproverPopoverOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [orgErrors, setOrgErrors] = useState<{ location?: boolean; division?: boolean; lob?: boolean; channel?: boolean }>({});

  useEffect(() => {
    if (employee) {
      const inferredLoginType: LoginType = employee.email.endsWith("@cpaxtra.co.th") ? "sso" : "local";
      const inferredRole =
        employee.roles.includes("System Admin") ? "system_admin" :
        employee.roles.includes("HO Finance") ? "ho_finance" :
        employee.roles.includes("Store Manager") ? "store_manager" :
        "store_user";
      const data: EmployeeFormData = {
        name: employee.name, code: employee.code, email: employee.email,
        phoneNumber: "0812345678",
        loginType: inferredLoginType, role: inferredRole,
        dept: employee.dept, branch: employee.branch, buCode: employee.buCode,
        positionLevel: employee.positionLevel, employeeType: employee.employeeType,
        storeType: employee.employeeType === "Store" ? "Hypermarket" : "",
        storeName: employee.employeeType === "Store" ? "001001" : "",
        directApprover: "", costCenter: "CC-" + employee.code,
        division: employee.employeeType === "HO" ? "92029" : "92032",
        location: employee.employeeType === "HO" ? "099999" : "001001",
        lob: "1001", channel: "9999",
        active: employee.active,
        systemRoles: ["cardholder"], isActive: employee.active,
        effectiveFrom: new Date(), effectiveTo: undefined,
        cardLastFour: "", cardholderNameOnCard: employee.name.toUpperCase(),
        cardIssuer: "", cardExpiry: "",
        approvalLimitPerTxn: "", approvalLimitPerMonth: "",
      };
      setForm(data);
      setInitialForm(data);
    }
  }, [employee]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  const selectedBU = activeBUs.find((b) => b.buCode === form.buCode);
  const linkedEntity = selectedBU ? entityMap[selectedBU.entity] : null;

  const positionLevels = getPositionLevels(form.employeeType, form.storeType);

  useEffect(() => {
    if (form.positionLevel === "Area Manager" && selectedBU && selectedBU.buType !== "Wholesale") {
      setValidationError("Area Manager role is only available for Wholesale Business Units per LOA policy FW-FN-001");
    } else {
      setValidationError("");
    }
  }, [form.positionLevel, selectedBU]);

  useEffect(() => {
    if (!positionLevels.includes(form.positionLevel)) {
      setForm((prev) => ({ ...prev, positionLevel: "" }));
    }
  }, [form.employeeType, form.storeType]);

  const isCorporateEmail = (email: string) => /@(cpaxtra\.co\.th|makro\.co\.th)$/.test(email);

  const validateEmail = (email: string, loginType: LoginType): string => {
    if (!email) return "Email is required.";
    if (loginType === "sso" && !isCorporateEmail(email)) return "SSO accounts must use a corporate domain (@cpaxtra.co.th or @makro.co.th)";
    if (loginType === "local" && isCorporateEmail(email)) return "Corporate email detected. Local Password accounts cannot use a corporate domain email.";
    return "";
  };

  const handleLoginTypeChange = (newType: LoginType) => {
    const isCorp = isCorporateEmail(form.email);
    let newEmail = form.email;
    let warning = "";
    if (newType === "local" && isCorp) {
      newEmail = "";
      warning = "Email cleared — corporate domain is not allowed for Local Password accounts.";
    }
    setForm({ ...form, loginType: newType, email: newEmail });
    setEmailWarning(warning);
    setEmailError("");
  };

  const handleEmailBlur = () => {
    const err = validateEmail(form.email, form.loginType);
    setEmailError(err);
    if (!err) setEmailWarning("");
  };

  const handleSave = () => {
    if (validationError) return;
    const emailErr = validateEmail(form.email, form.loginType);
    const phErr = validatePhone(form.phoneNumber);
    const orgErr = {
      location: !form.location,
      division: !form.division,
      lob: !form.lob,
      channel: !form.channel,
    };
    const hasOrgErr = Object.values(orgErr).some(Boolean);
    if (emailErr) setEmailError(emailErr);
    if (phErr) setPhoneError(phErr);
    if (hasOrgErr) setOrgErrors(orgErr);
    if (emailErr || phErr || hasOrgErr) return;
    toast.success(`Employee ${form.code} updated successfully`);
    navigate("/admin/employees");
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  const roleLabel = allRoles.find((r) => r.value === form.role)?.label || employee.roles[0] || "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-32">
        {/* Back link */}
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">Edit Employee</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {employee.code} · {employee.name} · {roleLabel}
        </p>

        {/* Cards */}
        <div className="mt-8 space-y-6">
          {/* Section: Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <SectionHeader
              title="Basic Information"
              description="Identity, login, and active status for this employee."
            />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Employee Code <Req /></Label>
                  <Input
                    className="mt-1.5 rounded-md border-gray-300"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. EMP005"
                  />
                </div>
                <div>
                  <Label>Full Name <Req /></Label>
                  <Input
                    className="mt-1.5 rounded-md border-gray-300"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="email">Email <Req /></Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailWarning(""); }}
                    onBlur={handleEmailBlur}
                    placeholder={form.loginType === "sso" ? "name@cpaxtra.co.th" : "e.g. somchai@makro.co.th or store001@gmail.com"}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={cn(
                      "mt-1.5 rounded-md border-gray-300",
                      emailError ? "border-destructive" : "",
                      emailWarning ? "border-orange-400" : ""
                    )}
                  />
                  {emailError && <p id="email-error" className="text-xs text-destructive mt-1">{emailError}</p>}
                  {emailWarning && !emailError && <p className="text-xs text-orange-500 mt-1">{emailWarning}</p>}
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number <Req /></Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={phoneFocused ? 10 : 12}
                      value={phoneFocused ? form.phoneNumber : formatPhoneDisplay(form.phoneNumber)}
                      onFocus={() => setPhoneFocused(true)}
                      onChange={(e) => {
                        const normalized = normalizePhoneInput(e.target.value);
                        setForm({ ...form, phoneNumber: normalized });
                        if (phoneError) setPhoneError("");
                      }}
                      onBlur={() => {
                        setPhoneFocused(false);
                        setPhoneError(validatePhone(form.phoneNumber));
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text");
                        const normalized = normalizePhoneInput(pasted);
                        setForm({ ...form, phoneNumber: normalized });
                      }}
                      placeholder="08X-XXX-XXXX"
                      aria-invalid={!!phoneError}
                      aria-describedby={phoneError ? "phone-error" : undefined}
                      className={cn(
                        "pl-9 rounded-md border-gray-300",
                        phoneError ? "border-destructive" : ""
                      )}
                    />
                  </div>
                  {phoneError && <p id="phone-error" className="text-xs text-destructive mt-1">{phoneError}</p>}
                </div>
              </div>


              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Login Type <Req /></Label>
                  <Select value={form.loginType} onValueChange={(v) => handleLoginTypeChange(v as LoginType)}>
                    <SelectTrigger className="mt-1.5 rounded-md border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sso">☁️ Microsoft 365 (SSO)</SelectItem>
                      <SelectItem value="local">🔑 Local Password</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    HQ staff. Must have a @cpaxtra.co.th or @makro.co.th email to sign in via Microsoft.
                  </p>
                </div>
                <div>
                  <Label>Active Status</Label>
                  <div className="mt-1.5 flex items-center justify-between rounded-md border border-gray-300 bg-background px-3 h-10">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          form.active ? "bg-emerald-500" : "bg-gray-400"
                        )}
                      />
                      <span className={form.active ? "text-emerald-700" : "text-muted-foreground"}>
                        {form.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Switch
                      checked={!!form.active}
                      onCheckedChange={(v) => setForm({ ...form, active: v })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Employee can access the system</p>
                </div>
              </div>



            </div>
          </section>

          {/* Section: Organization Structure */}
          <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <SectionHeader
              title="Organization Structure"
              description="Business unit, location, and reporting hierarchy."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>Business Unit <Req /></Label>
                <Popover open={buPopoverOpen} onOpenChange={setBuPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={buPopoverOpen} className="w-full justify-between font-normal mt-1.5 rounded-md border-gray-300">
                      {form.buCode
                        ? `${form.buCode} — ${activeBUs.find((b) => b.buCode === form.buCode)?.buNameTH || ""}`
                        : "Select business unit..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[440px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search business unit..." />
                      <CommandList>
                        <CommandEmpty>No business unit found.</CommandEmpty>
                        <CommandGroup>
                          {activeBUs.map((bu) => (
                            <CommandItem
                              key={bu.buCode}
                              value={`${bu.buCode} ${bu.buNameTH} ${bu.buNameEN}`}
                              onSelect={() => {
                                setForm({ ...form, buCode: bu.buCode });
                                setBuPopoverOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.buCode === bu.buCode ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{bu.buCode} — {bu.buNameTH}</span>
                                <span className="text-xs text-muted-foreground">{bu.buNameEN} · {bu.buType}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="org-location">Location <Req /></Label>
                <MasterCombobox
                  id="org-location"
                  value={form.location}
                  options={locationsMaster}
                  placeholder="Select location..."
                  onChange={(code) => { setForm({ ...form, location: code }); setOrgErrors((p) => ({ ...p, location: false })); }}
                  error={orgErrors.location}
                  highlightCodes={
                    form.employeeType === "Store"
                      ? locationsMaster.filter((l) => l.type === "Store").map((l) => l.code)
                      : ["099999"]
                  }
                />
                {orgErrors.location && <p className="text-xs text-destructive mt-1">This field is required</p>}
              </div>
              <div>
                <Label htmlFor="org-division">Division <Req /></Label>
                <MasterCombobox
                  id="org-division"
                  value={form.division}
                  options={divisionsMaster}
                  placeholder="Select division..."
                  onChange={(code) => { setForm({ ...form, division: code }); setOrgErrors((p) => ({ ...p, division: false })); }}
                  error={orgErrors.division}
                />
                {orgErrors.division && <p className="text-xs text-destructive mt-1">This field is required</p>}
              </div>
              <div>
                <Label htmlFor="org-lob" className="flex items-center gap-1.5">
                  LOB <Req />
                  <span title="Line of Business - used for GL posting and reporting" className="inline-flex">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" aria-label="Line of Business - used for GL posting and reporting" />
                  </span>
                </Label>
                <MasterCombobox
                  id="org-lob"
                  value={form.lob}
                  options={lobsMaster}
                  placeholder="Select line of business..."
                  onChange={(code) => { setForm({ ...form, lob: code }); setOrgErrors((p) => ({ ...p, lob: false })); }}
                  error={orgErrors.lob}
                />
                {orgErrors.lob && <p className="text-xs text-destructive mt-1">This field is required</p>}
              </div>
              <div>
                <Label htmlFor="org-channel" className="flex items-center gap-1.5">
                  Channel <Req />
                  <span title="Channel is set to All Channels by default and cannot be changed" className="inline-flex">
                    <LockIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="Channel is set to All Channels by default and cannot be changed" />
                  </span>
                </Label>
                <div
                  id="org-channel"
                  className="mt-1.5 flex items-center justify-between rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed select-none"
                  aria-readonly="true"
                >
                  <span>9999 - All Channels</span>
                  <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label>Employee Type <Req /></Label>
                <Select
                  value={form.employeeType === "Store" ? "STORE" : "HO"}
                  onValueChange={(v) => {
                    if (v === "HO") setForm({ ...form, employeeType: "HO", storeType: "" });
                    else setForm({ ...form, employeeType: "Store" });
                  }}
                >
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300">
                    <SelectValue placeholder="Select employee type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HO">Head Office</SelectItem>
                    <SelectItem value="STORE">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.employeeType === "Store" && (
                <div>
                  <Label>Store Type <Req /></Label>
                  <Select value={form.storeType} onValueChange={(v) => setForm({ ...form, storeType: v })}>
                    <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select store type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                      <SelectItem value="Supermarket">Supermarket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>

          {/* Section: Role & Authorization */}
          <RoleAuthorizationSection
            form={form}
            setForm={setForm}
            selectedBU={selectedBU}
            approverPopoverOpen={approverPopoverOpen}
            setApproverPopoverOpen={setApproverPopoverOpen}
            currentEmployeeCode={form.code}
            positionLevelSlot={
              <div>
                <Label>Position Level <Req /></Label>
                <Select value={form.positionLevel} onValueChange={(v) => setForm({ ...form, positionLevel: v })}>
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select position level..." /></SelectTrigger>
                  <SelectContent>
                    {positionLevels
                      .filter((p) => {
                        if (p === "Area Manager" && selectedBU && !selectedBU.areaManagerAllowed) return false;
                        return true;
                      })
                      .map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {form.positionLevel && loaHints[form.positionLevel] && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" /> {loaHints[form.positionLevel]}
                  </p>
                )}
                {validationError && (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{validationError}</p>
                  </div>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/employees")}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!!validationError || !!emailError}
            className="relative"
          >
            Save Changes
            {isDirty && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
