import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertTriangle, Ban, ShieldAlert } from "lucide-react";
import { expenseTypes, type ExpenseType } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="border-b mt-2" />
  </div>
);

export default function ExpenseTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const original = useMemo<ExpenseType | undefined>(
    () => expenseTypes.find((e) => e.id === id),
    [id],
  );

  const [form, setForm] = useState<ExpenseType | null>(original ? { ...original } : null);

  if (!original || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Expense type not found</p>
      </div>
    );
  }

  const update = <K extends keyof ExpenseType>(key: K, value: ExpenseType[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const max = Math.max(form.maxAmount, form.hardStopThreshold, 1);
  const alertPct = Math.min(100, Math.max(0, (form.alertThreshold / max) * 100));
  const hardPct = Math.min(100, Math.max(0, (form.hardStopThreshold / max) * 100));

  const handleSave = () => {
    toast.success(`${form.category} › ${form.subcategory} updated successfully`);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-32">
        <Link
          to="/admin/expense-types"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Expense Types
        </Link>

        <h1 className="text-3xl font-bold text-foreground">Edit Expense Type</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {form.category} › {form.subcategory}
        </p>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8 space-y-10">
          {/* Basic Information */}
          <section>
            <SectionHeader title="Basic Information" />
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label htmlFor="category">Expense Type</Label>
                <Input
                  id="category"
                  className="mt-1.5 rounded-md"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="e.g. Office Supplies"
                />
              </div>
              <div>
                <Label htmlFor="subcategory">Sub-Expense Type</Label>
                <Input
                  id="subcategory"
                  className="mt-1.5 rounded-md"
                  value={form.subcategory}
                  onChange={(e) => update("subcategory", e.target.value)}
                  placeholder="e.g. Stationery"
                />
              </div>
            </div>
          </section>

          {/* Threshold Configuration */}
          <section>
            <SectionHeader title="Threshold Configuration" />
            <p className="text-sm text-muted-foreground -mt-4 mb-5">
              Define the amount limits that trigger alerts or block submissions.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max" className="text-xs text-muted-foreground">Max Amount</Label>
                <Input
                  id="max"
                  type="number"
                  step={100}
                  className="mt-1.5 rounded-md tabular-nums"
                  value={form.maxAmount}
                  onChange={(e) => update("maxAmount", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="alert" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-status-validating" />
                  <span className="text-status-validating">Alert</span>
                </Label>
                <Input
                  id="alert"
                  type="number"
                  step={100}
                  className="mt-1.5 rounded-md tabular-nums border-status-validating/40 focus-visible:ring-status-validating/30"
                  value={form.alertThreshold}
                  onChange={(e) => update("alertThreshold", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="hardstop" className="text-xs flex items-center gap-1">
                  <Ban className="h-3 w-3 text-status-hold" />
                  <span className="text-status-hold">Hard Stop</span>
                </Label>
                <Input
                  id="hardstop"
                  type="number"
                  step={100}
                  className="mt-1.5 rounded-md tabular-nums border-status-hold/50 focus-visible:ring-status-hold/30"
                  value={form.hardStopThreshold}
                  onChange={(e) => update("hardStopThreshold", Number(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Threshold visualization */}
            <div className="mt-5 flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-primary/40"
                  style={{ width: `${alertPct}%` }}
                />
                <div
                  className="absolute inset-y-0 bg-status-validating"
                  style={{ left: `${alertPct}%`, width: `${Math.max(0, hardPct - alertPct)}%` }}
                />
                <div
                  className="absolute inset-y-0 bg-status-hold"
                  style={{ left: `${hardPct}%`, right: 0 }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                OK → Alert → Block
              </span>
            </div>
          </section>

          {/* Rules & Flags */}
          <section>
            <SectionHeader title="Rules & Flags" />
            <div className="divide-y">
              <div className="flex items-center justify-between py-4">
                <div>
                  <Label className="text-sm">Document Required</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Claim must include receipt or invoice</p>
                </div>
                <Switch
                  checked={form.documentRequired}
                  onCheckedChange={(v) => update("documentRequired", v)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <Label className="text-sm">Advance Allowed</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Can be funded via cash advance</p>
                </div>
                <Switch
                  checked={form.advanceAllowed}
                  onCheckedChange={(v) => update("advanceAllowed", v)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <Label className="text-sm">Reimbursement Allowed</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Post-payment reimbursement permitted</p>
                </div>
                <Switch
                  checked={form.reimbursementAllowed}
                  onCheckedChange={(v) => update("reimbursementAllowed", v)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-status-hold" />
                  <div>
                    <Label className="text-sm">Audit Sensitive</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Triggers mandatory audit sampling</p>
                  </div>
                </div>
                <Switch
                  checked={form.auditSensitive}
                  onCheckedChange={(v) => update("auditSensitive", v)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
        <div className="max-w-[900px] mx-auto flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button
            onClick={handleSave}
            className={cn("bg-foreground text-background hover:bg-foreground/90")}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
