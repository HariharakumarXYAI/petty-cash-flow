import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getDocument, updateDocument, type DocumentType } from "@/lib/documents-store";
import {
  PageShell,
  PageHeader,
  SectionCard,
  FormField,
  FormActions,
  RequiredMark,
} from "@/components/layout";

export default function DocumentEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const original = useMemo(() => getDocument(id), [id]);

  const [name, setName] = useState(original?.name ?? "");
  const [ocrEnabled, setOcrEnabled] = useState(original?.ocr === "Enabled");
  const [active, setActive] = useState(original?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!original) {
      toast.error("Document not found");
      navigate("/admin/documents", { replace: true });
    }
  }, [original, navigate]);

  if (!original) return null;

  const isDirty =
    name.trim() !== original.name ||
    (ocrEnabled ? "Enabled" : "Disabled") !== original.ocr ||
    active !== original.active;

  const disabled = !isDirty || saving;

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Document name is required.");
      return;
    }
    setSaving(true);
    const patch: Partial<DocumentType> = {
      name: name.trim(),
      ocr: ocrEnabled ? "Enabled" : "Disabled",
      active,
    };
    await new Promise((r) => setTimeout(r, 400));
    updateDocument(id, patch);
    setSaving(false);
    toast.success("Document updated");
    navigate("/admin/documents");
  };

  const handleCancel = () => navigate("/admin/documents");

  return (
    <PageShell
      header={
        <PageHeader
          backHref="/admin/documents"
          backLabel="Back to Documents"
          title="Edit Document"
          subtitle={original.name}
        />
      }
    >
      <SectionCard
        title="Document Details"
        description="Configure how this document type is captured and validated."
      >
        <FormField>
          <Label htmlFor="doc-name" className="text-sm">
            Document Name <RequiredMark />
          </Label>
          <Input
            id="doc-name"
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
            <Label className="text-sm font-medium">OCR Verification</Label>
            <p className="text-xs text-muted-foreground">
              Enable optical character recognition for this document.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums w-16 text-right">
              {ocrEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={ocrEnabled} onCheckedChange={setOcrEnabled} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive documents are hidden from claim submissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums w-16 text-right">
              {active ? "Active" : "Inactive"}
            </span>
            <Switch checked={active} onCheckedChange={setActive} />
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
