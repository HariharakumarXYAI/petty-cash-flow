import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { stores } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
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
import { ArrowLeft, AlertTriangle } from "lucide-react";

const Req = () => <span className="text-destructive">*</span>;

export default function StoreEdit() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = stores.find(s => s.id === storeId);

  const isInfoReadOnly = user?.role === "ho_finance";

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

  const [pettyCashFund, setPettyCashFund] = useState(initialValues.current.pettyCashFund);
  const [minBalance, setMinBalance] = useState(initialValues.current.minBalance);
  const [replenishAt, setReplenishAt] = useState(initialValues.current.replenishAt);

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
      minBalance !== iv.minBalance ||
      replenishAt !== iv.replenishAt
    );
  }, [thaiName, pp20Code, branchAcctCode, taxId, houseNo, moo, soi, street, subDistrict, district, province, postalCode, pettyCashFund, minBalance, replenishAt]);

  const handleBack = () => {
    if (isDirty()) setShowUnsavedDialog(true);
    else navigate("/masters/stores");
  };

  const handleSave = () => {
    if (!isInfoReadOnly) {
      const digitsOnly = taxId.replace(/\D/g, "");
      if (digitsOnly.length !== 13) {
        setTaxIdError("Tax ID must be exactly 13 digits");
        return;
      }
      setTaxIdError("");
    }
    if (pettyCashFund === 0 && minBalance === 0 && replenishAt === 0) {
      setShowZeroFundDialog(true);
      return;
    }
    performSave();
  };

  const performSave = () => navigate("/masters/stores");

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

  const isCritical = store.currentBalance <= store.minBalance;
  const isWarning = !isCritical && store.currentBalance <= store.minBalance * 1.3;

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-muted/30 p-8">
      <div className="max-w-[900px] mx-auto space-y-6">
        {/* Back link */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Stores
        </button>

        {/* Title + subtitle */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Edit Store</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} · {store.country} · {store.currency}
          </p>
        </div>

        {/* Balance banners */}
        {isCritical && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/5 border border-destructive/15 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Critical Balance</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current balance ({store.currentBalance.toLocaleString()}) is below the minimum ({store.minBalance.toLocaleString()}). Immediate replenishment required.
              </p>
            </div>
          </div>
        )}
        {isWarning && (
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

        {/* Store Information Card */}
        <div className="bg-card rounded-lg border p-8 space-y-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-foreground">Store Information</h2>
            {isInfoReadOnly && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Read-only for your role</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Thai Store Name (ชื่อสถานประกอบการ) <Req /></Label>
            <Input value={thaiName} onChange={e => setThaiName(e.target.value)} disabled={isInfoReadOnly} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Legal Entity</Label>
            <Input defaultValue={store.legalEntity} readOnly disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Type <Req /></Label>
              <Select defaultValue={store.type} disabled={isInfoReadOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                  <SelectItem value="Supermarket">Supermarket</SelectItem>
                  <SelectItem value="Mini">Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tax ID (เลขประจำตัวผู้เสียภาษี) <Req /></Label>
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
                disabled={isInfoReadOnly}
              />
              {taxIdError && <p className="text-xs text-destructive mt-1">{taxIdError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Code <Req /></Label>
              <Input value={pp20Code} onChange={e => setPp20Code(e.target.value)} placeholder="e.g. 00002" disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Branch Accounting Code <Req /></Label>
              <Input value={branchAcctCode} onChange={e => setBranchAcctCode(e.target.value)} placeholder="e.g. 010002" maxLength={10} disabled={isInfoReadOnly} />
              <p className="text-xs text-muted-foreground">Oracle Fusion ERP branch code (editable by Admin only)</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Full Address (ที่อยู่)</Label>
            <Input className="bg-yellow-50 border-yellow-200 text-foreground" readOnly value={composedAddress} />
            <p className="text-xs text-muted-foreground">Auto-composed from address fields below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">House No. (เลขที่) <Req /></Label>
              <Input value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 34/54" disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Moo (หมู่)</Label>
              <Input value={moo} onChange={e => setMoo(e.target.value)} placeholder="e.g. 1" disabled={isInfoReadOnly} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Soi/Alley (ตรอก/ซอย)</Label>
              <Input value={soi} onChange={e => setSoi(e.target.value)} placeholder="e.g. ซอยลาดพร้าว 1" disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Street (ถนน)</Label>
              <Input value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. ถนนลาดพร้าว" disabled={isInfoReadOnly} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Sub-district (ตำบล/แขวง) <Req /></Label>
              <Input value={subDistrict} onChange={e => setSubDistrict(e.target.value)} placeholder="e.g. คลองเกลือ" disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">District (อำเภอ/เขต) <Req /></Label>
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. ปากเกร็ด" disabled={isInfoReadOnly} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Province (จังหวัด) <Req /></Label>
              <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. นนทบุรี" disabled={isInfoReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Postal Code (รหัสไปรษณีย์) <Req /></Label>
              <Input value={postalCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setPostalCode(v); }} placeholder="e.g. 10240" maxLength={5} disabled={isInfoReadOnly} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Country <Req /></Label>
            <Select defaultValue={store.country} disabled={isInfoReadOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TH">Thailand</SelectItem>
                <SelectItem value="KH">Cambodia</SelectItem>
                <SelectItem value="MM">Myanmar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Petty Cash Fund Card */}
        <div className="bg-card rounded-lg border p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Petty Cash Fund Configuration</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Set the petty cash fund and replenishment trigger for this store.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Petty Cash Fund</Label>
              <Input className="tabular-nums" type="number" value={pettyCashFund} onChange={e => setPettyCashFund(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Minimum Balance</Label>
              <Input className="tabular-nums" type="number" value={minBalance} onChange={e => setMinBalance(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Replenish At</Label>
              <Input className="tabular-nums" type="number" value={replenishAt} onChange={e => setReplenishAt(Number(e.target.value))} />
              {replenishAt > pettyCashFund && (
                <p className="text-xs text-amber-600">Replenishment threshold is above the petty cash fund limit</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={handleBack}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

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
            <AlertDialogAction onClick={performSave}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
