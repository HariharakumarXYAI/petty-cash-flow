import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Download, Search } from "lucide-react";

const policyTypeStyles: Record<string, string> = {
  "Auto Approve": "bg-status-approved/10 text-status-approved border-status-approved/30",
  "Requires Approval": "bg-status-validating/10 text-status-validating border-status-validating/30",
  "Auto Reject": "bg-destructive/10 text-destructive border-destructive/30",
};

const mockPolicies = [
  { expense: "Entertainment", sub: "Client Entertainment", mcc: "7011", mccDesc: "Hotels and Motels", desc: "Hotels and Motels", policy: "Requires Approval", threshold: "—", currency: "THB", active: true },
  { expense: "Transportation", sub: "Taxi/Grab", mcc: "4121", mccDesc: "Taxicabs and Limousines", desc: "Taxicabs and Limousines", policy: "Auto Approve", threshold: "2,000", currency: "THB", active: true },
  { expense: "Meals & Entertainment", sub: "Business Meal", mcc: "5812", mccDesc: "Restaurants", desc: "Eating Places and Restaurants", policy: "Auto Approve", threshold: "1,500", currency: "THB", active: true },
  { expense: "Meals & Entertainment", sub: "Client Lunch", mcc: "5814", mccDesc: "Fast Food", desc: "Fast Food Restaurants", policy: "Auto Approve", threshold: "500", currency: "THB", active: true },
  { expense: "Hotel", sub: "Business Travel Hotel", mcc: "3000", mccDesc: "Airlines", desc: "Airlines", policy: "Requires Approval", threshold: "—", currency: "THB", active: true },
  { expense: "Entertainment", sub: "Team Dinner", mcc: "7996", mccDesc: "Amusement Parks", desc: "Amusement Parks", policy: "Auto Reject", threshold: "—", currency: "THB", active: true },
];

export default function PolicyPage() {
  const [search, setSearch] = useState("");
  const [expFilter, setExpFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Policy Management</h1>
          <p className="text-sm text-muted-foreground">Maintain expense type-based rules for Auto Approve / Auto Reject / Requires Approval</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Policy Rule</Button>
        </div>
      </div>

      <div className="my-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search policies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-3">
          <Select value={expFilter} onValueChange={setExpFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Expense Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expense Types</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subFilter} onValueChange={setSubFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sub Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sub Types</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead>Expense Type</TableHead>
              <TableHead>Sub Expense Type</TableHead>
              <TableHead>MCC Code (Ref)</TableHead>
              <TableHead>MCC Code Description</TableHead>
              <TableHead>Description/Sub-type</TableHead>
              <TableHead>Policy Type</TableHead>
              <TableHead>Threshold Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPolicies.map((p, i) => (
              <TableRow key={i} className={p.policy === "Requires Approval" ? "bg-status-validating/5" : ""}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{p.expense}</TableCell>
                <TableCell>{p.sub}</TableCell>
                <TableCell className="font-mono text-xs">{p.mcc}</TableCell>
                <TableCell className="text-xs">{p.mccDesc}</TableCell>
                <TableCell className="text-xs">{p.desc}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[11px] ${policyTypeStyles[p.policy] || ""}`}>{p.policy}</Badge>
                </TableCell>
                <TableCell>{p.threshold}</TableCell>
                <TableCell>{p.currency}</TableCell>
                <TableCell><Switch checked={p.active} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
