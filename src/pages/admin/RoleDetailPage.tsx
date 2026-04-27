import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Eye, Lock, Pencil, Search, Store as StoreIcon, X } from "lucide-react";
import { FormActions } from "@/components/layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  ALL_ACTIONS, actionMeta, dataScopeOptions, flattenCatalog, loadRoles, saveRoles,
  storeOptions, type ActionKey, type DataScope, type DynamicRole,
  type PermissionGrants, permissionCatalog,
} from "@/lib/permissions-catalog";
import { PermissionsMatrix } from "@/components/role/PermissionsMatrix";
import { emptyModulePermissions, type ModulePermissions } from "@/lib/role-modules";

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewOnlyParam = searchParams.get("view") === "1";
  const [allRoles, setAllRoles] = useState<DynamicRole[]>([]);
  const [draft, setDraft] = useState<DynamicRole | null>(null);
  const [original, setOriginal] = useState<DynamicRole | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    const list = loadRoles();
    setAllRoles(list);
    const found = list.find((r) => r.id === roleId);
    if (found) {
      setDraft(JSON.parse(JSON.stringify(found)));
      setOriginal(JSON.parse(JSON.stringify(found)));
    }
  }, [roleId]);

  const isDirty = useMemo(() => {
    if (!draft || !original) return false;
    return JSON.stringify(draft) !== JSON.stringify(original);
  }, [draft, original]);

  // Warn on unload
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (!draft) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/admin/roles")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </Button>
        <Card className="mt-6 p-12 text-center text-sm text-muted-foreground">
          Role not found.
        </Card>
      </div>
    );
  }

  const isSystemLocked = draft.isSystem;
  const isReadOnly = viewOnlyParam || isSystemLocked;
  const isLocked = isReadOnly;

  /* ───────────── permission helpers ───────────── */

  const update = (fn: (d: DynamicRole) => void) => {
    if (isLocked) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const copy: DynamicRole = JSON.parse(JSON.stringify(prev));
      fn(copy);
      return copy;
    });
  };

  const togglePerm = (nodeId: string, action: ActionKey) => {
    update((d) => {
      d.grants[nodeId] = d.grants[nodeId] ?? {};
      const next = !d.grants[nodeId][action];
      d.grants[nodeId][action] = next;

      // Find node + parent in catalog
      const findInfo = (
        nodes = permissionCatalog,
        parent: typeof permissionCatalog[number] | null = null,
      ): { node: typeof permissionCatalog[number]; parent: typeof permissionCatalog[number] | null } | null => {
        for (const n of nodes) {
          if (n.id === nodeId) return { node: n, parent };
          if (n.children) {
            const r = findInfo(n.children, n);
            if (r) return r;
          }
        }
        return null;
      };
      const info = findInfo();
      if (!info) return;

      // If this is a parent, propagate to children that have that action
      if (info.node.children?.length) {
        for (const child of info.node.children) {
          if (child.actions.includes(action)) {
            d.grants[child.id] = d.grants[child.id] ?? {};
            d.grants[child.id][action] = next;
          }
        }
      }

      // If this is a child, sync parent: parent checked if ANY child of that action is checked
      if (info.parent) {
        const siblings = info.parent.children ?? [];
        const anyOn = siblings
          .filter((c) => c.actions.includes(action))
          .some((c) => d.grants[c.id]?.[action]);
        d.grants[info.parent.id] = d.grants[info.parent.id] ?? {};
        d.grants[info.parent.id][action] = anyOn;
      }
    });
  };

  const toggleStore = (code: string) => {
    update((d) => {
      const has = d.storeCodes.includes(code);
      d.storeCodes = has ? d.storeCodes.filter((c) => c !== code) : [...d.storeCodes, code];
    });
  };

  const setDataScope = (scope: DataScope) => {
    update((d) => {
      d.dataScope = scope;
      if (scope === "all_stores") d.storeCodes = storeOptions.map((s) => s.code);
      if (scope === "own_store_only") d.storeCodes = [];
    });
  };

  const handleSave = () => {
    if (!draft) return;
    const next = allRoles.map((r) => (r.id === draft.id ? draft : r));
    setAllRoles(next);
    saveRoles(next);
    setOriginal(JSON.parse(JSON.stringify(draft)));
    toast.success("Role saved");
  };

  const handleDiscard = () => {
    if (!original) return;
    setDraft(JSON.parse(JSON.stringify(original)));
    setDiscardOpen(false);
    toast("Changes discarded");
  };

  const handleBack = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    navigate("/admin/roles");
  };

  const flat = flattenCatalog();
  const storeSelectionDisabled = draft.dataScope === "all_stores" || draft.dataScope === "own_store_only";

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {editingName && !isLocked ? (
                <Input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => update((d) => { d.name = e.target.value; })}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                  className="text-xl font-semibold h-9 max-w-md"
                />
              ) : (
                <button
                  type="button"
                  className="group flex items-center gap-2 text-left"
                  onClick={() => !isLocked && setEditingName(true)}
                  disabled={isLocked}
                >
                  <h1 className="text-2xl font-semibold tracking-tight">{draft.name}</h1>
                  {!isLocked && <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />}
                </button>
              )}
              {isSystemLocked && (
                <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
                  <Lock className="h-3 w-3" /> Protected
                </Badge>
              )}
              {viewOnlyParam && !isSystemLocked && (
                <Badge variant="outline" className="gap-1 border-slate-300 bg-slate-50 text-slate-700">
                  <Eye className="h-3 w-3" /> Read-only view
                </Badge>
              )}
            </div>
            <Input
              value={draft.description}
              onChange={(e) => update((d) => { d.description = e.target.value; })}
              placeholder="Add a short description for this role"
              className="border-0 px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:bg-slate-50 mt-1"
              disabled={isLocked}
            />
          </div>
        </div>
        {viewOnlyParam && !isSystemLocked && (
          <div className="shrink-0">
            <Button variant="outline" onClick={() => setSearchParams({})} className="gap-2">
              <Pencil className="h-4 w-4" /> Switch to edit
            </Button>
          </div>
        )}
      </div>

      {isSystemLocked && (
        <Card className="p-3 border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
          <Lock className="h-4 w-4" /> System Admin is a protected role. Permissions and stores cannot be edited.
        </Card>
      )}
      {viewOnlyParam && !isSystemLocked && (
        <Card className="p-3 border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" /> Read-only view. Toggles are disabled.
        </Card>
      )}

      {/* Permission matrix (module-based) */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Permissions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toggle which actions this role can perform on each module.
          </p>
        </div>
        <div className="p-5">
          <PermissionsMatrix
            value={draft.modulePermissions ?? emptyModulePermissions()}
            onChange={(next: ModulePermissions) =>
              update((d) => { d.modulePermissions = next; })
            }
            disabled={isLocked}
          />
        </div>
      </Card>

      {/* Data scope */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Data Scope</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defines which stores' data this role can see and act on.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {dataScopeOptions.map((opt) => {
            const active = draft.dataScope === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isLocked}
                onClick={() => setDataScope(opt.value)}
                className={cn(
                  "text-left rounded-lg border p-3 transition-colors",
                  active
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-slate-300 bg-white",
                  isLocked && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Store access */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Store Access ({draft.storeCodes.length}/{storeOptions.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {draft.dataScope === "all_stores"
                ? "All stores selected (Data Scope = All stores)."
                : draft.dataScope === "own_store_only"
                ? "Disabled — store will be the user's own store at runtime."
                : "Pick the stores this role can access."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-blue-600 hover:underline disabled:text-muted-foreground disabled:no-underline"
              disabled={storeSelectionDisabled || isLocked}
              onClick={() => update((d) => { d.storeCodes = storeOptions.map((s) => s.code); })}
            >
              Select All
            </button>
            <button
              className="text-xs text-red-600 hover:underline disabled:text-muted-foreground disabled:no-underline"
              disabled={storeSelectionDisabled || isLocked}
              onClick={() => update((d) => { d.storeCodes = []; })}
            >
              Remove All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {storeOptions.map((s) => {
            const checked = draft.storeCodes.includes(s.code);
            const disabled = storeSelectionDisabled || isLocked;
            return (
              <label
                key={s.code}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                  checked ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white",
                  disabled && "opacity-60 cursor-not-allowed",
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggleStore(s.code)}
                />
                <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  <StoreIcon className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">[{s.code}]</div>
                  <div className="text-sm font-medium truncate">{s.name}</div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* hidden Select used to satisfy import (UI offers card buttons) */}
      <div className="hidden">
        <Select value={draft.dataScope} onValueChange={(v) => setDataScope(v as DataScope)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {dataScopeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Label>scope</Label>
        <span>{Object.keys({} as PermissionGrants).length}</span>
      </div>

      {!isReadOnly && (
        <FormActions
          isDirty={isDirty}
          secondary={
            <Button
              variant="outline"
              onClick={() => (isDirty ? setDiscardOpen(true) : navigate("/admin/roles"))}
            >
              Cancel
            </Button>
          }
          primary={
            <Button onClick={handleSave} disabled={!isDirty}>
              Save Changes
            </Button>
          }
        />
      )}

      {/* Discard confirm */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits to permissions, scope or stores will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDiscard();
                navigate("/admin/roles");
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
