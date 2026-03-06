import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import {
  monthlySpendData, spendByCategory, storeBenchmarkData, advanceAgingData,
  claims, stores, alerts, auditRequests,
} from "@/lib/mock-data";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))",
];

const duplicateData = [
  { month: "Oct", attempts: 2 }, { month: "Nov", attempts: 1 },
  { month: "Dec", attempts: 4 }, { month: "Jan", attempts: 2 },
  { month: "Feb", attempts: 3 }, { month: "Mar", attempts: 1 },
];

const varianceData = [
  { month: "Oct", variance: 150 }, { month: "Nov", variance: -200 },
  { month: "Dec", variance: 0 }, { month: "Jan", variance: 300 },
  { month: "Feb", variance: -100 }, { month: "Mar", variance: 0 },
];

const topExceptionStores = [
  { store: "Makro Sathorn", alerts: 5, holdClaims: 2 },
  { store: "Makro Rama 4", alerts: 3, holdClaims: 1 },
  { store: "Makro Yangon Central", alerts: 3, holdClaims: 0 },
  { store: "Makro Phnom Penh 1", alerts: 2, holdClaims: 1 },
  { store: "Makro Mandalay", alerts: 1, holdClaims: 1 },
];

export default function Reports() {
  const { country } = useGlobalFilter();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive petty cash intelligence</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Export All</Button>
      </div>

      <Tabs defaultValue="spend" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="spend" className="text-xs">Spend Trends</TabsTrigger>
          <TabsTrigger value="benchmark" className="text-xs">Store Benchmarking</TabsTrigger>
          <TabsTrigger value="aging" className="text-xs">Advance Aging</TabsTrigger>
          <TabsTrigger value="findings" className="text-xs">Audit Findings</TabsTrigger>
        </TabsList>

        {/* Spend Trends */}
        <TabsContent value="spend" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-3">Monthly Spend Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Area type="monotone" dataKey="thisYear" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.1} strokeWidth={2} name="2026" />
                    <Area type="monotone" dataKey="lastYear" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.05} strokeWidth={2} strokeDasharray="4 4" name="2025" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-3">Spend by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                      {spendByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-3">Duplicate Receipt Attempts</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={duplicateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="attempts" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-3">Cash Variance Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="variance" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Exception Stores */}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Top Exception Stores</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="section-label">Store</TableHead>
                  <TableHead className="section-label text-right">Alerts</TableHead>
                  <TableHead className="section-label text-right">Hold Claims</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topExceptionStores.map((s) => (
                  <TableRow key={s.store} className="data-table-row">
                    <TableCell className="text-sm font-medium">{s.store}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{s.alerts}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{s.holdClaims}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Store Benchmarking */}
        <TabsContent value="benchmark" className="space-y-4">
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Store Actual vs Benchmark</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeBenchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="store" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} name="Actual" />
                  <Bar dataKey="benchmark" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} barSize={20} name="Benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Country Comparison</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="section-label">Country</TableHead>
                  <TableHead className="section-label text-right">Stores</TableHead>
                  <TableHead className="section-label text-right">Total Float</TableHead>
                  <TableHead className="section-label text-right">Claims MTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { country: "🇹🇭 Thailand", storeCount: stores.filter(s => s.country === "TH").length, float: stores.filter(s => s.country === "TH").reduce((s, st) => s + st.currentBalance, 0), claims: claims.filter(c => c.country === "TH").length },
                  { country: "🇰🇭 Cambodia", storeCount: stores.filter(s => s.country === "KH").length, float: stores.filter(s => s.country === "KH").reduce((s, st) => s + st.currentBalance, 0), claims: claims.filter(c => c.country === "KH").length },
                  { country: "🇲🇲 Myanmar", storeCount: stores.filter(s => s.country === "MM").length, float: stores.filter(s => s.country === "MM").reduce((s, st) => s + st.currentBalance, 0), claims: claims.filter(c => c.country === "MM").length },
                ].map(c => (
                  <TableRow key={c.country} className="data-table-row">
                    <TableCell className="text-sm font-medium">{c.country}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{c.storeCount}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums font-medium">{c.float.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{c.claims}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Advance Aging */}
        <TabsContent value="aging" className="space-y-4">
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Advance Aging Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={advanceAgingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Audit Findings */}
        <TabsContent value="findings" className="space-y-4">
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Audit Finding Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {["None", "Low", "Medium", "High"].map(sev => (
                <div key={sev} className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold tabular-nums">{auditRequests.filter(a => a.findingSeverity === sev).length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sev}</p>
                </div>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="section-label">Audit #</TableHead>
                  <TableHead className="section-label">Claim</TableHead>
                  <TableHead className="section-label">Store</TableHead>
                  <TableHead className="section-label">Finding</TableHead>
                  <TableHead className="section-label">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRequests.filter(a => a.findingSeverity).map(a => (
                  <TableRow key={a.id} className="data-table-row">
                    <TableCell className="font-mono text-xs">{a.auditNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{a.claimNumber}</TableCell>
                    <TableCell className="text-sm">{a.store}</TableCell>
                    <TableCell>
                      <Badge variant={a.findingSeverity === "None" ? "approved" : "alert"} className="text-[10px]">{a.findingSeverity}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.findingSummary || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
