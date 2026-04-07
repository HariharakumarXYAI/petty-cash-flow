import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, Bell, Mail } from "lucide-react";

export default function PendingApprovalEmailPage() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-0.5">Pending Approval — Email & Reminder Setup</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure consolidated email notifications for approvers with pending expense claims</p>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-sm">Enable Notifications</div>
                <div className="text-xs text-muted-foreground">Send a consolidated email to each approver listing all expense claims awaiting their approval</div>
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
                <div className="text-xs text-muted-foreground">Send a periodic reminder if claims remain in PENDING_APPROVAL status</div>
              </div>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-md p-3">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Emails are sent 30 minutes after a claim is submitted. Reminders repeat every 2 days until all claims are actioned.</span>
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
                <div><span className="font-medium text-muted-foreground">To:</span> manager@makro.co.th</div>
                <div><span className="font-medium text-muted-foreground">Subject:</span> Action Required — Pending Expense Approvals</div>
              </div>
              <hr />
              <div className="text-sm space-y-2">
                <p>Hi Manager,</p>
                <p>You have <strong>5</strong> expense claims awaiting your approval.</p>
                <div className="border rounded overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Claim #</th>
                        <th className="text-left p-2 font-medium">Employee</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t"><td className="p-2">CLM-2026-010</td><td className="p-2">สมชาย ใจดี</td><td className="p-2">฿2,500.00</td><td className="p-2">2026-04-01</td></tr>
                      <tr className="border-t"><td className="p-2">CLM-2026-011</td><td className="p-2">วิชาญ เจริญ</td><td className="p-2">฿4,200.00</td><td className="p-2">2026-04-02</td></tr>
                      <tr className="border-t"><td className="p-2">CLM-2026-012</td><td className="p-2">มานพ เก่ง</td><td className="p-2">฿1,800.00</td><td className="p-2">2026-04-03</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground text-xs">Please review and action these claims at your earliest convenience.</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
