import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil } from "lucide-react";

const mockDepartments = [
  { code: "SALES", name: "Sales", head: "สมชาย ใจดี", employees: 12, active: true },
  { code: "FIN", name: "Finance", head: "พิม ดี", employees: 5, active: true },
  { code: "ENG", name: "Engineering", head: "วิชาญ เจริญ", employees: 8, active: true },
  { code: "IT", name: "IT", head: "ณัฏฐพงษ์ ศรีสุข", employees: 4, active: true },
  { code: "OPS", name: "Operations", head: "มานพ เก่ง", employees: 15, active: true },
  { code: "HR", name: "Human Resources", head: "—", employees: 3, active: false },
];

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockDepartments.filter((d) => {
    if (statusFilter === "active" && !d.active) return false;
    if (statusFilter === "inactive" && d.active) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Departments</h1>
          <p className="text-sm text-muted-foreground">Manage organizational departments and team structure</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Add Department
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Dept Code</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Department Head</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.code}>
                <TableCell className="font-medium font-mono text-xs">{d.code}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.head}</TableCell>
                <TableCell>{d.employees}</TableCell>
                <TableCell><Switch checked={d.active} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
