import { stores } from "@/lib/mock-data";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function StoresPage() {
  const { country } = useGlobalFilter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const countryFiltered = country === "all" ? stores : stores.filter(s => s.country === country);
  const filtered = search
    ? countryFiltered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.legalEntity.toLowerCase().includes(search.toLowerCase()))
    : countryFiltered;

  const lowBalanceCount = filtered.filter(s => s.currentBalance <= s.minBalance * 1.3).length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stores & Float Limits</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} stores configured
            {lowBalanceCount > 0 && (
              <span className="text-status-hold ml-1">· {lowBalanceCount} low balance</span>
            )}
          </p>
        </div>
        <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Store</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input className="h-8 pl-8 text-sm" placeholder="Filter stores…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="section-label w-[200px]">Store</TableHead>
              <TableHead className="section-label hidden md:table-cell">Type</TableHead>
              <TableHead className="section-label hidden lg:table-cell">Legal Entity</TableHead>
              <TableHead className="section-label text-right">Float Limit</TableHead>
              <TableHead className="section-label text-right hidden md:table-cell">Balance</TableHead>
              <TableHead className="section-label hidden lg:table-cell w-[140px]">Utilization</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Min Balance</TableHead>
              <TableHead className="section-label text-right hidden xl:table-cell">Max Float</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const utilPct = Math.round((s.currentBalance / s.floatLimit) * 100);
              const isLow = s.currentBalance <= s.minBalance * 1.3;
              return (
                <TableRow key={s.id} className="data-table-row cursor-pointer" onClick={() => navigate(`/masters/stores/${s.id}/edit`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="h-3.5 w-3.5 text-status-hold flex-shrink-0" />}
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.country} · {s.currency}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {s.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{s.legalEntity}</TableCell>
                  <TableCell className="text-sm font-medium text-right tabular-nums">{s.floatLimit.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm font-medium text-right tabular-nums hidden md:table-cell ${isLow ? "text-status-hold" : ""}`}>
                    {s.currentBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-0.5">
                      <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            isLow ? "bg-status-hold" : utilPct > 80 ? "bg-status-validating" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(utilPct, 100)}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-px bg-status-hold/50"
                          style={{ left: `${Math.round((s.minBalance / s.floatLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className={isLow ? "text-status-hold font-medium" : "text-muted-foreground"}>{utilPct}%</span>
                        <span className="text-muted-foreground">of {s.floatLimit.toLocaleString()}</span>
                      </div>
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
    </div>
  );
}
