import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Ban, AlertTriangle, Copy, ScanLine,
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

export default function AdminRulesPage() {
  // Hard-stop toggles
  const [hsDuplicate, setHsDuplicate] = useState(true);
  const [hsProhibited, setHsProhibited] = useState(true);
  const [hsMissingDoc, setHsMissingDoc] = useState(true);
  const [hsAmount, setHsAmount] = useState(true);

  // Alert logic
  const [peerPct, setPeerPct] = useState(150);
  const [yoyPct, setYoyPct] = useState(200);
  const [peerEnabled, setPeerEnabled] = useState(true);
  const [yoyEnabled, setYoyEnabled] = useState(true);

  // Duplicate detection
  const [hashMatch, setHashMatch] = useState(true);
  const [crossStore, setCrossStore] = useState(true);

  // OCR
  const [ocrConfidence, setOcrConfidence] = useState(85);
  const [autoFill, setAutoFill] = useState(true);

  const handleSave = () => {
    toast.success("Rule settings saved");
  };

  return (
    <div className="-m-6 min-h-full bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rules &amp; Thresholds</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Configure validation, detection, and alert logic across all countries
            </p>
          </div>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save All Changes
          </Button>
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
                checked={hsDuplicate}
                onChange={setHsDuplicate}
              />
              <ToggleRow
                tone="red"
                label="Prohibited expense type"
                description="Block if category is marked as prohibited for the store"
                checked={hsProhibited}
                onChange={setHsProhibited}
              />
              <ToggleRow
                tone="red"
                label="Missing mandatory document"
                description="Block if required receipt or invoice is not attached"
                checked={hsMissingDoc}
                onChange={setHsMissingDoc}
              />
              <ToggleRow
                tone="red"
                label="Amount exceeds hard-stop limit"
                description="Block if claim amount is above the expense type hard-stop threshold"
                checked={hsAmount}
                onChange={setHsAmount}
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
                  value={peerPct}
                  onChange={(e) => setPeerPct(Number(e.target.value) || 0)}
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
                  value={yoyPct}
                  onChange={(e) => setYoyPct(Number(e.target.value) || 0)}
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
                checked={peerEnabled}
                onChange={setPeerEnabled}
              />
              <ToggleRow
                tone="amber"
                label="Enable year-over-year comparison"
                description="Compare current period against historical spend data"
                checked={yoyEnabled}
                onChange={setYoyEnabled}
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
                checked={hashMatch}
                onChange={setHashMatch}
              />
              <ToggleRow
                label="Cross-store duplicate check"
                description="Check for duplicates across all stores, not just the submitter's"
                checked={crossStore}
                onChange={setCrossStore}
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
                    value={[ocrConfidence]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setOcrConfidence(v[0])}
                  />
                </div>
                <div className="flex items-center justify-end mt-2">
                  <span className="text-2xl font-bold text-foreground tabular-nums">{ocrConfidence}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Below this → manual review required
                </p>
              </div>
              <div className="border-t pt-3">
                <ToggleRow
                  label="Auto-fill form from OCR"
                  description="Use OCR extracted values to pre-populate claim form fields"
                  checked={autoFill}
                  onChange={setAutoFill}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
