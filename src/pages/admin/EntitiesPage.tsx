import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Eye, Pencil, Ban, Search } from "lucide-react";
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

export interface EntityAddress {
  addressNo: string;
  moo: string;
  soi: string;
  road: string;
  tambol: string;
  amphoe: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface EntityForm {
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
  address: EntityAddress;
}

const emptyAddress: EntityAddress = {
  addressNo: "", moo: "", soi: "", road: "",
  tambol: "", amphoe: "", province: "", postalCode: "", country: "Thailand",
};

const emptyForm: EntityForm = {
  code: "", name: "", nameEn: "", taxId: "", entityType: "",
  start: "", end: "", status: "Active",
  businessGroup: "Wholesale", oracleCode: "10001", loaRef: "ตาราง 1 (Wholesale)", currency: "",
  ultimateApprover: "", financeController: "",
  address: { ...emptyAddress },
};

export const mockEntities = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", nameEn: "CP Axtra Public Company Limited", businessGroup: "Wholesale", oracleCode: "10001", taxId: "0105500000001", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: "EMP001", financeController: "EMP002", address: { addressNo: "97/11", moo: "6", soi: "", road: "ถนนเทพารักษ์", tambol: "บางเสาธง", amphoe: "บางเสาธง", province: "สมุทรปราการ", postalCode: "10570", country: "Thailand" } },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด (มหาชน)", nameEn: "Makro Public Company Limited", businessGroup: "Wholesale", oracleCode: "10002", taxId: "0105500000002", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: "EMP003", financeController: "EMP004", address: { addressNo: "1468", moo: "", soi: "", road: "ถนนพัฒนาการ", tambol: "สวนหลวง", amphoe: "สวนหลวง", province: "กรุงเทพมหานคร", postalCode: "10250", country: "Thailand" } },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", nameEn: "Demo Company Limited", businessGroup: "Retail", oracleCode: "13000", taxId: "0105500000003", entityType: "สาขา", start: "2025-06-01", end: "2026-12-31", status: "Inactive", loaRef: "ตาราง 1 (Retail)", currency: "THB", ultimateApprover: "EMP005", financeController: "EMP001", address: { addressNo: "333", moo: "2", soi: "ซอยลาดพร้าว 1", road: "ถนนลาดพร้าว", tambol: "จอมพล", amphoe: "จตุจักร", province: "กรุงเทพมหานคร", postalCode: "10900", country: "Thailand" } },
];

export function composeFullAddress(addr: EntityAddress): string {
  const parts: string[] = [];
  if (addr.addressNo) parts.push(addr.addressNo);
  if (addr.moo) parts.push(`หมู่ที่ ${addr.moo}`);
  if (addr.soi) parts.push(addr.soi);
  if (addr.road) parts.push(addr.road);
  if (addr.tambol) parts.push(`ต.${addr.tambol}`);
  if (addr.amphoe) parts.push(`อ.${addr.amphoe}`);
  if (addr.province) parts.push(`จ.${addr.province}`);
  if (addr.postalCode) parts.push(addr.postalCode);
  return parts.join(" ");
}

export default function EntitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<EntityForm>({ ...emptyForm, address: { ...emptyAddress } });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const filtered = mockEntities.filter((e) => {
    if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
    if (search && !e.name.includes(search) && !e.nameEn.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.taxId.includes(search) && !e.oracleCode.includes(search)) return false;
    return true;
  });

  const openAdd = () => {
    setEditIndex(null);
    setForm({ ...emptyForm, address: { ...emptyAddress } });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (idx: number) => {
    const e = mockEntities[idx];
    setEditIndex(idx);
    setForm({ ...e, address: { ...e.address } });
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

  const updateAddress = (key: keyof EntityAddress, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
    const errKey = `address.${key}`;
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: undefined }));
  };

  const composedAddress = useMemo(() => composeFullAddress(form.address), [form.address]);

  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!form.code.trim()) errs.code = "Required";
    if (!form.name.trim()) errs.name = "Required";
    if (!form.entityType) errs.entityType = "Required";
    if (!form.businessGroup) errs.businessGroup = "Required";
    if (!form.oracleCode.trim()) errs.oracleCode = "Required";
    if (!form.currency) errs.currency = "Required";
    if (form.taxId && !/^\d{13}$/.test(form.taxId)) errs.taxId = "Must be exactly 13 digits";
    // Address validation
    if (!form.address.addressNo.trim()) errs["address.addressNo"] = "Required";
    if (!form.address.tambol.trim()) errs["address.tambol"] = "Required";
    if (!form.address.amphoe.trim()) errs["address.amphoe"] = "Required";
    if (!form.address.province.trim()) errs["address.province"] = "Required";
    if (!form.address.postalCode.trim()) errs["address.postalCode"] = "Required";
    if (!form.address.country) errs["address.country"] = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast.success(editIndex !== null ? "Entity updated successfully" : "Entity created successfully");
    setDialogOpen(false);
  };

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
              <TableHead>Tax ID</TableHead>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/entities/${e.code}/edit`)}><Pencil className="h-4 w-4" /></Button>
                    
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
              <Label>Tax ID</Label>
              <Input value={form.taxId} onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                updateField("taxId", v);
              }} placeholder="13 digits" maxLength={13} className="font-mono" />
              {errors.taxId && <p className="text-xs text-destructive">{errors.taxId}</p>}
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
                    {["Wholesale"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessGroup && <p className="text-xs text-destructive">{errors.businessGroup}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Oracle Company Code <span className="text-destructive">*</span></Label>
                <Input value={form.oracleCode} readOnly className="font-mono bg-muted cursor-default" />
              </div>
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

          {/* SECTION 3 — Address Information */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">Address Information</h3>

            {/* Composed full address (read-only) */}
            <div className="space-y-1.5">
              <Label>ที่อยู่ / Full Address</Label>
              <Input
                value={composedAddress}
                readOnly
                className="bg-amber-50 border-amber-200 text-foreground cursor-default"
              />
              <p className="text-xs text-muted-foreground">Auto-composed from address fields below</p>
            </div>

            {/* เลขที่ + หมู่ */}
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-1.5">
                <Label>เลขที่ <span className="text-destructive">*</span></Label>
                <Input value={form.address.addressNo} onChange={(e) => updateAddress("addressNo", e.target.value)} placeholder="e.g. 97/11" />
                {errors["address.addressNo"] && <p className="text-xs text-destructive">{errors["address.addressNo"]}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>หมู่</Label>
                <Input value={form.address.moo} onChange={(e) => updateAddress("moo", e.target.value)} placeholder="e.g. 6" />
              </div>
            </div>

            {/* ตรอก/ซอย */}
            <div className="space-y-1.5">
              <Label>ตรอก/ซอย</Label>
              <Input value={form.address.soi} onChange={(e) => updateAddress("soi", e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" />
            </div>

            {/* ถนน */}
            <div className="space-y-1.5">
              <Label>ถนน</Label>
              <Input value={form.address.road} onChange={(e) => updateAddress("road", e.target.value)} placeholder="e.g. ถนนลาดพร้าว" />
            </div>

            {/* ตำบล/แขวง */}
            <div className="space-y-1.5">
              <Label>ตำบล/แขวง <span className="text-destructive">*</span></Label>
              <Input value={form.address.tambol} onChange={(e) => updateAddress("tambol", e.target.value)} placeholder="e.g. จอมพล" />
              {errors["address.tambol"] && <p className="text-xs text-destructive">{errors["address.tambol"]}</p>}
            </div>

            {/* อำเภอ/เขต */}
            <div className="space-y-1.5">
              <Label>อำเภอ/เขต <span className="text-destructive">*</span></Label>
              <Input value={form.address.amphoe} onChange={(e) => updateAddress("amphoe", e.target.value)} placeholder="e.g. จตุจักร" />
              {errors["address.amphoe"] && <p className="text-xs text-destructive">{errors["address.amphoe"]}</p>}
            </div>

            {/* จังหวัด + รหัสไปรษณีย์ */}
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-1.5">
                <Label>จังหวัด <span className="text-destructive">*</span></Label>
                <Input value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} placeholder="e.g. กรุงเทพมหานคร" />
                {errors["address.province"] && <p className="text-xs text-destructive">{errors["address.province"]}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
                <Input value={form.address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} placeholder="e.g. 10240" />
                {errors["address.postalCode"] && <p className="text-xs text-destructive">{errors["address.postalCode"]}</p>}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5 w-1/2">
              <Label>Country <span className="text-destructive">*</span></Label>
              <Select value={form.address.country} onValueChange={(v) => updateAddress("country", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thailand">Thailand</SelectItem>
                  <SelectItem value="Cambodia">Cambodia</SelectItem>
                  <SelectItem value="Myanmar">Myanmar</SelectItem>
                </SelectContent>
              </Select>
              {errors["address.country"] && <p className="text-xs text-destructive">{errors["address.country"]}</p>}
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
