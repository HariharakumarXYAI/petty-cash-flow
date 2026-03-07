import { useState } from "react";
import { Users, Search, Shield, ChevronRight, Clock, Mail, Building2, MapPin, Globe, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  type AppUser, type AppRole, type ScopeType,
  mockUsers, roleLabels, roleBadgeColors, scopeLabels,
} from "@/lib/roles";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-status-approved/10 text-status-approved border-status-approved/20" },
  suspended: { label: "Suspended", className: "bg-status-hold/10 text-status-hold border-status-hold/20" },
  pending: { label: "Pending", className: "bg-status-validating/10 text-status-validating border-status-validating/20" },
};

const scopeIcons: Record<ScopeType, typeof Building2> = {
  store: Building2,
  region: MapPin,
  country: Globe,
  entity: Layers,
  enterprise: Shield,
};

export default function AdminAccess() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AppUser | null>(null);

  const filtered = mockUsers.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.status === "active").length,
    suspended: mockUsers.filter(u => u.status === "suspended").length,
    pending: mockUsers.filter(u => u.status === "pending").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-foreground">Access Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage user roles, scopes, and approval authority across the enterprise
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Users className="h-3.5 w-3.5" />
          Invite User
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: counts.total, accent: "text-foreground" },
          { label: "Active", value: counts.active, accent: "text-status-approved" },
          { label: "Suspended", value: counts.suspended, accent: "text-status-hold" },
          { label: "Pending Setup", value: counts.pending, accent: "text-status-validating" },
        ].map((k) => (
          <div key={k.label} className="bg-card border rounded-lg p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold mt-1", k.accent)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar border-b pb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <Shield className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.entries(roleLabels)).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">User</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Role</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider hidden md:table-cell">Scope</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider hidden lg:table-cell">Approval Limit</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider hidden xl:table-cell">Last Login</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const ScopeIcon = scopeIcons[u.scope.type];
              const st = statusConfig[u.status];
              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelected(u)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold text-primary">{u.initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />{u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", roleBadgeColors[u.role])}>
                      {roleLabels[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ScopeIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{u.scope.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {u.approvalLimit ? (
                      <span className="text-xs font-medium text-foreground">
                        ≤ {u.approvalLimit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={cn("text-[10px]", st.className)}>
                      {st.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {u.lastLogin ? format(parseISO(u.lastLogin), "MMM d, HH:mm") : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selected && <UserDetail user={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserDetail({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const ScopeIcon = scopeIcons[user.scope.type];
  const st = statusConfig[user.status];

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{user.initials}</span>
          </div>
          <div>
            <p className="text-base font-semibold">{user.displayName}</p>
            <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
          </div>
        </SheetTitle>
        <SheetDescription className="sr-only">User access details</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="section-label">Account Status</span>
          <Badge variant="outline" className={cn("text-[11px]", st.className)}>
            {st.label}
          </Badge>
        </div>

        <Separator />

        {/* Role */}
        <div className="space-y-3">
          <span className="section-label">Role</span>
          <Select defaultValue={user.role}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {user.role === "store_user" && "Can create claims and view own submissions only."}
            {user.role === "store_manager" && "Can approve claims within their store up to the configured limit."}
            {user.role === "regional_manager" && "Oversees multiple stores in a region with elevated approval authority."}
            {user.role === "ho_finance" && "Full visibility across assigned countries. Can manage master data."}
            {user.role === "internal_audit" && "Read-only access to audit samples, findings, and the immutable trail."}
            {user.role === "system_admin" && "Manages access, configuration, and system settings. Not a business approver."}
          </p>
        </div>

        <Separator />

        {/* Scope */}
        <div className="space-y-3">
          <span className="section-label">Access Scope</span>
          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Select defaultValue={user.scope.type}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(scopeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ScopeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user.scope.label}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Approval Limit */}
        <div className="space-y-3">
          <span className="section-label">Approval Authority</span>
          {user.approvalLimit ? (
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">
                ≤ {user.approvalLimit.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Claims above this amount auto-escalate to the next authority level
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {user.role === "ho_finance" ? "View and oversight only — approval at operational level" : "No approval authority assigned"}
            </p>
          )}
        </div>

        <Separator />

        {/* Activity */}
        <div className="space-y-2">
          <span className="section-label">Activity</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last login: {user.lastLogin ? format(parseISO(user.lastLogin), "MMM d, yyyy 'at' HH:mm") : "Never logged in"}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Microsoft Entra ID
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {user.status === "active" ? (
            <Button variant="outline" size="sm" className="text-status-hold border-status-hold/30 hover:bg-status-hold/10">
              Suspend Access
            </Button>
          ) : user.status === "suspended" ? (
            <Button variant="outline" size="sm" className="text-status-approved border-status-approved/30 hover:bg-status-approved/10">
              Reactivate
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="text-primary">
              Activate
            </Button>
          )}
          <Button variant="outline" size="sm">Save Changes</Button>
        </div>
      </div>
    </>
  );
}
