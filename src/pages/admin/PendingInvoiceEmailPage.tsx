import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, Bell, Mail } from "lucide-react";

export default function PendingInvoiceEmailPage() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-0.5">Pending Invoice Email</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure notifications for cardholders with pending invoice submissions</p>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-sm">Enable Notifications</div>
                <div className="text-xs text-muted-foreground">Send a consolidated email to each cardholder listing all pending invoice submissions</div>
              </div>
            </div>
            <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-sm">Enable Reminders</div>
                <div className="text-xs text-muted-foreground">Send a periodic reminder if invoices remain in PENDING_DOCUMENT status</div>
              </div>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-md p-3">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Emails are sent 30 minutes after a claim is submitted. Reminders repeat every 2 days until all invoices are submitted.</span>
        </div>

        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Show Email Preview
              <ChevronDown className={`h-4 w-4 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 border rounded-lg bg-card p-5 space-y-3">
              <div className="text-xs space-y-1">
                <div><span className="font-medium text-muted-foreground">To:</span> somchai@makro.co.th</div>
                <div><span className="font-medium text-muted-foreground">Subject:</span> Action Required — Pending Invoice Submission</div>
              </div>
              <hr />
              <div className="text-sm space-y-2">
                <p>Hi Somchai,</p>
                <p>You have <strong>3</strong> expenses pending invoice upload.</p>
                <div className="border rounded overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Claim #</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t"><td className="p-2">CLM-2026-001</td><td className="p-2">฿1,250.00</td><td className="p-2">Pending Document</td></tr>
                      <tr className="border-t"><td className="p-2">CLM-2026-002</td><td className="p-2">฿3,400.00</td><td className="p-2">Pending Document</td></tr>
                      <tr className="border-t"><td className="p-2">CLM-2026-003</td><td className="p-2">฿780.00</td><td className="p-2">Pending Document</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground text-xs">Please upload the required invoices at your earliest convenience.</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
