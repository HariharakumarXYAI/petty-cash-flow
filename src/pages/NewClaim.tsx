import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Camera, ArrowLeft, Receipt, CheckCircle, AlertTriangle,
  XCircle, Lightbulb, FileCheck, Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { stores, expenseTypes } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function NewClaim() {
  const navigate = useNavigate();
  const { country } = useGlobalFilter();
  const [uploaded, setUploaded] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState("");
  const [amount, setAmount] = useState("");

  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const filteredExpenseTypes = country === "all" ? expenseTypes : expenseTypes.filter(e => e.countries.includes(country as any));

  const selectedExpenseType = expenseTypes.find(e => e.id === selectedExpense);
  const amountNum = parseFloat(amount) || 0;
  const isOverAlert = selectedExpenseType && amountNum > selectedExpenseType.alertThreshold;
  const isOverHardStop = selectedExpenseType && amountNum > selectedExpenseType.hardStopThreshold;

  const expectedOutcome = isOverHardStop ? "On Hold" : isOverAlert ? "Auto Approved with Alert" : "Auto Approved";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Claim Submitted", description: "Your claim has been submitted for OCR validation." });
    navigate("/claims");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Claim</h1>
          <p className="text-sm text-muted-foreground">Submit a petty cash claim · Under 60 seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left - Receipt & OCR */}
          <div className="lg:col-span-5 space-y-4">
            {/* Upload */}
            <div className="metric-card p-0 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" /> Receipt Capture
                </h3>
              </div>
              {!uploaded ? (
                <div
                  className="p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setUploaded(true)}
                >
                  <div className="mx-auto h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center mb-4">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Drop receipt or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · Max 10MB</p>
                  <p className="text-xs text-primary mt-2">OCR will extract data automatically</p>
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button type="button" variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1" />Upload</Button>
                    <Button type="button" variant="outline" size="sm"><Camera className="h-3.5 w-3.5 mr-1" />Camera</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <FileCheck className="h-8 w-8 text-status-approved mx-auto mb-2" />
                    <p className="text-sm font-medium">receipt_20260306.jpg</p>
                    <p className="text-xs text-muted-foreground">2.4 MB · Uploaded</p>
                  </div>

                  {/* OCR Preview */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">OCR Extracted Data</h4>
                      <Badge variant="approved">94% Confidence</Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Vendor:</span>
                        <span className="ml-1 font-medium">OfficeMate</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-1 font-medium">2026-03-06</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-1 font-medium">฿1,250.00</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tax ID:</span>
                        <span className="ml-1 font-medium">0105536...</span>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Check */}
                  <div className="flex items-center gap-2 p-2 rounded-md bg-status-approved/5 border border-status-approved/10">
                    <CheckCircle className="h-4 w-4 text-status-approved shrink-0" />
                    <span className="text-xs text-status-approved font-medium">No duplicate receipt detected</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Claim Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="metric-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Claim Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="section-label">Country</Label>
                  <Select defaultValue={country !== "all" ? country : "TH"}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                      <SelectItem value="KH">🇰🇭 Cambodia</SelectItem>
                      <SelectItem value="MM">🇲🇲 Myanmar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Store</Label>
                  <Select>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>
                      {filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Claimant</Label>
                  <Input className="h-9" defaultValue="Somchai Prasert" />
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Expense Type</Label>
                  <Select value={selectedExpense} onValueChange={setSelectedExpense}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {filteredExpenseTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.category} – {e.subcategory}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedExpenseType && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Lightbulb className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground">
                        Max: {selectedExpenseType.maxAmount.toLocaleString()} · Alert at {selectedExpenseType.alertThreshold.toLocaleString()} · Doc required: {selectedExpenseType.documentRequired ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Amount</Label>
                  <Input className="h-9" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Currency</Label>
                  <Select defaultValue="THB">
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="MMK">MMK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Receipt Date</Label>
                  <Input className="h-9" type="date" defaultValue="2026-03-06" />
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Vendor</Label>
                  <Input className="h-9" placeholder="Vendor name" />
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Payment Mode</Label>
                  <Select defaultValue="cash">
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="section-label">Link to Advance</Label>
                  <Select>
                    <SelectTrigger className="h-9"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked advance</SelectItem>
                      <SelectItem value="a1">ADV-TH-2026-0042</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="section-label">Notes</Label>
                <Textarea placeholder="Brief description of expense..." rows={2} />
              </div>
            </div>

            {/* Validation Summary */}
            <div className="metric-card space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Validation Summary</h3>
              <div className="space-y-2">
                {[
                  { label: "Receipt attached", pass: uploaded },
                  { label: "Amount within policy limit", pass: !isOverHardStop },
                  { label: "Expense type allowed", pass: true },
                  { label: "No duplicate receipt", pass: true },
                  { label: "Submission within window", pass: true },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {rule.pass ? (
                      <CheckCircle className="h-3.5 w-3.5 text-status-approved" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-status-hold" />
                    )}
                    <span className={rule.pass ? "text-foreground" : "text-status-hold font-medium"}>{rule.label}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Expected Outcome</p>
                  <div className="flex items-center gap-2 mt-1">
                    {expectedOutcome === "Auto Approved" && <CheckCircle className="h-4 w-4 text-status-approved" />}
                    {expectedOutcome === "Auto Approved with Alert" && <AlertTriangle className="h-4 w-4 text-status-validating" />}
                    {expectedOutcome === "On Hold" && <XCircle className="h-4 w-4 text-status-hold" />}
                    <span className="text-sm font-semibold">{expectedOutcome}</span>
                  </div>
                  {isOverHardStop && (
                    <p className="text-xs text-status-hold mt-1">Amount exceeds hard-stop threshold of {selectedExpenseType?.hardStopThreshold.toLocaleString()}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="section-label">Payable Amount</p>
                  <p className="text-xl font-bold tabular-nums mt-0.5">{amountNum > 0 ? amountNum.toLocaleString() : "—"}</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium">This claim will auto-approve if validation passes.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Submit Claim</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Save as Draft</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
