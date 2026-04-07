import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { stores } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function StoreEdit() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const store = stores.find(s => s.id === storeId);

  const [thaiName, setThaiName] = useState("แม็คโคร ลาดพร้าว");
  const [pp20Code, setPp20Code] = useState("00002");
  const [houseNo, setHouseNo] = useState("34/54");
  const [moo, setMoo] = useState("1");
  const [subDistrict, setSubDistrict] = useState("คลองเกลือ");
  const [district, setDistrict] = useState("ปากเกร็ด");
  const [province, setProvince] = useState("นนทบุรี");

  const composedAddress = useMemo(() => {
    const parts = [
      houseNo,
      moo ? `หมู่ที่ ${moo}` : "",
      subDistrict ? `ต.${subDistrict}` : "",
      district ? `อ.${district}` : "",
      province ? `จ.${province}` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }, [houseNo, moo, subDistrict, district, province]);

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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/masters/stores")}>
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
        <p className="section-label">Store Information</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Store Name</Label>
            <Input className="h-9" defaultValue={store.name} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ชื่อสถานประกอบการ (Store Name in Thai)</Label>
            <Input className="h-9" value={thaiName} onChange={e => setThaiName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Country</Label>
              <Select defaultValue={store.country}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TH">Thailand</SelectItem>
                  <SelectItem value="KH">Cambodia</SelectItem>
                  <SelectItem value="MM">Myanmar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Type</Label>
              <Select defaultValue={store.type}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                  <SelectItem value="Supermarket">Supermarket</SelectItem>
                  <SelectItem value="Mini">Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Legal Entity</Label>
            <Input className="h-9" defaultValue={store.legalEntity} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">รหัส PP20</Label>
            <Input className="h-9" value={pp20Code} onChange={e => setPp20Code(e.target.value)} placeholder="e.g. 00002" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ที่อยู่ (Full Address)</Label>
            <Input className="h-9 bg-amber-50 border-amber-200 text-foreground" readOnly value={composedAddress} />
            <p className="text-[10px] text-muted-foreground">Auto-composed from address fields below</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">รหัส Fusion</Label>
              <Input className="h-9" readOnly placeholder="e.g. 010002" defaultValue="010001" />
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">เลขที่</Label>
              <Input className="h-9" value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 34/54" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">หมู่</Label>
              <Input className="h-9" value={moo} onChange={e => setMoo(e.target.value)} placeholder="e.g. 1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">ตำบล/แขวง</Label>
            <Input className="h-9" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} placeholder="e.g. คลองเกลือ" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">อำเภอ/เขต</Label>
            <Input className="h-9" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. ปากเกร็ด" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">จังหวัด</Label>
            <Input className="h-9" value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. นนทบุรี" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Float Configuration */}
      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <p className="section-label">Float Configuration</p>
        <p className="text-xs text-muted-foreground">
          Set the cash float range and replenishment trigger for this store.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Petty Cash Float</Label>
            <Input className="h-9 tabular-nums" type="number" defaultValue={store.floatLimit} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maximum Float</Label>
            <Input className="h-9 tabular-nums" type="number" defaultValue={store.maxFloat} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Minimum Balance</Label>
            <Input className="h-9 tabular-nums" type="number" defaultValue={store.minBalance} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Replenish At</Label>
            <Input className="h-9 tabular-nums" type="number" defaultValue={store.replenishmentThreshold} />
          </div>
        </div>

        {/* Visual range */}
        <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Min: {store.minBalance.toLocaleString()}</span>
            <span>Float: {store.floatLimit.toLocaleString()}</span>
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

      <Separator />

      {/* Tax & Identification */}
      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <p className="section-label">Tax & Identification</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Fusion Code</Label>
              <Input className="h-9" readOnly placeholder="e.g. 010001" defaultValue="010001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">VAT Registration No. (ภ.พ.20)</Label>
              <Input className="h-9" placeholder="e.g. 00001" defaultValue="00001" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Full Address</Label>
            <Textarea rows={3} placeholder="e.g. 3498 ถ.ลาดพร้าว แขวงคลองจั่น เขตบางกะปิ กรุงเทพ 10240" defaultValue="3498 ถ.ลาดพร้าว แขวงคลองจั่น เขตบางกะปิ กรุงเทพ 10240" />
          </div>
        </div>
      </div>

      <div className="pb-6">
        <Button className="w-full">Save Changes</Button>
      </div>
    </div>
  );
}