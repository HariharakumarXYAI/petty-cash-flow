import { stores } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StoreInfo } from "@/lib/mock-data";

export default function StoresPage() {
  const { country } = useGlobalFilter();
  const [selected, setSelected] = useState<StoreInfo | null>(null);

  const filtered = country === "all" ? stores : stores.filter(s => s.country === country);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stores & Float Limits</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} stores configured</p>
        </div>
        <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Store</Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label">Store</TableHead>
              <TableHead className="section-label hidden md:table-cell">Type</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Legal Entity</TableHead>
              <TableHead className="section-label text-right">Float Limit</TableHead>
              <TableHead className="section-label text-right hidden md:table-cell">Current Bal.</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Utilization</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Min Balance</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Max Float</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const utilPct = Math.round((s.currentBalance / s.floatLimit) * 100);
              const isLow = s.currentBalance <= s.minBalance * 1.3;
              return (
                <TableRow key={s.id} className="data-table-row cursor-pointer" onClick={() => setSelected(s)}>
                  <TableCell>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.country} · {s.currency}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{s.type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{s.legalEntity}</TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums">{s.floatLimit.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm font-medium text-right tabular-nums hidden md:table-cell ${isLow ? "text-status-hold" : ""}`}>
                    {s.currentBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="w-20">
                      <Progress value={Math.min(utilPct, 100)} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{utilPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums text-muted-foreground hidden xl:table-cell">{s.minBalance.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums text-muted-foreground hidden xl:table-cell">{s.maxFloat.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>Edit Store</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5"><Label className="section-label">Store Name</Label><Input className="h-9" defaultValue={selected.name} /></div>
                <div className="space-y-1.5">
                  <Label className="section-label">Country</Label>
                  <Select defaultValue={selected.country}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TH">Thailand</SelectItem>
                      <SelectItem value="KH">Cambodia</SelectItem>
                      <SelectItem value="MM">Myanmar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="section-label">Store Type</Label>
                  <Select defaultValue={selected.type}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hypermarket">Hypermarket</SelectItem>
                      <SelectItem value="Supermarket">Supermarket</SelectItem>
                      <SelectItem value="Mini">Mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="section-label">Legal Entity</Label><Input className="h-9" defaultValue={selected.legalEntity} /></div>
                <div className="space-y-1.5"><Label className="section-label">Petty Cash Float</Label><Input className="h-9" type="number" defaultValue={selected.floatLimit} /></div>
                <div className="space-y-1.5"><Label className="section-label">Minimum Balance</Label><Input className="h-9" type="number" defaultValue={selected.minBalance} /></div>
                <div className="space-y-1.5"><Label className="section-label">Maximum Float</Label><Input className="h-9" type="number" defaultValue={selected.maxFloat} /></div>
                <div className="space-y-1.5"><Label className="section-label">Replenishment Threshold</Label><Input className="h-9" type="number" defaultValue={selected.replenishmentThreshold} /></div>
                <Button className="w-full">Save</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
