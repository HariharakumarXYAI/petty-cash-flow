import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Trash2, Plus, X, ChevronDown, Check, Layers } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { expenseTypes, type ExpenseType } from "@/lib/mock-data";
import { loadDocuments } from "@/lib/documents-store";
import {
  PageShell,
  PageHeader,
  SectionCard,
  FormActions,
  RequiredMark,
} from "@/components/layout";

type Country = "TH" | "KH" | "MM";
const ALL_COUNTRIES: Country[] = ["TH", "KH", "MM"];

type SubtypeDraft = {
  id: string;
  subcategory: string;
  documentRequired: boolean;
  maxAmount: number;
  accountNameEn: string;
  accountCode: string;
  requiredDocumentIds: string[];
  supportedDocumentIds: string[];
  active: boolean;
};

const fromExpense = (e: ExpenseType): SubtypeDraft => ({
  id: e.id,
  subcategory: e.subcategory,
  documentRequired: e.documentRequired,
  maxAmount: e.maxAmount,
  accountNameEn: "",
  accountCode: "",
  requiredDocumentIds: [],
  supportedDocumentIds: [],
  active: true,
});

const emptySubtype = (): SubtypeDraft => ({
  id: `new-${Math.random().toString(36).slice(2, 8)}`,
  subcategory: "",
  documentRequired: true,
  maxAmount: 0,
  accountNameEn: "",
  accountCode: "",
  requiredDocumentIds: [],
  supportedDocumentIds: [],
  active: true,
});

const FLAG_OPTIONS = ["Sensitive", "Advance", "Tax", "Travel", "Recurring"];

function DocMultiSelect({
  value,
  onChange,
  placeholder,
  options,
  closedLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  options: { id: string; name: string }[];
  closedLabel?: (count: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  const triggerText =
    value.length === 0
      ? placeholder
      : closedLabel
        ? closedLabel(value.length)
        : `${value.length} selected`;
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
              value.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">{triggerText}</span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
          <div className="max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No documents available</div>
            ) : (
              options.map((opt) => {
                const selected = value.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border border-input",
                        selected && "bg-primary border-primary text-primary-foreground",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{opt.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const opt = options.find((o) => o.id === id);
            if (!opt) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {opt.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="hover:text-foreground"
                  aria-label={`Remove ${opt.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExpenseTypeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const documentOptions = useMemo(
    () => loadDocuments().filter((d) => d.active).map((d) => ({ id: d.id, name: d.name })),
    [],
  );

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

  // Category-level thresholds & flags (migrated from subtype level)
  const initialAlertAt = Math.max(0, ...originalSiblings.map((e) => e.alertThreshold));
  const initialHardStop = Math.max(0, ...originalSiblings.map((e) => e.hardStopThreshold));
  const initialFlags = Array.from(
    new Set(
      originalSiblings.flatMap((e) => [
        ...(e.auditSensitive ? ["Sensitive"] : []),
        ...(e.advanceAllowed ? ["Advance"] : []),
      ]),
    ),
  );
  // Category-level countries: union of all subtype country lists
  const initialCountries = Array.from(
    new Set(originalSiblings.flatMap((e) => e.countries as Country[])),
  ) as Country[];
  const [alertAt, setAlertAt] = useState<number>(initialAlertAt);
  const [hardStop, setHardStop] = useState<number>(initialHardStop);
  const [flags, setFlags] = useState<string[]>(initialFlags);
  const [countries, setCountries] = useState<Country[]>(initialCountries);

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
        s.maxAmount !== orig.maxAmount ||
        s.documentRequired !== orig.documentRequired
      );
    });

  const isDirty =
    name.trim() !== categoryName ||
    documentRequired !== originalSiblings.some((e) => e.documentRequired) ||
    auditSensitive !== originalSiblings.some((e) => e.auditSensitive) ||
    advanceAllowed !== originalSiblings.some((e) => e.advanceAllowed) ||
    alertAt !== initialAlertAt ||
    hardStop !== initialHardStop ||
    flags.slice().sort().join(",") !== initialFlags.slice().sort().join(",") ||
    countries.slice().sort().join(",") !== initialCountries.slice().sort().join(",") ||
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Row 1: Expense Type | Countries */}
          <div className="space-y-1.5">
            <Label htmlFor="et-name" className="text-sm font-medium flex items-center h-5">
              Expense Type <RequiredMark />
            </Label>
            <p className="text-xs text-muted-foreground">
              The display name for this Expense Type.
            </p>
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center h-5">Countries</Label>
            <p className="text-xs text-muted-foreground">
              Select the countries where this expense type is available.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ALL_COUNTRIES.map((c) => {
                const active = countries.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setCountries((prev) =>
                        active ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:bg-muted",
                    )}
                  >
                    {c}
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Advance Allowed | Audit Sensitive */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center h-5">Advance Allowed</Label>
            <p className="text-xs text-muted-foreground">
              Allow employees to request a cash advance against this expense type.
            </p>
            <div className="flex items-center gap-3 h-10">
              <Switch checked={advanceAllowed} onCheckedChange={setAdvanceAllowed} />
              <span className="text-sm text-muted-foreground tabular-nums">
                {advanceAllowed ? "Allowed" : "Not Allowed"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center h-5">Audit Sensitive</Label>
            <p className="text-xs text-muted-foreground">
              Flag this Expense Type for additional audit review and compliance tracking.
            </p>
            <div className="flex items-center gap-3 h-10">
              <Switch checked={auditSensitive} onCheckedChange={setAuditSensitive} />
              <span className="text-sm text-muted-foreground tabular-nums">
                {auditSensitive ? "Sensitive" : "Standard"}
              </span>
            </div>
          </div>

          {/* Row 3: Alert At | Hard Stop */}
          <div className="space-y-1.5">
            <Label htmlFor="et-alert-at" className="text-sm font-medium flex items-center h-5">Alert At</Label>
            <p className="text-xs text-muted-foreground">
              Warn employees when a single claim reaches this amount.
            </p>
            <Input
              id="et-alert-at"
              type="number"
              value={alertAt}
              onChange={(e) => setAlertAt(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>

          {/* Row 4: Flags (full width pairing) */}
          <div className="space-y-1.5">
            <Label htmlFor="et-hard-stop" className="text-sm font-medium flex items-center h-5">Hard Stop</Label>
            <p className="text-xs text-muted-foreground">
              Block claims that exceed this amount.
            </p>
            <Input
              id="et-hard-stop"
              type="number"
              value={hardStop}
              onChange={(e) => setHardStop(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center h-5">Flags</Label>
            <p className="text-xs text-muted-foreground">
              Tag this expense type for special handling.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {FLAG_OPTIONS.map((f) => {
                const active = flags.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setFlags((prev) =>
                        active ? prev.filter((x) => x !== f) : [...prev, f],
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:bg-muted",
                    )}
                  >
                    {f}
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Sub Expense Types"
        description="Configure sub expense types, country availability, and spending thresholds for this Expense Type."
        headerAside={
          <Button variant="outline" size="sm" onClick={openAddSubtype}>
            <Plus className="h-4 w-4 mr-1" /> Add Sub Expense Type
          </Button>
        }
      >
        {subtypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">No sub expense types configured yet</p>
            <Button variant="outline" size="sm" onClick={openAddSubtype}>
              <Plus className="h-4 w-4 mr-1" /> Add Sub Expense Type
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub Expense Type Name</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subtypes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.subcategory}</TableCell>
                    <TableCell className="text-center">
                      {s.documentRequired ? (
                        <FileText className="h-3.5 w-3.5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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

              <div className="flex items-center justify-between border-t pt-3">
                <Label className="text-sm">Document Required</Label>
                <Switch
                  checked={editingSubtype.documentRequired}
                  onCheckedChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, documentRequired: v })
                  }
                />
              </div>

              <FormField>
                <Label className="text-sm">
                  Account Name (EN) <RequiredMark />
                </Label>
                <Input
                  placeholder="e.g., Account TC001"
                  value={editingSubtype.accountNameEn}
                  onChange={(e) =>
                    setEditingSubtype({ ...editingSubtype, accountNameEn: e.target.value })
                  }
                />
              </FormField>

              <FormField>
                <Label className="text-sm">
                  Account Code <RequiredMark />
                </Label>
                <Input
                  placeholder="e.g., ACC-TC001"
                  value={editingSubtype.accountCode}
                  onChange={(e) =>
                    setEditingSubtype({ ...editingSubtype, accountCode: e.target.value })
                  }
                />
              </FormField>

              <FormField>
                <Label className="text-sm">Required Documents</Label>
                <DocMultiSelect
                  value={editingSubtype.requiredDocumentIds}
                  onChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, requiredDocumentIds: v })
                  }
                  placeholder="Select required documents..."
                  options={documentOptions}
                />
              </FormField>

              <FormField>
                <Label className="text-sm">Supported Documents</Label>
                <DocMultiSelect
                  value={editingSubtype.supportedDocumentIds}
                  onChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, supportedDocumentIds: v })
                  }
                  placeholder="Select supported documents..."
                  options={documentOptions}
                  closedLabel={(n) => `${n} selected`}
                />
              </FormField>

              <div className="flex items-center justify-between border-t pt-3">
                <Label className="text-sm">Active</Label>
                <Switch
                  checked={editingSubtype.active}
                  onCheckedChange={(v) =>
                    setEditingSubtype({ ...editingSubtype, active: v })
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
