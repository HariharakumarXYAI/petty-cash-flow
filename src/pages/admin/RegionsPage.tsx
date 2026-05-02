import { TrendingUp, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { regionLabels } from "@/lib/roles";
import { stores } from "@/lib/mock-data";

export default function RegionsPage() {
  const regions = Object.entries(regionLabels).map(([id, label]) => {
    const regionStores = stores.filter((s) => (s as { region_id?: string }).region_id === id);
    const country = regionStores[0]?.country ?? (id.startsWith("r-kh") ? "KH" : id.startsWith("r-mm") ? "MM" : "TH");
    return { id, label, storeCount: regionStores.length, country };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Regions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic groupings used for Regional Manager scope and benchmarking
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="section-label">Region</TableHead>
              <TableHead className="section-label">Region ID</TableHead>
              <TableHead className="section-label">Country</TableHead>
              <TableHead className="section-label text-right">Stores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {r.label}
                </TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.id}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.country}</TableCell>
                <TableCell className="text-sm text-right tabular-nums">{r.storeCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
