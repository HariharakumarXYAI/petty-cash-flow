// Route guard map — the only place that decides which roles can reach which pages.
// Pages NOT listed here are not guarded (legacy/admin pages keep their existing behavior).

import type { AppRole } from "@/lib/roles";

export const PAGE_ACCESS: Record<string, AppRole[]> = {
  "/dashboard":              ["store_user", "store_manager", "regional_manager", "ho_finance", "internal_audit", "system_admin"],
  "/claims":                 ["store_user", "store_manager", "regional_manager", "ho_finance", "internal_audit"],
  "/claims/new":             ["store_user", "store_manager", "regional_manager", "ho_finance"],
  "/advances":               ["store_user", "store_manager", "regional_manager", "ho_finance", "internal_audit"],
  "/advances/new":           ["store_user", "store_manager", "regional_manager", "ho_finance"],
  "/approvals":              ["store_manager", "regional_manager", "ho_finance"],
  "/exceptions":             ["regional_manager", "ho_finance", "internal_audit"],
  "/store-trends":           ["regional_manager", "ho_finance", "internal_audit"],
  "/audit-trail":            ["internal_audit", "system_admin"],
  "/admin/users":            ["system_admin"],
  "/admin/stores":           ["system_admin"],
  "/admin/sub-types":        ["system_admin", "ho_finance"],
  "/admin/doc-requirements": ["system_admin", "ho_finance"],
  "/admin/system-settings":  ["system_admin"],
};

/** Returns true if the role can access the path. Paths not in the map are unguarded → true. */
export function canAccess(path: string, role: AppRole | undefined | null): boolean {
  if (!role) return false;
  const allowed = PAGE_ACCESS[path];
  if (!allowed) return true; // path not declared → not guarded by this service
  return allowed.includes(role);
}

/** Returns true if the path is declared in the access map. */
export function isGuardedPath(path: string): boolean {
  return Object.prototype.hasOwnProperty.call(PAGE_ACCESS, path);
}
