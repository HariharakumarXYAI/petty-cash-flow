import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Ban, Search } from "lucide-react";

const bgColors: Record<string, string> = {
  Wholesale: "bg-blue-100 text-blue-700 border-blue-200",
  Retail: "bg-green-100 text-green-700 border-green-200",
  "Food Service": "bg-amber-100 text-amber-700 border-amber-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

const mockEntities = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", nameEn: "CP Axtra Public Company Limited", businessGroup: "Wholesale", oracleCode: "10001", taxId: "0105500000001", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active" },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด (มหาชน)", nameEn: "Makro Public Company Limited", businessGroup: "Wholesale", oracleCode: "10002", taxId: "0105500000002", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active" },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", nameEn: "Demo Company Limited", businessGroup: "Retail", oracleCode: "13000", taxId: "0105500000003", entityType: "สาขา", start: "2025-06-01", end: "2026-12-31", status: "Inactive" },
];

export default function EntitiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockEntities.filter((e) => {
    if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
    if (search && !e.name.includes(search) && !e.nameEn.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase()) && !e.taxId.includes(search) && !e.oracleCode.includes(search)) return false;
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
              <TableHead>Entity Code</TableHead>
              <TableHead>Legal Entity Name (TH)</TableHead>
              <TableHead>Legal Entity Name (EN)</TableHead>
              <TableHead>Business Group</TableHead>
              <TableHead>Oracle Code</TableHead>
              <TableHead>Primary Tax ID</TableHead>
              <TableHead>Effective Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.code}>
                <TableCell className="font-medium">{e.code}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell className="text-muted-foreground">{e.nameEn}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={bgColors[e.businessGroup] || bgColors.Other}>
                    {e.businessGroup}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">{e.oracleCode}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{e.taxId}</TableCell>
                <TableCell>{e.start}</TableCell>
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
