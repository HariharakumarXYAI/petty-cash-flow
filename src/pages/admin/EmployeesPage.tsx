import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, UserPlus, Eye, Pencil, Trash2, Search, Users, UserCheck, ShieldCheck, Settings, CreditCard } from "lucide-react";

const mockEmployees = [
  { name: "สมชาย ใจดี", code: "EMP001", email: "somchai@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User"], active: true },
  { name: "สมหญิง แก้วสาย", code: "EMP002", email: "somying@makro.co.th", dept: "Sales", branch: "Bangkok", roles: ["Store User", "Store Manager"], active: true },
  { name: "วิชาญ เจริญ", code: "EMP003", email: "wichai@makro.co.th", dept: "Engineering", branch: "Chiang Mai", roles: ["Store User"], active: true },
  { name: "พิม ดี", code: "ACC001", email: "pim@makro.co.th", dept: "Finance", branch: "Bangkok", roles: ["HO Finance"], active: true },
  { name: "ณัฏฐพงษ์ ศรีสุข", code: "ADM001", email: "nattapong@makro.co.th", dept: "IT", branch: "Bangkok", roles: ["System Admin"], active: true },
  { name: "มานพ เก่ง", code: "EMP004", email: "manop@makro.co.th", dept: "Operations", branch: "Phuket", roles: ["Store User"], active: false },
];

const roleBadgeColor: Record<string, string> = {
  "Store User": "bg-muted text-muted-foreground",
  "Store Manager": "bg-status-approved/10 text-status-approved border-status-approved/20",
  "HO Finance": "bg-status-investigation/10 text-status-investigation border-status-investigation/20",
  "System Admin": "bg-destructive/10 text-destructive border-destructive/20",
};

const stats = [
  { label: "Total Employees", count: 6, icon: Users, color: "text-primary" },
  { label: "Active Employees", count: 5, icon: UserCheck, color: "text-status-approved" },
  { label: "Approvers", count: 2, icon: ShieldCheck, color: "text-status-investigation" },
  { label: "Admins", count: 1, icon: Settings, color: "text-status-validating" },
  { label: "Cardholders", count: 3, icon: CreditCard, color: "text-destructive" },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockEmployees.filter((e) => {
    if (statusFilter === "active" && !e.active) return false;
    if (statusFilter === "inactive" && e.active) return false;
    if (search && !e.name.includes(search) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.email.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Employee Profiles</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-1" /> Invite User</Button>
          <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"><Plus className="h-4 w-4 mr-1" /> Add Employee</Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 my-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-semibold">{s.count}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Employee Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.code}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="font-mono text-xs">{e.code}</TableCell>
                <TableCell className="text-xs">{e.email}</TableCell>
                <TableCell>{e.dept}</TableCell>
                <TableCell>{e.branch}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {e.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`text-[10px] ${roleBadgeColor[r] || ""}`}>{r}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell><Switch checked={e.active} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
