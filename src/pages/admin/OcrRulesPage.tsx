import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function OcrRulesPage() {
  const [amountTHB, setAmountTHB] = useState("10");
  const [amountPct, setAmountPct] = useState("0.5");
  const [dateDays, setDateDays] = useState("3");

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-0.5">OCR Validation Rules</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure tolerance thresholds for document matching during OCR validation</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amount Matching</CardTitle>
            <CardDescription>Configure tolerance for matching invoice amounts against bank transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <Label>Amount Tolerance (THB)</Label>
                <div className="relative mt-1.5">
                  <Input value={amountTHB} onChange={(e) => setAmountTHB(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">THB</span>
                </div>
              </div>
              <div>
                <Label>Amount Tolerance (%)</Label>
                <div className="relative mt-1.5">
                  <Input value={amountPct} onChange={(e) => setAmountPct(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>System uses whichever tolerance is greater (absolute THB or % of transaction amount)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date Matching</CardTitle>
            <CardDescription>Configure tolerance for matching invoice dates against bank transaction dates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs mb-3">
              <Label>Date Tolerance (Days)</Label>
              <div className="relative mt-1.5">
                <Input value={dateDays} onChange={(e) => setDateDays(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Max number of days difference allowed between invoice date and bank transaction date</span>
            </div>
          </CardContent>
        </Card>

        <Button>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
