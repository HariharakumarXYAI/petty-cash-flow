import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getDocument, updateDocument, type DocumentType } from "@/lib/documents-store";

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

  const handleCancel = () => {
    navigate("/admin/documents");
  };

  return (
    <div className="-m-6 min-h-full bg-gray-50">
      <div className="p-6 pb-24">
        <div className="max-w-[700px]">
          <Link
            to="/admin/documents"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Edit Document</h1>
            <p className="text-sm text-muted-foreground mt-2">{original.name}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-5">
            <div>
              <Label htmlFor="doc-name" className="text-sm font-medium">
                Document Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                className={cn("mt-1.5", nameError && "border-destructive focus-visible:ring-destructive")}
              />
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            </div>

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
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] py-4 px-8">
        <div className="max-w-[700px] flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={disabled}
            className={cn(
              "bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md px-5",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
