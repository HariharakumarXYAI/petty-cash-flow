import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Eye, Pencil, Ban, Boxes, TrendingUp, Store, Building2,
} from "lucide-react";

type BUType = "Wholesale" | "Retail" | "DC" | "HQ" | "Food Service";

interface BusinessUnit {
  id: string;
  buCode: string;
  buNameTH: string;
  buNameEN: string;
  entity: string;
  buType: BUType;
  lobCode: string;
  status: "Active" | "Inactive";
}

const buTypeBadgeClass: Record<BUType, string> = {
  Wholesale: "bg-blue-100 text-blue-700 border-blue-200",
  Retail: "bg-green-100 text-green-700 border-green-200",
  DC: "bg-amber-100 text-amber-700 border-amber-200",
  HQ: "bg-purple-100 text-purple-700 border-purple-200",
  "Food Service": "bg-orange-100 text-orange-700 border-orange-200",
};

const initialData: BusinessUnit[] = [
  {
    id: "1", buCode: "WS-MK-TH", buNameTH: "แม็คโคร ประเทศไทย",
    buNameEN: "Makro Thailand", entity: "CPA001", buType: "Wholesale",
    lobCode: "1001", status: "Active",
  },
  {
    id: "2", buCode: "RT-LT-TH", buNameTH: "โลตัส ประเทศไทย",
    buNameEN: "Lotus Thailand", entity: "CPA001", buType: "Retail",
    lobCode: "2001", status: "Active",
  },
  {
    id: "3", buCode: "DC-MK-TH", buNameTH: "แม็คโคร ศูนย์กระจายสินค้า",
    buNameEN: "Makro DC Thailand", entity: "CPA001", buType: "DC",
    lobCode: "1001", status: "Active",
  },
  {
    id: "4", buCode: "HQ-CP", buNameTH: "ซีพี แอ็กซ์ตร้า สำนักงานใหญ่",
    buNameEN: "CP Axtra HQ", entity: "CPA001", buType: "HQ",
    lobCode: "9999", status: "Active",
  },
];

const emptyForm = {
  buCode: "", buNameTH: "", buNameEN: "", entity: "CPA001",
  buType: "Wholesale" as BUType, lobCode: "", status: "Active" as const,
};

export default function BusinessUnitsPage() {
  const [data, setData] = useState<BusinessUnit[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (bu: BusinessUnit) => {
    setEditingId(bu.id);
    setForm({
      buCode: bu.buCode, buNameTH: bu.buNameTH, buNameEN: bu.buNameEN,
      entity: bu.entity, buType: bu.buType, lobCode: bu.lobCode,
      status: bu.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setData((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...form } : b))
      );
    } else {
      setData((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...form },
      ]);
    }
    setDialogOpen(false);
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Business Unit" : "Add Business Unit"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BU Code *</Label>
                <Input value={form.buCode} onChange={(e) => setForm({ ...form, buCode: e.target.value })} />
              </div>
              <div>
                <Label>LOB Code</Label>
                <Input value={form.lobCode} onChange={(e) => setForm({ ...form, lobCode: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>BU Name (TH)</Label>
              <Input value={form.buNameTH} onChange={(e) => setForm({ ...form, buNameTH: e.target.value })} />
            </div>
            <div>
              <Label>BU Name (EN)</Label>
              <Input value={form.buNameEN} onChange={(e) => setForm({ ...form, buNameEN: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entity</Label>
                <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPA001">CPA001 — CP Axtra</SelectItem>
                    <SelectItem value="MKR002">MKR002 — Makro</SelectItem>
                    <SelectItem value="DEM003">DEM003 — Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>BU Type</Label>
                <Select value={form.buType} onValueChange={(v) => setForm({ ...form, buType: v as BUType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="DC">DC (Distribution Center)</SelectItem>
                    <SelectItem value="HQ">HQ / Head Office</SelectItem>
                    <SelectItem value="Food Service">Food Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSave}>
              {editingId ? "Save Changes" : "Add Business Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
