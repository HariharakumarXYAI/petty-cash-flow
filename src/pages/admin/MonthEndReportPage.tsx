import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, X } from "lucide-react";

const variables = ["{{month}}", "{{year}}", "{{company}}", "{{total_amount}}", "{{rejected_count}}"];

export default function MonthEndReportPage() {
  const [enabled, setEnabled] = useState(true);
  const [day, setDay] = useState("9");
  const [subject, setSubject] = useState("PettyCash 360 Expense Summary Report — {{month}}/{{year}}");
  const [recipients, setRecipients] = useState(["HR Team", "Finance Team"]);

  const insertVariable = (v: string) => {
    setSubject((prev) => prev + " " + v);
  };

  const removeRecipient = (r: string) => {
    setRecipients((prev) => prev.filter((x) => x !== r));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Month End Report — HR & Finance</h1>
          <p className="text-sm text-muted-foreground">Monthly PettyCash expense summary sent to HR and Finance automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Enable</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Send on day of month</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">Report will be sent on day {day} of each month</p>
            </div>
            <div>
              <Label>Recipients</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {recipients.map((r) => (
                  <Badge key={r} variant="secondary" className="gap-1 pr-1">
                    {r}
                    <button onClick={() => removeRecipient(r)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Click to add or remove recipient groups</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Email Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject Line</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Available Variables</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {variables.map((v) => (
                  <Badge key={v} variant="outline" className="cursor-pointer hover:bg-muted text-xs" onClick={() => insertVariable(v)}>
                    {v}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Click a variable to insert it into the subject line</p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Variables are replaced with real values when the email is sent</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Email Preview</h3>
        <div className="border rounded-lg bg-card p-5 space-y-3">
          <div className="text-xs space-y-1">
            <div><span className="font-medium text-muted-foreground">To:</span> HR Team, Finance Team</div>
            <div><span className="font-medium text-muted-foreground">Subject:</span> PettyCash 360 Expense Summary Report — April/2026</div>
          </div>
          <hr />
          <div className="text-sm space-y-3">
            <p>Dear HR & Finance Team,</p>
            <p>Please find below the monthly PettyCash expense summary report.</p>
            <div className="border rounded overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Count</th>
                    <th className="text-right p-2 font-medium">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="p-2">Auto Approved</td><td className="p-2">42</td><td className="p-2 text-right">฿318,500.00</td></tr>
                  <tr className="border-t"><td className="p-2">On Hold</td><td className="p-2">8</td><td className="p-2 text-right">฿67,200.00</td></tr>
                  <tr className="border-t"><td className="p-2">Rejected</td><td className="p-2">3</td><td className="p-2 text-right">฿12,400.00</td></tr>
                  <tr className="border-t font-medium"><td className="p-2">Total</td><td className="p-2">53</td><td className="p-2 text-right">฿398,100.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
