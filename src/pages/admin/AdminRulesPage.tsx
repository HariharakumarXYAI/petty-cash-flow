import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Ban, AlertTriangle, Copy, ScanLine, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "red" | "amber" | "plain";
}

function ToggleRow({ label, description, checked, onChange, tone = "plain" }: ToggleRowProps) {
  const Icon = tone === "red" ? Ban : tone === "amber" ? AlertTriangle : null;
  const iconColor = tone === "red" ? "text-red-600" : "text-amber-600";
  const wrap =
    tone === "red"
      ? "bg-red-50/50 rounded-lg p-4"
      : tone === "amber"
      ? "bg-amber-50/50 rounded-lg p-4"
      : "py-3";

  return (
    <div className={cn("flex items-start justify-between gap-4", wrap)}>
      <div className="space-y-1">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          {Icon && <Icon className={cn("h-3.5 w-3.5", iconColor)} />}
          {label}
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  );
}

interface CardHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function CardHeader({ icon, iconBg, title, description }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-gray-200">
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

const INITIAL_STATE = {
  hsDuplicate: true,
  hsProhibited: true,
  hsMissingDoc: true,
  hsAmount: true,
  peerPct: 150,
  yoyPct: 200,
  peerEnabled: true,
  yoyEnabled: true,
  hashMatch: true,
  crossStore: true,
  ocrConfidence: 85,
  autoFill: true,
};

type RulesState = typeof INITIAL_STATE;

export default function AdminRulesPage() {
  const [savedState, setSavedState] = useState<RulesState>(INITIAL_STATE);
  const [state, setState] = useState<RulesState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof RulesState>(key: K, value: RulesState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const isDirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(savedState),
    [state, savedState],
  );

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavedState(state);
    setSaving(false);
    toast.success("Rule settings saved");
  };

  const handleCancel = () => {
    setState(savedState);
    toast("Changes discarded");
  };

  return (
    <div className="-m-6 min-h-full bg-gray-50">
      <div className="p-6 pb-24">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Rules &amp; Thresholds</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Configure validation, detection, and alert logic across all countries
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Hard-Stop Conditions */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader
                icon={<Ban className="h-5 w-5" />}
                iconBg="bg-red-50 text-red-600"
                title="Hard-Stop Conditions"
                description="Claims matching these rules are blocked from submission"
              />
              <div className="space-y-3">
                <ToggleRow
                  tone="red"
                  label="Duplicate receipt detected"
                  description="Block if receipt hash matches an existing claim"
                  checked={state.hsDuplicate}
                  onChange={(v) => update("hsDuplicate", v)}
                />
                <ToggleRow
                  tone="red"
                  label="Prohibited expense type"
                  description="Block if category is marked as prohibited for the store"
                  checked={state.hsProhibited}
                  onChange={(v) => update("hsProhibited", v)}
                />
                <ToggleRow
                  tone="red"
                  label="Missing mandatory document"
                  description="Block if required receipt or invoice is not attached"
                  checked={state.hsMissingDoc}
                  onChange={(v) => update("hsMissingDoc", v)}
                />
                <ToggleRow
                  tone="red"
                  label="Amount exceeds hard-stop limit"
                  description="Block if claim amount is above the expense type hard-stop threshold"
                  checked={state.hsAmount}
                  onChange={(v) => update("hsAmount", v)}
                />
              </div>
            </section>

            {/* Card 2: Alert Logic */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBg="bg-amber-50 text-amber-600"
                title="Alert Logic"
                description="Claims matching these rules generate alerts for review"
              />
              <div className="space-y-5">
                <div>
                  <Label htmlFor="peer-pct" className="text-sm font-medium">Peer deviation threshold (%)</Label>
                  <Input
                    id="peer-pct"
                    type="number"
                    step={10}
                    value={state.peerPct}
                    onChange={(e) => update("peerPct", Number(e.target.value) || 0)}
                    className="mt-1.5 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Alert when store spend exceeds peer average by this percentage
                  </p>
                </div>
                <div>
                  <Label htmlFor="yoy-pct" className="text-sm font-medium">YoY deviation threshold (%)</Label>
                  <Input
                    id="yoy-pct"
                    type="number"
                    step={10}
                    value={state.yoyPct}
                    onChange={(e) => update("yoyPct", Number(e.target.value) || 0)}
                    className="mt-1.5 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Alert when spend exceeds same period last year by this percentage
                  </p>
                </div>
                <ToggleRow
                  tone="amber"
                  label="Enable peer benchmarking"
                  description="Compare store spending against peer group averages"
                  checked={state.peerEnabled}
                  onChange={(v) => update("peerEnabled", v)}
                />
                <ToggleRow
                  tone="amber"
                  label="Enable year-over-year comparison"
                  description="Compare current period against historical spend data"
                  checked={state.yoyEnabled}
                  onChange={(v) => update("yoyEnabled", v)}
                />
              </div>
            </section>

            {/* Card 3: Duplicate Detection */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader
                icon={<Copy className="h-5 w-5" />}
                iconBg="bg-blue-50 text-blue-600"
                title="Duplicate Detection"
                description="Receipt matching and cross-store checks"
              />
              <div className="divide-y">
                <ToggleRow
                  label="Receipt hash matching"
                  description="Use image fingerprinting to detect resubmitted receipts"
                  checked={state.hashMatch}
                  onChange={(v) => update("hashMatch", v)}
                />
                <ToggleRow
                  label="Cross-store duplicate check"
                  description="Check for duplicates across all stores, not just the submitter's"
                  checked={state.crossStore}
                  onChange={(v) => update("crossStore", v)}
                />
              </div>
            </section>

            {/* Card 4: OCR Validation */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader
                icon={<ScanLine className="h-5 w-5" />}
                iconBg="bg-blue-50 text-blue-600"
                title="OCR Validation"
                description="Optical character recognition settings"
              />
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Minimum confidence threshold</Label>
                  <div className="mt-3">
                    <Slider
                      value={[state.ocrConfidence]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => update("ocrConfidence", v[0])}
                    />
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <span className="text-2xl font-bold text-foreground tabular-nums">{state.ocrConfidence}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Below this → manual review required
                  </p>
                </div>
                <div className="border-t pt-3">
                  <ToggleRow
                    label="Auto-fill form from OCR"
                    description="Use OCR extracted values to pre-populate claim form fields"
                    checked={state.autoFill}
                    onChange={(v) => update("autoFill", v)}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky footer action bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] py-4 px-8">
        <div className="max-w-[1200px] mx-auto flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className={cn(
              "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md px-5",
              (!isDirty || saving) && "opacity-50 cursor-not-allowed",
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5",
              (!isDirty || saving) && "opacity-50 cursor-not-allowed",
            )}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
