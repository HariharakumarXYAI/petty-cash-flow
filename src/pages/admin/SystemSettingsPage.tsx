import { useState } from "react";
import { Settings, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const [autoApproveLimit, setAutoApproveLimit] = useState("7500");
  const [ocrCutoff, setOcrCutoff] = useState("0.75");
  const [advanceOverdueDays, setAdvanceOverdueDays] = useState("14");
  const [duplicateWindowDays, setDuplicateWindowDays] = useState("7");
  const [maintenance, setMaintenance] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const save = () => toast.success("System settings saved");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">System Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Global thresholds, OCR tuning, and operational parameters
            </p>
          </div>
        </div>
        <Button size="sm" onClick={save} className="gap-1.5">
          <Save className="h-3.5 w-3.5" /> Save changes
        </Button>
      </div>

      <Section title="Auto-approval thresholds" hint="Applied across all stores. Per-country overrides live in Policy Management.">
        <FieldRow label="Default auto-approve limit (THB)">
          <Input value={autoApproveLimit} onChange={(e) => setAutoApproveLimit(e.target.value)} className="max-w-[180px]" />
        </FieldRow>
        <FieldRow label="Duplicate detection window (days)">
          <Input value={duplicateWindowDays} onChange={(e) => setDuplicateWindowDays(e.target.value)} className="max-w-[180px]" />
        </FieldRow>
      </Section>

      <Section title="OCR engine" hint="Claims below the confidence cutoff are flagged for human review.">
        <FieldRow label="Confidence cutoff (0.0–1.0)">
          <Input value={ocrCutoff} onChange={(e) => setOcrCutoff(e.target.value)} className="max-w-[180px]" />
        </FieldRow>
      </Section>

      <Section title="Advances" hint="Aging policy that drives the overdue badge and blocking rules.">
        <FieldRow label="Days before advance is overdue">
          <Input value={advanceOverdueDays} onChange={(e) => setAdvanceOverdueDays(e.target.value)} className="max-w-[180px]" />
        </FieldRow>
      </Section>

      <Section title="Notifications & maintenance">
        <FieldRow label="Send email notifications">
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </FieldRow>
        <FieldRow label="Maintenance mode (read-only platform)">
          <Switch checked={maintenance} onCheckedChange={setMaintenance} />
        </FieldRow>
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Info className="h-3 w-3" /> {hint}
          </p>
        )}
      </div>
      <Separator className="mb-3" />
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}
