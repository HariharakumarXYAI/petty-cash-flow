import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Search, Pencil, Lock, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface PermissionMatrix {
  [feature: string]: { view: boolean; submit: boolean; approve: boolean; delete: boolean };
}

type DataScope = "own_store" | "own_store_team" | "assigned_region" | "all_stores";

interface RoleData {
  id: string;
  name: string;
  userCount: number;
  permissions: string[];
  dataScope: string;
  dataScopeValue: DataScope;
  matrix: PermissionMatrix;
  isLocked: boolean;
}

const FEATURES = [
  "Claims",
  "Advances",
  "Reports",
  "User Management",
  "Store Configuration",
  "Policy & Thresholds",
  "Audit Logs",
  "Admin Config",
];

const scopeOptions: { value: DataScope; label: string }[] = [
  { value: "own_store", label: "Own Store" },
  { value: "own_store_team", label: "Own Store + Team" },
  { value: "assigned_region", label: "Assigned Region" },
  { value: "all_stores", label: "All Stores" },
];

function buildMatrix(
  features: string[],
  overrides: Partial<Record<string, Partial<{ view: boolean; submit: boolean; approve: boolean; delete: boolean }>>>
): PermissionMatrix {
  const m: PermissionMatrix = {};
  for (const f of features) {
    m[f] = { view: false, submit: false, approve: false, delete: false, ...(overrides[f] || {}) };
  }
  return m;
}

const fullMatrix = buildMatrix(FEATURES, Object.fromEntries(FEATURES.map((f) => [f, { view: true, submit: true, approve: true, delete: true }])));

const initialRoles: RoleData[] = [
  {
    id: "store_user",
    name: "Store User",
    userCount: 3,
    permissions: ["Submit Claims", "View Own Claims", "Submit Advances"],
    dataScope: "Own store only",
    dataScopeValue: "own_store",
    matrix: buildMatrix(FEATURES, {
      Claims: { view: true, submit: true },
      Advances: { view: true, submit: true },
    }),
    isLocked: false,
  },
  {
    id: "store_manager",
    name: "Store Manager",
    userCount: 2,
    permissions: ["Submit Claims", "View Own Claims", "Approve Claims", "View Team Claims", "View Team Advances"],
    dataScope: "Own store",
    dataScopeValue: "own_store_team",
    matrix: buildMatrix(FEATURES, {
      Claims: { view: true, submit: true, approve: true },
      Advances: { view: true, submit: true },
      Reports: { view: true },
    }),
    isLocked: false,
  },
  {
    id: "regional_manager",
    name: "Regional Manager",
    userCount: 4,
    permissions: ["View Region Claims", "View Region Advances Overdue", "Receive Escalation Alerts"],
    dataScope: "Assigned region",
    dataScopeValue: "assigned_region",
    matrix: buildMatrix(FEATURES, {
      Claims: { view: true, approve: true },
      Advances: { view: true },
      Reports: { view: true },
    }),
    isLocked: false,
  },
  {
    id: "ho_finance",
    name: "HO Finance",
    userCount: 1,
    permissions: ["View All Claims", "Approve Escalated Claims", "Manage Advances", "Run Reports", "Manage Alerts"],
    dataScope: "All stores",
    dataScopeValue: "all_stores",
    matrix: buildMatrix(FEATURES, {
      Claims: { view: true, approve: true },
      Advances: { view: true, submit: true, approve: true },
      Reports: { view: true, submit: true },
      "Store Configuration": { view: true },
      "Policy & Thresholds": { view: true, approve: true },
    }),
    isLocked: false,
  },
  {
    id: "internal_audit",
    name: "Internal Audit",
    userCount: 0,
    permissions: ["View All Claims (read-only)", "View Audit Logs", "Run Audit Reports"],
    dataScope: "All stores",
    dataScopeValue: "all_stores",
    matrix: buildMatrix(FEATURES, {
      Claims: { view: true },
      Reports: { view: true },
      "Audit Logs": { view: true },
    }),
    isLocked: false,
  },
  {
    id: "system_admin",
    name: "System Admin",
    userCount: 1,
    permissions: ["Full Access"],
    dataScope: "All stores",
    dataScopeValue: "all_stores",
    matrix: { ...fullMatrix },
    isLocked: true,
  },
];

/* ─── Component ─── */
export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // drawer edit state
  const [editName, setEditName] = useState("");
  const [editScope, setEditScope] = useState<DataScope>("own_store");
  const [editMatrix, setEditMatrix] = useState<PermissionMatrix>({});

  const filtered = useMemo(
    () => roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [roles, search]
  );

  const openEdit = (role: RoleData) => {
    setEditingRole(role);
    setEditName(role.name);
    setEditScope(role.dataScopeValue);
    setEditMatrix(JSON.parse(JSON.stringify(role.matrix)));
    setDrawerOpen(true);
  };

  const togglePerm = (feature: string, col: "view" | "submit" | "approve" | "delete") => {
    if (editingRole?.isLocked) return;
    setEditMatrix((prev) => ({
      ...prev,
      [feature]: { ...prev[feature], [col]: !prev[feature][col] },
    }));
  };

  const handleSave = () => {
    if (!editingRole) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === editingRole.id
          ? { ...r, name: editName, dataScopeValue: editScope, matrix: editMatrix }
          : r
      )
    );
    setDrawerOpen(false);
    toast({ title: "Permissions updated", description: `${editName} role saved successfully.` });
  };

  const totalUsers = roles.reduce((s, r) => s + r.userCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-0.5">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Define what each role can do in the system · {roles.length} roles · {totalUsers} users
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Role Overview
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Role Overview ─── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((role) => (
              <Card key={role.id} className="group relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {role.isLocked && <Lock className="h-3.5 w-3.5 text-status-hold" />}
                      <CardTitle className="text-base">{role.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEdit(role)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Data scope: {role.dataScope}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {role.isLocked ? (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">
                        <Lock className="h-3 w-3 mr-1" />
                        Full Access
                      </Badge>
                    ) : (
                      role.permissions.map((p) => (
                        <Badge key={p} variant="outline" className="text-[11px]">
                          {p}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 py-8 text-center">
                No roles match "{search}"
              </p>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab 2: Permission Matrix (read-only overview) ─── */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-3 min-w-[160px]">Feature</th>
                  {roles.map((r) => (
                    <th key={r.id} className="text-center font-medium px-3 py-3 min-w-[100px]">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat, fi) => (
                  <tr key={feat} className={fi % 2 === 1 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{feat}</td>
                    {roles.map((r) => {
                      const perms = r.matrix[feat];
                      const active = perms.view || perms.submit || perms.approve || perms.delete;
                      return (
                        <td key={r.id} className="text-center px-3 py-2.5">
                          {r.isLocked ? (
                            <span className="text-xs text-status-hold">✓ Full</span>
                          ) : active ? (
                            <div className="flex justify-center gap-1">
                              {perms.view && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" title="View" />
                              )}
                              {perms.submit && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-approved" title="Submit" />
                              )}
                              {perms.approve && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-hold" title="Approve" />
                              )}
                              {perms.delete && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" title="Delete" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" /> View
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-status-approved" /> Add / Submit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-status-hold" /> Edit / Approve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive" /> Delete
            </span>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Edit Drawer ─── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">
              {editingRole?.isLocked ? (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-status-hold" />
                  {editingRole.name}
                </span>
              ) : (
                "Edit Role Permissions"
              )}
            </SheetTitle>
            <SheetDescription>
              {editingRole?.isLocked
                ? "System Admin has full access and cannot be modified."
                : "Configure permissions and data scope for this role."}
            </SheetDescription>
          </SheetHeader>

          {editingRole && (
            <div className="space-y-6 py-4 px-1">
              {/* Role Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Role Name
                </Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={editingRole.isLocked}
                  className="h-9"
                />
              </div>

              {/* Data Scope */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Data Scope
                </Label>
                <Select
                  value={editScope}
                  onValueChange={(v) => setEditScope(v as DataScope)}
                  disabled={editingRole.isLocked}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permission Matrix */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permissions
                </Label>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left font-medium px-3 py-2 text-xs">Feature</th>
                        <th className="text-center font-medium px-2 py-2 text-xs">View</th>
                        <th className="text-center font-medium px-2 py-2 text-xs">Add</th>
                        <th className="text-center font-medium px-2 py-2 text-xs">Approve</th>
                        <th className="text-center font-medium px-2 py-2 text-xs">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURES.map((feat, fi) => {
                        const perms = editMatrix[feat];
                        if (!perms) return null;
                        return (
                          <tr key={feat} className={fi % 2 === 1 ? "bg-muted/30" : ""}>
                            <td className="px-3 py-2.5 text-xs font-medium">{feat}</td>
                            {(["view", "submit", "approve", "delete"] as const).map((col) => (
                              <td key={col} className="text-center px-2 py-2.5">
                                <Checkbox
                                  checked={perms[col]}
                                  onCheckedChange={() => togglePerm(feat, col)}
                                  disabled={editingRole.isLocked}
                                  className={
                                    perms[col]
                                      ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      : ""
                                  }
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            {!editingRole?.isLocked && <Button onClick={handleSave}>Save Changes</Button>}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
