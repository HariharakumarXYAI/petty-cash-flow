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
  User, Search, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  directApprover: string;
  costCenter: string;
  division: string;
  location: string;
  lob: string;
  channel: string;
  active: boolean;
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

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="border-b mt-2" />
  </div>
);

const Req = () => <span className="text-destructive">*</span>;

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employee = mockEmployees.find((e) => e.code === id);

  const [form, setForm] = useState<EmployeeFormData>({
    name: "", code: "", email: "", phoneNumber: "", loginType: "sso", role: "store_user", dept: "", branch: "",
    buCode: "", positionLevel: "", employeeType: "Store",
    storeType: "", directApprover: "", costCenter: "",
    division: "", location: "", lob: "", channel: "", active: true,
  });
  const [emailWarning, setEmailWarning] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [initialForm, setInitialForm] = useState<EmployeeFormData>(form);
  const [buPopoverOpen, setBuPopoverOpen] = useState(false);
  const [approverPopoverOpen, setApproverPopoverOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

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
        directApprover: "", costCenter: "CC-" + employee.code,
        division: "", location: "", lob: "", channel: "",
        active: employee.active,
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
    if (emailErr) setEmailError(emailErr);
    if (phErr) setPhoneError(phErr);
    if (emailErr || phErr) return;
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

        {/* Card */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8 space-y-10">
          {/* Section: Basic Information */}
          <section>
            <SectionHeader title="Basic Information" />
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

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Division</Label>
                  <Input
                    className="mt-1.5 rounded-md border-gray-300"
                    value={form.dept}
                    onChange={(e) => setForm({ ...form, dept: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Store</Label>
                  <Input
                    className="mt-1.5 rounded-md border-gray-300"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Employee Type <Req /></Label>
                <div className="flex mt-1.5 rounded-md border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, employeeType: "HO", storeType: "" })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all",
                      form.employeeType === "HO"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Building2 className="h-4 w-4" /> HO (Head Office)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, employeeType: "Store" })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all",
                      form.employeeType === "Store"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Store className="h-4 w-4" /> Store
                  </button>
                </div>
              </div>

              <div>
                <Label>Role <Req /></Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Select the access level for this employee.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Business Unit & Position */}
          <section>
            <SectionHeader title="Business Unit & Position" />
            <div className="space-y-5">
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
                {selectedBU && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" /> {selectedBU.loaTableRef}
                  </p>
                )}
              </div>

              {selectedBU && (
                <div className="rounded-md border border-gray-200 bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">Auto-filled from Business Unit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Entity / Company</span>
                      <p className="font-mono text-xs font-medium text-foreground">{selectedBU.entity} — {linkedEntity?.name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Oracle Company Code</span>
                      <p className="font-mono text-xs font-medium text-foreground">{linkedEntity?.oracleCode || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">LOB Default</span>
                      <p className="font-mono text-xs font-medium text-foreground">{selectedBU.lobCode}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">BU Type</span>
                      <p className="text-xs font-medium text-foreground">{selectedBU.buType}</p>
                    </div>
                  </div>
                </div>
              )}

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
              </div>

              {validationError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{validationError}</p>
                </div>
              )}

              <div>
                <Label>Direct Approver <Req /></Label>
                <Popover open={approverPopoverOpen} onOpenChange={setApproverPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal mt-1.5 rounded-md border-gray-300">
                      {form.directApprover
                        ? mockEmployees.find((e) => e.code === form.directApprover)?.name || form.directApprover
                        : "Search by name or employee code"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[440px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or employee code..." />
                      <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {mockEmployees
                            .filter((e) => e.code !== form.code && e.active)
                            .map((e) => (
                              <CommandItem
                                key={e.code}
                                value={`${e.code} ${e.name}`}
                                onSelect={() => {
                                  setForm({ ...form, directApprover: e.code });
                                  setApproverPopoverOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", form.directApprover === e.code ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{e.name}</span>
                                  <span className="text-xs text-muted-foreground">{e.code} · {e.positionLevel}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.directApprover && (() => {
                  const approver = mockEmployees.find((e) => e.code === form.directApprover);
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

              <div>
                <Label>Cost Center <Req /></Label>
                <Input
                  className="mt-1.5 rounded-md border-gray-300"
                  value={form.costCenter}
                  onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
                  placeholder="e.g. CC-1001-BKK"
                />
              </div>
            </div>
          </section>

          {/* Section: Accounting */}
          <section>
            <SectionHeader title="Accounting" />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Division</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} placeholder="e.g. 01" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. BKK-01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>LOB</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.lob} onChange={(e) => setForm({ ...form, lob: e.target.value })} placeholder="e.g. 1001" />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="e.g. Wholesale" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Status */}
          <section>
            <SectionHeader title="Status" />
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4">
              <div>
                <Label className="text-sm font-medium">Active Status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Employee can access the system</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </section>
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
