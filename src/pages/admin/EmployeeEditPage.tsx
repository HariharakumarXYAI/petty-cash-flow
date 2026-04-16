import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft, ChevronsUpDown, Check, AlertTriangle, Info, Building2, Store,
  ShieldAlert, Calendar, User, ChevronRight, Search,
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

// Position levels filtered by Employee Type + Store Type
const getPositionLevels = (employeeType: "HO" | "Store", storeType: string) => {
  const base = ["Staff", "Senior Manager", "Area Manager", "Associate Director", "Director", "Senior Director"];
  if (employeeType === "HO") return base;
  // Store — add store-specific levels
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

interface EmployeeFormData {
  name: string;
  code: string;
  email: string;
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

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employee = mockEmployees.find((e) => e.code === id);

  const [form, setForm] = useState<EmployeeFormData>({
    name: "", code: "", email: "", dept: "", branch: "",
    buCode: "", positionLevel: "", employeeType: "Store",
    storeType: "", directApprover: "", costCenter: "",
    division: "", location: "", lob: "", channel: "", active: true,
  });

  const [initialForm, setInitialForm] = useState<EmployeeFormData>(form);
  const [buPopoverOpen, setBuPopoverOpen] = useState(false);
  const [approverPopoverOpen, setApproverPopoverOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (employee) {
      const data: EmployeeFormData = {
        name: employee.name, code: employee.code, email: employee.email,
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

  // Reset position level if not in current list when employee type or store type changes
  useEffect(() => {
    if (!positionLevels.includes(form.positionLevel)) {
      setForm((prev) => ({ ...prev, positionLevel: "" }));
    }
  }, [form.employeeType, form.storeType]);

  const handleSave = () => {
    if (validationError) return;
    toast.success(`Employee ${form.code} updated successfully`);
    navigate("/admin/employees");
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/employees">Admin Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/employees">Employee Profiles</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Employee</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Title */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Employee</h1>
          <Badge variant="outline" className="mt-1 font-mono text-xs">{form.code}</Badge>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 pb-24">
        {/* LEFT COLUMN — 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card 1 — Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Code <span className="text-destructive">*</span></Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. EMP005" />
                </div>
                <div>
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {/* Employee Type Toggle */}
              <div>
                <Label>Employee Type <span className="text-destructive">*</span></Label>
                <div className="flex mt-1.5 rounded-lg border overflow-hidden">
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
            </CardContent>
          </Card>

          {/* Card 2 — Business Unit & Position */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Business Unit & Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BU Searchable Dropdown */}
              <div>
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

              {/* Auto-filled info */}
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

            </CardContent>
          </Card>

          {/* Card 3 — Approval & Authorization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Approval & Authorization</CardTitle>
              <div className="border-b mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Store Type — conditional */}
              <div
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  form.employeeType === "Store" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <Label>Store Type <span className="text-destructive">*</span></Label>
                <Select value={form.storeType} onValueChange={(v) => setForm({ ...form, storeType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select store type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                    <SelectItem value="Supermarket">Supermarket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Position Level */}
              <div>
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
              <div>
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
              <div>
                <Label>Cost Center <span className="text-destructive">*</span></Label>
                <Input value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} placeholder="e.g. CC-1001-BKK" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4 — Accounting */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Accounting</CardTitle>
              <div className="border-b mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Division</Label>
                  <Input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} placeholder="e.g. 01" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. BKK-01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>LOB</Label>
                  <Input value={form.lob} onChange={(e) => setForm({ ...form, lob: e.target.value })} placeholder="e.g. 1001" />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="e.g. Wholesale" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 3 — Status & Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Status & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Employee can access the system</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>

              {/* Summary box */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</h4>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Employee Type</span>
                    <Badge variant={form.employeeType === "HO" ? "default" : "secondary"} className="text-xs">
                      {form.employeeType === "HO" ? (
                        <><Building2 className="h-3 w-3 mr-1" /> HO</>
                      ) : (
                        <><Store className="h-3 w-3 mr-1" /> Store</>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Position Level</span>
                    <span className="text-xs font-medium text-foreground">{form.positionLevel}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Approval Authority</span>
                    <span className="text-xs font-medium text-foreground">
                      {approvalAuthority[form.positionLevel] || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Direct Approver</span>
                    <span className="text-xs font-medium text-foreground">
                      {form.directApprover
                        ? mockEmployees.find((e) => e.code === form.directApprover)?.name || "—"
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Last Updated</span>
                    <span className="text-xs text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center justify-between px-8 py-3 max-w-screen-2xl mx-auto">
          <Link to="/admin/employees" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Employee Profiles
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/admin/employees")}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!!validationError}
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
    </div>
  );
}
