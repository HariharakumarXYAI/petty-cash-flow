// Runtime permission helper. Reads the current user's role module permissions
// from localStorage (matches the persistence pattern used by permissions-catalog).

import { loadRoles } from "@/lib/permissions-catalog";
import { MODULE_ACTIONS, type ModuleAction } from "@/lib/role-modules";
import type { AppRole } from "@/lib/roles";

// Map app roles to dynamic role IDs in localStorage seed.
const appRoleToDynamicId: Partial<Record<AppRole, string>> = {
  system_admin: "role_system_admin",
  store_manager: "role_store_manager",
  store_user: "role_store_user",
};

export function getRoleModulePermissions(appRole: AppRole | undefined) {
  if (!appRole) return {};
  // System Admin always has full access.
  if (appRole === "system_admin") return null; // null = "all"
  const dynamicId = appRoleToDynamicId[appRole];
  if (!dynamicId) return {};
  const roles = loadRoles();
  const role = roles.find((r) => r.id === dynamicId);
  // Module permissions field is added on save; fall back to empty.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((role as any)?.modulePermissions ?? {}) as Record<
    string,
    Partial<Record<ModuleAction, boolean>>
  >;
}

export function hasPermission(
  appRole: AppRole | undefined,
  moduleId: string,
  action: ModuleAction,
): boolean {
  const perms = getRoleModulePermissions(appRole);
  if (perms === null) return true; // system admin
  return !!perms[moduleId]?.[action];
}

export function hasAnyPermission(
  appRole: AppRole | undefined,
  moduleId: string,
): boolean {
  return MODULE_ACTIONS.some((a) => hasPermission(appRole, moduleId, a));
}
