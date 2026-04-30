import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Pencil, Trash2, Plus, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { expenseTypes, type ExpenseType } from "@/lib/mock-data";
import {
  PageShell,
  PageHeader,
  SectionCard,
  FormField,
  FormActions,
  RequiredMark,
} from "@/components/layout";

type Country = "TH" | "KH" | "MM";
const ALL_COUNTRIES: Country[] = ["TH", "KH", "MM"];

type SubtypeDraft = {
  id: string;
  subcategory: string;
  countries: Country[];
  documentRequired: boolean;
  auditSensitive: boolean;
  advanceAllowed: boolean;
  alertThreshold: number;
  hardStopThreshold: number;
  maxAmount: number;
};

const fromExpense = (e: ExpenseType): SubtypeDraft => ({
  id: e.id,
  subcategory: e.subcategory,
  countries: [...e.countries] as Country[],
  documentRequired: e.documentRequired,
  auditSensitive: e.auditSensitive,
  advanceAllowed: e.advanceAllowed,
  alertThreshold: e.alertThreshold,
  hardStopThreshold: e.hardStopThreshold,
  maxAmount: e.maxAmount,
});

const emptySubtype = (): SubtypeDraft => ({
  id: `new-${Math.random().toString(36).slice(2, 8)}`,
  subcategory: "",
  countries: ["TH"],
  documentRequired: true,
  auditSensitive: false,
  advanceAllowed: false,
  alertThreshold: 0,
  hardStopThreshold: 0,
  maxAmount: 0,
});

export default function ExpenseTypeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  // Resolve the parent category from the row id used in the URL
  const original = useMemo(() => expenseTypes.find((e) => e.id === id), [id]);
  const categoryName = original?.category ?? "";
  const originalSiblings = useMemo(
    () => expenseTypes.filter((e) => e.category === categoryName),
    [categoryName],
  );

  // Category-level details (derived from any sibling — keep original as source)
  const [name, setName] = useState(categoryName);
  const [documentRequired, setDocumentRequired] = useState(
    originalSiblings.some((e) => e.documentRequired),
  );
  const [auditSensitive, setAuditSensitive] = useState(
    originalSiblings.some((e) => e.auditSensitive),
  );
  const [advanceAllowed, setAdvanceAllowed] = useState(
    originalSiblings.some((e) => e.advanceAllowed),
  );

  // Subtype list (local draft)
  const [subtypes, setSubtypes] = useState<SubtypeDraft[]>(
    originalSiblings.map(fromExpense),
  );

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Subtype dialog state
  const [editingSubtype, setEditingSubtype] = useState<SubtypeDraft | null>(null);
  const [isNewSubtype, setIsNewSubtype] = useState(false);

  useEffect(() => {
    if (!original) {
      toast.error("Expense type not found");
      navigate("/admin/expense-types", { replace: true });
    }
  }, [original, navigate]);

  if (!original) return null;

  const initialSubtypeIds = originalSiblings.map((s) => s.id).join("|");
  const currentSubtypeIds = subtypes.map((s) => s.id).join("|");
  const subtypesChanged =
    initialSubtypeIds !== currentSubtypeIds ||
    subtypes.some((s) => {
      const orig = originalSiblings.find((o) => o.id === s.id);
      if (!orig) return true;
      return (
        s.subcategory !== orig.subcategory ||
        s.alertThreshold !== orig.alertThreshold ||
        s.hardStopThreshold !== orig.hardStopThreshold ||
        s.maxAmount !== orig.maxAmount ||
        s.documentRequired !== orig.documentRequired ||
        s.auditSensitive !== orig.auditSensitive ||
        s.advanceAllowed !== orig.advanceAllowed ||
        s.countries.slice().sort().join(",") !==
          (orig.countries as string[]).slice().sort().join(",")
      );
    });

  const isDirty =
    name.trim() !== categoryName ||
    documentRequired !== originalSiblings.some((e) => e.documentRequired) ||
    auditSensitive !== originalSiblings.some((e) => e.auditSensitive) ||
    advanceAllowed !== originalSiblings.some((e) => e.advanceAllowed) ||
    subtypesChanged;

  const disabled = !isDirty || saving;

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    toast.success("Expense type updated");
    navigate("/admin/expense-types");
  };

  const handleCancel = () => navigate("/admin/expense-types");

  const openAddSubtype = () => {
    setEditingSubtype(emptySubtype());
    setIsNewSubtype(true);
  };
  const openEditSubtype = (s: SubtypeDraft) => {
    setEditingSubtype({ ...s });
    setIsNewSubtype(false);
  };
  const deleteSubtype = (sid: string) => {
    setSubtypes((prev) => prev.filter((s) => s.id !== sid));
  };
  const commitSubtype = () => {
    if (!editingSubtype) return;
    if (!editingSubtype.subcategory.trim()) {
      toast.error("Subtype name is required");
      return;
    }
    if (editingSubtype.countries.length === 0) {
      toast.error("Select at least one country");
      return;
    }
    setSubtypes((prev) => {
      if (isNewSubtype) return [...prev, editingSubtype];
      return prev.map((s) => (s.id === editingSubtype.id ? editingSubtype : s));
    });
    setEditingSubtype(null);
  };

  return (
    <PageShell
      header={
        <PageHeader
          backHref="/admin/expense-types"
          backLabel="Back to Expense Types"
          title="Edit Expense Type"
          subtitle={categoryName}
        />
      }
    >
      <SectionCard
        title="Expense Type Details"
        description="Configure how this Expense Type behaves in claim submissions."
      >
        <FormField>
          <Label htmlFor="et-name" className="text-sm">
            Expense Type <RequiredMark />
          </Label>
          <Input
            id="et-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            className={cn(nameError && "border-destructive focus-visible:ring-destructive")}
          />
          {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
        </FormField>

        <div className="flex items-center justify-between border-t pt-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Audit Sensitive</Label>
            <p className="text-xs text-muted-foreground">
              Flag this Expense Type for additional audit review and compliance tracking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums w-20 text-right">
              {auditSensitive ? "Sensitive" : "Standard"}
            </span>
            <Switch checked={auditSensitive} onCheckedChange={setAuditSensitive} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Advance Allowed</Label>
            <p className="text-xs text-muted-foreground">
              Allow employees to request a cash advance against this expense type.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums w-24 text-right">
              {advanceAllowed ? "Allowed" : "Not Allowed"}
            </span>
            <Switch checked={advanceAllowed} onCheckedChange={setAdvanceAllowed} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Subtypes"
        description="Configure subtypes, country availability, and spending thresholds for this Expense Type."
        headerAside={
          <Button variant="outline" size="sm" onClick={openAddSubtype}>
            <Plus className="h-4 w-4 mr-1" /> Add Subtype
          </Button>
        }
      >
        {subtypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">No subtypes configured yet</p>
            <Button variant="outline" size="sm" onClick={openAddSubtype}>
              <Plus className="h-4 w-4 mr-1" /> Add Subtype
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subtype Name</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead className="text-right">Alert At</TableHead>
                  <TableHead className="text-right">Hard Stop</TableHead>
                  <TableHead className="text-center">Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subtypes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.subcategory}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {s.countries.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {s.documentRequired ? (
                        <FileText className="h-3.5 w-3.5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      <span className="text-status-validating font-medium">
                        {s.alertThreshold.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      <span className="text-status-hold font-semibold">
                        {s.hardStopThreshold.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        {s.auditSensitive && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-status-hold/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-hold">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Sensitive
                          </span>
                        )}
                        {s.advanceAllowed && (
                          <span className="inline-flex items-center rounded bg-status-approved/10 px-1.5 py-0.5 text-[10px] font-medium text-status-approved">
                            Advance
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditSubtype(s)}
                          aria-label={`Edit ${s.subcategory}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteSubtype(s.id)}
                          aria-label={`Delete ${s.subcategory}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <FormActions
        secondary={
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        }
        primary={
          <Button onClick={handleSave} disabled={disabled}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        }
      />

      <Dialog
        open={editingSubtype !== null}
        onOpenChange={(o) => !o && setEditingSubtype(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isNewSubtype ? "Add Subtype" : "Edit Subtype"}</DialogTitle>
          </DialogHeader>
          {editingSubtype && (
            <div className="space-y-4">
              <FormField>
                <Label className="text-sm">
                  Subtype Name <RequiredMark />
                </Label>
                <Input
                  value={editingSubtype.subcategory}
                  onChange={(e) =>
                    setEditingSubtype({ ...editingSubtype, subcategory: e.target.value })
                  }
                />
              </FormField>

              <FormField>
                <Label className="text-sm">Countries</Label>
                <div className="flex items-center gap-4 pt-1">
                  {ALL_COUNTRIES.map((c) => {
                    const checked = editingSubtype.countries.includes(c);
                    return (
                      <label key={c} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = v
                              ? [...editingSubtype.countries, c]
                              : editingSubtype.countries.filter((x) => x !== c);
                            setEditingSubtype({ ...editingSubtype, countries: next });
                          }}
                        />
                        {c}
                      </label>
                    );
                  })}
                </div>
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField>
                  <Label className="text-sm">Alert At</Label>
                  <Input
                    type="number"
                    value={editingSubtype.alertThreshold}
                    onChange={(e) =>
                      setEditingSubtype({
                        ...editingSubtype,
                        alertThreshold: Number(e.target.value),
                      })
                    }
                  />
                </FormField>
                <FormField>
                  <Label className="text-sm">Hard Stop</Label>
                  <Input
                    type="number"
                    value={editingSubtype.hardStopThreshold}
                    onChange={(e) =>
                      setEditingSubtype({
                        ...editingSubtype,
                        hardStopThreshold: Number(e.target.value),
                      })
                    }
                  />
                </FormField>
                <FormField>
                  <Label className="text-sm">Max Amount</Label>
                  <Input
                    type="number"
                    value={editingSubtype.maxAmount}
                    onChange={(e) =>
                      setEditingSubtype({
                        ...editingSubtype,
                        maxAmount: Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <Label className="text-sm">Document Required</Label>
                <Switch
                  checked={editingSubtype.documentRequired}
                  onCheckedChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, documentRequired: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Audit Sensitive</Label>
                <Switch
                  checked={editingSubtype.auditSensitive}
                  onCheckedChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, auditSensitive: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Advance Allowed</Label>
                <Switch
                  checked={editingSubtype.advanceAllowed}
                  onCheckedChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, advanceAllowed: v })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubtype(null)}>
              Cancel
            </Button>
            <Button onClick={commitSubtype}>
              {isNewSubtype ? "Add Subtype" : "Save Subtype"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
