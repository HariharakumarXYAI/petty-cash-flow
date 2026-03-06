import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileImage, GitCompare, ShieldCheck, Clock, Link2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claims } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const claim = claims.find(c => c.id === id);

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Claim not found</p>
        <Button variant="ghost" onClick={() => navigate("/claims")} className="mt-2">Back to Claims</Button>
      </div>
    );
  }

  const timeline = [
    { time: claim.submittedAt, event: "Claim submitted", actor: claim.submitter, status: "done" },
    { time: claim.submittedAt, event: "OCR validation started", actor: "System", status: "done" },
    ...(claim.ocrConfidence > 0 ? [{ time: claim.submittedAt, event: `OCR completed · ${claim.ocrConfidence}% confidence`, actor: "System", status: "done" as const }] : []),
    ...(claim.status === "Auto Approved" ? [{ time: claim.submittedAt, event: "Auto-approved", actor: "System", status: "done" as const }] : []),
    ...(claim.status === "Auto Approved with Alert" ? [{ time: claim.submittedAt, event: "Auto-approved with alert flag", actor: "System", status: "done" as const }] : []),
    ...(claim.status === "On Hold" ? [{ time: claim.submittedAt, event: "Put on hold — validation failed", actor: "System", status: "active" as const }] : []),
    ...(claim.status === "Under Investigation" ? [{ time: claim.submittedAt, event: "Investigation opened", actor: "System", status: "active" as const }] : []),
    ...(claim.status === "Settled" ? [{ time: claim.submittedAt, event: "Payment settled", actor: "System", status: "done" as const }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/claims")} className="h-8 w-8 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground font-mono">{claim.claimNumber}</h1>
            <StatusBadge status={claim.status} />
            {claim.hasAlert && <Badge variant="alert">Alert Flagged</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {claim.store} · {claim.submitter} · {claim.amount.toLocaleString()} {claim.currency}
          </p>
        </div>
        <Button variant="outline" size="sm"><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="metric-card py-3">
          <p className="section-label">Amount</p>
          <p className="text-xl font-bold tabular-nums mt-1">{claim.amount.toLocaleString()} {claim.currency}</p>
        </div>
        <div className="metric-card py-3">
          <p className="section-label">Expense Type</p>
          <p className="text-sm font-medium mt-1">{claim.expenseType}</p>
          <p className="text-xs text-muted-foreground">{claim.subcategory}</p>
        </div>
        <div className="metric-card py-3">
          <p className="section-label">OCR Confidence</p>
          <p className={`text-xl font-bold mt-1 ${claim.ocrConfidence >= 90 ? "text-status-approved" : claim.ocrConfidence >= 75 ? "text-status-validating" : "text-status-hold"}`}>
            {claim.ocrConfidence > 0 ? `${claim.ocrConfidence}%` : "Pending"}
          </p>
        </div>
        <div className="metric-card py-3">
          <p className="section-label">Receipt Date</p>
          <p className="text-sm font-medium mt-1">{claim.receiptDate}</p>
          <p className="text-xs text-muted-foreground">Vendor: {claim.vendor}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receipt" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="receipt" className="gap-1.5 text-xs"><FileImage className="h-3.5 w-3.5" />Receipt</TabsTrigger>
          <TabsTrigger value="ocr" className="gap-1.5 text-xs"><GitCompare className="h-3.5 w-3.5" />OCR vs Input</TabsTrigger>
          <TabsTrigger value="validation" className="gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Validation</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Timeline</TabsTrigger>
          <TabsTrigger value="linked" className="gap-1.5 text-xs"><Link2 className="h-3.5 w-3.5" />Linked</TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="metric-card">
          <div className="flex items-center justify-center bg-muted/30 rounded-lg h-64 border-2 border-dashed border-border">
            <div className="text-center">
              <FileImage className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Receipt image preview</p>
              <p className="text-xs text-muted-foreground mt-1">receipt_{claim.claimNumber}.jpg</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="metric-card">
          <h3 className="text-sm font-semibold mb-4">OCR Extracted vs User Input</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="font-semibold text-muted-foreground uppercase tracking-wider">Field</div>
            <div className="font-semibold text-muted-foreground uppercase tracking-wider">OCR Value</div>
            <div className="font-semibold text-muted-foreground uppercase tracking-wider">User Input</div>
            {[
              { field: "Vendor", ocr: claim.vendor, user: claim.vendor },
              { field: "Amount", ocr: claim.amount.toLocaleString(), user: claim.amount.toLocaleString() },
              { field: "Date", ocr: claim.receiptDate, user: claim.receiptDate },
              { field: "Tax ID", ocr: "0105536xxxx", user: "0105536xxxx" },
            ].map((row, i) => (
              <React.Fragment key={i}>
                <div className="text-foreground font-medium py-2 border-t">{row.field}</div>
                <div className="text-foreground py-2 border-t font-mono">{row.ocr}</div>
                <div className="text-foreground py-2 border-t">{row.user}</div>
              </React.Fragment>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="validation" className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Validation Rules</h3>
          <div className="space-y-3">
            {[
              { rule: "Receipt document attached", pass: true },
              { rule: "Amount within policy limit", pass: claim.status !== "On Hold" },
              { rule: "Expense type allowed for country", pass: true },
              { rule: "No duplicate receipt detected", pass: claim.status !== "Rejected" },
              { rule: "Submission within 7-day window", pass: true },
              { rule: "OCR confidence above threshold", pass: claim.ocrConfidence >= 75 },
              { rule: "Vendor not on blocked list", pass: true },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${r.pass ? "bg-status-approved/10 text-status-approved" : "bg-status-hold/10 text-status-hold"}`}>
                  {r.pass ? "✓" : "✕"}
                </div>
                <span className="text-sm">{r.rule}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Claim Timeline</h3>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${item.status === "active" ? "bg-primary ring-4 ring-primary/20" : "bg-status-approved"}`} />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.event}</p>
                  <p className="text-xs text-muted-foreground">{item.actor} · {new Date(item.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="linked" className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Linked Entries</h3>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="section-label">Cashbook Entry</p>
              <p className="text-sm font-medium mt-1">Claim Payout · {claim.claimNumber}</p>
              <p className="text-xs text-muted-foreground">{claim.amount.toLocaleString()} {claim.currency} · {claim.store}</p>
            </div>
            {claim.linkedAdvanceId && (
              <div className="p-3 border rounded-lg">
                <p className="section-label">Linked Advance</p>
                <p className="text-sm font-medium mt-1">{claim.linkedAdvanceId}</p>
              </div>
            )}
            {!claim.linkedAdvanceId && (
              <p className="text-sm text-muted-foreground">No linked advance</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

