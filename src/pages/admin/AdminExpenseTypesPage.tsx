import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { expenseTypes } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Pencil, Search, ShieldAlert } from "lucide-react";

type ExpenseRow = (typeof expenseTypes)[number];

export default function AdminExpenseTypesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Group expense types by category
  const grouped = expenseTypes.reduce<Record<string, ExpenseRow[]>>((acc, et) => {
    if (!acc[et.category]) acc[et.category] = [];
    acc[et.category].push(et);
    return acc;
  }, {});

  const categories = Object.entries(grouped).filter(([category, items]) => {
    if (
      search &&
      !category.toLowerCase().includes(search.toLowerCase()) &&
      !items.some((i) => i.subcategory.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const sensitiveCount = expenseTypes.filter((e) => e.auditSensitive).length;
  const docRequiredCount = expenseTypes.filter((e) => e.documentRequired).length;

  const goEdit = (id: string) => navigate(`/admin/expense-types/${id}/edit`);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expense Types</h1>
          <p className="text-sm text-muted-foreground">
            {expenseTypes.length} types configured · {sensitiveCount} audit-sensitive · {docRequiredCount} require documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import CSV</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button size="sm" onClick={() => navigate("/admin/expense-types/new")}><Plus className="h-4 w-4 mr-1" /> Add Expense Type</Button>
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
              <TableHead>Expense Type</TableHead>
              <TableHead>Subtypes</TableHead>
              <TableHead className="hidden md:table-cell">Countries</TableHead>
              
              <TableHead className="hidden lg:table-cell text-right">Alert At</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Hard Stop</TableHead>
              <TableHead className="hidden xl:table-cell text-center">Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(([category, items]) => (
              <TableRow key={category}>
                <TableCell className="font-medium">{category}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs pointer-events-none">{items.length} subtypes</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {[...new Set(items.flatMap(i => i.countries))].map(c => (
                      <span key={c} className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell" />
                <TableCell className="hidden lg:table-cell" />
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center justify-center gap-1.5">
                    {items.some(i => i.auditSensitive) && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-status-hold/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-hold">
                        <ShieldAlert className="h-2.5 w-2.5" />Sensitive
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => goEdit(items[0].id)}
                    aria-label={`Edit ${category}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No expense types found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
