import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Ban, Search } from "lucide-react";

const mockEntities = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", taxId: "0105500000001", branch: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active" },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด (มหาชน)", taxId: "0105500000002", branch: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active" },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", taxId: "0105500000003", branch: "สาขา", start: "2025-06-01", end: "2026-12-31", status: "Inactive" },
];

export default function EntitiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockEntities.filter((e) => {
    if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
    if (search && !e.name.includes(search) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.taxId.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Entities</h1>
          <p className="text-sm text-muted-foreground">Manage legal entity registrations and tax identifiers</p>
        </div>
        <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add Company Identity
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search entities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Company Code</TableHead>
              <TableHead>Legal Entity Name (TH)</TableHead>
              <TableHead>Primary Tax ID</TableHead>
              <TableHead>Branch Type</TableHead>
              <TableHead>Effective Start</TableHead>
              <TableHead>Effective End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.code}>
                <TableCell className="font-medium">{e.code}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell className="font-mono text-xs">{e.taxId}</TableCell>
                <TableCell>{e.branch}</TableCell>
                <TableCell>{e.start}</TableCell>
                <TableCell>{e.end}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "Active" ? "default" : "secondary"} className={e.status === "Active" ? "bg-status-approved/10 text-status-approved border-status-approved/20" : ""}>
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Ban className="h-4 w-4" /></Button>
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
