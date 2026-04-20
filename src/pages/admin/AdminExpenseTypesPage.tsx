import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Upload, Download, Eye, Pencil, Trash2, Search, ChevronDown, ChevronRight } from "lucide-react";

interface ExpenseType {
  name: string;
  subtypeCount: number;
  subtypes: string[];
  active: boolean;
  updatedAt: string;
}

const mockExpenseTypes: ExpenseType[] = [
  { name: "Entertainment", subtypeCount: 4, subtypes: ["Team Dinner", "Client Entertainment", "Company Event", "Sport/Recreation"], active: true, updatedAt: "2026-03-04" },
  { name: "Hotel", subtypeCount: 9, subtypes: ["Business Travel", "Training", "Conference", "Transit", "Emergency", "Long-term", "Resort", "Hostel", "Serviced Apartment"], active: true, updatedAt: "2026-03-04" },
  { name: "Meals & Entertainment", subtypeCount: 8, subtypes: ["Business Meal", "Client Lunch", "Team Lunch", "Working Dinner", "Snacks", "Coffee", "Catering", "Delivery"], active: true, updatedAt: "2026-03-04" },
  { name: "Personal", subtypeCount: 1, subtypes: ["Miscellaneous"], active: true, updatedAt: "2026-03-04" },
  { name: "Transportation", subtypeCount: 3, subtypes: ["Taxi/Grab", "Fuel Reimbursement", "Toll Fee"], active: true, updatedAt: "2026-03-04" },
];

export default function AdminExpenseTypesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = mockExpenseTypes.filter((e) => {
    if (filter === "active" && !e.active) return false;
    if (filter === "inactive" && e.active) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expense Type</h1>
          <p className="text-sm text-muted-foreground">Manage expense type categories and their sub-types</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense Type</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expense types..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
              <TableHead className="w-8"></TableHead>
              <TableHead>Expense Type</TableHead>
              <TableHead>Subtypes</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <Collapsible key={e.name} open={expanded[e.name]} onOpenChange={(o) => setExpanded((p) => ({ ...p, [e.name]: o }))} asChild>
                <>
                  <TableRow>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expanded[e.name] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.subtypeCount} subtypes</Badge></TableCell>
                    <TableCell><Switch checked={e.active} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <>
                      {e.subtypes.map((st) => (
                        <TableRow key={st} className="bg-muted/30">
                          <TableCell />
                          <TableCell />
                          <TableCell className="pl-12 text-sm text-muted-foreground">{st}</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                        </TableRow>
                      ))}
                    </>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
