import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadRoles, type DynamicRole } from "@/lib/permissions-catalog";

export default function RolesPermissionsPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<DynamicRole[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  const filtered = useMemo(() => {
    if (!roles) return [];
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  const goEdit = (role: DynamicRole) => {
    if (role.isSystem) {
      navigate(`/admin/roles/${role.id}?view=1`);
    } else {
      navigate(`/admin/roles/${role.id}`);
    }
  };

  const goView = (role: DynamicRole) => {
    navigate(`/admin/roles/${role.id}?view=1`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and configure roles with permissions
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/admin/roles/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Create Role
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-64" />
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-12">
                  {search.trim()
                    ? `No roles found matching "${search.trim()}"`
                    : "No roles configured yet. Click Create Role to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((role) => (
                <TableRow
                  key={role.id}
                  className="cursor-pointer"
                  onClick={() => goEdit(role)}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{role.name}</div>
                    {role.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {role.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5"
                        style={{ background: "#FEF3C7", color: "#92400E" }}
                      >
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center text-xs rounded-full px-2.5 py-0.5"
                        style={{ background: "#DCFCE7", color: "#166534" }}
                      >
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => goView(role)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View permissions</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8", role.isSystem && "opacity-40 pointer-events-none")}
                              disabled={role.isSystem}
                              onClick={() => goEdit(role)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {role.isSystem
                            ? "Protected role — cannot be edited"
                            : "Edit role"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
