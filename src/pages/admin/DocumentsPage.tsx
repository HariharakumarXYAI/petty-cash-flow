import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, Pencil, Trash2, Search } from "lucide-react";

const mockDocs = [
  { name: "Tax Invoice", type: "Primary", ocr: "Enabled", active: true },
  { name: "Receipt", type: "Primary", ocr: "Enabled", active: true },
  { name: "Boarding Pass", type: "Support", ocr: "Disabled", active: true },
  { name: "Hotel Folio", type: "Primary", ocr: "Enabled", active: true },
  { name: "Quotation", type: "Support", ocr: "Disabled", active: true },
  { name: "Approval Form", type: "Support", ocr: "Disabled", active: false },
];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockDocs.filter((d) => {
    if (statusFilter === "active" && !d.active) return false;
    if (statusFilter === "inactive" && d.active) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Manage document types for expense claims</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"><Plus className="h-4 w-4 mr-1" /> Add Document Type</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              
              <TableHead>Document Name</TableHead>
              
              <TableHead>OCR Verification</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.name}>
                
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={d.ocr === "Enabled" ? "bg-status-approved/10 text-status-approved border-status-approved/20" : ""}>{d.ocr}</Badge>
                </TableCell>
                <TableCell><Switch checked={d.active} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
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
