import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus, Upload, UserPlus, Eye, Pencil, Trash2, Search, Users, UserCheck,
  ShieldCheck, Settings, CreditCard, ChevronsUpDown, Check, AlertTriangle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Business Unit master data (shared with BusinessUnitsPage) ──
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

const positionLevels = [
  "Staff", "Supervisor", "Area Manager", "Department Manager", "Division Director", "VP", "SVP", "CFO",
];

const mockEmployees: Employee[] = [
  { name: "สมชาย ใจดี", code: "EMP001", email: "somchai@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User"], active: true, buCode: "WS-MK-TH", positionLevel: "Staff", employeeType: "Store" },
  { name: "สมหญิง แก้วสาย", code: "EMP002", email: "somying@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User", "Store Manager"], active: true, buCode: "WS-MK-TH", positionLevel: "Area Manager", employeeType: "Store" },
  { name: "วิชาญ เจริญ", code: "EMP003", email: "wichai@makro.co.th", dept: "Engineering", branch: "Chiang Mai", roles: ["Store User"], active: true, buCode: "RT-LT-TH", positionLevel: "Staff", employeeType: "Store" },
  { name: "พิม ดี", code: "ACC001", email: "pim@makro.co.th", dept: "Finance", branch: "Bangkok", roles: ["HO Finance"], active: true, buCode: "HQ-CP", positionLevel: "Supervisor", employeeType: "HO" },
  { name: "ณัฏฐพงษ์ ศรีสุข", code: "ADM001", email: "nattapong@makro.co.th", dept: "IT", branch: "Bangkok", roles: ["System Admin"], active: true, buCode: "HQ-CP", positionLevel: "Department Manager", employeeType: "HO" },
  { name: "มานพ เก่ง", code: "EMP004", email: "manop@makro.co.th", dept: "Operations", branch: "Phuket", roles: ["Store User"], active: false, buCode: "DC-MK-TH", positionLevel: "Staff", employeeType: "Store" },
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
  { label: "Cardholders", count: 3, icon: CreditCard, color: "text-destructive" },
];

interface EmployeeForm {
  name: string;
  code: string;
  email: string;
  dept: string;
  branch: string;
  buCode: string;
  positionLevel: string;
  employeeType: "HO" | "Store";
  active: boolean;
}

const emptyForm: EmployeeForm = {
  name: "", code: "", email: "", dept: "", branch: "",
  buCode: "", positionLevel: "Staff", employeeType: "Store", active: true,
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [buPopoverOpen, setBuPopoverOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const selectedBU = activeBUs.find((b) => b.buCode === form.buCode);
  const linkedEntity = selectedBU ? entityMap[selectedBU.entity] : null;

  // Validate Area Manager + non-Wholesale
  useEffect(() => {
    if (form.positionLevel === "Area Manager" && selectedBU && selectedBU.buType !== "Wholesale") {
      setValidationError("Area Manager role is only available for Wholesale Business Units per LOA policy FW-FN-001");
    } else {
      setValidationError("");
    }
  }, [form.positionLevel, selectedBU]);

  const filtered = employees.filter((e) => {
    if (statusFilter === "active" && !e.active) return false;
    if (statusFilter === "inactive" && e.active) return false;
    if (search && !e.name.includes(search) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.email.includes(search)) return false;
    return true;
  });

  const openAdd = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingCode(emp.code);
    setForm({
      name: emp.name, code: emp.code, email: emp.email,
      dept: emp.dept, branch: emp.branch, buCode: emp.buCode,
      positionLevel: emp.positionLevel, employeeType: emp.employeeType, active: emp.active,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (validationError) return;
    if (editingCode) {
      setEmployees((prev) =>
        prev.map((e) => e.code === editingCode ? { ...e, ...form, roles: e.roles } : e)
      );
    } else {
      setEmployees((prev) => [...prev, { ...form, roles: ["Store User"] }]);
    }
    setSheetOpen(false);
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
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Employee Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.code}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="font-mono text-xs">{e.code}</TableCell>
                <TableCell className="text-xs">{e.email}</TableCell>
                <TableCell>{e.dept}</TableCell>
                <TableCell>{e.branch}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {e.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`text-[10px] ${roleBadgeColor[r] || ""}`}>{r}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell><Switch checked={e.active} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/employees/${e.code}/edit`)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Employee Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCode ? "Edit Employee" : "Add Employee"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee Code *</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. EMP005" />
                  </div>
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Input value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee Type *</Label>
                    <Select value={form.employeeType} onValueChange={(v) => setForm({ ...form, employeeType: v as "HO" | "Store" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HO">HO</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Business Unit & Position */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Business Unit & Position</h3>
              <div className="space-y-3">
                {/* BU Searchable Dropdown */}
                <div>
                  <Label>Business Unit *</Label>
                  <Popover open={buPopoverOpen} onOpenChange={setBuPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={buPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
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

                  {/* LOA Table hint */}
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
                        <p className="font-mono text-xs font-medium text-foreground">
                          {selectedBU.entity} — {linkedEntity?.name || "—"}
                        </p>
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

                {/* Position Level */}
                <div>
                  <Label>Position Level *</Label>
                  <Select value={form.positionLevel} onValueChange={(v) => setForm({ ...form, positionLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {positionLevels
                        .filter((p) => {
                          // Hide Area Manager if BU doesn't allow it
                          if (p === "Area Manager" && selectedBU && !selectedBU.areaManagerAllowed) return false;
                          return true;
                        })
                        .map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Validation error */}
                {validationError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{validationError}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Active</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSave} disabled={!!validationError}>
              {editingCode ? "Save Changes" : "Save Employee"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
