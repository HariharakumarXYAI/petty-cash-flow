// Module-based permissions model (Django-style).
// Lives alongside the legacy permissionCatalog grants for backward compat.

export type ModuleAction = "add" | "change" | "delete" | "view";

export const MODULE_ACTIONS: ModuleAction[] = ["add", "change", "delete", "view"];

export interface ModuleDef {
  id: string;
  label: string;
}

export interface ModuleGroupDef {
  id: string;
  label: string;
  modules: ModuleDef[];
}

export const moduleGroups: ModuleGroupDef[] = [
  {
    id: "system_configuration",
    label: "SYSTEM CONFIGURATION",
    modules: [
      { id: "entities", label: "Entities" },
      { id: "rules", label: "Rules" },
    ],
  },
  {
    id: "company_information",
    label: "COMPANY INFORMATION",
    modules: [{ id: "stores", label: "Stores & Petty Cash Fund" }],
  },
  {
    id: "user_setup",
    label: "USER SETUP",
    modules: [
      { id: "employee_profiles", label: "Employee Profiles" },
      { id: "roles", label: "Roles & Permissions" },
    ],
  },
  {
    id: "expense_configuration",
    label: "EXPENSE CONFIGURATION",
    modules: [
      { id: "documents", label: "Documents" },
      { id: "expense_type", label: "Expense Type" },
      { id: "policy_management", label: "Policy Management" },
    ],
  },
  {
    id: "notification_setup",
    label: "NOTIFICATION SETUP",
    modules: [
      { id: "pending_invoice_email", label: "Pending Invoice Email" },
      { id: "pending_approval_email", label: "Pending Approval Email" },
    ],
  },
  {
    id: "reports",
    label: "REPORTS",
    modules: [{ id: "month_end_report", label: "Month End Report — HR & Finance" }],
  },
  {
    id: "core_operations",
    label: "CORE OPERATIONS",
    modules: [
      { id: "claims", label: "Claims" },
      { id: "advances", label: "Advances" },
      { id: "petty_cash_fund", label: "Petty Cash Fund" },
    ],
  },
];

export const allModules: ModuleDef[] = moduleGroups.flatMap((g) => g.modules);

// Storage shape: { [moduleId]: { add?: bool, change?: bool, delete?: bool, view?: bool } }
export type ModulePermissions = Record<string, Partial<Record<ModuleAction, boolean>>>;

export function emptyModulePermissions(): ModulePermissions {
  return {};
}

export function fullModulePermissions(): ModulePermissions {
  const out: ModulePermissions = {};
  for (const m of allModules) {
    out[m.id] = { add: true, change: true, delete: true, view: true };
  }
  return out;
}

export function countModulePermissions(p: ModulePermissions): number {
  let n = 0;
  for (const k of Object.keys(p)) {
    for (const a of MODULE_ACTIONS) if (p[k]?.[a]) n++;
  }
  return n;
}

export function isModuleAllChecked(p: ModulePermissions, moduleId: string): boolean {
  const grant = p[moduleId] ?? {};
  return MODULE_ACTIONS.every((a) => !!grant[a]);
}

export function setModuleAll(
  p: ModulePermissions,
  moduleId: string,
  value: boolean,
): ModulePermissions {
  const next = { ...p };
  next[moduleId] = value
    ? { add: true, change: true, delete: true, view: true }
    : { add: false, change: false, delete: false, view: false };
  return next;
}

export function setModuleAction(
  p: ModulePermissions,
  moduleId: string,
  action: ModuleAction,
  value: boolean,
): ModulePermissions {
  const next = { ...p };
  next[moduleId] = { ...(next[moduleId] ?? {}), [action]: value };
  return next;
}
