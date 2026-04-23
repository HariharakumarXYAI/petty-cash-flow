import { useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { stores } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export default function StoreNew() {
  const navigate = useNavigate();

  const initialValues = useRef({
    storeName: "",
    thaiName: "",
    legalEntity: "",
    type: "",
    taxId: "",
    pp20Code: "",
    branchAcctCode: "",
    houseNo: "",
    moo: "",
    soi: "",
    street: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    country: "",
    pettyCashFund: 0,
    minBalance: 0,
    replenishAt: 0,
  });

  const [storeName, setStoreName] = useState("");
  const [thaiName, setThaiName] = useState("");
  const [legalEntity, setLegalEntity] = useState("");
  const [type, setType] = useState("");
  const [taxId, setTaxId] = useState("");
  const [pp20Code, setPp20Code] = useState("");
  const [branchAcctCode, setBranchAcctCode] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [moo, setMoo] = useState("");
  const [soi, setSoi] = useState("");
  const [street, setStreet] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const [pettyCashFund, setPettyCashFund] = useState(0);
  const [minBalance, setMinBalance] = useState(0);
  const [replenishAt, setReplenishAt] = useState(0);

  const [taxIdError, setTaxIdError] = useState("");
  const [branchCodeError, setBranchCodeError] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showZeroFundDialog, setShowZeroFundDialog] = useState(false);
  const [showDuplicateNameDialog, setShowDuplicateNameDialog] = useState(false);

  const composedAddress = useMemo(() => {
    const parts = [
      houseNo,
      moo ? `หมู่ที่ ${moo}` : "",
      soi,
      street,
      subDistrict ? `ต.${subDistrict}` : "",
      district ? `อ.${district}` : "",
      province ? `จ.${province}` : "",
      postalCode,
    ].filter(Boolean);
    return parts.join(" ");
  }, [houseNo, moo, soi, street, subDistrict, district, province, postalCode]);

  const isDirty = useCallback(() => {
    const iv = initialValues.current;
    return (
      storeName !== iv.storeName ||
      thaiName !== iv.thaiName ||
      legalEntity !== iv.legalEntity ||
      type !== iv.type ||
      taxId !== iv.taxId ||
      pp20Code !== iv.pp20Code ||
      branchAcctCode !== iv.branchAcctCode ||
      houseNo !== iv.houseNo ||
      moo !== iv.moo ||
      soi !== iv.soi ||
      street !== iv.street ||
      subDistrict !== iv.subDistrict ||
      district !== iv.district ||
      province !== iv.province ||
      postalCode !== iv.postalCode ||
      country !== iv.country ||
      pettyCashFund !== iv.pettyCashFund ||
      minBalance !== iv.minBalance ||
      replenishAt !== iv.replenishAt
    );
  }, [storeName, thaiName, legalEntity, type, taxId, pp20Code, branchAcctCode, houseNo, moo, soi, street, subDistrict, district, province, postalCode, country, pettyCashFund, minBalance, replenishAt]);

  const dirty = isDirty();

  const handleBack = () => {
    if (dirty) setShowUnsavedDialog(true);
    else navigate("/masters/stores");
  };

  const handleSave = () => {
    const digitsOnly = taxId.replace(/\D/g, "");
    if (digitsOnly.length !== 13) {
      setTaxIdError("Tax ID must be exactly 13 digits");
      return;
    }
    setTaxIdError("");

    const branchExists = false; // mock
    if (branchExists) {
      setBranchCodeError("Branch Code must be unique");
      return;
    }
    setBranchCodeError("");

    if (pettyCashFund === 0 && minBalance === 0 && replenishAt === 0) {
      setShowZeroFundDialog(true);
      return;
    }

    const nameExists = stores.some(s => s.name.toLowerCase() === storeName.trim().toLowerCase());
    if (nameExists) {
      setShowDuplicateNameDialog(true);
      return;
    }

    performSave();
  };

  const performSave = () => {
    try {
      toast.success("Store created successfully");
      navigate("/masters/stores");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  return (
    <PageShell
      header={
        <PageHeader
          onBack={handleBack}
          backLabel="Back to Stores"
          title="Add New Store"
          subtitle="Create a new store with petty cash fund configuration"
        />
      }
    >
      {/* Store Information */}
      <SectionCard title="Store Information">
        <FormField>
          <Label className="text-sm">Store Name (EN) <RequiredMark /></Label>
          <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. Makro Ladprao" />
        </FormField>

        <FormField>
          <Label className="text-sm">Thai Store Name (ชื่อสถานประกอบการ) <RequiredMark /></Label>
          <Input value={thaiName} onChange={e => setThaiName(e.target.value)} placeholder="e.g. แม็คโคร ลาดพร้าว" />
        </FormField>

        <FormField>
          <Label className="text-sm">Legal Entity</Label>
          <Input value={legalEntity} onChange={e => setLegalEntity(e.target.value)} placeholder="e.g. Siam Makro PCL" />
        </FormField>

        <FormGrid>
          <FormField>
            <Label className="text-sm">Type <RequiredMark /></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                <SelectItem value="Supermarket">Supermarket</SelectItem>
                <SelectItem value="Mini">Mini</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <Label className="text-sm">Tax ID (เลขประจำตัวผู้เสียภาษี) <RequiredMark /></Label>
            <Input
              className={taxIdError ? "border-destructive" : ""}
              placeholder="e.g. 0107536000382"
              value={taxId}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                setTaxId(v);
                if (taxIdError) setTaxIdError("");
              }}
              maxLength={13}
            />
            {taxIdError && <p className="text-xs text-destructive mt-1">{taxIdError}</p>}
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">Branch Code <RequiredMark /></Label>
            <Input
              className={branchCodeError ? "border-destructive" : ""}
              value={pp20Code}
              onChange={e => { setPp20Code(e.target.value); if (branchCodeError) setBranchCodeError(""); }}
              placeholder="e.g. 00002"
            />
            {branchCodeError && <p className="text-xs text-destructive mt-1">{branchCodeError}</p>}
          </FormField>
          <FormField>
            <Label className="text-sm">Branch Accounting Code <RequiredMark /></Label>
            <Input value={branchAcctCode} onChange={e => setBranchAcctCode(e.target.value)} placeholder="e.g. 010002" maxLength={10} />
            <p className="text-xs text-muted-foreground">Oracle Fusion ERP branch code</p>
          </FormField>
        </FormGrid>

        <FormField>
          <Label className="text-sm">Full Address (ที่อยู่)</Label>
          <Input className="bg-muted/40" readOnly value={composedAddress} />
          <p className="text-xs text-muted-foreground">Auto-composed from address fields below</p>
        </FormField>

        <FormGrid>
          <FormField>
            <Label className="text-sm">House No. (เลขที่) <RequiredMark /></Label>
            <Input value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 34/54" />
          </FormField>
          <FormField>
            <Label className="text-sm">Moo (หมู่)</Label>
            <Input value={moo} onChange={e => setMoo(e.target.value)} placeholder="e.g. 1" />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">Soi/Alley (ตรอก/ซอย)</Label>
            <Input value={soi} onChange={e => setSoi(e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" />
          </FormField>
          <FormField>
            <Label className="text-sm">Street (ถนน)</Label>
            <Input value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. ถนนลาดพร้าว" />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">Sub-district (ตำบล/แขวง) <RequiredMark /></Label>
            <Input value={subDistrict} onChange={e => setSubDistrict(e.target.value)} placeholder="e.g. คลองเกลือ" />
          </FormField>
          <FormField>
            <Label className="text-sm">District (อำเภอ/เขต) <RequiredMark /></Label>
            <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. ปากเกร็ด" />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField>
            <Label className="text-sm">Province (จังหวัด) <RequiredMark /></Label>
            <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. นนทบุรี" />
          </FormField>
          <FormField>
            <Label className="text-sm">Postal Code (รหัสไปรษณีย์) <RequiredMark /></Label>
            <Input value={postalCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setPostalCode(v); }} placeholder="e.g. 10240" maxLength={5} />
          </FormField>
        </FormGrid>

        <FormField>
          <Label className="text-sm">Country <RequiredMark /></Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TH">Thailand</SelectItem>
              <SelectItem value="KH">Cambodia</SelectItem>
              <SelectItem value="MM">Myanmar</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </SectionCard>

      {/* Petty Cash Fund Configuration */}
      <SectionCard
        title="Petty Cash Fund Configuration"
        description="Set the petty cash fund and replenishment trigger for this store."
      >
        <FormGrid>
          <FormField>
            <Label className="text-sm">Petty Cash Fund</Label>
            <Input className="tabular-nums" type="number" value={pettyCashFund} onChange={e => setPettyCashFund(Number(e.target.value))} />
          </FormField>
          <FormField>
            <Label className="text-sm">Minimum Balance</Label>
            <Input className="tabular-nums" type="number" value={minBalance} onChange={e => setMinBalance(Number(e.target.value))} />
          </FormField>
          <FormField>
            <Label className="text-sm">Replenish At</Label>
            <Input className="tabular-nums" type="number" value={replenishAt} onChange={e => setReplenishAt(Number(e.target.value))} />
            {replenishAt > pettyCashFund && (
              <p className="text-xs text-status-hold">Replenishment threshold is above the petty cash fund limit</p>
            )}
          </FormField>
        </FormGrid>
      </SectionCard>

      <FormActions
        isDirty={dirty}
        secondary={<Button variant="outline" onClick={handleBack}>Cancel</Button>}
        primary={<Button onClick={handleSave}>Create Store</Button>}
      />

      {/* Unsaved changes */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Unsaved changes will be lost. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/masters/stores")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Zero fund */}
      <AlertDialog open={showZeroFundDialog} onOpenChange={setShowZeroFundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Zero Limits</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? All petty cash fund limits are set to zero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowZeroFundDialog(false); performSave(); }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate name */}
      <AlertDialog open={showDuplicateNameDialog} onOpenChange={setShowDuplicateNameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Store Name</AlertDialogTitle>
            <AlertDialogDescription>
              A store with this name already exists. Continue anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDuplicateNameDialog(false); performSave(); }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
