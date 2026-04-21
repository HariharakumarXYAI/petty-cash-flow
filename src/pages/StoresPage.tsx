import { stores } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function StoresPage() {
  const { country } = useGlobalFilter();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Dialog state
  const [editStoreId, setEditStoreId] = useState<string | null>(null);
  const editStore = editStoreId ? stores.find(s => s.id === editStoreId) : null;

  // Form state for edit dialog
  const [thaiName, setThaiName] = useState("");
  const [pp20Code, setPp20Code] = useState("");
  const [branchAcctCode, setBranchAcctCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [moo, setMoo] = useState("");
  const [soi, setSoi] = useState("");
  const [street, setStreet] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [pettyCashFund, setPettyCashFund] = useState(0);
  const [maxFund, setMaxFund] = useState(0);
  const [minBalance, setMinBalance] = useState(0);
  const [replenishAt, setReplenishAt] = useState(0);
  const [taxIdError, setTaxIdError] = useState("");
  const [showZeroFundDialog, setShowZeroFundDialog] = useState(false);

  const isInfoReadOnly = user?.role === "ho_finance";

  const openEdit = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    setEditStoreId(storeId);
    setThaiName("แม็คโคร ลาดพร้าว");
    setPp20Code("00002");
    setBranchAcctCode("010001");
    setTaxId("");
    setHouseNo("34/54");
    setMoo("1");
    setSoi("");
    setStreet("");
    setSubDistrict("คลองเกลือ");
    setDistrict("ปากเกร็ด");
    setProvince("นนทบุรี");
    setPostalCode("");
    setPettyCashFund(store.floatLimit);
    setMaxFund(store.maxFloat);
    setMinBalance(store.minBalance);
    setReplenishAt(store.replenishmentThreshold);
    setTaxIdError("");
  };

  const composedAddress = useMemo(() => {
    const parts = [houseNo, moo ? `หมู่ที่ ${moo}` : "", soi, street,
      subDistrict ? `ต.${subDistrict}` : "", district ? `อ.${district}` : "",
      province ? `จ.${province}` : "", postalCode].filter(Boolean);
    return parts.join(" ");
  }, [houseNo, moo, soi, street, subDistrict, district, province, postalCode]);

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

  const performSave = () => {
    toast.success("Store updated successfully");
    setEditStoreId(null);
  };

  const countryFiltered = country === "all" ? stores : stores.filter(s => s.country === country);
  const filtered = search
    ? countryFiltered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.legalEntity.toLowerCase().includes(search.toLowerCase()))
    : countryFiltered;

  const lowBalanceCount = filtered.filter(s => s.currentBalance <= s.minBalance * 1.3).length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stores & Petty Cash Fund Limits</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} stores configured
            {lowBalanceCount > 0 && (
              <span className="text-status-hold ml-1">· {lowBalanceCount} low balance</span>
            )}
          </p>
        </div>
        {user?.role === "system_admin" && (
          <Button size="sm" onClick={() => navigate("/masters/stores/new")}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Store</Button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input className="h-8 pl-8 text-sm" placeholder="Filter stores…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label w-[200px]">Store</TableHead>
              <TableHead className="section-label hidden md:table-cell">Type</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Legal Entity</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Min Balance</TableHead>
              <TableHead className="section-label text-right hidden md:table-cell">Balance</TableHead>
              <TableHead className="section-label text-right">Fund Limit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const utilPct = Math.round((s.currentBalance / s.floatLimit) * 100);
              const isCritical = s.currentBalance <= s.minBalance;
              const isWarning = !isCritical && s.currentBalance <= s.minBalance * 1.3;
              const isLow = isCritical || isWarning;
              return (
                <TableRow key={s.id} className="data-table-row cursor-pointer" onClick={() => openEdit(s.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${isCritical ? "text-destructive" : "text-status-hold"}`} />}
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.country} · {s.currency}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {s.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{s.legalEntity}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums text-muted-foreground hidden xl:table-cell">{s.minBalance.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm font-medium text-right tabular-nums hidden md:table-cell ${isCritical ? "text-destructive" : ""}`}>
                    {s.currentBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums">{s.floatLimit.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Store Dialog */}
      <Dialog open={!!editStoreId} onOpenChange={(o) => { if (!o) setEditStoreId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
          </DialogHeader>

          {editStore && (
            <div className="space-y-4">
              {/* Balance warnings */}
              {editStore.currentBalance <= editStore.minBalance && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/5 border border-destructive/15 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Critical Balance</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Current balance ({editStore.currentBalance.toLocaleString()}) is below the minimum ({editStore.minBalance.toLocaleString()}).
                    </p>
                  </div>
                </div>
              )}

              {/* Store Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-1">Store Information</h3>
                <div className="space-y-1.5">
                  <Label className="text-sm">ชื่อสถานประกอบการ (Store Name in Thai) <span className="text-destructive">*</span></Label>
                  <Input className="h-9" value={thaiName} onChange={e => setThaiName(e.target.value)} disabled={isInfoReadOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Legal Entity</Label>
                  <Input className="h-9" defaultValue={editStore.legalEntity} disabled={isInfoReadOnly} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
                    <Select defaultValue={editStore.type} disabled={isInfoReadOnly}>
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
                      disabled={isInfoReadOnly}
                    />
                    {taxIdError && <p className="text-xs text-destructive mt-1">{taxIdError}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Branch Code <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={pp20Code} onChange={e => setPp20Code(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Branch Accounting Code <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={branchAcctCode} onChange={e => setBranchAcctCode(e.target.value)} disabled={isInfoReadOnly} />
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
                    <Input className="h-9" value={houseNo} onChange={e => setHouseNo(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">หมู่</Label>
                    <Input className="h-9" value={moo} onChange={e => setMoo(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">ตรอก/ซอย</Label>
                    <Input className="h-9" value={soi} onChange={e => setSoi(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">ถนน</Label>
                    <Input className="h-9" value={street} onChange={e => setStreet(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">ตำบล/แขวง <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">อำเภอ/เขต <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={district} onChange={e => setDistrict(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">จังหวัด <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={province} onChange={e => setProvince(e.target.value)} disabled={isInfoReadOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
                    <Input className="h-9" value={postalCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setPostalCode(v); }} maxLength={5} disabled={isInfoReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Country <span className="text-destructive">*</span></Label>
                    <Select defaultValue={editStore.country} disabled={isInfoReadOnly}>
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

              <Separator />

              {/* Petty Cash Fund Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-1">Petty Cash Fund Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Petty Cash Fund</Label>
                    <Input className="h-9 tabular-nums" type="number" value={pettyCashFund} onChange={e => setPettyCashFund(Number(e.target.value))} />
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
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStoreId(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zero fund confirmation */}
      <AlertDialog open={showZeroFundDialog} onOpenChange={setShowZeroFundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Zero Limits</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? All petty cash fund limits are set to zero.</AlertDialogDescription>
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
