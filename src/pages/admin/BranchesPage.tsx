import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil } from "lucide-react";

const mockBranches = [
  { code: "BKK001", name: "สำนักงานใหญ่", nameEn: "Head Office", region: "Bangkok", address: "รัชดาภิเษก กรุงเทพฯ", active: true },
  { code: "BKK002", name: "สาขาบางนา", nameEn: "Bangna Branch", region: "Bangkok", address: "บางนา กรุงเทพฯ", active: true },
  { code: "CNX001", name: "สาขาเชียงใหม่", nameEn: "Chiang Mai Branch", region: "North", address: "เมือง เชียงใหม่", active: true },
  { code: "PKT001", name: "สาขาภูเก็ต", nameEn: "Phuket Branch", region: "South", address: "เมือง ภูเก็ต", active: false },
];

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockBranches.filter((b) => {
    if (statusFilter === "active" && !b.active) return false;
    if (statusFilter === "inactive" && b.active) return false;
    if (search && !b.name.includes(search) && !b.nameEn.toLowerCase().includes(search.toLowerCase()) && !b.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage company branches and office locations</p>
        </div>
        <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add Branch
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Branch Code</TableHead>
              <TableHead>Branch Name (TH)</TableHead>
              <TableHead>Branch Name (EN)</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.code}>
                <TableCell className="font-medium">{b.code}</TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.nameEn}</TableCell>
                <TableCell>
                  <Badge variant="outline">{b.region}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{b.address}</TableCell>
                <TableCell><Switch checked={b.active} /></TableCell>
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
