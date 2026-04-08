import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Eye, Pencil, Ban, Boxes, TrendingUp, Store, Building2,
  CalendarIcon, Info,
} from "lucide-react";

type BUType = "Wholesale" | "Retail" | "DC" | "HQ" | "Food Service" | "Property-Mall" | "International";

interface BusinessUnit {
  id: string;
  buCode: string;
  buNameTH: string;
  buNameEN: string;
  description: string;
  entity: string;
  buType: BUType;
  lobCode: string;
  loaTableRef: string;
  areaManagerAllowed: boolean;
  effectiveStart: string;
  effectiveEnd: string;
  status: "Active" | "Inactive";
}

const buTypeBadgeClass: Record<BUType, string> = {
  Wholesale: "bg-blue-100 text-blue-700 border-blue-200",
  Retail: "bg-green-100 text-green-700 border-green-200",
  DC: "bg-amber-100 text-amber-700 border-amber-200",
  HQ: "bg-purple-100 text-purple-700 border-purple-200",
  "Food Service": "bg-orange-100 text-orange-700 border-orange-200",
  "Property-Mall": "bg-pink-100 text-pink-700 border-pink-200",
  International: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const entityOptions = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", oracleCode: "10001" },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด", oracleCode: "10002" },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", oracleCode: "13000" },
];

const lobDefaults: Record<string, string> = {
  Wholesale: "1001",
  Retail: "2001",
  "Property-Mall": "3001",
  HQ: "9999",
  DC: "9999",
  "Food Service": "9999",
  International: "9999",
};

const loaTableDefaults: Record<string, string> = {
  Wholesale: "LOA ตาราง 1 (Wholesale)",
  Retail: "LOA ตาราง 1 (Retail)",
  DC: "LOA ตาราง 2 (DC)",
  HQ: "LOA ตาราง 3 (HQ)",
  "Food Service": "LOA ตาราง 2 (Food Service)",
  "Property-Mall": "LOA ตาราง 4 (Property-Mall)",
  International: "LOA ตาราง 5 (International)",
};

const initialData: BusinessUnit[] = [
  {
    id: "1", buCode: "WS-MK-TH", buNameTH: "แม็คโคร ประเทศไทย",
    buNameEN: "Makro Thailand", description: "", entity: "CPA001",
    buType: "Wholesale", lobCode: "1001", loaTableRef: "LOA ตาราง 1 (Wholesale)",
    areaManagerAllowed: true, effectiveStart: "2024-01-01", effectiveEnd: "", status: "Active",
  },
  {
    id: "2", buCode: "RT-LT-TH", buNameTH: "โลตัส ประเทศไทย",
    buNameEN: "Lotus Thailand", description: "", entity: "CPA001",
    buType: "Retail", lobCode: "2001", loaTableRef: "LOA ตาราง 1 (Retail)",
    areaManagerAllowed: false, effectiveStart: "2024-01-01", effectiveEnd: "", status: "Active",
  },
  {
    id: "3", buCode: "DC-MK-TH", buNameTH: "แม็คโคร ศูนย์กระจายสินค้า",
    buNameEN: "Makro DC Thailand", description: "", entity: "CPA001",
    buType: "DC", lobCode: "1001", loaTableRef: "LOA ตาราง 2 (DC)",
    areaManagerAllowed: false, effectiveStart: "2024-01-01", effectiveEnd: "", status: "Active",
  },
  {
    id: "4", buCode: "HQ-CP", buNameTH: "ซีพี แอ็กซ์ตร้า สำนักงานใหญ่",
    buNameEN: "CP Axtra HQ", description: "", entity: "CPA001",
    buType: "HQ", lobCode: "9999", loaTableRef: "LOA ตาราง 3 (HQ)",
    areaManagerAllowed: false, effectiveStart: "2024-01-01", effectiveEnd: "", status: "Active",
  },
];

type FormState = Omit<BusinessUnit, "id">;

const emptyForm: FormState = {
  buCode: "", buNameTH: "", buNameEN: "", description: "",
  entity: "CPA001", buType: "Wholesale", lobCode: "1001",
  loaTableRef: "LOA ตาราง 1 (Wholesale)", areaManagerAllowed: true,
  effectiveStart: "", effectiveEnd: "", status: "Active",
};

export default function BusinessUnitsPage() {
  const [data, setData] = useState<BusinessUnit[]>(initialData);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = data.filter(
    (bu) =>
      bu.buCode.toLowerCase().includes(search.toLowerCase()) ||
      bu.buNameEN.toLowerCase().includes(search.toLowerCase()) ||
      bu.buNameTH.includes(search)
  );

  const stats = {
    total: data.length,
    active: data.filter((b) => b.status === "Active").length,
    wholesale: data.filter((b) => b.buType === "Wholesale").length,
    retail: data.filter((b) => b.buType === "Retail").length,
  };

  // Auto-fill logic when BU Type changes
  useEffect(() => {
    const lob = lobDefaults[form.buType] || "9999";
    const loa = loaTableDefaults[form.buType] || "";
    const areaManager = form.buType === "Wholesale";
    setForm((prev) => ({
      ...prev,
      lobCode: lob,
      loaTableRef: loa,
      areaManagerAllowed: areaManager,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.buType]);

  const oracleCode = entityOptions.find((e) => e.code === form.entity)?.oracleCode || "—";

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (bu: BusinessUnit) => {
    setEditingId(bu.id);
    setForm({
      buCode: bu.buCode, buNameTH: bu.buNameTH, buNameEN: bu.buNameEN,
      description: bu.description, entity: bu.entity, buType: bu.buType,
      lobCode: bu.lobCode, loaTableRef: bu.loaTableRef,
      areaManagerAllowed: bu.areaManagerAllowed,
      effectiveStart: bu.effectiveStart, effectiveEnd: bu.effectiveEnd,
      status: bu.status,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setData((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...form } : b))
      );
    } else {
      setData((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...form } as BusinessUnit,
      ]);
    }
    setSheetOpen(false);
  };

  const toggleStatus = (id: string) => {
    setData((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" }
          : b
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Units</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage business unit classification linked to legal entities
          </p>
        </div>
        <Button variant="destructive" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Business Unit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Business Units", value: stats.total, icon: Boxes, bg: "bg-primary/8", fg: "text-primary" },
          { label: "Active", value: stats.active, icon: TrendingUp, bg: "bg-status-approved/10", fg: "text-status-approved" },
          { label: "Wholesale", value: stats.wholesale, icon: Store, bg: "bg-blue-50", fg: "text-blue-600" },
          { label: "Retail", value: stats.retail, icon: Building2, bg: "bg-green-50", fg: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.fg}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search business units..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BU Code</TableHead>
                <TableHead>BU Name (TH)</TableHead>
                <TableHead>BU Name (EN)</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>BU Type</TableHead>
                <TableHead>LOB Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bu) => (
                <TableRow key={bu.id}>
                  <TableCell className="font-mono text-xs">{bu.buCode}</TableCell>
                  <TableCell>{bu.buNameTH}</TableCell>
                  <TableCell>{bu.buNameEN}</TableCell>
                  <TableCell className="font-mono text-xs">{bu.entity}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${buTypeBadgeClass[bu.buType]}`}>
                      {bu.buType}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{bu.lobCode}</TableCell>
                  <TableCell>
                    <Badge variant={bu.status === "Active" ? "approved" : "rejected"}>
                      {bu.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(bu)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Deactivate" onClick={() => toggleStatus(bu.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No business units found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Sheet (Side Panel) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Business Unit" : "Add Business Unit"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* SECTION 1 — Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <Label>BU Code *</Label>
                  <Input
                    value={form.buCode}
                    onChange={(e) => setForm({ ...form, buCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. WS-MK-TH"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Unique code for this business unit</p>
                </div>
                <div>
                  <Label>BU Name (TH) *</Label>
                  <Input
                    value={form.buNameTH}
                    onChange={(e) => setForm({ ...form, buNameTH: e.target.value })}
                  />
                </div>
                <div>
                  <Label>BU Name (EN) *</Label>
                  <Input
                    value={form.buNameEN}
                    onChange={(e) => setForm({ ...form, buNameEN: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 2 — Classification */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Classification</h3>
              <div className="space-y-3">
                <div>
                  <Label>Parent Entity *</Label>
                  <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {entityOptions.map((e) => (
                        <SelectItem key={e.code} value={e.code}>
                          {e.code} — {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Oracle Company Code (from Entity)</Label>
                  <Input value={oracleCode} readOnly className="font-mono bg-muted/50" />
                </div>
                <div>
                  <Label>BU Type *</Label>
                  <Select value={form.buType} onValueChange={(v) => setForm({ ...form, buType: v as BUType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="DC">DC (Distribution Center)</SelectItem>
                      <SelectItem value="HQ">HQ / Head Office</SelectItem>
                      <SelectItem value="Food Service">Food Service</SelectItem>
                      <SelectItem value="Property-Mall">Property-Mall</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">LOA Table Reference (auto)</Label>
                  <Input value={form.loaTableRef} readOnly className="bg-muted/50 text-sm" />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="text-sm">Area Manager Role Allowed</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Per LOA policy — Wholesale only
                    </p>
                  </div>
                  <Switch
                    checked={form.areaManagerAllowed}
                    onCheckedChange={(v) => setForm({ ...form, areaManagerAllowed: v })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 3 — Oracle Accounting (read-only) */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Oracle Accounting</h3>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Oracle Fusion — Auto Values</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Oracle Company Code</span>
                    <p className="font-mono font-medium text-foreground">{oracleCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">LOB Default</span>
                    <p className="font-mono font-medium text-foreground">{form.lobCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Channel Default</span>
                    <p className="font-mono font-medium text-foreground">9999</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Local Default</span>
                    <p className="font-mono font-medium text-foreground">9999</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  These values auto-populate COA segments when employees under this BU submit expenses
                </p>
              </div>
            </div>

            <Separator />

            {/* SECTION 4 — Validity */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Validity</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Effective Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.effectiveStart && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.effectiveStart ? format(new Date(form.effectiveStart), "dd/MM/yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.effectiveStart ? new Date(form.effectiveStart) : undefined}
                          onSelect={(d) => setForm({ ...form, effectiveStart: d ? format(d, "yyyy-MM-dd") : "" })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Effective End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.effectiveEnd && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.effectiveEnd ? format(new Date(form.effectiveEnd), "dd/MM/yyyy") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.effectiveEnd ? new Date(form.effectiveEnd) : undefined}
                          onSelect={(d) => setForm({ ...form, effectiveEnd: d ? format(d, "yyyy-MM-dd") : "" })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label className="text-sm">Status</Label>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", form.status === "Active" ? "text-status-approved" : "text-muted-foreground")}>
                      {form.status}
                    </span>
                    <Switch
                      checked={form.status === "Active"}
                      onCheckedChange={(v) => setForm({ ...form, status: v ? "Active" : "Inactive" })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSave}>
              {editingId ? "Save Changes" : "Save Business Unit"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
