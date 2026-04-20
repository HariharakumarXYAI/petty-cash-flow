import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Filter, ChevronDown, ChevronRight, Pencil, Trash2,
  Lock, ShieldCheck, Store, Inbox,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ALL_ACTIONS, actionMeta, countGrants, flattenCatalog, loadRoles, saveRoles,
  type DynamicRole,
} from "@/lib/permissions-catalog";

const PAGE_SIZES = [10, 20, 50];

export default function RolesPermissionsPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DynamicRole | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DynamicRole | null>(null);

  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  const persist = (next: DynamicRole[]) => {
    setRoles(next);
    saveRoles(next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRoles = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCreate = () => {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setFormError(null);
    setCreateOpen(true);
  };

  const openRename = (role: DynamicRole) => {
    setEditTarget(role);
    setFormName(role.name);
    setFormDesc(role.description);
    setFormError(null);
    setCreateOpen(true);
  };

  const handleSubmitForm = () => {
    const name = formName.trim();
    if (!name) {
      setFormError("Role name is required.");
      return;
    }
    const dup = roles.some(
      (r) =>
        r.name.toLowerCase() === name.toLowerCase() &&
        r.id !== editTarget?.id,
    );
    if (dup) {
      setFormError("A role with this name already exists.");
      return;
    }

    if (editTarget) {
      const next = roles.map((r) =>
        r.id === editTarget.id ? { ...r, name, description: formDesc.trim() } : r,
      );
      persist(next);
      toast.success("Role updated");
      setCreateOpen(false);
    } else {
      const newRole: DynamicRole = {
        id: `role_${Date.now()}`,
        name,
        description: formDesc.trim(),
        isSystem: false,
        grants: {},
        storeCodes: [],
        dataScope: "own_store",
        createdAt: new Date().toISOString(),
      };
      const next = [...roles, newRole];
      persist(next);
      toast.success("Role created");
      setCreateOpen(false);
      navigate(`/admin/roles/${newRole.id}`);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.isSystem) {
      toast.error("System Admin role cannot be deleted");
      setDeleteTarget(null);
      return;
    }
    const next = roles.filter((r) => r.id !== deleteTarget.id);
    persist(next);
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and configure roles with permissions
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      <div className="w-full">
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or description..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center bg-slate-50 border-dashed">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-base">No roles yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click "+ Create Role" to get started.
              </p>
            </Card>
          ) : (
            <Card className="divide-y">
              {pageRoles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  expanded={!!expanded[role.id]}
                  onToggle={() =>
                    setExpanded((s) => ({ ...s, [role.id]: !s[role.id] }))
                  }
                  onEdit={() => navigate(`/admin/roles/${role.id}`)}
                  onRename={() => openRename(role)}
                  onDelete={() => setDeleteTarget(role)}
                />
              ))}
            </Card>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {safePage} of {totalPages} ({filtered.length} role
                {filtered.length === 1 ? "" : "s"})
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Rows</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Rename modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the role's name and description."
                : "Give the new role a name and short description."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role Name *</Label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Regional Auditor"
                className={cn(formError && "border-red-500 focus-visible:ring-red-500")}
              />
              {formError && (
                <p className="text-xs text-red-600 mt-1">{formError}</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What can this role do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editTarget ? "Save" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role
              {deleteTarget ? ` "${deleteTarget.name}"` : ""}. Users assigned to this
              role will need to be reassigned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleRow({
  role, expanded, onToggle, onEdit, onRename, onDelete,
}: {
  role: DynamicRole;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const permCount = countGrants(role.grants);
  const grouped = useMemo(() => {
    const flat = flattenCatalog();
    const out: { module: string; perms: string[] }[] = [];
    for (const row of flat) {
      if (row.depth !== 0) continue;
      const moduleGrant = role.grants[row.node.id] ?? {};
      const actions = ALL_ACTIONS.filter((a) => moduleGrant[a]);
      if (actions.length === 0) continue;
      out.push({
        module: row.node.label,
        perms: actions.map((a) => actionMeta[a].label),
      });
    }
    return out;
  }, [role]);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
        <CollapsibleTrigger className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-200">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{role.name}</h3>
            {role.isSystem && (
              <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
                <Lock className="h-3 w-3" /> Locked
              </Badge>
            )}
          </div>
          {role.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> {permCount} permissions
          </span>
          <span className="flex items-center gap-1">
            <Store className="h-3.5 w-3.5" /> {role.storeCodes.length} stores
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Edit permissions">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={role.isSystem}
            title={role.isSystem ? "System role is locked" : "Delete role"}
          >
            <Trash2 className={cn("h-4 w-4", !role.isSystem && "text-red-600")} />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <div className="px-14 pb-5 space-y-4 bg-slate-50/50">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Permissions
            </p>
            {grouped.length === 0 ? (
              <p className="text-xs text-muted-foreground">No permissions assigned.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {grouped.map((g) => (
                  <div key={g.module} className="text-xs">
                    <span className="font-medium">{g.module}: </span>
                    <span className="text-muted-foreground">{g.perms.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Stores ({role.storeCodes.length})
            </p>
            {role.storeCodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No stores assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {role.storeCodes.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    [{c}]
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onRename}>
              Rename / description
            </Button>
            <Button
              size="sm"
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Configure permissions
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PermissionMatrixOverview({ roles }: { roles: DynamicRole[] }) {
  const flat = flattenCatalog();

  if (roles.length === 0) {
    return (
      <Card className="p-8 text-sm text-muted-foreground text-center">
        No roles to compare. Create a role first.
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="min-w-[280px] sticky left-0 bg-slate-50 z-10">
                Module / Permission
              </TableHead>
              {roles.map((r) => (
                <TableHead key={r.id} className="text-center min-w-[140px]">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      {r.isSystem && <Lock className="h-3 w-3 text-amber-600" />}
                      {r.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {countGrants(r.grants)} perms
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flat.map((row) => (
              <TableRow key={row.node.id}>
                <TableCell className="sticky left-0 bg-background z-10">
                  <span
                    className={cn(
                      row.depth > 0 && "pl-6 text-muted-foreground",
                      row.depth === 0 && "font-medium",
                    )}
                  >
                    {row.node.label}
                  </span>
                </TableCell>
                {roles.map((r) => {
                  const grant = r.grants[row.node.id] ?? {};
                  const enabled = row.node.actions.filter((a) => grant[a]);
                  return (
                    <TableCell key={r.id} className="text-center">
                      {enabled.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {enabled.map((a) => (
                            <span
                              key={a}
                              className={cn(
                                "inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold",
                                actionMeta[a].tone,
                                actionMeta[a].text,
                              )}
                              title={actionMeta[a].label}
                            >
                              {actionMeta[a].label[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
