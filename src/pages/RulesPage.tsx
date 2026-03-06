import { ShieldCheck, AlertTriangle, Copy, Clock, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export default function RulesPage() {
  const [ocrThreshold, setOcrThreshold] = useState([85]);
  const [submissionWindow, setSubmissionWindow] = useState([7]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rules & Thresholds</h1>
          <p className="text-sm text-muted-foreground">Configure validation, detection, and alert logic</p>
        </div>
        <Button size="sm">Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duplicate Detection */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Duplicate Detection</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable receipt hash matching</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Cross-store duplicate check</Label>
              <Switch defaultChecked />
            </div>
            <div className="space-y-1.5">
              <Label className="section-label">Hash similarity threshold (%)</Label>
              <Input className="h-9" type="number" defaultValue={90} />
              <p className="text-[10px] text-muted-foreground">Receipts with similarity above this threshold will be flagged</p>
            </div>
            <div className="space-y-1.5">
              <Label className="section-label">Lookback period (days)</Label>
              <Input className="h-9" type="number" defaultValue={90} />
            </div>
          </div>
        </div>

        {/* OCR Validation */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">OCR Validation</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="section-label">Minimum confidence threshold</Label>
              <Slider value={ocrThreshold} onValueChange={setOcrThreshold} max={100} min={50} step={5} className="mt-2" />
              <p className="text-xs text-muted-foreground">Current: {ocrThreshold}% — Below this, manual review required</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto-fill form from OCR</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Require vendor name match</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Submission Window */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Submission Rules</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="section-label">Submission window (days after receipt)</Label>
              <Slider value={submissionWindow} onValueChange={setSubmissionWindow} max={30} min={1} step={1} className="mt-2" />
              <p className="text-xs text-muted-foreground">Current: {submissionWindow} days</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Block late submissions</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Allow backdated claims with approval</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Hard Stop Conditions */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-status-hold" />
            <h3 className="text-sm font-semibold text-foreground">Hard-Stop Conditions</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Duplicate receipt detected</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Prohibited expense type</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Missing mandatory document</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Amount exceeds hard-stop limit</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Vendor on blocked list</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Alert Logic */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-validating" />
            <h3 className="text-sm font-semibold text-foreground">Alert Logic</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="section-label">Peer deviation threshold (%)</Label>
              <Input className="h-9" type="number" defaultValue={150} />
              <p className="text-[10px] text-muted-foreground">Alert when store spend exceeds peer avg by this %</p>
            </div>
            <div className="space-y-1.5">
              <Label className="section-label">YoY deviation threshold (%)</Label>
              <Input className="h-9" type="number" defaultValue={200} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable peer benchmarking</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable year-over-year comparison</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Peer Group */}
        <div className="metric-card space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Peer Group Benchmark</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Group by store type</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Group by country</Label>
              <Switch defaultChecked />
            </div>
            <div className="space-y-1.5">
              <Label className="section-label">Minimum peer group size</Label>
              <Input className="h-9" type="number" defaultValue={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="section-label">Comparison period (months)</Label>
              <Input className="h-9" type="number" defaultValue={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
