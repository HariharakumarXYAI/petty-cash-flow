import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Eye, Pencil, Ban, Search, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

const bgColors: Record<string, string> = {
  Wholesale: "bg-blue-100 text-blue-700 border-blue-200",
  Retail: "bg-green-100 text-green-700 border-green-200",
  "Food Service": "bg-amber-100 text-amber-700 border-amber-200",
  "Property-Mall": "bg-purple-100 text-purple-700 border-purple-200",
  International: "bg-sky-100 text-sky-700 border-sky-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

const loaMap: Record<string, string> = {
  Wholesale: "ตาราง 1 (Wholesale)",
  Retail: "ตาราง 1 (Retail)",
  "Food Service": "ตาราง 2 (Food Service)",
  "Property-Mall": "ตาราง 3 (Property-Mall)",
  International: "ตาราง 4 (International)",
};

const mockEmployees = [
  { id: "EMP001", name: "คุณสมชาย วงศ์ใหญ่" },
  { id: "EMP002", name: "คุณสมหญิง จันทร์ดี" },
  { id: "EMP003", name: "คุณวิชัย ศรีสุข" },
  { id: "EMP004", name: "คุณนภา รัตนกุล" },
  { id: "EMP005", name: "คุณพิชัย ธนาพร" },
];

interface EntityForm {
  code: string;
  name: string;
  nameEn: string;
  taxId: string;
  entityType: string;
  start: string;
  end: string;
  status: string;
  businessGroup: string;
  oracleCode: string;
  loaRef: string;
  currency: string;
  ultimateApprover: string;
  financeController: string;
}

const emptyForm: EntityForm = {
  code: "", name: "", nameEn: "", taxId: "", entityType: "",
  start: "", end: "", status: "Active",
  businessGroup: "", oracleCode: "", loaRef: "", currency: "",
  ultimateApprover: "", financeController: "",
};

const mockEntities = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", nameEn: "CP Axtra Public Company Limited", businessGroup: "Wholesale", oracleCode: "10001", taxId: "0105500000001", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: "EMP001", financeController: "EMP002" },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด (มหาชน)", nameEn: "Makro Public Company Limited", businessGroup: "Wholesale", oracleCode: "10002", taxId: "0105500000002", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: "EMP003", financeController: "EMP004" },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", nameEn: "Demo Company Limited", businessGroup: "Retail", oracleCode: "13000", taxId: "0105500000003", entityType: "สาขา", start: "2025-06-01", end: "2026-12-31", status: "Inactive", loaRef: "ตาราง 1 (Retail)", currency: "THB", ultimateApprover: "EMP005", financeController: "EMP001" },
];

export default function EntitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<EntityForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Partial<Record<keyof EntityForm, string>>>({});

  const filtered = mockEntities.filter((e) => {
    if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
    if (search && !e.name.includes(search) && !e.nameEn.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.taxId.includes(search) && !e.oracleCode.includes(search)) return false;
    return true;
  });

  const openAdd = () => {
    setEditIndex(null);
    setForm({ ...emptyForm });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (idx: number) => {
    const e = mockEntities[idx];
    setEditIndex(idx);
    setForm({ ...e });
    setErrors({});
    setDialogOpen(true);
  };

  const updateField = <K extends keyof EntityForm>(key: K, value: EntityForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "businessGroup") {
        next.loaRef = loaMap[value as string] || "";
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof EntityForm, string>> = {};
    if (!form.code.trim()) errs.code = "Required";
    if (!form.name.trim()) errs.name = "Required";
    if (!form.entityType) errs.entityType = "Required";
    if (!form.businessGroup) errs.businessGroup = "Required";
    if (!form.oracleCode.trim()) errs.oracleCode = "Required";
    else if (!/^\d{5}$/.test(form.oracleCode)) errs.oracleCode = "Must be exactly 5 digits";
    if (!form.currency) errs.currency = "Required";
    if (form.taxId && !/^\d{13}$/.test(form.taxId)) errs.taxId = "Must be exactly 13 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast.success(editIndex !== null ? "Entity updated successfully" : "Entity created successfully");
    setDialogOpen(false);
  };

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [cfoSearch, setCfoSearch] = useState("");

  const filteredEmployees = (q: string) =>
    mockEmployees.filter((emp) => emp.name.includes(q) || emp.id.toLowerCase().includes(q.toLowerCase()));

  const getEmployeeName = (id: string) => mockEmployees.find((e) => e.id === id)?.name || id;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Entities</h1>
          <p className="text-sm text-muted-foreground">Manage legal entity registrations and tax identifiers</p>
        </div>
        <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Company Identity
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search entities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Entity Code</TableHead>
              <TableHead>Legal Entity Name (TH)</TableHead>
              <TableHead>Legal Entity Name (EN)</TableHead>
              <TableHead>Business Group</TableHead>
              <TableHead>Oracle Code</TableHead>
              <TableHead>Primary Tax ID</TableHead>
              <TableHead>Effective Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={e.code}>
                <TableCell className="font-medium">{e.code}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell className="text-muted-foreground">{e.nameEn}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={bgColors[e.businessGroup] || bgColors.Other}>
                    {e.businessGroup}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">{e.oracleCode}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{e.taxId}</TableCell>
                <TableCell>{e.start}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "Active" ? "default" : "secondary"} className={e.status === "Active" ? "bg-status-approved/10 text-status-approved border-status-approved/20" : ""}>
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/entities/${e.code}`)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Ban className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Company Identity" : "Add Company Identity"}</DialogTitle>
          </DialogHeader>

          {/* Warning Banner */}
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Oracle Company Code must exactly match Segment 1 in Oracle Fusion COA. Default for Makro Thailand is 10001.</span>
          </div>

          {/* SECTION 1 — Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Entity Code <span className="text-destructive">*</span></Label>
                <Input value={form.code} onChange={(e) => updateField("code", e.target.value)} placeholder="e.g. CPA001" />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Entity Type <span className="text-destructive">*</span></Label>
                <Select value={form.entityType} onValueChange={(v) => updateField("entityType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สำนักงานใหญ่">สำนักงานใหญ่</SelectItem>
                    <SelectItem value="สาขา">สาขา</SelectItem>
                  </SelectContent>
                </Select>
                {errors.entityType && <p className="text-xs text-destructive">{errors.entityType}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Legal Entity Name (TH) <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. บริษัท แม็คโคร จำกัด (มหาชน)" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Legal Entity Name (EN)</Label>
              <Input value={form.nameEn} onChange={(e) => updateField("nameEn", e.target.value)} placeholder="e.g. Makro Public Company Limited" />
            </div>

            <div className="space-y-1.5">
              <Label>Primary Tax ID</Label>
              <Input value={form.taxId} onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                updateField("taxId", v);
              }} placeholder="13 digits" maxLength={13} className="font-mono" />
              {errors.taxId && <p className="text-xs text-destructive">{errors.taxId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Effective Start Date</Label>
                <Input type="date" value={form.start} onChange={(e) => updateField("start", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Effective End Date</Label>
                <Input type="date" value={form.end} onChange={(e) => updateField("end", e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Switch checked={form.status === "Active"} onCheckedChange={(c) => updateField("status", c ? "Active" : "Inactive")} />
              <span className="text-sm text-muted-foreground">{form.status}</span>
            </div>
          </div>

          {/* SECTION 2 — Business Classification */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Business Classification</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Group <span className="text-destructive">*</span></Label>
                <Select value={form.businessGroup} onValueChange={(v) => updateField("businessGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {["Wholesale", "Retail", "Food Service", "Property-Mall", "International"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessGroup && <p className="text-xs text-destructive">{errors.businessGroup}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Oracle Company Code <span className="text-destructive">*</span></Label>
                <Input value={form.oracleCode} onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                  updateField("oracleCode", v);
                }} placeholder="e.g. 10001" maxLength={5} className="font-mono" />
                <p className="text-xs text-muted-foreground">Must match Oracle Fusion COA Segment 1</p>
                {errors.oracleCode && <p className="text-xs text-destructive">{errors.oracleCode}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>LOA Table Reference</Label>
              <Input value={form.loaRef} readOnly className="bg-muted cursor-not-allowed" placeholder="Auto-filled from Business Group" />
            </div>

            <div className="space-y-1.5">
              <Label>Default Currency <span className="text-destructive">*</span></Label>
              <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB — Thai Baht</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
            </div>
          </div>

          {/* SECTION 3 — Approval Authority */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Approval Authority</h3>

            <div className="space-y-1.5">
              <Label>Ultimate Approver</Label>
              <div className="relative">
                {form.ultimateApprover ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <span>{getEmployeeName(form.ultimateApprover)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => updateField("ultimateApprover", "")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="pl-9"
                    />
                    {employeeSearch && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                        {filteredEmployees(employeeSearch).map((emp) => (
                          <button key={emp.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => { updateField("ultimateApprover", emp.id); setEmployeeSearch(""); }}>
                            {emp.name} <span className="text-muted-foreground">({emp.id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Fallback approver when no one in chain has sufficient limit</p>
            </div>

            <div className="space-y-1.5">
              <Label>Finance Controller / CFO</Label>
              <div className="relative">
                {form.financeController ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <span>{getEmployeeName(form.financeController)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => updateField("financeController", "")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={cfoSearch}
                      onChange={(e) => setCfoSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="pl-9"
                    />
                    {cfoSearch && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                        {filteredEmployees(cfoSearch).map((emp) => (
                          <button key={emp.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => { updateField("financeController", emp.id); setCfoSearch(""); }}>
                            {emp.name} <span className="text-muted-foreground">({emp.id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Required co-signer for Over Budget and Tax Penalty items per LOA policy</p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleSave}>
              {editIndex !== null ? "Save Changes" : "Create Entity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
