import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  PageShell,
  PageHeader,
  SectionCard,
  FormGrid,
  FormField,
  FormActions,
  RequiredMark,
} from "@/components/layout";
import { mockEntities, composeFullAddress, type EntityForm, type EntityAddress } from "./EntitiesPage";

const loaMap: Record<string, string> = {
  Wholesale: "ตาราง 1 (Wholesale)",
  Retail: "ตาราง 1 (Retail)",
  "Food Service": "ตาราง 2 (Food Service)",
  "Property-Mall": "ตาราง 3 (Property-Mall)",
  International: "ตาราง 4 (International)",
};

export default function EntityEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const original = mockEntities.find((e) => e.code === id);

  const initialForm = useRef<EntityForm | null>(
    original ? { ...original, address: { ...original.address } } : null
  );
  const [form, setForm] = useState<EntityForm>(
    original ? { ...original, address: { ...original.address } } : ({} as EntityForm)
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const composedAddress = useMemo(() => (form.address ? composeFullAddress(form.address) : ""), [form.address]);

  const isDirty = useCallback(() => {
    if (!initialForm.current) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm.current);
  }, [form]);

  if (!original) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Entity not found</p>
      </PageShell>
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

  const dirty = isDirty();

  return (
    <PageShell
      header={
        <PageHeader
          onBack={() => navigate("/admin/entities")}
          backLabel="Back to Entities"
          title="Edit Company Identity"
          subtitle={`${original.code} · ${original.nameEn || original.name} · ${original.taxId || "—"}`}
        />
      }
    >
      <SectionCard title="Basic Information">
        <FormGrid>
          <FormField>
            <Label className="text-sm">Entity Code <RequiredMark /></Label>
            <Input value={form.code} onChange={(e) => updateField("code", e.target.value)} placeholder="e.g. CPA001" />
            {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">Entity Type <RequiredMark /></Label>
            <Select value={form.entityType} onValueChange={(v) => updateField("entityType", v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="สำนักงานใหญ่">สำนักงานใหญ่</SelectItem>
                <SelectItem value="สาขา">สาขา</SelectItem>
              </SelectContent>
            </Select>
            {errors.entityType && <p className="text-xs text-destructive mt-1">{errors.entityType}</p>}
          </FormField>
        </FormGrid>

        <FormField>
          <Label className="text-sm">Legal Entity Name (TH) <RequiredMark /></Label>
          <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. บริษัท แม็คโคร จำกัด (มหาชน)" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </FormField>

        <FormField>
          <Label className="text-sm">Legal Entity Name (EN)</Label>
          <Input value={form.nameEn} onChange={(e) => updateField("nameEn", e.target.value)} placeholder="e.g. Makro Public Company Limited" />
        </FormField>

        <FormField>
          <Label className="text-sm">Tax ID</Label>
          <Input
            className="font-mono"
            value={form.taxId}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 13);
              updateField("taxId", v);
            }}
            placeholder="13 digits"
            maxLength={13}
          />
          {errors.taxId && <p className="text-xs text-destructive mt-1">{errors.taxId}</p>}
        </FormField>

        <div className="flex items-center gap-3">
          <Label className="text-sm">Status</Label>
          <Switch checked={form.status === "Active"} onCheckedChange={(c) => updateField("status", c ? "Active" : "Inactive")} />
          <span className="text-sm text-muted-foreground">{form.status}</span>
        </div>
      </SectionCard>

      <SectionCard title="Business Classification">
        <FormGrid>
          <FormField>
            <Label className="text-sm">Business Group <RequiredMark /></Label>
            <Select value={form.businessGroup} onValueChange={(v) => updateField("businessGroup", v)}>
              <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
              <SelectContent>
                {["Wholesale"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessGroup && <p className="text-xs text-destructive mt-1">{errors.businessGroup}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">Oracle Company Code <RequiredMark /></Label>
            <Input value={form.oracleCode} readOnly className="font-mono bg-muted cursor-default" />
          </FormField>
        </FormGrid>

        <FormField>
          <Label className="text-sm">Default Currency <RequiredMark /></Label>
          <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
            <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="THB">THB — Thai Baht</SelectItem>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
              <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
            </SelectContent>
          </Select>
          {errors.currency && <p className="text-xs text-destructive mt-1">{errors.currency}</p>}
        </FormField>
      </SectionCard>

      <SectionCard title="Address Information">
        <FormField>
          <Label className="text-sm">ที่อยู่ / Full Address</Label>
          <Input value={composedAddress} readOnly className="bg-muted/40 cursor-default" />
          <p className="text-xs text-muted-foreground">Auto-composed from address fields below</p>
        </FormField>

        <FormGrid>
          <FormField>
            <Label className="text-sm">เลขที่ <RequiredMark /></Label>
            <Input value={form.address.addressNo} onChange={(e) => updateAddress("addressNo", e.target.value)} placeholder="e.g. 97/11" />
            {errors["address.addressNo"] && <p className="text-xs text-destructive mt-1">{errors["address.addressNo"]}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">หมู่</Label>
            <Input value={form.address.moo} onChange={(e) => updateAddress("moo", e.target.value)} placeholder="e.g. 6" />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">ตรอก/ซอย</Label>
            <Input value={form.address.soi} onChange={(e) => updateAddress("soi", e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" />
          </FormField>
          <FormField>
            <Label className="text-sm">ถนน</Label>
            <Input value={form.address.road} onChange={(e) => updateAddress("road", e.target.value)} placeholder="e.g. ถนนลาดพร้าว" />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">ตำบล/แขวง <RequiredMark /></Label>
            <Input value={form.address.tambol} onChange={(e) => updateAddress("tambol", e.target.value)} placeholder="e.g. จอมพล" />
            {errors["address.tambol"] && <p className="text-xs text-destructive mt-1">{errors["address.tambol"]}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">อำเภอ/เขต <RequiredMark /></Label>
            <Input value={form.address.amphoe} onChange={(e) => updateAddress("amphoe", e.target.value)} placeholder="e.g. จตุจักร" />
            {errors["address.amphoe"] && <p className="text-xs text-destructive mt-1">{errors["address.amphoe"]}</p>}
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">จังหวัด <RequiredMark /></Label>
            <Input value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} placeholder="e.g. กรุงเทพมหานคร" />
            {errors["address.province"] && <p className="text-xs text-destructive mt-1">{errors["address.province"]}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">รหัสไปรษณีย์ <RequiredMark /></Label>
            <Input value={form.address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} placeholder="e.g. 10240" />
            {errors["address.postalCode"] && <p className="text-xs text-destructive mt-1">{errors["address.postalCode"]}</p>}
          </FormField>
        </FormGrid>

        <FormField>
          <Label className="text-sm">Country <RequiredMark /></Label>
          <Select value={form.address.country} onValueChange={(v) => updateAddress("country", v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Thailand">Thailand</SelectItem>
              <SelectItem value="Cambodia">Cambodia</SelectItem>
              <SelectItem value="Myanmar">Myanmar</SelectItem>
            </SelectContent>
          </Select>
          {errors["address.country"] && <p className="text-xs text-destructive mt-1">{errors["address.country"]}</p>}
        </FormField>
      </SectionCard>

      <FormActions
        isDirty={dirty}
        secondary={<Button variant="outline" onClick={() => navigate("/admin/entities")}>Cancel</Button>}
        primary={<Button onClick={handleSave}>Save Changes</Button>}
      />
    </PageShell>
  );
}
