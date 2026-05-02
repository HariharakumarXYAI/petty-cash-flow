import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  detail: string;
}

// Mock audit log — derived from existing claims so it feels coherent.
const MOCK_AUDIT: AuditEvent[] = [
  { id: "a1", timestamp: "2026-05-02T10:14:00Z", user: "Somchai Prathumwan", role: "store_manager", action: "approve", target: "PC-TH-00003-2026-05-00012", detail: "Approved within authority limit" },
  { id: "a2", timestamp: "2026-05-02T09:42:00Z", user: "System", role: "system", action: "auto_approve", target: "PC-TH-00003-2026-05-00008", detail: "OCR confirmed, under threshold" },
  { id: "a3", timestamp: "2026-05-02T08:30:00Z", user: "Priya Mongkol", role: "store_user", action: "submit", target: "PC-TH-00001-2026-05-00009", detail: "New claim submitted (draft → pending)" },
  { id: "a4", timestamp: "2026-05-01T17:11:00Z", user: "Nattaya Kittisak", role: "regional_manager", action: "hold", target: "PC-TH-00002-2026-05-00007", detail: "Placed on hold pending evidence" },
  { id: "a5", timestamp: "2026-05-01T15:02:00Z", user: "Thanyarat Chaiyaphum", role: "ho_finance", action: "reject", target: "PC-TH-00006-2026-05-00004", detail: "Outside policy scope" },
  { id: "a6", timestamp: "2026-05-01T11:48:00Z", user: "System", role: "system", action: "ocr_low_confidence", target: "PC-TH-00002-2026-05-00006", detail: "OCR confidence 62% — flagged" },
  { id: "a7", timestamp: "2026-04-30T14:25:00Z", user: "David Lertpanya", role: "internal_audit", action: "review", target: "PC-TH-00002-2026-05-00005", detail: "Sampled for monthly audit" },
  { id: "a8", timestamp: "2026-04-30T09:00:00Z", user: "Kanya Supachai", role: "system_admin", action: "config_change", target: "policy:auto-approve", detail: "Threshold raised TH 5,000 → 7,500 THB" },
];

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const actions = useMemo(() => [...new Set(MOCK_AUDIT.map((e) => e.action))].sort(), []);
  const roles = useMemo(() => [...new Set(MOCK_AUDIT.map((e) => e.role))].sort(), []);

  const filtered = useMemo(() => {
    return MOCK_AUDIT.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (![e.user, e.target, e.detail].some((s) => s.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [search, actionFilter, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Read-only system log · filterable by user, action, and date
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          <Eye className="h-3 w-3 mr-1" /> Read-only
        </Badge>
      </div>

      <div className="filter-bar flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search user, target, detail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="section-label">Timestamp</TableHead>
              <TableHead className="section-label">User</TableHead>
              <TableHead className="section-label">Role</TableHead>
              <TableHead className="section-label">Action</TableHead>
              <TableHead className="section-label">Target</TableHead>
              <TableHead className="section-label">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No audit events match the filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{e.user}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{e.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{e.target}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.detail}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
