import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Plus, X, ChevronDown, Check, Layers } from "lucide-react";
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
  subExpenseType: string;
  accountNameEn: string;
  accountCode: string;
  requiredDocumentIds: string[];
  supportedDocumentIds: string[];
  active: boolean;
};

const fromExpense = (e: ExpenseType): SubtypeDraft => ({
  id: e.id,
  subExpenseType: e.subcategory,
  accountNameEn: "",
  accountCode: "",
  requiredDocumentIds: [],
  supportedDocumentIds: [],
  active: true,
});

const emptySubtype = (): SubtypeDraft => ({
  id: `new-${Math.random().toString(36).slice(2, 8)}`,
  subExpenseType: "",
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

interface ExpenseTypeEditPageProps {
  mode?: "create" | "edit";
}

export default function ExpenseTypeEditPage({ mode = "edit" }: ExpenseTypeEditPageProps) {
  const isCreate = mode === "create";
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const documentOptions = useMemo(
    () => loadDocuments().filter((d) => d.active).map((d) => ({ id: d.id, name: d.name })),
    [],
  );

  // Resolve the parent category from the row id used in the URL (edit mode only)
  const original = useMemo(
    () => (isCreate ? undefined : expenseTypes.find((e) => e.id === id)),
    [id, isCreate],
  );
  const categoryName = original?.category ?? "";
  const originalSiblings = useMemo(
    () => (isCreate ? [] : expenseTypes.filter((e) => e.category === categoryName)),
    [categoryName, isCreate],
  );

  // Category-level details (derived from any sibling — keep original as source)
  const [name, setName] = useState(isCreate ? "" : categoryName);
  const [documentRequired, setDocumentRequired] = useState(
    isCreate ? false : originalSiblings.some((e) => e.documentRequired),
  );
  const [auditSensitive, setAuditSensitive] = useState(
    isCreate ? false : originalSiblings.some((e) => e.auditSensitive),
  );
  const [advanceAllowed, setAdvanceAllowed] = useState(
    isCreate ? false : originalSiblings.some((e) => e.advanceAllowed),
  );

  // Category-level thresholds & flags (migrated from subtype level)
  const initialAlertAt = isCreate
    ? ("" as number | "")
    : Math.max(0, ...originalSiblings.map((e) => e.alertThreshold));
  const initialHardStop = isCreate
    ? ("" as number | "")
    : Math.max(0, ...originalSiblings.map((e) => e.hardStopThreshold));
  const initialFlags = isCreate
    ? []
    : Array.from(
        new Set(
          originalSiblings.flatMap((e) => [
            ...(e.auditSensitive ? ["Sensitive"] : []),
            ...(e.advanceAllowed ? ["Advance"] : []),
          ]),
        ),
      );
  // Category-level countries: union of all subtype country lists
  const initialCountries = isCreate
    ? ([] as Country[])
    : (Array.from(
        new Set(originalSiblings.flatMap((e) => e.countries as Country[])),
      ) as Country[]);
  const [alertAt, setAlertAt] = useState<number | "">(initialAlertAt);
  const [hardStop, setHardStop] = useState<number | "">(initialHardStop);
  const [flags, setFlags] = useState<string[]>(initialFlags);
  const [countries, setCountries] = useState<Country[]>(initialCountries);

  // Subtype list (local draft) — create mode starts with one empty card
  const [subtypes, setSubtypes] = useState<SubtypeDraft[]>(
    isCreate ? [emptySubtype()] : originalSiblings.map(fromExpense),
  );

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Per-row required-field errors
  const [subtypeErrors, setSubtypeErrors] = useState<
    Record<string, { subExpenseType?: boolean; accountNameEn?: boolean; accountCode?: boolean }>
  >({});

  useEffect(() => {
    if (!isCreate && !original) {
      toast.error("Expense type not found");
      navigate("/admin/expense-types", { replace: true });
    }
  }, [original, navigate, isCreate]);

  if (!isCreate && !original) return null;

  const initialSubtypeIds = originalSiblings.map((s) => s.id).join("|");
  const currentSubtypeIds = subtypes.map((s) => s.id).join("|");
  const subtypesChanged =
    initialSubtypeIds !== currentSubtypeIds ||
    subtypes.some((s) => {
      const orig = originalSiblings.find((o) => o.id === s.id);
      if (!orig) return true;
      return (
        s.subExpenseType !== orig.subcategory ||
        s.accountNameEn !== "" ||
        s.accountCode !== "" ||
        s.requiredDocumentIds.length > 0 ||
        s.supportedDocumentIds.length > 0 ||
        s.active !== true
      );
    });

  const isDirty =
    isCreate ||
    name.trim() !== categoryName ||
    documentRequired !== originalSiblings.some((e) => e.documentRequired) ||
    auditSensitive !== originalSiblings.some((e) => e.auditSensitive) ||
    advanceAllowed !== originalSiblings.some((e) => e.advanceAllowed) ||
    alertAt !== initialAlertAt ||
    hardStop !== initialHardStop ||
    flags.slice().sort().join(",") !== initialFlags.slice().sort().join(",") ||
    countries.slice().sort().join(",") !== initialCountries.slice().sort().join(",") ||
    subtypesChanged;

  const disabled = (!isCreate && !isDirty) || saving;

  const validateSubtypes = () => {
    const errs: Record<string, { subExpenseType?: boolean; accountNameEn?: boolean; accountCode?: boolean }> = {};
    let ok = true;
    subtypes.forEach((s) => {
      const rowErr: { subExpenseType?: boolean; accountNameEn?: boolean; accountCode?: boolean } = {};
      if (!s.subExpenseType.trim()) { rowErr.subExpenseType = true; ok = false; }
      if (!s.accountNameEn.trim()) { rowErr.accountNameEn = true; ok = false; }
      if (!s.accountCode.trim()) { rowErr.accountCode = true; ok = false; }
      if (Object.keys(rowErr).length) errs[s.id] = rowErr;
    });
    setSubtypeErrors(errs);
    return ok;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    if (!validateSubtypes()) {
      toast.error("Please fill in all required subtype fields");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    toast.success(isCreate ? "Expense type created successfully" : "Expense type updated");
    navigate("/admin/expense-types");
  };

  const handleCancel = () => {
    if (isDirty) {
      const ok = window.confirm("You have unsaved changes. Discard and leave this page?");
      if (!ok) return;
    }
    navigate("/admin/expense-types");
  };

  const updateSubtype = <K extends keyof SubtypeDraft>(sid: string, key: K, value: SubtypeDraft[K]) => {
    setSubtypes((prev) => prev.map((s) => (s.id === sid ? { ...s, [key]: value } : s)));
    const errKey = key as "subExpenseType" | "accountNameEn" | "accountCode";
    if (subtypeErrors[sid]?.[errKey]) {
      setSubtypeErrors((prev) => {
        const next = { ...prev };
        const row = { ...next[sid] };
        delete row[errKey];
        if (Object.keys(row).length === 0) delete next[sid];
        else next[sid] = row;
        return next;
      });
    }
  };

  const addSubtype = () => {
    setSubtypes((prev) => [...prev, emptySubtype()]);
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
              onChange={(e) => setAlertAt(e.target.value === "" ? "" : Number(e.target.value))}
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
              onChange={(e) => setHardStop(e.target.value === "" ? "" : Number(e.target.value))}
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
        title={
          <span className="inline-flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Sub Expense Types
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {subtypes.length}
            </span>
          </span>
        }
        description="Configure sub expense types, country availability, and spending thresholds for this Expense Type."
        headerAside={
          <Button variant="outline" size="sm" onClick={addSubtype}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        }
      >
        <div className="space-y-4">
          {subtypes.map((s, idx) => {
            const errs = subtypeErrors[s.id] || {};
            return (
              <div key={s.id} className="rounded-lg border bg-card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Sub Type #{idx + 1}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      s.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Row 1: 3-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Sub Expense Type <RequiredMark />
                    </Label>
                    <Input
                      placeholder="e.g., FAT90-Sub-TC001-..."
                      value={s.subExpenseType}
                      onChange={(e) => updateSubtype(s.id, "subExpenseType", e.target.value)}
                      className={cn(errs.subExpenseType && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Account Code <RequiredMark />
                    </Label>
                    <Input
                      placeholder="e.g., ACC-TC001"
                      value={s.accountCode}
                      onChange={(e) => updateSubtype(s.id, "accountCode", e.target.value)}
                      className={cn(errs.accountCode && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Account Name (EN) <RequiredMark />
                    </Label>
                    <Input
                      placeholder="e.g., Account TC001"
                      value={s.accountNameEn}
                      onChange={(e) => updateSubtype(s.id, "accountNameEn", e.target.value)}
                      className={cn(errs.accountNameEn && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                </div>

                {/* Row 2: Required Documents */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Required Documents</Label>
                  <DocMultiSelect
                    value={s.requiredDocumentIds}
                    onChange={(v) => updateSubtype(s.id, "requiredDocumentIds", v)}
                    placeholder="Select required documents..."
                    options={documentOptions}
                  />
                </div>

                {/* Row 3: Supported Documents */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Supported Documents</Label>
                  <DocMultiSelect
                    value={s.supportedDocumentIds}
                    onChange={(v) => updateSubtype(s.id, "supportedDocumentIds", v)}
                    placeholder="Select supported documents..."
                    options={documentOptions}
                    closedLabel={(n) => `${n} selected`}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center border-t pt-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Active</Label>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(v) => updateSubtype(s.id, "active", v)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {subtypes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">No sub expense types configured yet</p>
              <Button variant="outline" size="sm" onClick={addSubtype}>
                <Plus className="h-4 w-4 mr-1" /> Add Sub Expense Type
              </Button>
            </div>
          )}
        </div>
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
    </PageShell>
  );
}
