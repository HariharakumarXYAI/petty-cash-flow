import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { expenseTypes } from "@/lib/mock-data";
import {
  PageShell,
  PageHeader,
  SectionCard,
  FormField,
  FormGrid,
  FormActions,
  RequiredMark,
} from "@/components/layout";

export default function ExpenseTypeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const original = useMemo(() => expenseTypes.find((e) => e.id === id), [id]);

  const [name, setName] = useState(original?.subcategory ?? "");
  const [alertThreshold, setAlertThreshold] = useState<number>(original?.alertThreshold ?? 0);
  const [hardStopThreshold, setHardStopThreshold] = useState<number>(original?.hardStopThreshold ?? 0);
  const [maxAmount, setMaxAmount] = useState<number>(original?.maxAmount ?? 0);
  const [documentRequired, setDocumentRequired] = useState(original?.documentRequired ?? false);
  const [auditSensitive, setAuditSensitive] = useState(original?.auditSensitive ?? false);
  const [advanceAllowed, setAdvanceAllowed] = useState(original?.advanceAllowed ?? false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!original) {
      toast.error("Expense type not found");
      navigate("/admin/expense-types", { replace: true });
    }
  }, [original, navigate]);

  if (!original) return null;

  const isDirty =
    name.trim() !== original.subcategory ||
    alertThreshold !== original.alertThreshold ||
    hardStopThreshold !== original.hardStopThreshold ||
    maxAmount !== original.maxAmount ||
    documentRequired !== original.documentRequired ||
    auditSensitive !== original.auditSensitive ||
    advanceAllowed !== original.advanceAllowed;

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

  return (
    <PageShell
      header={
        <PageHeader
          backHref="/admin/expense-types"
          backLabel="Back to Expense Types"
          title="Edit Expense Type"
          subtitle={`${original.category} · ${original.subcategory}`}
        />
      }
    >
      <SectionCard
        title="Category Details"
        description="Configure how this expense category behaves in claim submissions."
      >
        <FormField>
          <Label htmlFor="et-name" className="text-sm">
            Subtype Name <RequiredMark />
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

        <FormGrid>
          <FormField>
            <Label htmlFor="et-alert" className="text-sm">Alert At</Label>
            <Input
              id="et-alert"
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
            />
          </FormField>
          <FormField>
            <Label htmlFor="et-hardstop" className="text-sm">Hard Stop</Label>
            <Input
              id="et-hardstop"
              type="number"
              value={hardStopThreshold}
              onChange={(e) => setHardStopThreshold(Number(e.target.value))}
            />
          </FormField>
          <FormField>
            <Label htmlFor="et-max" className="text-sm">Max Amount</Label>
            <Input
              id="et-max"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(Number(e.target.value))}
            />
          </FormField>
        </FormGrid>

        <div className="flex items-center justify-between border-t pt-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Document Required</Label>
            <p className="text-xs text-muted-foreground">
              Require employees to attach a supporting document for this expense type.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums w-20 text-right">
              {documentRequired ? "Required" : "Optional"}
            </span>
            <Switch checked={documentRequired} onCheckedChange={setDocumentRequired} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Audit Sensitive</Label>
            <p className="text-xs text-muted-foreground">
              Flag this category for additional audit review and compliance tracking.
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
