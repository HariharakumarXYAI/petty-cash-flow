import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PositionLevel {
  id: string;
  positionName: string;
  active: boolean;
  updatedAt: string;
}

const initialData: PositionLevel[] = [
  { id: "1", positionName: "Manager", active: true, updatedAt: "2026-04-10" },
  { id: "2", positionName: "Senior Manager", active: true, updatedAt: "2026-04-10" },
  { id: "3", positionName: "Director", active: true, updatedAt: "2026-04-08" },
  { id: "4", positionName: "VP", active: true, updatedAt: "2026-04-05" },
  { id: "5", positionName: "Supervisor", active: true, updatedAt: "2026-03-28" },
  { id: "6", positionName: "Officer", active: true, updatedAt: "2026-03-25" },
  { id: "7", positionName: "Executive", active: false, updatedAt: "2026-03-20" },
  { id: "8", positionName: "Associate", active: true, updatedAt: "2026-03-15" },
  { id: "9", positionName: "Team Lead", active: true, updatedAt: "2026-03-10" },
  { id: "10", positionName: "Assistant Manager", active: false, updatedAt: "2026-03-01" },
];

interface FormState {
  positionName: string;
  active: boolean;
}

const emptyForm: FormState = { positionName: "", active: true };

export default function PositionLevelsPage() {
  const [data, setData] = useState<PositionLevel[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = data.filter((p) => {
    if (statusFilter === "active" && !p.active) return false;
    if (statusFilter === "inactive" && p.active) return false;
    if (search && !p.positionName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (item: PositionLevel) => {
    setEditingId(item.id);
    setForm({ positionName: item.positionName, active: item.active });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const name = form.positionName.trim();
    if (!name) {
      setFormError("Position name is required");
      return;
    }
    if (name.length > 100) {
      setFormError("Position name must be 100 characters or less");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (editingId) {
      setData((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, positionName: name, active: form.active, updatedAt: today }
            : p
        )
      );
      toast.success("Position level updated successfully");
    } else {
      setData((prev) => [
        ...prev,
        { id: crypto.randomUUID(), positionName: name, active: form.active, updatedAt: today },
      ]);
      toast.success("Position level created successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setData((prev) => prev.filter((p) => p.id !== deleteId));
    toast.success("Position level deleted successfully");
    setDeleteId(null);
  };

  const toggleActive = (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setData((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, active: !p.active, updatedAt: today } : p
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Position Levels</h1>
          <p className="text-sm text-muted-foreground">
            Manage position level classifications for employees
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Position Level
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search position levels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Position Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p, idx) => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium">{p.positionName}</TableCell>
                <TableCell>
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.updatedAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Delete"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No position levels found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Position Level" : "Add Position Level"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Position Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.positionName}
                onChange={(e) => {
                  setForm({ ...form, positionName: e.target.value });
                  if (formError) setFormError("");
                }}
                placeholder="e.g. Senior Manager"
                maxLength={100}
              />
              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Active</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Position Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this position level? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
