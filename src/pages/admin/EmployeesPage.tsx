import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus, Upload, UserPlus, Eye, Pencil, Search, Users, UserCheck,
  ShieldCheck, Settings, CreditCard, ChevronsUpDown, Check, AlertTriangle, Info,
  Building2, Store, User, Calendar, Mail, AlertCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Business Unit master data ──
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

// ── Employees ──
type LoginType = "sso" | "local";

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
  isFirstLogin?: boolean;
  emailStatus?: "sent" | "failed";
  loginType: LoginType;
}

const mockEmployees: Employee[] = [
  { name: "สมชาย ใจดี", code: "EMP001", email: "somchai@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User"], active: true, buCode: "WS-MK-TH", positionLevel: "Staff", employeeType: "Store", isFirstLogin: false, emailStatus: "sent", loginType: "local" },
  { name: "สมหญิง แก้วสาย", code: "EMP002", email: "somying@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User", "Store Manager"], active: true, buCode: "WS-MK-TH", positionLevel: "Area Manager", employeeType: "Store", isFirstLogin: true, emailStatus: "sent", loginType: "local" },
  { name: "วิชาญ เจริญ", code: "EMP003", email: "wichai@makro.co.th", dept: "Engineering", branch: "Chiang Mai", roles: ["Store User"], active: true, buCode: "RT-LT-TH", positionLevel: "Staff", employeeType: "Store", isFirstLogin: false, emailStatus: "sent", loginType: "local" },
  { name: "พิม ดี", code: "ACC001", email: "pim@cpaxtra.co.th", dept: "Finance", branch: "Bangkok", roles: ["HO Finance"], active: true, buCode: "HQ-CP", positionLevel: "Senior Manager", employeeType: "HO", isFirstLogin: false, emailStatus: "sent", loginType: "sso" },
  { name: "ณัฏฐพงษ์ ศรีสุข", code: "ADM001", email: "nattapong@cpaxtra.co.th", dept: "IT", branch: "Bangkok", roles: ["System Admin"], active: true, buCode: "HQ-CP", positionLevel: "Director", employeeType: "HO", isFirstLogin: false, emailStatus: "sent", loginType: "sso" },
  { name: "มานพ เก่ง", code: "EMP004", email: "manop@makro.co.th", dept: "Operations", branch: "Phuket", roles: ["Store User"], active: false, buCode: "DC-MK-TH", positionLevel: "Staff", employeeType: "Store", isFirstLogin: true, emailStatus: "failed", loginType: "local" },
];

const roleBadgeColor: Record<string, string> = {
  "Store User": "bg-muted text-muted-foreground",
  "Store Manager": "bg-status-approved/10 text-status-approved border-status-approved/20",
  "HO Finance": "bg-status-investigation/10 text-status-investigation border-status-investigation/20",
  "System Admin": "bg-destructive/10 text-destructive border-destructive/20",
};

const stats = [
  { label: "Total Employees", count: 6, icon: Users, color: "text-primary" },
  { label: "Active Employees", count: 5, icon: UserCheck, color: "text-status-approved" },
  { label: "Approvers", count: 2, icon: ShieldCheck, color: "text-status-investigation" },
  { label: "Admins", count: 1, icon: Settings, color: "text-status-validating" },
  
];

// Position levels filtered by Employee Type + Store Type
const getPositionLevels = (employeeType: "HO" | "Store", storeType: string) => {
  const base = ["Staff", "Senior Manager", "Area Manager", "Associate Director", "Director", "Senior Director"];
  if (employeeType === "HO") return base;
  const storeLevels = [...base, "Director – Region Operations"];
  if (storeType === "Hypermarket") storeLevels.push("Store Manager – Hypermarket");
  if (storeType === "Supermarket") storeLevels.push("Store Manager – Supermarket");
  return storeLevels;
};

const approvalAuthority: Record<string, string> = {
  "Staff": "No approval authority",
  "Senior Manager": "Can approve ≤ ฿10,000",
  "Area Manager": "Can approve ≤ ฿20,000",
  "Associate Director": "Can approve ≤ ฿50,000",
  "Director": "Can approve ≤ ฿100,000",
  "Senior Director": "Can approve ≤ ฿500,000",
  "Director – Region Operations": "Can approve ≤ ฿200,000",
  "Store Manager – Hypermarket": "Can approve ≤ ฿30,000",
  "Store Manager – Supermarket": "Can approve ≤ ฿20,000",
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

interface EmployeeForm {
  name: string;
  code: string;
  email: string;
  loginType: LoginType;
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

const emptyForm: EmployeeForm = {
  name: "", code: "", email: "", loginType: "sso", dept: "", branch: "",
  buCode: "", positionLevel: "Staff", employeeType: "Store",
  storeType: "", directApprover: "", costCenter: "",
  division: "", location: "", lob: "", channel: "", active: true,
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>({ ...emptyForm });
  const [buPopoverOpen, setBuPopoverOpen] = useState(false);
  const [approverPopoverOpen, setApproverPopoverOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [emailError, setEmailError] = useState("");

  const selectedBU = activeBUs.find((b) => b.buCode === form.buCode);
  const linkedEntity = selectedBU ? entityMap[selectedBU.entity] : null;
  const positionLevels = getPositionLevels(form.employeeType, form.storeType);

  // Validate Area Manager + non-Wholesale
  useEffect(() => {
    if (form.positionLevel === "Area Manager" && selectedBU && selectedBU.buType !== "Wholesale") {
      setValidationError("Area Manager role is only available for Wholesale Business Units per LOA policy FW-FN-001");
    } else {
      setValidationError("");
    }
  }, [form.positionLevel, selectedBU]);

  // Reset position level if not in current list
  useEffect(() => {
    if (!positionLevels.includes(form.positionLevel) && form.positionLevel) {
      setForm((prev) => ({ ...prev, positionLevel: "" }));
    }
  }, [form.employeeType, form.storeType]);

  const filtered = employees.filter((e) => {
    if (statusFilter === "active" && !e.active) return false;
    if (statusFilter === "inactive" && e.active) return false;
    if (search && !e.name.includes(search) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.email.includes(search)) return false;
    return true;
  });

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
    // Only clear email when switching SSO → Local with a corporate email
    if (newType === "local" && isCorp) {
      newEmail = "";
      warning = "Email cleared — corporate domain is not allowed for Local Password accounts.";
    }
    // All other directions: preserve email
    setForm({ ...form, loginType: newType, email: newEmail });
    setEmailWarning(warning);
    setEmailError("");
  };

  const handleEmailBlur = () => {
    const err = validateEmail(form.email, form.loginType);
    setEmailError(err);
    if (!err) setEmailWarning("");
  };

  const openAdd = () => {
    setEditingCode(null);
    setForm({ ...emptyForm });
    setEmailWarning("");
    setEmailError("");
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingCode(emp.code);
    setForm({
      name: emp.name, code: emp.code, email: emp.email,
      loginType: emp.loginType,
      dept: emp.dept, branch: emp.branch, buCode: emp.buCode,
      positionLevel: emp.positionLevel, employeeType: emp.employeeType,
      storeType: emp.employeeType === "Store" ? "Hypermarket" : "",
      directApprover: "", costCenter: "CC-" + emp.code,
      division: "", location: "", lob: "", channel: "",
      active: emp.active,
    });
    setEmailWarning("");
    setEmailError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (validationError) return;
    const emailErr = validateEmail(form.email, form.loginType);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    if (editingCode) {
      setEmployees((prev) =>
        prev.map((e) => e.code === editingCode ? { ...e, name: form.name, code: form.code, email: form.email, loginType: form.loginType, dept: form.dept, branch: form.branch, buCode: form.buCode, positionLevel: form.positionLevel, employeeType: form.employeeType, active: form.active } : e)
      );
      toast.success(`Employee ${form.code} updated successfully`);
    } else {
      // Simulate email delivery (randomly fail ~20% for demo)
      const emailFailed = Math.random() < 0.2;
      const newEmployee: Employee = {
        ...form,
        roles: ["Store User"],
        active: true,
        isFirstLogin: true,
        emailStatus: emailFailed ? "failed" : "sent",
      };
      setEmployees((prev) => [...prev, newEmployee]);

      if (emailFailed) {
        toast.warning(
          `Account created, but the password email could not be sent. Ask System Admin to resend.`,
          {
            duration: Infinity,
            style: {
              background: "#FFFBE6",
              borderLeft: "4px solid #FAAD14",
              color: "#333333",
              fontSize: "14px",
            },
          }
        );
      } else {
        toast.success(
          `Account created. Temporary password sent to ${form.email}.`,
          {
            duration: 5000,
            style: {
              background: "#F0FFF4",
              borderLeft: "4px solid #52C41A",
              color: "#333333",
              fontSize: "14px",
            },
          }
        );
      }
    }
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Employee Profiles</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-1" /> Invite User</Button>
          <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 my-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-semibold">{s.count}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Login Type</TableHead>
              
              <TableHead>Store</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Credentials</TableHead>
              
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.code}>
                <TableCell className="font-mono text-xs">{e.code}</TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="text-xs">{e.email}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center text-xs rounded-full px-2.5 py-0.5"
                    style={e.loginType === "sso"
                      ? { background: "#E6F0FF", color: "#0052CC" }
                      : { background: "#F0F0F0", color: "#555555" }
                    }
                  >
                    {e.loginType === "sso" ? "☁️ Microsoft 365" : "🔑 Local Password"}
                  </span>
                </TableCell>
                
                <TableCell>{e.branch}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {e.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`text-[10px] ${roleBadgeColor[r] || ""}`}>{r}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {e.emailStatus && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {e.emailStatus === "sent" ? (
                          <Mail className="h-4 w-4 text-status-approved" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-status-hold" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {e.emailStatus === "sent" ? "Credentials sent" : "Email failed"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell><Switch checked={e.active} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Employee Code <span className="text-destructive">*</span></Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. EMP005" />
              </div>
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailWarning(""); }}
                onBlur={handleEmailBlur}
                placeholder={form.loginType === "sso" ? "name@cpaxtra.co.th" : "e.g. somchai@makro.co.th or store001@gmail.com"}
                className={cn(
                  emailError ? "border-destructive" : "",
                  emailWarning ? "border-orange-400" : ""
                )}
              />
              {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
              {emailWarning && !emailError && <p className="text-xs text-orange-500 mt-1">{emailWarning}</p>}
            </div>
            {/* Login Type */}
            <div className="space-y-1.5">
              <Label>Login Type <span className="text-destructive">*</span></Label>
              {user?.role === "store_manager" ? (
                <>
                  <div
                    className="flex items-center gap-2 h-[44px] px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: "#F0F0F0", color: "#555555", borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
                  >
                    🔑 Local Password
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Store staff accounts always use Local Password login.
                  </p>
                </>
              ) : (
                <>
                  <Select value={form.loginType} onValueChange={(v) => handleLoginTypeChange(v as LoginType)}>
                    <SelectTrigger className="h-[44px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sso">☁️ Microsoft 365 (SSO)</SelectItem>
                      <SelectItem value="local">🔑 Local Password</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.loginType === "sso"
                      ? "HQ staff. Must have a @cpaxtra.co.th or @makro.co.th email to sign in via Microsoft."
                      : "Store staff. Uses Employee Code + password. Must NOT have a corporate domain email."}
                  </p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Input value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Store</Label>
                <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
              </div>
            </div>

            {/* Employee Type Toggle */}
            <div className="space-y-1.5">
              <Label>Employee Type <span className="text-destructive">*</span></Label>
              <div className="flex rounded-lg border overflow-hidden">
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

            <Separator />

            {/* Business Unit & Position */}
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Business Unit & Position</h3>

            {/* BU Searchable Dropdown */}
            <div className="space-y-1.5">
              <Label>Business Unit <span className="text-destructive">*</span></Label>
              <Popover open={buPopoverOpen} onOpenChange={setBuPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={buPopoverOpen} className="w-full justify-between font-normal">
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

            {/* Auto-filled fields from BU */}
            {selectedBU && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
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

            {/* Store Type — conditional */}
            {form.employeeType === "Store" && (
              <div className="space-y-1.5">
                <Label>Store Type <span className="text-destructive">*</span></Label>
                <Select value={form.storeType} onValueChange={(v) => setForm({ ...form, storeType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select store type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                    <SelectItem value="Supermarket">Supermarket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Position Level */}
            <div className="space-y-1.5">
              <Label>Position Level <span className="text-destructive">*</span></Label>
              <Select value={form.positionLevel} onValueChange={(v) => setForm({ ...form, positionLevel: v })}>
                <SelectTrigger><SelectValue placeholder="Select position level..." /></SelectTrigger>
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

            {/* Validation error */}
            {validationError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{validationError}</p>
              </div>
            )}

            {/* Direct Approver */}
            <div className="space-y-1.5">
              <Label>Direct Approver <span className="text-destructive">*</span></Label>
              <Popover open={approverPopoverOpen} onOpenChange={setApproverPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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

            {/* Cost Center */}
            <div className="space-y-1.5">
              <Label>Cost Center <span className="text-destructive">*</span></Label>
              <Input value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} placeholder="e.g. CC-1001-BKK" />
            </div>

            <Separator />

            {/* Accounting */}
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Accounting</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} placeholder="e.g. 01" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. BKK-01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>LOB</Label>
                <Input value={form.lob} onChange={(e) => setForm({ ...form, lob: e.target.value })} placeholder="e.g. 1001" />
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="e.g. Wholesale" />
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Employee Type</span>
                  <Badge variant={form.employeeType === "HO" ? "default" : "secondary"} className="text-xs">
                    {form.employeeType === "HO" ? <><Building2 className="h-3 w-3 mr-1" /> HO</> : <><Store className="h-3 w-3 mr-1" /> Store</>}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Position Level</span>
                  <span className="text-xs font-medium text-foreground">{form.positionLevel || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Approval Authority</span>
                  <span className="text-xs font-medium text-foreground">{approvalAuthority[form.positionLevel] || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Direct Approver</span>
                  <span className="text-xs font-medium text-foreground">
                    {form.directApprover ? mockEmployees.find((e) => e.code === form.directApprover)?.name || "—" : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!!validationError || !!emailError}>
              {editingCode ? "Save Changes" : "Save Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
