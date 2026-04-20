import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Pencil, Eye } from "lucide-react";

const mockStores = [
  { code: "S001", name: "Makro Rama IV", branch: "Bangkok", float: 50000, balance: 32000, minBalance: 10000, active: true },
  { code: "S002", name: "Makro Bangna", branch: "Bangkok", float: 50000, balance: 8500, minBalance: 10000, active: true },
  { code: "S003", name: "Makro Chiang Mai", branch: "North", float: 30000, balance: 22000, minBalance: 8000, active: true },
  { code: "S004", name: "Makro Phnom Penh", branch: "Cambodia", float: 20000, balance: 15000, minBalance: 5000, active: true },
  { code: "S005", name: "Makro Phuket", branch: "South", float: 30000, balance: 3000, minBalance: 8000, active: false },
];

export default function AdminStoresPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockStores.filter((s) => {
    if (statusFilter === "active" && !s.active) return false;
    if (statusFilter === "inactive" && s.active) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Stores & Petty Cash Fund</h1>
          <p className="text-sm text-muted-foreground">Manage store locations and petty cash fund allocations</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Add Store
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search stores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Store Code</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Fund Limit</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const utilization = Math.round((1 - s.balance / s.float) * 100);
              const isLow = s.balance <= s.minBalance * 1.3;
              return (
                <TableRow key={s.code} className={isLow && s.active ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.branch}</Badge></TableCell>
                  <TableCell>฿{s.float.toLocaleString()}</TableCell>
                  <TableCell className={isLow ? "text-destructive font-medium" : ""}>
                    ฿{s.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-28">
                      <Progress value={utilization} className="h-2" />
                      <span className="text-xs text-muted-foreground">{utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={s.active} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
