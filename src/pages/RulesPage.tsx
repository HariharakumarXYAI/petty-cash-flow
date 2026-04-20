import { ShieldCheck, AlertTriangle, Copy, Clock, Scan, Ban, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface RuleToggleProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  variant?: "default" | "alert" | "hardstop";
}

function RuleToggle({ label, description, defaultChecked, variant = "default" }: RuleToggleProps) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 px-2.5 rounded-md ${
      variant === "hardstop" ? "bg-status-hold/5" : variant === "alert" ? "bg-status-validating/5" : ""
    }`}>
      <div className="space-y-0.5">
        <Label className="text-sm flex items-center gap-1.5">
          {variant === "hardstop" && <Ban className="h-3 w-3 text-status-hold" />}
          {variant === "alert" && <AlertTriangle className="h-3 w-3 text-status-validating" />}
          {label}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} className="flex-shrink-0 mt-0.5" />
    </div>
  );
}

export default function RulesPage() {
  const [ocrThreshold, setOcrThreshold] = useState([85]);
  const [submissionWindow, setSubmissionWindow] = useState([7]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rules & Thresholds</h1>
          <p className="text-sm text-muted-foreground">Configure validation, detection, and alert logic across all countries</p>
        </div>
        <Button size="sm">Save All Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hard-Stop Conditions — most critical, first */}
        <div className="metric-card space-y-3 border-status-hold/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-status-hold/10">
              <Ban className="h-3.5 w-3.5 text-status-hold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hard-Stop Conditions</h3>
              <p className="text-[11px] text-muted-foreground">Claims matching these rules are blocked from submission</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <RuleToggle variant="hardstop" label="Duplicate receipt detected" description="Block if receipt hash matches an existing claim" defaultChecked />
            <RuleToggle variant="hardstop" label="Prohibited expense type" description="Block if category is marked as prohibited for the store" defaultChecked />
            <RuleToggle variant="hardstop" label="Missing mandatory document" description="Block if required receipt or invoice is not attached" defaultChecked />
            <RuleToggle variant="hardstop" label="Amount exceeds hard-stop limit" description="Block if claim amount is above the expense type hard-stop threshold" defaultChecked />
            
          </div>
        </div>

        {/* Alert Logic */}
        <div className="metric-card space-y-3 border-status-validating/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-status-validating/10">
              <AlertTriangle className="h-3.5 w-3.5 text-status-validating" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alert Logic</h3>
              <p className="text-[11px] text-muted-foreground">Claims matching these rules generate alerts for review</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Peer deviation threshold (%)</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={150} />
              <p className="text-[10px] text-muted-foreground">Alert when store spend exceeds peer average by this percentage</p>
            </div>
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">YoY deviation threshold (%)</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={200} />
              <p className="text-[10px] text-muted-foreground">Alert when spend exceeds same period last year by this percentage</p>
            </div>
            <Separator />
            <RuleToggle variant="alert" label="Enable peer benchmarking" description="Compare store spending against peer group averages" defaultChecked />
            <RuleToggle variant="alert" label="Enable year-over-year comparison" description="Compare current period against historical spend data" defaultChecked />
          </div>
        </div>

        {/* Duplicate Detection */}
        <div className="metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10">
              <Copy className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Duplicate Detection</h3>
              <p className="text-[11px] text-muted-foreground">Receipt matching and cross-store checks</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <RuleToggle label="Receipt hash matching" description="Use image fingerprinting to detect resubmitted receipts" defaultChecked />
            <RuleToggle label="Cross-store duplicate check" description="Check for duplicates across all stores, not just the submitter's" defaultChecked />
            <Separator />
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Hash similarity threshold (%)</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={90} />
              <p className="text-[10px] text-muted-foreground">Receipts above this similarity score are flagged as potential duplicates</p>
            </div>
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Lookback period (days)</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={90} />
              <p className="text-[10px] text-muted-foreground">How far back to search for matching receipts</p>
            </div>
          </div>
        </div>

        {/* OCR Validation */}
        <div className="metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10">
              <Scan className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">OCR Validation</h3>
              <p className="text-[11px] text-muted-foreground">Optical character recognition settings</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Minimum confidence threshold</Label>
              <Slider value={ocrThreshold} onValueChange={setOcrThreshold} max={100} min={50} step={5} className="mt-2" />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground">Below this → manual review required</p>
                <span className="text-xs font-semibold tabular-nums text-foreground">{ocrThreshold}%</span>
              </div>
            </div>
            <Separator />
            <RuleToggle label="Auto-fill form from OCR" description="Pre-populate claim fields from scanned receipt data" defaultChecked />
            <RuleToggle label="Require vendor name match" description="OCR-extracted vendor must match a known vendor record" defaultChecked />
          </div>
        </div>

        {/* Submission Rules */}
        <div className="metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10">
              <Clock className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Submission Rules</h3>
              <p className="text-[11px] text-muted-foreground">Timing and late submission policies</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Submission window (days after receipt)</Label>
              <Slider value={submissionWindow} onValueChange={setSubmissionWindow} max={30} min={1} step={1} className="mt-2" />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground">Claims submitted after this window are flagged</p>
                <span className="text-xs font-semibold tabular-nums text-foreground">{submissionWindow} days</span>
              </div>
            </div>
            <Separator />
            <RuleToggle label="Block late submissions" description="Prevent claims submitted after the allowed window" />
            <RuleToggle label="Allow backdated with approval" description="Late claims can proceed if a manager approves" defaultChecked />
          </div>
        </div>

        {/* Peer Group Benchmark */}
        <div className="metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Peer Group Benchmark</h3>
              <p className="text-[11px] text-muted-foreground">How stores are grouped for comparison</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <RuleToggle label="Group by store type" description="Compare Hypermarkets with Hypermarkets, Minis with Minis" defaultChecked />
            <RuleToggle label="Group by country" description="Only compare stores within the same country" defaultChecked />
            <Separator />
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Minimum peer group size</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={3} />
              <p className="text-[10px] text-muted-foreground">Skip benchmarking if peer group has fewer stores than this</p>
            </div>
            <div className="space-y-1.5 px-2.5">
              <Label className="text-xs text-muted-foreground">Comparison period (months)</Label>
              <Input className="h-9 tabular-nums" type="number" defaultValue={3} />
              <p className="text-[10px] text-muted-foreground">Rolling period used for peer average calculations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
