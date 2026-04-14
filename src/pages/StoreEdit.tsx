import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { stores } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
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
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function StoreEdit() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = stores.find(s => s.id === storeId);

  // HO Finance can only edit Petty Cash Fund section; everything else is read-only
  const isInfoReadOnly = user?.role === "ho_finance";

  // --- Initial values (used for dirty check) ---
  const initialValues = useRef({
    thaiName: "แม็คโคร ลาดพร้าว",
    pp20Code: "00002",
    branchAcctCode: "010001",
    taxId: "",
    houseNo: "34/54",
    moo: "1",
    soi: "",
    street: "",
    subDistrict: "คลองเกลือ",
    district: "ปากเกร็ด",
    province: "นนทบุรี",
    postalCode: "",
    pettyCashFund: store?.floatLimit ?? 0,
    maxFund: store?.maxFloat ?? 0,
    minBalance: store?.minBalance ?? 0,
    replenishAt: store?.replenishmentThreshold ?? 0,
  });

  const [thaiName, setThaiName] = useState(initialValues.current.thaiName);
  const [pp20Code, setPp20Code] = useState(initialValues.current.pp20Code);
  const [branchAcctCode, setBranchAcctCode] = useState(initialValues.current.branchAcctCode);
  const [taxId, setTaxId] = useState(initialValues.current.taxId);
  const [houseNo, setHouseNo] = useState(initialValues.current.houseNo);
  const [moo, setMoo] = useState(initialValues.current.moo);
  const [soi, setSoi] = useState(initialValues.current.soi);
  const [street, setStreet] = useState(initialValues.current.street);
  const [subDistrict, setSubDistrict] = useState(initialValues.current.subDistrict);
  const [district, setDistrict] = useState(initialValues.current.district);
  const [province, setProvince] = useState(initialValues.current.province);
  const [postalCode, setPostalCode] = useState(initialValues.current.postalCode);

  // Petty cash fund fields
  const [pettyCashFund, setPettyCashFund] = useState(initialValues.current.pettyCashFund);
  const [maxFund, setMaxFund] = useState(initialValues.current.maxFund);
  const [minBalance, setMinBalance] = useState(initialValues.current.minBalance);
  const [replenishAt, setReplenishAt] = useState(initialValues.current.replenishAt);

  // Validation & dialog state
  const [taxIdError, setTaxIdError] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showZeroFundDialog, setShowZeroFundDialog] = useState(false);

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

  // --- Dirty check ---
  const isDirty = useCallback(() => {
    const iv = initialValues.current;
    return (
      thaiName !== iv.thaiName ||
      pp20Code !== iv.pp20Code ||
      branchAcctCode !== iv.branchAcctCode ||
      taxId !== iv.taxId ||
      houseNo !== iv.houseNo ||
      moo !== iv.moo ||
      soi !== iv.soi ||
      street !== iv.street ||
      subDistrict !== iv.subDistrict ||
      district !== iv.district ||
      province !== iv.province ||
      postalCode !== iv.postalCode ||
      pettyCashFund !== iv.pettyCashFund ||
      maxFund !== iv.maxFund ||
      minBalance !== iv.minBalance ||
      replenishAt !== iv.replenishAt
    );
  }, [thaiName, pp20Code, branchAcctCode, taxId, houseNo, moo, soi, street, subDistrict, district, province, postalCode, pettyCashFund, maxFund, minBalance, replenishAt]);

  // --- Back navigation with unsaved check ---
  const handleBack = () => {
    if (isDirty()) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/masters/stores");
    }
  };

  // --- Save handler ---
  const handleSave = () => {
    // Fix 1: Tax ID validation (on save)
    const digitsOnly = taxId.replace(/\D/g, "");
    if (digitsOnly.length !== 13) {
      setTaxIdError("Tax ID must be exactly 13 digits");
      return;
    }
    setTaxIdError("");

    // Fix 3: All-zeros fund check
    if (pettyCashFund === 0 && maxFund === 0 && minBalance === 0 && replenishAt === 0) {
      setShowZeroFundDialog(true);
      return;
    }

    performSave();
  };

  const performSave = () => {
    // Placeholder save logic
    navigate("/masters/stores");
  };

  if (!store) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/masters/stores")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Stores
        </Button>
        <p className="text-muted-foreground">Store not found.</p>
      </div>
    );
  }

  const isLow = store.currentBalance <= store.minBalance * 1.3;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Store</h1>
          <p className="text-sm text-muted-foreground">{store.name} · {store.country} · {store.currency}</p>
        </div>
      </div>

      {/* Low Balance Warning */}
      {isLow && (
        <div className="flex items-start gap-2 rounded-md bg-status-hold/5 border border-status-hold/15 p-3">
          <AlertTriangle className="h-4 w-4 text-status-hold mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-status-hold">Low Balance Warning</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current balance ({store.currentBalance.toLocaleString()}) is near or below minimum ({store.minBalance.toLocaleString()}).
            </p>
          </div>
        </div>
      )}

      {/* Store Information */}
      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-label">Store Information</p>
          {isInfoReadOnly && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Read-only for your role</span>
          )}
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">ชื่อสถานประกอบการ (Store Name in Thai) <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={thaiName} onChange={e => setThaiName(e.target.value)} required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Legal Entity</Label>
            <Input className="h-9" defaultValue={store.legalEntity} readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
              <Select defaultValue={store.type} required disabled={isInfoReadOnly}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                readOnly={isInfoReadOnly}
                disabled={isInfoReadOnly}
              />
              {taxIdError && <p className="text-xs text-destructive mt-1">{taxIdError}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Code <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={pp20Code} onChange={e => setPp20Code(e.target.value)} placeholder="e.g. 00002" required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Accounting Code <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={branchAcctCode} onChange={e => setBranchAcctCode(e.target.value)} placeholder="e.g. 010002" maxLength={10} required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
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
              <Input className="h-9" value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 34/54" required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">หมู่</Label>
              <Input className="h-9" value={moo} onChange={e => setMoo(e.target.value)} placeholder="e.g. 1" readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ตรอก/ซอย</Label>
            <Input className="h-9" value={soi} onChange={e => setSoi(e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ถนน</Label>
            <Input className="h-9" value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. ถนนลาดพร้าว" readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ตำบล/แขวง <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} placeholder="e.g. คลองเกลือ" required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">อำเภอ/เขต <span className="text-destructive">*</span></Label>
            <Input className="h-9" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. ปากเกร็ด" required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">จังหวัด <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. นนทบุรี" required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
              <Input className="h-9" value={postalCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setPostalCode(v); }} placeholder="e.g. 10240" maxLength={5} required readOnly={isInfoReadOnly} disabled={isInfoReadOnly} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Country <span className="text-destructive">*</span></Label>
              <Select defaultValue={store.country} required disabled={isInfoReadOnly}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
          </div>
        </div>

        {/* Visual range */}
        <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Min: {store.minBalance.toLocaleString()}</span>
            <span>Fund: {store.floatLimit.toLocaleString()}</span>
            <span>Max: {store.maxFloat.toLocaleString()}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
              style={{ width: `${Math.round((store.currentBalance / store.maxFloat) * 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-px bg-status-hold"
              style={{ left: `${Math.round((store.minBalance / store.maxFloat) * 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-px bg-status-approved"
              style={{ left: `${Math.round((store.floatLimit / store.maxFloat) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Current balance: <span className="font-medium text-foreground">{store.currentBalance.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="pb-6">
        <Button className="w-full" onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Fix 2: Unsaved changes confirmation */}
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

      {/* Fix 3: All-zeros fund confirmation */}
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
            <AlertDialogAction onClick={performSave}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
