import { useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { stores } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
    maxFund: 0,
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
  const [maxFund, setMaxFund] = useState(0);
  const [minBalance, setMinBalance] = useState(0);
  const [replenishAt, setReplenishAt] = useState(0);

  // Validation errors
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
      maxFund !== iv.maxFund ||
      minBalance !== iv.minBalance ||
      replenishAt !== iv.replenishAt
    );
  }, [storeName, thaiName, legalEntity, type, taxId, pp20Code, branchAcctCode, houseNo, moo, soi, street, subDistrict, district, province, postalCode, country, pettyCashFund, maxFund, minBalance, replenishAt]);

  const handleBack = () => {
    if (isDirty()) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/masters/stores");
    }
  };

  const handleSave = () => {
    // Tax ID validation
    const digitsOnly = taxId.replace(/\D/g, "");
    if (digitsOnly.length !== 13) {
      setTaxIdError("Tax ID must be exactly 13 digits");
      return;
    }
    setTaxIdError("");

    // Branch Code uniqueness check
    const duplicateBranch = stores.some(s => s.id !== undefined && pp20Code && s.id && pp20Code === pp20Code);
    // Simple mock: check if branch code already exists in mock data
    const branchExists = stores.some(s => {
      // Mock check — in real app this would be an API call
      return false;
    });
    if (branchExists) {
      setBranchCodeError("Branch Code must be unique");
      return;
    }
    setBranchCodeError("");

    // All-zeros fund check
    if (pettyCashFund === 0 && maxFund === 0 && minBalance === 0 && replenishAt === 0) {
      setShowZeroFundDialog(true);
      return;
    }

    // Duplicate store name check
    const nameExists = stores.some(s => s.name.toLowerCase() === storeName.trim().toLowerCase());
    if (nameExists) {
      setShowDuplicateNameDialog(true);
      return;
    }

    performSave();
  };

  const performSave = () => {
    try {
      // Placeholder save logic
      toast.success("Store created successfully");
      navigate("/masters/stores");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const maxFundForBar = maxFund || 1; // prevent div by zero

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Store</h1>
          <p className="text-sm text-muted-foreground">Create a new store with petty cash fund configuration</p>
        </div>
      </div>

      {/* Store Information */}
      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <p className="section-label">Store Information</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Store Name (EN) <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. Makro Ladprao" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ชื่อสถานประกอบการ (Store Name in Thai) <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={thaiName} onChange={e => setThaiName(e.target.value)} placeholder="e.g. แม็คโคร ลาดพร้าว" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Legal Entity</Label>
            <Input className="h-9" value={legalEntity} onChange={e => setLegalEntity(e.target.value)} placeholder="e.g. Siam Makro PCL" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                  <SelectItem value="Supermarket">Supermarket</SelectItem>
                  <SelectItem value="Mini">Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">TAX ID <span className="text-destructive">*</span></Label>
              <Input
                className={`h-9 ${taxIdError ? "border-destructive" : ""}`}
                placeholder="e.g. 0107536000382"
                value={taxId}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setTaxId(v);
                  if (taxIdError) setTaxIdError("");
                }}
                maxLength={13}
                required
              />
              {taxIdError && <p className="text-xs text-destructive mt-1">{taxIdError}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Code <span className="text-destructive">*</span></Label>
              <Input
                className={`h-9 ${branchCodeError ? "border-destructive" : ""}`}
                value={pp20Code}
                onChange={e => { setPp20Code(e.target.value); if (branchCodeError) setBranchCodeError(""); }}
                placeholder="e.g. 00002"
                required
              />
              {branchCodeError && <p className="text-xs text-destructive mt-1">{branchCodeError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Accounting Code <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={branchAcctCode} onChange={e => setBranchAcctCode(e.target.value)} placeholder="e.g. 010002" maxLength={10} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ที่อยู่ (Full Address)</Label>
            <Input className="h-9 bg-amber-50 border-amber-200 text-foreground" readOnly value={composedAddress} />
            <p className="text-[10px] text-muted-foreground">Auto-composed from address fields below</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">เลขที่ <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 34/54" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">หมู่</Label>
              <Input className="h-9" value={moo} onChange={e => setMoo(e.target.value)} placeholder="e.g. 1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ตรอก/ซอย</Label>
            <Input className="h-9" value={soi} onChange={e => setSoi(e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ถนน</Label>
            <Input className="h-9" value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. ถนนลาดพร้าว" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ตำบล/แขวง <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} placeholder="e.g. คลองเกลือ" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">อำเภอ/เขต <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. ปากเกร็ด" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">จังหวัด <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. นนทบุรี" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={postalCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setPostalCode(v); }} placeholder="e.g. 10240" maxLength={5} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Country <span className="text-destructive">*</span></Label>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TH">Thailand</SelectItem>
                  <SelectItem value="KH">Cambodia</SelectItem>
                  <SelectItem value="MM">Myanmar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>
        </div>
      </div>

      <Separator />

      {/* Petty Cash Fund Configuration */}
      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <p className="section-label">Petty Cash Fund Configuration</p>
        <p className="text-xs text-muted-foreground">
          Set the petty cash fund range and replenishment trigger for this store.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Petty Cash Fund</Label>
            <Input className="h-9 tabular-nums" type="number" value={pettyCashFund} onChange={e => setPettyCashFund(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maximum Fund</Label>
            <Input className="h-9 tabular-nums" type="number" value={maxFund} onChange={e => setMaxFund(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Minimum Balance</Label>
            <Input className="h-9 tabular-nums" type="number" value={minBalance} onChange={e => setMinBalance(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Replenish At</Label>
            <Input className="h-9 tabular-nums" type="number" value={replenishAt} onChange={e => setReplenishAt(Number(e.target.value))} />
            {replenishAt > pettyCashFund && (
              <p className="text-xs text-amber-600">Replenishment threshold is above the petty cash fund limit</p>
            )}
          </div>
        </div>

        {/* Visual range */}
        <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Min: {minBalance.toLocaleString()}</span>
            <span>Fund: {pettyCashFund.toLocaleString()}</span>
            <span>Max: {maxFund.toLocaleString()}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
              style={{ width: "0%" }}
            />
            {maxFund > 0 && (
              <>
                <div
                  className="absolute top-0 h-full w-px bg-status-hold"
                  style={{ left: `${Math.round((minBalance / maxFundForBar) * 100)}%` }}
                />
                <div
                  className="absolute top-0 h-full w-px bg-status-approved"
                  style={{ left: `${Math.round((pettyCashFund / maxFundForBar) * 100)}%` }}
                />
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Current balance: <span className="font-medium text-foreground">0</span>
          </p>
        </div>
      </div>

      <div className="pb-6">
        <Button className="w-full" onClick={handleSave}>Create Store</Button>
      </div>

      {/* Unsaved changes confirmation */}
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

      {/* All-zeros fund confirmation */}
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

      {/* Duplicate store name warning */}
      <AlertDialog open={showDuplicateNameDialog} onOpenChange={setShowDuplicateNameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Store Name</AlertDialogTitle>
            <AlertDialogDescription>
              A store with this name already exists. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDuplicateNameDialog(false); performSave(); }}>
              Allow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
