import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { mockEntities, composeFullAddress, type EntityForm, type EntityAddress } from "./EntitiesPage";

const loaMap: Record<string, string> = {
  Wholesale: "ตาราง 1 (Wholesale)",
  Retail: "ตาราง 1 (Retail)",
  "Food Service": "ตาราง 2 (Food Service)",
  "Property-Mall": "ตาราง 3 (Property-Mall)",
  International: "ตาราง 4 (International)",
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="border-b mt-2" />
  </div>
);

const Req = () => <span className="text-destructive">*</span>;

export default function EntityEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const original = mockEntities.find((e) => e.code === id);

  const [form, setForm] = useState<EntityForm>(
    original ? { ...original, address: { ...original.address } } : ({} as EntityForm)
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const composedAddress = useMemo(() => (form.address ? composeFullAddress(form.address) : ""), [form.address]);

  if (!original) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Entity not found</p>
      </div>
    );
  }

  const updateField = <K extends keyof EntityForm>(key: K, value: EntityForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "businessGroup") {
        next.loaRef = loaMap[value as string] || "";
      }
      return next;
    });
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key as string]: undefined }));
  };

  const updateAddress = (key: keyof EntityAddress, value: string) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    const errKey = `address.${key}`;
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!form.code?.trim()) errs.code = "Required";
    if (!form.name?.trim()) errs.name = "Required";
    if (!form.entityType) errs.entityType = "Required";
    if (!form.businessGroup) errs.businessGroup = "Required";
    if (!form.oracleCode?.trim()) errs.oracleCode = "Required";
    if (!form.currency) errs.currency = "Required";
    if (form.taxId && !/^\d{13}$/.test(form.taxId)) errs.taxId = "Must be exactly 13 digits";
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
    toast.success("Entity updated successfully");
    navigate("/admin/entities");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-32">
        <Link
          to="/admin/entities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Entities
        </Link>

        <h1 className="text-3xl font-bold text-foreground">Edit Company Identity</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {original.code} · {original.nameEn || original.name} · {original.taxId || "—"}
        </p>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8 space-y-10">
          {/* Basic Information */}
          <section>
            <SectionHeader title="Basic Information" />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Entity Code <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.code} onChange={(e) => updateField("code", e.target.value)} placeholder="e.g. CPA001" />
                  {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
                </div>
                <div>
                  <Label>Entity Type <Req /></Label>
                  <Select value={form.entityType} onValueChange={(v) => updateField("entityType", v)}>
                    <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="สำนักงานใหญ่">สำนักงานใหญ่</SelectItem>
                      <SelectItem value="สาขา">สาขา</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.entityType && <p className="text-xs text-destructive mt-1">{errors.entityType}</p>}
                </div>
              </div>

              <div>
                <Label>Legal Entity Name (TH) <Req /></Label>
                <Input className="mt-1.5 rounded-md border-gray-300" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. บริษัท แม็คโคร จำกัด (มหาชน)" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Legal Entity Name (EN)</Label>
                <Input className="mt-1.5 rounded-md border-gray-300" value={form.nameEn} onChange={(e) => updateField("nameEn", e.target.value)} placeholder="e.g. Makro Public Company Limited" />
              </div>

              <div>
                <Label>Tax ID</Label>
                <Input
                  className="mt-1.5 rounded-md border-gray-300 font-mono"
                  value={form.taxId}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                    updateField("taxId", v);
                  }}
                  placeholder="13 digits"
                  maxLength={13}
                />
                {errors.taxId && <p className="text-xs text-destructive mt-1">{errors.taxId}</p>}
              </div>

              <div className="flex items-center gap-3">
                <Label>Status</Label>
                <Switch checked={form.status === "Active"} onCheckedChange={(c) => updateField("status", c ? "Active" : "Inactive")} />
                <span className="text-sm text-muted-foreground">{form.status}</span>
              </div>
            </div>
          </section>

          {/* Business Classification */}
          <section>
            <SectionHeader title="Business Classification" />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Business Group <Req /></Label>
                  <Select value={form.businessGroup} onValueChange={(v) => updateField("businessGroup", v)}>
                    <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {["Wholesale"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessGroup && <p className="text-xs text-destructive mt-1">{errors.businessGroup}</p>}
                </div>
                <div>
                  <Label>Oracle Company Code <Req /></Label>
                  <Input value={form.oracleCode} readOnly className="mt-1.5 rounded-md border-gray-300 font-mono bg-muted cursor-default" />
                </div>
              </div>

              <div>
                <Label>Default Currency <Req /></Label>
                <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB — Thai Baht</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-xs text-destructive mt-1">{errors.currency}</p>}
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section>
            <SectionHeader title="Address Information" />
            <div className="space-y-5">
              <div>
                <Label>ที่อยู่ / Full Address</Label>
                <Input
                  value={composedAddress}
                  readOnly
                  className="mt-1.5 rounded-md bg-amber-50 border-amber-200 text-foreground cursor-default"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-composed from address fields below</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>เลขที่ <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.addressNo} onChange={(e) => updateAddress("addressNo", e.target.value)} placeholder="e.g. 97/11" />
                  {errors["address.addressNo"] && <p className="text-xs text-destructive mt-1">{errors["address.addressNo"]}</p>}
                </div>
                <div>
                  <Label>หมู่</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.moo} onChange={(e) => updateAddress("moo", e.target.value)} placeholder="e.g. 6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>ตรอก/ซอย</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.soi} onChange={(e) => updateAddress("soi", e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" />
                </div>
                <div>
                  <Label>ถนน</Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.road} onChange={(e) => updateAddress("road", e.target.value)} placeholder="e.g. ถนนลาดพร้าว" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>ตำบล/แขวง <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.tambol} onChange={(e) => updateAddress("tambol", e.target.value)} placeholder="e.g. จอมพล" />
                  {errors["address.tambol"] && <p className="text-xs text-destructive mt-1">{errors["address.tambol"]}</p>}
                </div>
                <div>
                  <Label>อำเภอ/เขต <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.amphoe} onChange={(e) => updateAddress("amphoe", e.target.value)} placeholder="e.g. จตุจักร" />
                  {errors["address.amphoe"] && <p className="text-xs text-destructive mt-1">{errors["address.amphoe"]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>จังหวัด <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} placeholder="e.g. กรุงเทพมหานคร" />
                  {errors["address.province"] && <p className="text-xs text-destructive mt-1">{errors["address.province"]}</p>}
                </div>
                <div>
                  <Label>รหัสไปรษณีย์ <Req /></Label>
                  <Input className="mt-1.5 rounded-md border-gray-300" value={form.address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} placeholder="e.g. 10240" />
                  {errors["address.postalCode"] && <p className="text-xs text-destructive mt-1">{errors["address.postalCode"]}</p>}
                </div>
              </div>

              <div>
                <Label>Country <Req /></Label>
                <Select value={form.address.country} onValueChange={(v) => updateAddress("country", v)}>
                  <SelectTrigger className="mt-1.5 rounded-md border-gray-300"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thailand">Thailand</SelectItem>
                    <SelectItem value="Cambodia">Cambodia</SelectItem>
                    <SelectItem value="Myanmar">Myanmar</SelectItem>
                  </SelectContent>
                </Select>
                {errors["address.country"] && <p className="text-xs text-destructive mt-1">{errors["address.country"]}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/entities")}>Cancel</Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
